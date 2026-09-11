import { Pool } from 'pg';
import { getAuthUser } from '../_utils/auth.js';
import { sendTicketWhatsappGroupNotification, sendTicketEmailNotification } from '../_utils/notifications.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let user;
  try {
    user = getAuthUser(req);
    if (!user || !user.clientId) {
      return res.status(401).json({ error: 'Acesso não autorizado. Identifique-se no Portal do Cliente.' });
    }
  } catch (authErr) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Por favor, faça login novamente.' });
  }

  const clientId = Number(user.clientId);
  const dbClient = await pool.connect();

  try {
    if (req.method === 'GET') {
      // 1. Fetch tickets for this client with equipment, technician, and linked budget info
      const ticketsQuery = `
        SELECT 
          st.id,
          st.client_id,
          st.equipment_id,
          st.ticket_type,
          st.status,
          st.priority,
          st.description,
          st.scheduled_date,
          st.technician_name,
          st.resolution_notes,
          st.evidence_photos,
          st.closed_at,
          st.created_at,
          st.updated_at,
          st.origin,
          st.hour_meter,
          st.budget_id,
          e.name as equipment_name,
          e.brand as equipment_brand,
          e.model as equipment_model,
          e.serial_number as equipment_serial_number,
          COALESCE(t.name, st.technician_name) as assigned_technician,
          b.grand_total as budget_grand_total,
          b.total_parts as budget_total_parts,
          b.total_labor as budget_total_labor,
          b.status as budget_status,
          b.created_at as budget_created_at
        FROM service_tickets st
        LEFT JOIN equipments e ON st.equipment_id = e.id
        LEFT JOIN technicians t ON st.technician_id = t.id
        LEFT JOIN budgets b ON (
          st.budget_id = b.id OR 
          (b.equipment_id = st.equipment_id AND b.equipment_id IS NOT NULL AND b.client_id::text = st.client_id::text)
        )
        WHERE st.client_id = $1
        ORDER BY st.created_at DESC
      `;
      const ticketsRes = await dbClient.query(ticketsQuery, [clientId]);

      // Calculate client KPI metrics
      let totalTickets = ticketsRes.rows.length;
      let openTickets = 0;
      let completedTickets = 0;
      let totalMaintenanceCost = 0;

      const seenBudgetIds = new Set();

      ticketsRes.rows.forEach(t => {
        const s = (t.status || '').toLowerCase();
        if (s.includes('conclu') || s.includes('finaliz')) {
          completedTickets++;
        } else if (!s.includes('cancel')) {
          openTickets++;
        }

        if (t.budget_id && !seenBudgetIds.has(t.budget_id) && t.budget_grand_total) {
          seenBudgetIds.add(t.budget_id);
          totalMaintenanceCost += parseFloat(t.budget_grand_total) || 0;
        }
      });

      return res.status(200).json({
        success: true,
        metrics: {
          total_tickets: totalTickets,
          open_tickets: openTickets,
          completed_tickets: completedTickets,
          total_maintenance_cost: totalMaintenanceCost
        },
        tickets: ticketsRes.rows
      });
    }

    if (req.method === 'POST') {
      const {
        equipment_id,
        new_equipment_model,
        new_equipment_brand,
        new_equipment_serial,
        ticket_type,
        priority,
        description,
        hour_meter,
        evidence_photos
      } = req.body || {};

      if (!description && !ticket_type) {
        return res.status(400).json({ error: 'Tipo de chamado e descrição são obrigatórios.' });
      }

      let finalEquipmentId = equipment_id ? Number(equipment_id) : null;

      // If client is adding a new equipment on the fly
      if (!finalEquipmentId && (new_equipment_model || new_equipment_serial)) {
        const brand = new_equipment_brand?.trim() || 'Tennant';
        const model = new_equipment_model?.trim() || 'Equipamento Tennant';
        const name = `${brand} ${model}`;
        const serial = new_equipment_serial?.trim() || 'Não informado';

        const eqRes = await dbClient.query(`
          INSERT INTO equipments (
            client_id,
            name,
            brand,
            model,
            serial_number,
            ownership_type,
            status
          )
          VALUES ($1, $2, $3, $4, $5, 'Próprio do Cliente', 'Em Operação')
          RETURNING id
        `, [clientId, name, brand, model, serial]);
        finalEquipmentId = eqRes.rows[0].id;
      }

      const tType = ticket_type || 'Corretiva';
      const tPriority = priority || 'Média';
      const tDesc = description?.trim() || '';
      const hMeter = hour_meter ? parseInt(hour_meter, 10) : null;
      const photos = evidence_photos ? JSON.stringify(evidence_photos) : null;

      const insertTicketRes = await dbClient.query(`
        INSERT INTO service_tickets (
          client_id,
          equipment_id,
          ticket_type,
          status,
          priority,
          description,
          origin,
          hour_meter,
          evidence_photos
        )
        VALUES ($1, $2, $3, 'Aberto', $4, $5, 'portal_cliente', $6, $7)
        RETURNING *
      `, [
        clientId,
        finalEquipmentId,
        tType,
        tPriority,
        tDesc,
        hMeter,
        photos
      ]);

      const newTicket = insertTicketRes.rows[0];

      // Fetch client & equipment info for immediate notifications
      try {
        const cRes = await dbClient.query('SELECT name, phone, address FROM clients WHERE id = $1', [clientId]);
        const eqRes = finalEquipmentId ? await dbClient.query('SELECT model, serial_number FROM equipments WHERE id = $1', [finalEquipmentId]) : { rows: [] };
        
        const clientInfo = cRes.rows[0] || {};
        const eqInfo = eqRes.rows[0] || {};

        const notificationPayload = {
          ...newTicket,
          client_name: clientInfo.name,
          client_phone: clientInfo.phone,
          client_address: clientInfo.address,
          equipment_model: eqInfo.model || 'Não especificado',
          equipment_serial_number: eqInfo.serial_number || 'S/N'
        };

        sendTicketWhatsappGroupNotification(dbClient, notificationPayload, clientInfo.name, null, 'novo', []).catch(console.error);
        sendTicketEmailNotification(dbClient, notificationPayload, clientInfo.name, null, 'novo').catch(console.error);
      } catch (e) {
        console.warn('Erro ao enviar notificação de chamado aberto pelo portal:', e);
      }

      return res.status(201).json({
        success: true,
        message: 'Chamado aberto com sucesso!',
        ticket: newTicket
      });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Erro na API de chamados do portal:', error);
    return res.status(500).json({ error: 'Erro interno ao processar chamados do cliente.' });
  } finally {
    dbClient.release();
  }
}
