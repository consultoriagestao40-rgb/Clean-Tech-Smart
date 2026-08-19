import { Pool } from 'pg';
import { sendProposalApprovalWhatsappGroupNotification } from './_utils/notifications.js';

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

  const { id, status, client_feedback, approved_by, approved_option } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'ID e Status são obrigatórios.' });
  }

  try {
    const timeStr = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const optionNote = approved_option ? ` [Opção Aprovada: ${approved_option}]` : '';
    const auditMsg = status === 'Fechada' || status === 'Aprovada'
      ? `Aprovado por: ${approved_by || 'Cliente'}${optionNote} em ${timeStr}. Feedback: ${client_feedback || 'Nenhum'}`
      : `Recusado em ${timeStr}. Motivo/Ajustes solicitados: ${client_feedback || 'Nenhum'}`;

    const { rows } = await pool.query(`
      UPDATE rental_proposals
      SET status = $1,
          notes = CASE 
            WHEN notes IS NULL OR notes = '' THEN $2::text
            ELSE CONCAT(notes, E'\n\n--- Histórico de Decisão ---\n', $2::text)
          END
      WHERE id = $3
      RETURNING *
    `, [status, auditMsg, id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada.' });
    }

    const proposal = rows[0];

    // Update physical equipment status if linked
    if (proposal.equipment_id && (status === 'Aprovada' || status === 'Fechada')) {
      await pool.query(`
        UPDATE equipments
        SET client_id = $1, status = 'Locado'
        WHERE id = $2
      `, [proposal.client_id, proposal.equipment_id]);
    }

    // Trigger WhatsApp notification in background
    try {
      // Query client & machine model details
      const detailsRes = await pool.query(`
        SELECT c.name as client_name, mm.name as machine_name, eq.name as equipment_name, eq.serial_number
        FROM rental_proposals rp
        LEFT JOIN clients c ON rp.client_id::text = c.id::text
        LEFT JOIN machine_models mm ON rp.machine_model_id = mm.id
        LEFT JOIN equipments eq ON rp.equipment_id = eq.id
        WHERE rp.id = $1
      `, [proposal.id]);

      const details = detailsRes.rows[0] || {};
      const itemDetails = details.equipment_name
        ? `${details.machine_name || ''} (Ativo: ${details.equipment_name} S/N: ${details.serial_number || 'S/N'})`
        : details.machine_name || 'Equipamento de Locação';

      const formattedVal = proposal.monthly_value
        ? `R$ ${Number(proposal.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês (${proposal.period_months || 36} meses)`
        : '';

      sendProposalApprovalWhatsappGroupNotification(pool, {
        type: 'locacao',
        id: proposal.id,
        clientName: details.client_name || 'Cliente',
        itemDetails: itemDetails,
        value: formattedVal,
        approvedBy: approved_by || 'Cliente (Link Público)',
        feedback: client_feedback || null,
        status: status
      }).catch(err => console.error('Erro notificacao WhatsApp locacao:', err));
    } catch (notifErr) {
      console.error('Erro ao montar notificacao de locacao:', notifErr);
    }

    return res.status(200).json({ success: true, proposal: proposal });
  } catch (error) {
    console.error('Erro ao aprovar/recusar proposta:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar decisão.' });
  }
}
