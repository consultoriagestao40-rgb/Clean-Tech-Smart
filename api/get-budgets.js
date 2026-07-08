import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT 
        b.id, 
        b.client_id, 
        b.contact_name, 
        b.service_type, 
        b.grand_total, 
        b.status,
        b.created_at,
        c.name as client_name
      FROM budgets b
      LEFT JOIN clients c ON b.client_id::text = c.id::text
      ORDER BY b.created_at DESC
    `);
    
    return res.status(200).json({ budgets: result.rows });
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar orçamentos' });
  } finally {
    client.release();
  }
}
