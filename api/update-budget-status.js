import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const client = await pool.connect();

  try {
    const { id, status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ error: 'ID e status são obrigatórios.' });
    }

    await client.query(`
      UPDATE budgets 
      SET status = $1 
      WHERE id = $2
    `, [status, id]);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar status do orçamento:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar status' });
  } finally {
    client.release();
  }
}
