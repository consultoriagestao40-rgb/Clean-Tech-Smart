import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const client = await pool.connect();

  try {
    await client.query(`
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS budget_id INT;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rental_proposal_id INT;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(50);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS conta_azul_sale_id VARCHAR(100);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ncm_info TEXT;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_date DATE;

      UPDATE invoices 
      SET status = 'Faturada' 
      WHERE conta_azul_sale_id IS NOT NULL 
        AND (status = 'Pendente' OR status IS NULL);
    `);

    const result = await client.query(`
      SELECT 
        i.*,
        c.name as client_name,
        rp.period_months as rental_period_months,
        mm.name as rental_machine_name,
        eq.name as rental_equipment_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id::text = c.id::text
      LEFT JOIN rental_proposals rp ON i.rental_proposal_id = rp.id
      LEFT JOIN machine_models mm ON rp.machine_model_id = mm.id
      LEFT JOIN equipments eq ON rp.equipment_id = eq.id
      ORDER BY i.due_date DESC;
    `);
    
    // Processar inteligência de "Vencida" no backend se a data passou
    const today = new Date();
    today.setHours(0,0,0,0);

    const invoices = result.rows.map(inv => {
      const dueDate = new Date(inv.due_date);
      let status = inv.status;
      
      if ((status === 'Pendente' || !status) && inv.conta_azul_sale_id) {
        status = 'Faturada';
      }

      if ((status === 'Pendente' || status === 'Faturada') && dueDate < today) {
        status = 'Vencida';
      }

      return { ...inv, status };
    });

    return res.status(200).json({ success: true, invoices });
  } catch (error) {
    console.error('Erro ao buscar faturas:', error);
    return res.status(500).json({ error: 'Erro interno' });
  } finally {
    client.release();
  }
}
