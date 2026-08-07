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
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const client = await pool.connect();

  try {
    const { id, status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ error: 'ID e status são obrigatórios.' });
    }

    const { rows } = await client.query(`
      UPDATE budgets 
      SET status = $1 
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (rows.length > 0 && ['Aprovado', 'Aprovada'].includes(status)) {
      const budget = rows[0];
      try {
        const detailsRes = await client.query(`
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

        sendProposalApprovalWhatsappGroupNotification(client, {
          type: 'orcamento',
          id: budget.id,
          clientName: details.client_name || 'Cliente',
          itemDetails: itemDetails,
          value: formattedVal,
          approvedBy: 'Atualização de Status',
          feedback: null,
          status: status
        }).catch(err => console.error('Erro notificacao WhatsApp update budget:', err));
      } catch (notifErr) {
        console.error('Erro ao notificar update budget:', notifErr);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar status do orçamento:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar status' });
  } finally {
    client.release();
  }
}
