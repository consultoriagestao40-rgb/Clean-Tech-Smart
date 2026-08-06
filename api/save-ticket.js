import { Pool } from 'pg';
import { sendTicketWhatsappGroupNotification, sendTicketEmailNotification } from './_utils/notifications.js';

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
      technician_id,
      scheduled_date,
      internal_notes
    } = req.body;

    if (!client_id || !ticket_type) {
      return res.status(400).json({ error: 'Cliente e Tipo de Chamado são obrigatórios.' });
    }

    const finalClientId = Number(client_id);
    const finalEquipmentId = equipment_id ? Number(equipment_id) : null;
    const finalScheduledDate = scheduled_date ? new Date(scheduled_date) : null;
    const finalTechnicianId = technician_id ? Number(technician_id) : null;
    const isUpdate = !!id;

    let oldTicket = null;
    const changesList = [];

    if (isUpdate) {
      // Fetch previous ticket state to detect exact field changes
      const oldRes = await client.query('SELECT * FROM service_tickets WHERE id = $1', [id]);
      if (oldRes.rows.length > 0) {
        oldTicket = oldRes.rows[0];
      }
    }

    let result;

    if (isUpdate) {
      // Update ticket
      result = await client.query(`
        UPDATE service_tickets
        SET client_id = $1,
            equipment_id = $2,
            ticket_type = $3,
            status = $4,
            priority = $5,
            description = $6,
            technician_name = $7,
            technician_id = $8,
            scheduled_date = $9,
            internal_notes = $10,
            updated_at = NOW()
        WHERE id = $11
        RETURNING *
      `, [
        finalClientId,
        finalEquipmentId,
        ticket_type,
        status || 'Aberto',
        priority || 'Média',
        description || '',
        technician_name || null,
        finalTechnicianId,
        finalScheduledDate,
        internal_notes || '',
        id
      ]);
    } else {
      // Insert ticket
      result = await client.query(`
        INSERT INTO service_tickets (
          client_id,
          equipment_id,
          ticket_type,
          status,
          priority,
          description,
          technician_name,
          technician_id,
          scheduled_date,
          internal_notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        finalClientId,
        finalEquipmentId,
        ticket_type,
        status || 'Aberto',
        priority || 'Média',
        description || '',
        technician_name || null,
        finalTechnicianId,
        finalScheduledDate,
        internal_notes || ''
      ]);
    }

    const savedTicket = result.rows[0];

    // Auto-link equipment to client if not linked yet
    if (finalEquipmentId && finalClientId) {
      await client.query(`
        UPDATE equipments
        SET client_id = $1
        WHERE id = $2 AND (client_id IS NULL OR client_id != $1)
      `, [finalClientId, finalEquipmentId]);
    }

    // Fetch Client Name & Address
    let clientName = 'Cliente';
    let clientAddress = '';
    if (finalClientId) {
      const cRes = await client.query('SELECT name, address FROM clients WHERE id = $1', [finalClientId]);
      if (cRes.rows.length > 0) {
        clientName = cRes.rows[0].name;
        clientAddress = cRes.rows[0].address;
      }
    }

    // Fetch Technician Name
    let techName = technician_name || '';
    if (finalTechnicianId) {
      const tRes = await client.query('SELECT name FROM technicians WHERE id = $1', [finalTechnicianId]);
      if (tRes.rows.length > 0) {
        techName = tRes.rows[0].name;
      }
    }

    // Fetch Equipment Details
    let eqInfo = '';
    if (finalEquipmentId) {
      const eRes = await client.query('SELECT name, brand, model, serial_number FROM equipments WHERE id = $1', [finalEquipmentId]);
      if (eRes.rows.length > 0) {
        const eq = eRes.rows[0];
        eqInfo = `${eq.name || ''} ${eq.model ? `(${eq.model})` : ''} ${eq.serial_number ? `S/N: ${eq.serial_number}` : ''}`.trim();
      }
    }

    // Compare fields if it's an update
    if (isUpdate && oldTicket) {
      if (oldTicket.status !== savedTicket.status) {
        changesList.push(`Status alterado: "${oldTicket.status || 'Aberto'}" ➔ "${savedTicket.status}"`);
      }
      if (Number(oldTicket.technician_id) !== Number(savedTicket.technician_id) || oldTicket.technician_name !== savedTicket.technician_name) {
        changesList.push(`Técnico responsável: "${oldTicket.technician_name || 'Não atribuído'}" ➔ "${techName || 'Não atribuído'}"`);
      }
      if (String(oldTicket.scheduled_date) !== String(savedTicket.scheduled_date)) {
        const oldDateStr = oldTicket.scheduled_date ? new Date(oldTicket.scheduled_date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Não agendado';
        const newDateStr = savedTicket.scheduled_date ? new Date(savedTicket.scheduled_date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Não agendado';
        changesList.push(`Agendamento alterado: "${oldDateStr}" ➔ "${newDateStr}"`);
      }
      if (oldTicket.priority !== savedTicket.priority) {
        changesList.push(`Prioridade: "${oldTicket.priority || 'Média'}" ➔ "${savedTicket.priority}"`);
      }
      if (oldTicket.description !== savedTicket.description) {
        changesList.push(`Defeito / Solicitação alterado: "${savedTicket.description || 'Nenhum'}"`);
      }
      if (oldTicket.ticket_type !== savedTicket.ticket_type) {
        changesList.push(`Tipo de Chamado alterado: "${savedTicket.ticket_type}"`);
      }
      if (Number(oldTicket.equipment_id) !== Number(savedTicket.equipment_id)) {
        changesList.push(`Equipamento alterado: "${eqInfo || 'Não informado'}"`);
      }
    }

    // Trigger Async WhatsApp & Email Notifications in background
    try {
      const ticketWithDetails = {
        ...savedTicket,
        address: clientAddress,
        equipment_info: eqInfo
      };
      sendTicketWhatsappGroupNotification(client, ticketWithDetails, clientName, techName, isUpdate ? 'update' : 'create', changesList).catch(e => console.error('Erro async notificacao zapi:', e));
      sendTicketEmailNotification(client, ticketWithDetails, clientName, techName, isUpdate ? 'update' : 'create').catch(e => console.error('Erro async notificacao email:', e));
    } catch (notifErr) {
      console.error('Erro ao acionar notificações:', notifErr);
    }

    return res.status(200).json({ success: true, ticket: savedTicket });
  } catch (error) {
    console.error('Erro ao salvar chamado:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar chamado: ' + (error.message || String(error)) });
  } finally {
    client.release();
  }
}
