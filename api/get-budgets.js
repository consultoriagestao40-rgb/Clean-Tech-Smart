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

  const { technician_id } = req.query || {};
  const client = await pool.connect();

  try {
    let query = `
      SELECT 
        b.id, 
        b.client_id, 
        b.contact_name, 
        b.service_type, 
        b.grand_total, 
        b.status,
        b.created_at,
        b.technician_id,
        b.ticket_id,
        b.created_by_user_id,
        c.name as client_name,
        t.name as technician_name,
        eq.name as equipment_name,
        eq.model as equipment_model
      FROM budgets b
      LEFT JOIN clients c ON b.client_id::text = c.id::text
      LEFT JOIN technicians t ON b.technician_id = t.id
      LEFT JOIN equipments eq ON b.equipment_id = eq.id
    `;
    const params = [];

    if (technician_id && technician_id !== 'todos') {
      query += ` WHERE b.technician_id = $1`;
      params.push(Number(technician_id));
    }

    query += ` ORDER BY b.created_at DESC`;

    const result = await client.query(query, params);
    
    return res.status(200).json({ budgets: result.rows });
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar orçamentos' });
  } finally {
    client.release();
  }
}
