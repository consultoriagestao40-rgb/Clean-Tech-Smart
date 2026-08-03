import { Pool } from 'pg';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

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

  const {
    id,
    evidence_photos,
    client_signature,
    signed_by_name,
    signed_by_document,
    resolution_notes,
    internal_notes
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID do chamado é obrigatório.' });
  }

  const client = await pool.connect();

  try {
    const result = await client.query(`
      UPDATE service_tickets
      SET status = 'Concluído',
          evidence_photos = $1,
          client_signature = $2,
          signed_by_name = $3,
          signed_by_document = $4,
          resolution_notes = $5,
          internal_notes = COALESCE($6, internal_notes),
          closed_at = NOW(),
          updated_at = NOW()
      WHERE id = $7
      RETURNING *;
    `, [
      evidence_photos || null,
      client_signature || null,
      signed_by_name || null,
      signed_by_document || null,
      resolution_notes || null,
      internal_notes || null,
      Number(id)
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chamado não encontrado.' });
    }

    const ticket = result.rows[0];

    // Buscar dados complementares para as notificações de fechamento
    try {
      const detailsRes = await client.query(`
        SELECT c.name as client_name, c.address as client_address, t.name as technician_name
        FROM service_tickets st
        LEFT JOIN clients c ON st.client_id = c.id
        LEFT JOIN technicians t ON st.technician_id = t.id
        WHERE st.id = $1
      `, [ticket.id]);

      const details = detailsRes.rows[0] || {};
      ticket.address = details.client_address;

      // Importar dinamicamente os helpers de notificação
      const { sendTicketWhatsappGroupNotification, sendTicketEmailNotification } = await import('./_utils/notifications.js');

      // Disparar de forma assíncrona (não-bloqueante)
      sendTicketWhatsappGroupNotification(client, ticket, details.client_name, details.technician_name || ticket.technician_name || 'Não atribuído', 'close')
        .catch(err => console.error('Erro ao enviar notificação WhatsApp:', err));
      
      sendTicketEmailNotification(client, ticket, details.client_name, details.technician_name || ticket.technician_name || 'Não atribuído', 'close')
        .catch(err => console.error('Erro ao enviar notificação E-mail:', err));
    } catch (notifErr) {
      console.error('Falha ao processar notificações de fechamento:', notifErr);
    }

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error('Erro ao fechar chamado:', error);
    return res.status(500).json({ error: 'Erro interno ao fechar chamado' });
  } finally {
    client.release();
  }
}
