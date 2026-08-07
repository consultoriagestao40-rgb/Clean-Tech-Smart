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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID do equipamento é obrigatório.' });
  }

  const equipmentId = Number(id);
  const client = await pool.connect();

  try {
    // 1. Fetch Equipment Details
    const eqRes = await client.query(`
      SELECT eq.*, 
             c.name as client_name, c.razao_social as client_razao_social, c.phone as client_phone, c.address as client_address,
             ec.name as category_name
      FROM equipments eq
      LEFT JOIN clients c ON eq.client_id::text = c.id::text
      LEFT JOIN equipment_categories ec ON eq.category_id = ec.id
      WHERE eq.id = $1
    `, [equipmentId]);

    if (eqRes.rows.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado.' });
    }

    const equipment = eqRes.rows[0];

    // 2. Fetch Maintenance & Service Tickets History
    const ticketsRes = await client.query(`
      SELECT st.*, 
             c.name as client_name,
             COALESCE(t.name, st.technician_name) as technician_name
      FROM service_tickets st
      LEFT JOIN clients c ON st.client_id::text = c.id::text
      LEFT JOIN technicians t ON st.technician_id = t.id
      WHERE st.equipment_id = $1
      ORDER BY st.created_at DESC
    `, [equipmentId]);

    // 3. Fetch Contracts History
    const contractsRes = await client.query(`
      SELECT ctr.*, 
             c.name as client_name
      FROM contracts ctr
      LEFT JOIN clients c ON ctr.client_id::text = c.id::text
      WHERE ctr.equipments::text LIKE '%"id":' || $1 || '%'
         OR ctr.equipments::text LIKE '%"equipment_id":' || $1 || '%'
         OR ctr.equipments::text LIKE '%"id": "' || $1 || '"%'
      ORDER BY ctr.created_at DESC
    `, [equipmentId]);

    // 4. Fetch Rental Proposals History
    const proposalsRes = await client.query(`
      SELECT rp.*, 
             c.name as client_name,
             mm.name as machine_name
      FROM rental_proposals rp
      LEFT JOIN clients c ON rp.client_id::text = c.id::text
      LEFT JOIN machine_models mm ON rp.machine_model_id = mm.id
      WHERE rp.equipment_id = $1
      ORDER BY rp.created_at DESC
    `, [equipmentId]);

    return res.status(200).json({
      success: true,
      equipment,
      tickets: ticketsRes.rows,
      contracts: contractsRes.rows,
      proposals: proposalsRes.rows
    });
  } catch (error) {
    console.error('Erro ao buscar histórico do equipamento:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar histórico.' });
  } finally {
    client.release();
  }
}
