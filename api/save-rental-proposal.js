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
    id, client_id, machine_model_id, equipment_id, rental_price_id, period_months, monthly_value,
    contract_type, hours_per_month, region_used, delivery_time, freight_cost, validity_days,
    notes, seller_info, insumos_percent, manutencao_percent, lucro_percent, tributos_percent,
    status
  } = req.body;

  if (!client_id || !machine_model_id || !rental_price_id) {
    return res.status(400).json({ error: 'Os campos Cliente, Máquina e Tabela de Locação são obrigatórios.' });
  }

  const client = await pool.connect();

  try {
    // Ensure equipment_id column exists on rental_proposals
    await client.query(`
      ALTER TABLE rental_proposals ADD COLUMN IF NOT EXISTS equipment_id INTEGER;
    `);

    const finalEquipmentId = equipment_id ? Number(equipment_id) : null;
    const finalClientId = Number(client_id);
    const proposalStatus = status || 'Rascunho';

    let savedProposal;
    if (id) {
      // Update
      const { rows } = await client.query(`
        UPDATE rental_proposals
        SET client_id = $1, machine_model_id = $2, equipment_id = $3, rental_price_id = $4, period_months = $5,
            monthly_value = $6, contract_type = $7, hours_per_month = $8, region_used = $9,
            delivery_time = $10, freight_cost = $11, validity_days = $12, notes = $13, seller_info = $14,
            insumos_percent = $15, manutencao_percent = $16, lucro_percent = $17, tributos_percent = $18,
            status = $19
        WHERE id = $20
        RETURNING *
      `, [
        finalClientId, machine_model_id, finalEquipmentId, rental_price_id, period_months, monthly_value,
        contract_type, hours_per_month, region_used, delivery_time, freight_cost, validity_days,
        notes, seller_info, insumos_percent, manutencao_percent, lucro_percent, tributos_percent,
        proposalStatus, id
      ]);
      savedProposal = rows[0];
    } else {
      // Insert
      const { rows } = await client.query(`
        INSERT INTO rental_proposals (
          client_id, machine_model_id, equipment_id, rental_price_id, period_months, monthly_value,
          contract_type, hours_per_month, region_used, delivery_time, freight_cost, validity_days,
          notes, seller_info, insumos_percent, manutencao_percent, lucro_percent, tributos_percent,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `, [
        finalClientId, machine_model_id, finalEquipmentId, rental_price_id, period_months, monthly_value,
        contract_type, hours_per_month, region_used, delivery_time, freight_cost, validity_days,
        notes, seller_info, insumos_percent, manutencao_percent, lucro_percent, tributos_percent,
        proposalStatus
      ]);
      savedProposal = rows[0];
    }

    // Auto-update physical equipment asset in equipments table if selected
    if (finalEquipmentId) {
      const eqStatus = ['Aprovada', 'Fechada', 'Em Contrato', 'Enviada'].includes(proposalStatus) ? 'Locado' : 'Alocado';
      await client.query(`
        UPDATE equipments
        SET client_id = $1, status = $2
        WHERE id = $3
      `, [finalClientId, eqStatus, finalEquipmentId]);
    }

    return res.status(id ? 200 : 201).json({ proposal: savedProposal });
  } catch (error) {
    console.error('Erro ao salvar proposta de locação:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar proposta.' });
  } finally {
    client.release();
  }
}
