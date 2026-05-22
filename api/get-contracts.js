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

  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT 
        c.*,
        cl.name as client_name
      FROM contracts c
      LEFT JOIN clients cl ON c.client_id = cl.id
      ORDER BY c.created_at DESC;
    `);
    return res.status(200).json({ success: true, contracts: result.rows });
  } catch (error) {
    console.error('Erro ao buscar contratos:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar contratos' });
  } finally {
    client.release();
  }
}
