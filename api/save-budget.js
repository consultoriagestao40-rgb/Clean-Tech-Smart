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

  const client = await pool.connect();

  try {
    const data = req.body;
    let budgetId = data.id ? Number(data.id) : null;
    const markupPercent = Number(data.markupPercent !== undefined ? data.markupPercent : 28.00);
    
    await client.query('BEGIN');

    if (budgetId) {
      // 1. Atualizar orcamento existente
      await client.query(`
        UPDATE budgets 
        SET client_id = $1, contact_name = $2, contact_info = $3, service_type = $4, 
            initial_km = $5, final_km = $6, price_per_km = $7, 
            total_labor = $8, total_parts = $9, total_logistics = $10, grand_total = $11, notes = $12, status = $13, equipment_id = $14,
            markup_percent = $15
        WHERE id = $16
      `, [
        data.client, data.contact, data.contactInfo, data.serviceType,
        data.logistics.initialKm, data.logistics.finalKm, data.logistics.pricePerKm,
        data.totalLabor, data.totalParts, data.totalLogistics, data.grandTotal, data.notes,
        data.status || 'Pendente', data.equipmentId ? Number(data.equipmentId) : null,
        markupPercent,
        budgetId
      ]);

      // 2. Limpar registros de mao de obra e pecas antigos
      await client.query(`DELETE FROM budget_labor WHERE budget_id = $1`, [budgetId]);
      await client.query(`DELETE FROM budget_parts WHERE budget_id = $1`, [budgetId]);
    } else {
      // Inserir orcamento novo
      const budgetResult = await client.query(`
        INSERT INTO budgets (
          client_id, contact_name, contact_info, service_type, 
          initial_km, final_km, price_per_km, 
          total_labor, total_parts, total_logistics, grand_total, notes, status, equipment_id,
          markup_percent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id;
      `, [
        data.client, data.contact, data.contactInfo, data.serviceType,
        data.logistics.initialKm, data.logistics.finalKm, data.logistics.pricePerKm,
        data.totalLabor, data.totalParts, data.totalLogistics, data.grandTotal, data.notes,
        data.status || 'Pendente', data.equipmentId ? Number(data.equipmentId) : null,
        markupPercent
      ]);

      budgetId = budgetResult.rows[0].id;
    }

    // 3. Inserir mao de obra
    for (const item of data.laborItems) {
      await client.query(`
        INSERT INTO budget_labor (budget_id, description, hours, unit_price)
        VALUES ($1, $2, $3, $4)
      `, [budgetId, item.description, item.hours, item.unitPrice]);
    }

    // 4. Inserir pecas (com cost_price)
    for (const item of data.partsItems) {
      const costPrice = item.costPrice !== undefined ? Number(item.costPrice) : null;
      await client.query(`
        INSERT INTO budget_parts (budget_id, part_name, quantity, unit_price, cost_price)
        VALUES ($1, $2, $3, $4, $5)
      `, [budgetId, item.partName, item.quantity, item.unitPrice, costPrice]);
    }

    await client.query('COMMIT');
    
    return res.status(200).json({ success: true, budgetId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao salvar orçamento:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar orçamento' });
  } finally {
    client.release();
  }
}
