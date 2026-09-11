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

    const techId = data.technicianId ? Number(data.technicianId) : (data.technician_id ? Number(data.technician_id) : null);
    const tickId = data.ticketId ? Number(data.ticketId) : (data.ticket_id ? Number(data.ticket_id) : null);
    const createdBy = data.createdByUserId ? Number(data.createdByUserId) : null;

    // Quick status update (e.g. Gestor approval: { id, status: 'Aprovado' })
    if (budgetId && data.status && (!data.logistics && data.client === undefined)) {
      await client.query(`UPDATE budgets SET status = $1 WHERE id = $2`, [data.status, budgetId]);
      
      // If approved and has ticket_id, update service_tickets budget_id & status if needed
      const bRes = await client.query(`SELECT ticket_id, grand_total FROM budgets WHERE id = $1`, [budgetId]);
      if (bRes.rows.length > 0 && bRes.rows[0].ticket_id) {
        await client.query(`
          UPDATE service_tickets 
          SET budget_id = $1, budget_value = $2 
          WHERE id = $3
        `, [budgetId, bRes.rows[0].grand_total, bRes.rows[0].ticket_id]);
      }

      await client.query('COMMIT');
      return res.status(200).json({ success: true, id: budgetId, status: data.status });
    }

    if (budgetId) {
      // 1. Atualizar orcamento existente
      await client.query(`
        UPDATE budgets 
        SET client_id = $1, contact_name = $2, contact_info = $3, service_type = $4, 
            initial_km = $5, final_km = $6, price_per_km = $7, 
            total_labor = $8, total_parts = $9, total_logistics = $10, grand_total = $11, notes = $12, status = $13, equipment_id = $14,
            markup_percent = $15, machine_model_id = $16, technician_id = COALESCE($17, technician_id), ticket_id = COALESCE($18, ticket_id)
        WHERE id = $19
      `, [
        data.client, data.contact, data.contactInfo, data.serviceType,
        data.logistics.initialKm, data.logistics.finalKm, data.logistics.pricePerKm,
        data.totalLabor, data.totalParts, data.totalLogistics, data.grandTotal, data.notes,
        data.status || 'Pendente de Aprovação', data.equipmentId ? Number(data.equipmentId) : null,
        markupPercent,
        data.machineModelId ? Number(data.machineModelId) : null,
        techId,
        tickId,
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
          markup_percent, machine_model_id, technician_id, ticket_id, created_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id;
      `, [
        data.client, data.contact, data.contactInfo, data.serviceType,
        data.logistics.initialKm, data.logistics.finalKm, data.logistics.pricePerKm,
        data.totalLabor, data.totalParts, data.totalLogistics, data.grandTotal, data.notes,
        data.status || 'Pendente de Aprovação', data.equipmentId ? Number(data.equipmentId) : null,
        markupPercent,
        data.machineModelId ? Number(data.machineModelId) : null,
        techId,
        tickId,
        createdBy
      ]);

      budgetId = budgetResult.rows[0].id;
    }

    // Vincular ao chamado em service_tickets se informado
    if (tickId) {
      await client.query(`
        UPDATE service_tickets 
        SET budget_id = $1, updated_at = NOW() 
        WHERE id = $2
      `, [budgetId, tickId]);
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
