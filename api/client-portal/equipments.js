import { Pool } from 'pg';
import { getAuthUser } from '../_utils/auth.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let user;
  try {
    user = getAuthUser(req);
    if (!user || !user.clientId) {
      return res.status(401).json({ error: 'Acesso não autorizado ao portal.' });
    }
  } catch (authErr) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  const clientId = Number(user.clientId);
  const dbClient = await pool.connect();

  try {
    if (req.method === 'GET') {
      const eqQuery = `
        SELECT 
          e.id,
          e.name,
          e.brand,
          e.model,
          e.serial_number,
          e.ownership_type,
          e.status,
          e.created_at,
          COUNT(DISTINCT st.id) as tickets_count,
          COALESCE(SUM(DISTINCT b.grand_total), 0) as total_maintenance_cost,
          MAX(st.created_at) as last_maintenance_date
        FROM equipments e
        LEFT JOIN service_tickets st ON st.equipment_id = e.id
        LEFT JOIN budgets b ON (b.equipment_id = e.id OR st.budget_id = b.id)
        WHERE e.client_id = $1
        GROUP BY e.id
        ORDER BY e.created_at DESC
      `;
      const result = await dbClient.query(eqQuery, [clientId]);

      return res.status(200).json({
        success: true,
        equipments: result.rows
      });
    }

    if (req.method === 'POST') {
      const {
        brand,
        model,
        serial_number,
        name,
        ownership_type
      } = req.body || {};

      if (!model && !serial_number) {
        return res.status(400).json({ error: 'Modelo ou Número de Série é obrigatório.' });
      }

      const eqBrand = brand?.trim() || 'Tennant';
      const eqModel = model?.trim() || 'Lavadora Tennant';
      const eqName = name?.trim() || `${eqBrand} ${eqModel}`;
      const eqSerial = serial_number?.trim() || 'Não informado';
      const eqOwnership = ownership_type || 'Próprio do Cliente';

      const insertRes = await dbClient.query(`
        INSERT INTO equipments (
          client_id,
          name,
          brand,
          model,
          serial_number,
          ownership_type,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'Em Operação')
        RETURNING *
      `, [
        clientId,
        eqName,
        eqBrand,
        eqModel,
        eqSerial,
        eqOwnership
      ]);

      return res.status(201).json({
        success: true,
        message: 'Equipamento cadastrado com sucesso!',
        equipment: insertRes.rows[0]
      });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Erro na API de equipamentos do portal:', error);
    return res.status(500).json({ error: 'Erro interno ao processar equipamentos.' });
  } finally {
    dbClient.release();
  }
}
