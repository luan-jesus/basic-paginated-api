require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const app = express();
app.use(express.json());
app.use(cors());

app.get('/operacoes', async (req, res) => {
  const { codigoClassificador, dataContabil } = req.query;

  if (!codigoClassificador || !dataContabil) {
    return res.status(400).json({ 
      error: 'Parâmetros obrigatórios ausentes. Por favor, forneça "codigoClassificador" e "dataContabil".' 
    });
  }

  const page = parseInt(req.query.page || '1', 10);
  const size = parseInt(req.query.size || '10', 10);
  
  const sort = req.query.sort || 'id,asc';
  const [sortColumn, sortDirection = 'asc'] = sort.split(',');

  if (page < 1 || size < 1) {
      return res.status(400).json({ error: 'Os parâmetros "page" e "size" devem ser números positivos.' });
  }

  const allowedSortColumns = ['id', 'descricao', 'valor', 'data_contabil'];
  if (!allowedSortColumns.includes(sortColumn.toLowerCase())) {
    return res.status(400).json({ error: `Coluna de ordenação inválida. Permitidas: ${allowedSortColumns.join(', ')}` });
  }
  const safeSortDirection = sortDirection.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  try {
    const baseQuery = `
      FROM t_operacao 
      WHERE codigo_classificador = $1 AND data_operacao = $2
    `;

    const whereValues = [codigoClassificador, dataContabil];

    const countQuery = `SELECT COUNT(*) ${baseQuery}`;

    const offset = (page - 1) * size;
    const dataQuery = `
      SELECT *
      ${baseQuery}
      ORDER BY ${sortColumn} ${safeSortDirection}
      LIMIT $3
      OFFSET $4
    `;

    const dataValues = [...whereValues, size, offset];

    const totalResult = await pool.query(countQuery, whereValues);
    const totalItems = parseInt(totalResult.rows[0].count, 10);

    const dataResult = await pool.query(dataQuery, dataValues);

    const totalPages = Math.ceil(totalItems / size);

    const response = {
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: size
      },
      data: formatResponse(dataResult.rows)
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Erro ao executar a consulta:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

function formatResponse(rows) {
  return rows.map(row => ({
    id: parseInt(row.id),
    codigo_classificador: row.codigo_classificador,
    titulo_classificador: row.titulo_classificador,
    valor_movimento: parseFloat(row.valor_movimento),
    data_atualizacao: row.data_atualizacao,
    data_referencia: row.data_referencia,
    data_processamento: row.data_processamento,
    data_operacao: row.data_operacao,
    data_contabil: row.data_contabil,
    id_cliente: parseInt(row.id_cliente),
    cpf_cliente: row.cpf_cliente,
    nome_cliente: row.nome_cliente,
    produto: row.produto,
    tipo_cartao: row.tipo_cartao,
    rede_origem: row.rede_origem,
    empresa: row.empresa,
    filial: row.filial,
    codigo_vencimento: row.codigo_vencimento
  }));
}

const PORT = process.env.API_PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});