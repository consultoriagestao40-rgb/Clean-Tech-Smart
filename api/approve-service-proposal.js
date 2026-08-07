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

  const { id, feedback } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'ID não informado.' });
  }

  try {
    const isApproval = !feedback?.includes('[Solicitação de Ajustes]');
    const newStatus = isApproval ? 'Aprovada' : 'Negociação';

    const { rows } = await pool.query(`
      UPDATE service_proposals
      SET status = $1,
          notes = CASE 
            WHEN notes IS NULL OR notes = '' THEN $2
            ELSE notes || E'\n' || $2
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [newStatus, feedback || '', id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada.' });
    }

    const proposal = rows[0];

    // Trigger WhatsApp notification in background
    try {
      const detailsRes = await pool.query(`
        SELECT sp.*, c.name as fetched_client_name
        FROM service_proposals sp
        LEFT JOIN clients c ON sp.client_id::text = c.id::text
        WHERE sp.id = $1
      `, [proposal.id]);

      const details = detailsRes.rows[0] || {};
      const formattedVal = proposal.monthly_value
        ? `R$ ${Number(proposal.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês (${proposal.contract_period || '12 meses'})`
        : '';

      sendProposalApprovalWhatsappGroupNotification(pool, {
        type: 'servico',
        id: proposal.id,
        clientName: details.fetched_client_name || proposal.client_name || 'Cliente',
        itemDetails: proposal.machines_summary || 'Plano de Manutenção Preventiva & Gestão Recorrente',
        value: formattedVal,
        approvedBy: isApproval ? 'Cliente (Assinatura Digital)' : 'Solicitado ajuste pelo cliente',
        feedback: feedback || null,
        status: newStatus
      }).catch(err => console.error('Erro notificacao WhatsApp servico:', err));
    } catch (notifErr) {
      console.error('Erro ao montar notificacao de servico:', notifErr);
    }

    return res.status(200).json({ proposal: proposal });
  } catch (error) {
    console.error('Erro ao atualizar status da proposta de serviço:', error);
    return res.status(500).json({ error: 'Erro interno ao processar aprovação.' });
  }
}
