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

  const { id, status, client_feedback, approved_by } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'ID e Status são obrigatórios.' });
  }

  try {
    const timeStr = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const auditMsg = status === 'Aprovado' 
      ? `Aprovado por: ${approved_by || 'Cliente'} em ${timeStr}. Feedback: ${client_feedback || 'Nenhum'}`
      : `Recusado/Ajuste solicitado em ${timeStr}. Motivo: ${client_feedback || 'Nenhum'}`;

    const { rows } = await pool.query(`
      UPDATE budgets
      SET status = $1,
          notes = CASE 
            WHEN notes IS NULL OR notes = '' THEN $2::text
            ELSE CONCAT(notes, E'\n\n--- Histórico de Decisão ---\n', $2::text)
          END
      WHERE id = $3
      RETURNING *
    `, [status, auditMsg, id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Orçamento não encontrado.' });
    }

    const budget = rows[0];

    // Trigger WhatsApp notification in background
    try {
      const detailsRes = await pool.query(`
        SELECT c.name as client_name, eq.name as equipment_name, eq.model as equipment_model, eq.serial_number
        FROM budgets b
        LEFT JOIN clients c ON b.client_id::text = c.id::text
        LEFT JOIN equipments eq ON b.equipment_id = eq.id
        WHERE b.id = $1
      `, [budget.id]);

      const details = detailsRes.rows[0] || {};
      const itemDetails = details.equipment_name
        ? `${details.equipment_name} ${details.equipment_model ? `(${details.equipment_model})` : ''} ${details.serial_number ? `S/N: ${details.serial_number}` : ''}`.trim()
        : 'Assistência Técnica de Equipamento';

      const totalVal = budget.total_budget_value || budget.total_value;
      const formattedVal = totalVal ? `R$ ${Number(totalVal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';

      sendProposalApprovalWhatsappGroupNotification(pool, {
        type: 'orcamento',
        id: budget.id,
        clientName: details.client_name || 'Cliente',
        itemDetails: itemDetails,
        value: formattedVal,
        approvedBy: approved_by || 'Cliente (Aprovação Digital)',
        feedback: client_feedback || null,
        status: status
      }).catch(err => console.error('Erro notificacao WhatsApp orcamento:', err));
    } catch (notifErr) {
      console.error('Erro ao montar notificacao de orcamento:', notifErr);
    }

    return res.status(200).json({ success: true, budget: budget });
  } catch (error) {
    console.error('Erro ao aprovar/recusar orçamento:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar decisão.' });
  }
}
