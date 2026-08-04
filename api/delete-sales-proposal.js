import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.body || req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID da proposta é obrigatório.' });
  }

  try {
    await pool.query('DELETE FROM sales_proposals WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Proposta de venda excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir proposta de venda:', error);
    return res.status(500).json({ error: 'Erro interno ao excluir proposta.' });
  }
}
