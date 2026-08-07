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
    return res.status(400).json({ error: 'ID da proposta é obrigatório.' });
  }

  try {
    const { rows } = await pool.query(`
      UPDATE sales_proposals
      SET status = 'Aprovada',
          notes = COALESCE(notes, '') || E'\n[Aprovação Digital]: ' || $2
      WHERE id = $1
      RETURNING *
    `, [id, feedback || 'Proposta de Venda assinada e aprovada digitalmente pelo cliente.']);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada.' });
    }

    const proposal = rows[0];

    // Trigger WhatsApp notification in background
    try {
      const detailsRes = await pool.query(`
        SELECT c.name as client_name, mm.name as machine_name
        FROM sales_proposals sp
        LEFT JOIN clients c ON sp.client_id::text = c.id::text
        LEFT JOIN machine_models mm ON sp.machine_model_id = mm.id
        WHERE sp.id = $1
      `, [proposal.id]);

      const details = detailsRes.rows[0] || {};
      const totalVal = proposal.sale_price || proposal.total_price;
      const formattedVal = totalVal ? `R$ ${Number(totalVal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';

      sendProposalApprovalWhatsappGroupNotification(pool, {
        type: 'venda',
        id: proposal.id,
        clientName: details.client_name || proposal.client_name || 'Cliente',
        itemDetails: details.machine_name || 'Equipamento de Venda',
        value: formattedVal,
        approvedBy: 'Cliente (Assinatura Digital)',
        feedback: feedback || null,
        status: 'Aprovada'
      }).catch(err => console.error('Erro notificacao WhatsApp venda:', err));
    } catch (notifErr) {
      console.error('Erro ao montar notificacao de venda:', notifErr);
    }

    return res.status(200).json({ proposal: proposal });
  } catch (error) {
    console.error('Erro ao aprovar proposta de venda:', error);
    return res.status(500).json({ error: 'Erro interno ao aprovar proposta.' });
  }
}
