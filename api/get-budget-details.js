import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'ID do orçamento não fornecido' });
  }

  const client = await pool.connect();

  try {
    // 1. Obter dados do orçamento com informações do cliente
    const budgetRes = await client.query(`
      SELECT b.*, c.name as client_name, c.document as client_document, c.email as client_email, c.phone as client_phone, c.address as client_address
      FROM budgets b
      LEFT JOIN clients c ON b.client_id::text = c.id::text
      WHERE b.id = $1
    `, [id]);

    if (budgetRes.rows.length === 0) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    const budget = budgetRes.rows[0];

    // 2. Obter mão de obra
    const laborRes = await client.query(`
      SELECT * FROM budget_labor WHERE budget_id = $1 ORDER BY id ASC
    `, [id]);

    // 3. Obter peças
    const partsRes = await client.query(`
      SELECT * FROM budget_parts WHERE budget_id = $1 ORDER BY id ASC
    `, [id]);

    return res.status(200).json({
      success: true,
      budget,
      laborItems: laborRes.rows,
      partsItems: partsRes.rows
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do orçamento:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar detalhes' });
  } finally {
    client.release();
  }
}
