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
        id, 
        client_id, 
        contact_name, 
        service_type, 
        grand_total, 
        created_at 
      FROM budgets 
      ORDER BY created_at DESC
    `);
    
    return res.status(200).json({ budgets: result.rows });
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar orçamentos' });
  } finally {
    client.release();
  }
}
