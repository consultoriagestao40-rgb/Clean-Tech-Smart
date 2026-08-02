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
    id, client_id, machine_model_id, rental_price_id, period_months, monthly_value,
    contract_type, hours_per_month, region_used, delivery_time, freight_cost, validity_days,
    notes, seller_info
  } = req.body;

  if (!client_id || !machine_model_id || !rental_price_id) {
    return res.status(400).json({ error: 'Os campos Cliente, Máquina e Tabela de Locação são obrigatórios.' });
  }

  try {
    if (id) {
      // Update
      const { rows } = await pool.query(`
        UPDATE rental_proposals
        SET client_id = $1, machine_model_id = $2, rental_price_id = $3, period_months = $4,
            monthly_value = $5, contract_type = $6, hours_per_month = $7, region_used = $8,
            delivery_time = $9, freight_cost = $10, validity_days = $11, notes = $12, seller_info = $13
        WHERE id = $14
        RETURNING *
      `, [
        client_id, machine_model_id, rental_price_id, period_months, monthly_value,
        contract_type, hours_per_month, region_used, delivery_time, freight_cost, validity_days,
        notes, seller_info, id
      ]);
      return res.status(200).json({ proposal: rows[0] });
    } else {
      // Insert
      const { rows } = await pool.query(`
        INSERT INTO rental_proposals (
          client_id, machine_model_id, rental_price_id, period_months, monthly_value,
          contract_type, hours_per_month, region_used, delivery_time, freight_cost, validity_days,
          notes, seller_info
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        client_id, machine_model_id, rental_price_id, period_months, monthly_value,
        contract_type, hours_per_month, region_used, delivery_time, freight_cost, validity_days,
        notes, seller_info
      ]);
      return res.status(201).json({ proposal: rows[0] });
    }
  } catch (error) {
    console.error('Erro ao salvar proposta de locação:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar proposta.' });
  }
}
