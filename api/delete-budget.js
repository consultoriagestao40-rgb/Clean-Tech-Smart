import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const client = await pool.connect();

  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID do orçamento é obrigatório.' });
    }

    await client.query('BEGIN');

    // 1. Excluir mão de obra e peças associadas
    await client.query('DELETE FROM budget_labor WHERE budget_id = $1', [id]);
    await client.query('DELETE FROM budget_parts WHERE budget_id = $1', [id]);

    // 2. Excluir orçamento
    await client.query('DELETE FROM budgets WHERE id = $1', [id]);

    await client.query('COMMIT');
    
    return res.status(200).json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao excluir orçamento:', error);
    return res.status(500).json({ error: 'Erro interno ao excluir orçamento' });
  } finally {
    client.release();
  }
}
