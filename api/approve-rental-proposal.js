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

  const { id, status, client_feedback, approved_by } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'ID e Status são obrigatórios.' });
  }

  try {
    const timeStr = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const auditMsg = status === 'Fechada' 
      ? `Aprovado por: ${approved_by || 'Cliente'} em ${timeStr}. Feedback: ${client_feedback || 'Nenhum'}`
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

    return res.status(200).json({ success: true, proposal: rows[0] });
  } catch (error) {
    console.error('Erro ao aprovar/recusar proposta:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar decisão.' });
  }
}
