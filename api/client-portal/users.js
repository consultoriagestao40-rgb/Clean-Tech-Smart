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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
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
      const resQuery = await dbClient.query(`
        SELECT id, name, email, phone, role, created_at
        FROM client_portal_users
        WHERE client_id = $1
        ORDER BY created_at ASC
      `, [clientId]);

      return res.status(200).json({
        success: true,
        users: resQuery.rows
      });
    }

    if (req.method === 'POST') {
      const { name, email, phone, role } = req.body || {};
      if (!name) {
        return res.status(400).json({ error: 'O nome do usuário é obrigatório.' });
      }

      const insertRes = await dbClient.query(`
        INSERT INTO client_portal_users (client_id, name, email, phone, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        clientId,
        name.trim(),
        email?.trim() || null,
        phone?.trim() || null,
        role?.trim() || 'Operador / Solicitante'
      ]);

      return res.status(201).json({
        success: true,
        message: 'Usuário cadastrado com sucesso!',
        user: insertRes.rows[0]
      });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
      }

      await dbClient.query(`
        DELETE FROM client_portal_users
        WHERE id = $1 AND client_id = $2
      `, [Number(id), clientId]);

      return res.status(200).json({ success: true, message: 'Usuário removido com sucesso.' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Erro na API de usuários do portal:', error);
    return res.status(500).json({ error: 'Erro interno ao gerenciar usuários.' });
  } finally {
    dbClient.release();
  }
}
