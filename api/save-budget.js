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
    
    await client.query('BEGIN');

    // 1. Inserir orcamento
    const budgetResult = await client.query(`
      INSERT INTO budgets (
        client_id, contact_name, contact_info, service_type, 
        initial_km, final_km, price_per_km, 
        total_labor, total_parts, total_logistics, grand_total, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id;
    `, [
      data.client, data.contact, data.contactInfo, data.serviceType,
      data.logistics.initialKm, data.logistics.finalKm, data.logistics.pricePerKm,
      data.totalLabor, data.totalParts, data.totalLogistics, data.grandTotal, data.notes
    ]);

    const budgetId = budgetResult.rows[0].id;

    // 2. Inserir mao de obra
    for (const item of data.laborItems) {
      await client.query(`
        INSERT INTO budget_labor (budget_id, description, hours, unit_price)
        VALUES ($1, $2, $3, $4)
      `, [budgetId, item.description, item.hours, item.unitPrice]);
    }

    // 3. Inserir pecas
    for (const item of data.partsItems) {
      await client.query(`
        INSERT INTO budget_parts (budget_id, part_name, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
      `, [budgetId, item.partName, item.quantity, item.unitPrice]);
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
