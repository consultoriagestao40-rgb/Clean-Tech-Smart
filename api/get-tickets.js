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
      SELECT st.*, 
             c.name as client_name, c.phone as client_phone, c.address as client_address,
             e.name as equipment_name, e.brand as equipment_brand, e.model as equipment_model, e.serial_number as equipment_serial_number,
             COALESCE(t.name, st.technician_name) as technician_name
      FROM service_tickets st
      LEFT JOIN clients c ON st.client_id::text = c.id::text
      LEFT JOIN equipments e ON st.equipment_id = e.id
      LEFT JOIN technicians t ON st.technician_id = t.id
      ORDER BY st.created_at DESC
    `);
    
    return res.status(200).json({ success: true, tickets: result.rows });
  } catch (error) {
    console.error('Erro ao buscar chamados:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar chamados' });
  } finally {
    client.release();
  }
}
