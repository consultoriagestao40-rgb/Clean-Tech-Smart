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

  const {
    id, client_id, machine_model_id,
    fob_price, cif_price, taxes_info, proposal_value,
    payment_terms, delivery_time, warranty, validity_days,
    notes, seller_info, status
  } = req.body;

  if (!client_id || !machine_model_id) {
    return res.status(400).json({ error: 'Os campos Cliente e Equipamento são obrigatórios.' });
  }

  try {
    if (id) {
      // Update
      const { rows } = await pool.query(`
        UPDATE sales_proposals
        SET client_id = $1, machine_model_id = $2,
            fob_price = $3, cif_price = $4, taxes_info = $5, proposal_value = $6,
            payment_terms = $7, delivery_time = $8, warranty = $9, validity_days = $10,
            notes = $11, seller_info = $12, status = $13, updated_at = CURRENT_TIMESTAMP
        WHERE id = $14
        RETURNING *
      `, [
        client_id, machine_model_id,
        fob_price || 'A consultar', cif_price || 'A consultar', taxes_info || 'Conforme texto abaixo',
        proposal_value || '', payment_terms || '', delivery_time || '',
        warranty || '12 Meses', validity_days || '10 Dias',
        notes || '', seller_info || '', status || 'Rascunho', id
      ]);
      return res.status(200).json({ proposal: rows[0] });
    } else {
      // Insert
      const { rows } = await pool.query(`
        INSERT INTO sales_proposals (
          client_id, machine_model_id,
          fob_price, cif_price, taxes_info, proposal_value,
          payment_terms, delivery_time, warranty, validity_days,
          notes, seller_info, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        client_id, machine_model_id,
        fob_price || 'A consultar', cif_price || 'A consultar', taxes_info || 'Conforme texto abaixo',
        proposal_value || '', payment_terms || '', delivery_time || '',
        warranty || '12 Meses', validity_days || '10 Dias',
        notes || '', seller_info || '', status || 'Rascunho'
      ]);
      return res.status(201).json({ proposal: rows[0] });
    }
  } catch (error) {
    console.error('Erro ao salvar proposta de venda:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar proposta de venda.' });
  }
}
