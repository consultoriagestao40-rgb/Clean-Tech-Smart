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

  // Ensure table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_proposals (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      machines_included TEXT,
      preventive_scope TEXT,
      corrective_scope TEXT,
      extra_hours_scope TEXT,
      service_description TEXT,
      quantity TEXT,
      monthly_value TEXT,
      contract_months TEXT,
      payment_terms TEXT,
      validity_days TEXT,
      parts_notes TEXT,
      notes TEXT,
      seller_info TEXT,
      status TEXT DEFAULT 'Rascunho',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const {
    id, client_id, machines_included,
    preventive_scope, corrective_scope, extra_hours_scope,
    service_description, quantity, monthly_value,
    contract_months, payment_terms, validity_days,
    parts_notes, notes, seller_info, status
  } = req.body;

  if (!client_id) {
    return res.status(400).json({ error: 'O campo Cliente é obrigatório.' });
  }

  try {
    if (id) {
      // Update
      const { rows } = await pool.query(`
        UPDATE service_proposals
        SET client_id = $1, machines_included = $2,
            preventive_scope = $3, corrective_scope = $4, extra_hours_scope = $5,
            service_description = $6, quantity = $7, monthly_value = $8,
            contract_months = $9, payment_terms = $10, validity_days = $11,
            parts_notes = $12, notes = $13, seller_info = $14, status = $15, updated_at = CURRENT_TIMESTAMP
        WHERE id = $16
        RETURNING *
      `, [
        client_id,
        machines_included || '02 Lavadoras de Piso Industriais — Modelo Brava',
        preventive_scope || '',
        corrective_scope || '',
        extra_hours_scope || '',
        service_description || '',
        quantity || '02 un.',
        monthly_value || 'R$ 3.000,00',
        contract_months || '12 meses',
        payment_terms || 'Mensal via boleto bancário / PIX',
        validity_days || '15 dias',
        parts_notes || '',
        notes || '',
        seller_info || '',
        status || 'Rascunho',
        id
      ]);
      return res.status(200).json({ proposal: rows[0] });
    } else {
      // Insert
      const { rows } = await pool.query(`
        INSERT INTO service_proposals (
          client_id, machines_included,
          preventive_scope, corrective_scope, extra_hours_scope,
          service_description, quantity, monthly_value,
          contract_months, payment_terms, validity_days,
          parts_notes, notes, seller_info, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `, [
        client_id,
        machines_included || '02 Lavadoras de Piso Industriais — Modelo Brava',
        preventive_scope || '',
        corrective_scope || '',
        extra_hours_scope || '',
        service_description || '',
        quantity || '02 un.',
        monthly_value || 'R$ 3.000,00',
        contract_months || '12 meses',
        payment_terms || 'Mensal via boleto bancário / PIX',
        validity_days || '15 dias',
        parts_notes || '',
        notes || '',
        seller_info || '',
        status || 'Rascunho'
      ]);
      return res.status(201).json({ proposal: rows[0] });
    }
  } catch (error) {
    console.error('Erro ao salvar proposta de serviço:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar proposta de serviço.' });
  }
}
