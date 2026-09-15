import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const client = await pool.connect();

  try {
    const { 
      id, client_id: rawClientId, client_name, start_date, status, equipments, services, observations, 
      total_rental_value, total_services_value, total_venal_value,
      expiry_date, readjustment_date, cost_value, tax_cost_percent,
      billing_day, due_day, payment_method, total_installments, current_installment
    } = req.body;

    // Garantir colunas adicionais na tabela contracts
    await client.query(`
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS billing_day INT;
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS due_day INT;
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS total_installments INT;
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS current_installment INT;
    `);

    let client_id = rawClientId;
    // Se não tiver client_id mas tiver client_name, tentar localizar ou criar o cliente
    if ((!client_id || client_id === 'new') && client_name) {
      const cliFind = await client.query('SELECT id FROM clients WHERE LOWER(name) = LOWER($1) LIMIT 1', [client_name.trim()]);
      if (cliFind.rows.length > 0) {
        client_id = cliFind.rows[0].id;
      } else {
        const cliCreate = await client.query(`
          INSERT INTO clients (name, created_at) VALUES ($1, NOW()) RETURNING id
        `, [client_name.trim()]);
        client_id = cliCreate.rows[0].id;
      }
    }
    
    if (!client_id || !start_date) {
      return res.status(400).json({ error: 'Cliente e Data são obrigatórios.' });
    }

    const equipmentsJson = JSON.stringify(equipments || []);
    const servicesJson = JSON.stringify(services || []);

    let result;

    if (id) {
      result = await client.query(`
        UPDATE contracts 
        SET client_id = $1, start_date = $2, status = $3, equipments = $4::jsonb, services = $5::jsonb, 
            observations = $6, total_rental_value = $7, total_services_value = $8, total_venal_value = $9,
            expiry_date = $10, readjustment_date = $11, cost_value = $12, tax_cost_percent = $13,
            billing_day = $14, due_day = $15, payment_method = $16, total_installments = $17, current_installment = $18
        WHERE id = $19
        RETURNING *;
      `, [
        client_id, start_date, status || 'Reserva', equipmentsJson, servicesJson, 
        observations, total_rental_value, total_services_value, total_venal_value,
        expiry_date || null, readjustment_date || null, cost_value || 0, tax_cost_percent || 0,
        billing_day ? parseInt(billing_day) : null,
        due_day ? parseInt(due_day) : null,
        payment_method || 'Boleto',
        total_installments ? parseInt(total_installments) : null,
        current_installment ? parseInt(current_installment) : null,
        id
      ]);

      await client.query(`
        INSERT INTO contract_history (contract_id, action, status) VALUES ($1, $2, $3)
      `, [id, 'Contrato editado', result.rows[0].status]);

    } else {
      // Gerar código sequencial
      const maxIdRes = await client.query('SELECT MAX(id) as max_id FROM contracts');
      const nextId = (maxIdRes.rows[0].max_id || 0) + 1;
      const code = `CTR-${String(nextId).padStart(4, '0')}`;

      result = await client.query(`
        INSERT INTO contracts (
          code, client_id, start_date, status, equipments, services, observations, 
          total_rental_value, total_services_value, total_venal_value,
          expiry_date, readjustment_date, cost_value, tax_cost_percent,
          billing_day, due_day, payment_method, total_installments, current_installment
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *;
      `, [
        code, client_id, start_date, status || 'Ativo', equipmentsJson, servicesJson, 
        observations, total_rental_value, total_services_value, total_venal_value,
        expiry_date || null, readjustment_date || null, cost_value || 0, tax_cost_percent || 0,
        billing_day ? parseInt(billing_day) : null,
        due_day ? parseInt(due_day) : null,
        payment_method || 'Boleto',
        total_installments ? parseInt(total_installments) : null,
        current_installment ? parseInt(current_installment) : null
      ]);

      await client.query(`
        INSERT INTO contract_history (contract_id, action, status) VALUES ($1, $2, $3)
      `, [result.rows[0].id, 'Contrato criado', result.rows[0].status]);
    }

    // Auto-update physical equipment assets in equipments table to Locado and link client_id
    if (equipments && Array.isArray(equipments)) {
      for (const eqItem of equipments) {
        const eqId = eqItem.equipment_id || eqItem.id;
        if (eqId) {
          await client.query(`
            UPDATE equipments
            SET client_id = $1, status = 'Locado'
            WHERE id = $2
          `, [client_id, eqId]);
        }
      }
    }
    
    return res.status(200).json({ success: true, contract: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar contrato:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar contrato' });
  } finally {
    client.release();
  }
}
