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
    const { id, client_id, start_date, status, equipments, services, observations, total_rental_value, total_services_value, total_venal_value } = req.body;
    
    if (!client_id || !start_date) {
      return res.status(400).json({ error: 'Cliente e Data são obrigatórios.' });
    }

    const equipmentsJson = JSON.stringify(equipments || []);
    const servicesJson = JSON.stringify(services || []);

    let result;

    if (id) {
      result = await client.query(`
        UPDATE contracts 
        SET client_id = $1, start_date = $2, status = $3, equipments = $4::jsonb, services = $5::jsonb, observations = $6, total_rental_value = $7, total_services_value = $8, total_venal_value = $9
        WHERE id = $10
        RETURNING *;
      `, [client_id, start_date, status || 'Reserva', equipmentsJson, servicesJson, observations, total_rental_value, total_services_value, total_venal_value, id]);

      await client.query(`
        INSERT INTO contract_history (contract_id, action, status) VALUES ($1, $2, $3)
      `, [id, 'Contrato editado', result.rows[0].status]);

    } else {
      // Gerar código sequencial
      const maxIdRes = await client.query('SELECT MAX(id) as max_id FROM contracts');
      const nextId = (maxIdRes.rows[0].max_id || 0) + 1;
      const code = `CTR-${String(nextId).padStart(4, '0')}`;

      result = await client.query(`
        INSERT INTO contracts (code, client_id, start_date, status, equipments, services, observations, total_rental_value, total_services_value, total_venal_value)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10)
        RETURNING *;
      `, [code, client_id, start_date, status || 'Reserva', equipmentsJson, servicesJson, observations, total_rental_value, total_services_value, total_venal_value]);

      await client.query(`
        INSERT INTO contract_history (contract_id, action, status) VALUES ($1, $2, $3)
      `, [result.rows[0].id, 'Contrato criado', result.rows[0].status]);
    }
    
    return res.status(200).json({ success: true, contract: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar contrato:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar contrato' });
  } finally {
    client.release();
  }
}
