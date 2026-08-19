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
    status, items
  } = req.body;

  if (!client_id) {
    return res.status(400).json({ error: 'O campo Cliente é obrigatório.' });
  }

  const primaryItem = Array.isArray(items) && items.length > 0 ? items[0] : null;
  const finalMachineModelId = primaryItem?.machine_model_id || machine_model_id;
  const finalRentalPriceId = primaryItem?.rental_price_id || rental_price_id;
  const finalPeriodMonths = primaryItem?.period_months || period_months || 36;
  const finalMonthlyValue = primaryItem?.monthly_value || monthly_value || '0.00';
  const finalEquipmentId = (primaryItem?.equipment_id ? Number(primaryItem.equipment_id) : (equipment_id ? Number(equipment_id) : null));
  const finalContractType = primaryItem?.contract_type || contract_type || '0 - Sem cobertura.';
  const finalHoursPerMonth = primaryItem?.hours_per_month || hours_per_month || '100 horas/mês';
  const itemsJson = items && Array.isArray(items) ? JSON.stringify(items) : null;

  if (!finalMachineModelId || !finalRentalPriceId) {
    return res.status(400).json({ error: 'Pelo menos uma opção com Máquina e Tabela de Locação é obrigatória.' });
  }

  const client = await pool.connect();

  try {
    // Ensure equipment_id and items columns exist on rental_proposals
    await client.query(`
      ALTER TABLE rental_proposals ADD COLUMN IF NOT EXISTS equipment_id INTEGER;
      ALTER TABLE rental_proposals ADD COLUMN IF NOT EXISTS items JSONB;
    `);

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
            status = $19, items = $20
        WHERE id = $21
        RETURNING *
      `, [
        finalClientId, finalMachineModelId, finalEquipmentId, finalRentalPriceId, finalPeriodMonths, finalMonthlyValue,
        finalContractType, finalHoursPerMonth, region_used, delivery_time, freight_cost, validity_days,
        notes, seller_info, insumos_percent, manutencao_percent, lucro_percent, tributos_percent,
        proposalStatus, itemsJson, id
      ]);
      savedProposal = rows[0];
    } else {
      // Insert
      const { rows } = await client.query(`
        INSERT INTO rental_proposals (
          client_id, machine_model_id, equipment_id, rental_price_id, period_months, monthly_value,
          contract_type, hours_per_month, region_used, delivery_time, freight_cost, validity_days,
          notes, seller_info, insumos_percent, manutencao_percent, lucro_percent, tributos_percent,
          status, items
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *
      `, [
        finalClientId, finalMachineModelId, finalEquipmentId, finalRentalPriceId, finalPeriodMonths, finalMonthlyValue,
        finalContractType, finalHoursPerMonth, region_used, delivery_time, freight_cost, validity_days,
        notes, seller_info, insumos_percent, manutencao_percent, lucro_percent, tributos_percent,
        proposalStatus, itemsJson
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
