require('dotenv').config();
const express = require('express');
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

app.get('/operacoes', async (req, res) => {
  const { codigoClassificador, dataContabil } = req.query;

  if (!codigoClassificador || !dataContabil) {
    return res.status(400).json({ 
      error: 'Parâmetros obrigatórios ausentes. Por favor, forneça "codigoClassificador" e "dataContabil".' 
    });
  }

  try {
    const query = `
      SELECT id, codigo_classificador, data_contabil, descricao, valor 
      FROM t_operacao 
      WHERE codigo_classificador = $1 AND data_contabil = $2
    `;
    
    const values = [codigoClassificador, dataContabil];

    const result = await pool.query(query, values);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error('Erro ao executar a consulta:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});