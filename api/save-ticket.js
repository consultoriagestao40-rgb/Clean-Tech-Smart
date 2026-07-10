import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const client = await pool.connect();

  try {
    const {
      id,
      client_id,
      equipment_id,
      ticket_type,
      status,
      priority,
      description,
      technician_name,
      scheduled_date,
      internal_notes
    } = req.body;

    if (!client_id || !ticket_type) {
      return res.status(400).json({ error: 'Cliente e Tipo de Chamado são obrigatórios.' });
    }

    const finalClientId = Number(client_id);
    const finalEquipmentId = equipment_id ? Number(equipment_id) : null;
    const finalScheduledDate = scheduled_date ? new Date(scheduled_date) : null;

    let result;

    if (id) {
      // Atualizar chamado existente
      result = await client.query(`
        UPDATE service_tickets
        SET client_id = $1, equipment_id = $2, ticket_type = $3, status = $4, priority = $5,
            description = $6, technician_name = $7, scheduled_date = $8, internal_notes = $9,
            updated_at = NOW()
        WHERE id = $10
        RETURNING *;
      `, [
        finalClientId, finalEquipmentId, ticket_type, status || 'Aberto', priority || 'Média',
        description || null, technician_name || null, finalScheduledDate, internal_notes || null,
        id
      ]);
    } else {
      // Criar novo chamado
      result = await client.query(`
        INSERT INTO service_tickets (
          client_id, equipment_id, ticket_type, status, priority,
          description, technician_name, scheduled_date, internal_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `, [
        finalClientId, finalEquipmentId, ticket_type, status || 'Aberto', priority || 'Média',
        description || null, technician_name || null, finalScheduledDate, internal_notes || null
      ]);
    }

    return res.status(200).json({ success: true, ticket: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar chamado:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar chamado' });
  } finally {
    client.release();
  }
}
