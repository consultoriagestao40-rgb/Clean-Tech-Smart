import { Pool } from 'pg';
import { getAuthUser } from '../_utils/auth.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let dbClient;
  try {
    dbClient = await pool.connect();
  } catch (e) {
    console.error('[CRM Tasks DB Connection Error]:', e.message);
  }

  try {
    let currentUser = null;
    try {
      currentUser = getAuthUser(req);
    } catch (authErr) {
      console.warn('[tasks] JWT auth skipped/fallback:', authErr.message);
    }

    if (req.method === 'GET') {
      const { phone, lead_phone } = req.query || {};
      const targetPhone = phone || lead_phone;

      if (!dbClient) {
        return res.status(200).json({ tasks: [] });
      }

      if (targetPhone) {
        const digits = targetPhone.replace(/\D/g, '');
        const suffix = digits.length >= 8 ? digits.slice(-8) : digits;

        const result = await dbClient.query(
          `SELECT 
             t.id, 
             t.lead_phone, 
             t.title, 
             t.completed, 
             to_char(t.due_date, 'YYYY-MM-DD"T"HH24:MI:SS') as due_date,
             to_char(t.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') as created_at
           FROM crm_tasks t
           WHERE t.lead_phone = $1 OR replace(t.lead_phone, '-', '') LIKE $2
           ORDER BY t.completed ASC, t.due_date ASC NULLS LAST, t.id DESC`,
          [targetPhone, `%${suffix}`]
        );
        return res.status(200).json({ tasks: result.rows });
      } else {
        // Return ALL tasks across all leads (using LIMIT 1 subquery for lead name to prevent duplicate rows)
        const result = await dbClient.query(
          `SELECT 
             t.id, 
             t.lead_phone, 
             COALESCE(
               (SELECT CASE 
                         WHEN company IS NOT NULL AND contact_name IS NOT NULL THEN company || ' (' || contact_name || ')'
                         WHEN company IS NOT NULL THEN company
                         WHEN contact_name IS NOT NULL THEN contact_name
                         ELSE name
                       END 
                FROM leads 
                WHERE phone = t.lead_phone OR replace(phone, '-', '') LIKE '%' || right(replace(t.lead_phone, '-', ''), 8) 
                LIMIT 1),
               t.lead_phone
             ) as lead_name,
             t.title, 
             t.completed, 
             to_char(t.due_date, 'YYYY-MM-DD"T"HH24:MI:SS') as due_date,
             to_char(t.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') as created_at
           FROM crm_tasks t
           ORDER BY t.completed ASC, t.due_date ASC NULLS LAST, t.id DESC`
        );
        return res.status(200).json({ tasks: result.rows });
      }
    } else if (req.method === 'POST') {
      const { id, action, completed, lead_phone, title, due_date } = req.body || {};

      if (!dbClient) {
        return res.status(500).json({ error: 'Banco de dados indisponível' });
      }

      if (action === 'delete' && id) {
        await dbClient.query(`DELETE FROM crm_tasks WHERE id = $1`, [Number(id)]);
        return res.status(200).json({ success: true, deletedId: id });
      }

      if (id !== undefined && id !== null && action !== 'create') {
        // Toggle completion or update task
        const updateRes = await dbClient.query(
          `UPDATE crm_tasks 
           SET completed = $1 
           WHERE id = $2 
           RETURNING id, lead_phone, title, completed, to_char(due_date, 'YYYY-MM-DD"T"HH24:MI:SS') as due_date`,
          [Boolean(completed), Number(id)]
        );
        if (updateRes.rows.length === 0) {
          return res.status(404).json({ error: 'Tarefa não encontrada' });
        }
        return res.status(200).json({ task: updateRes.rows[0] });
      } else {
        // Create new task
        if (!lead_phone || !title) {
          return res.status(400).json({ error: 'lead_phone e title são obrigatórios' });
        }

        const cleanPhone = lead_phone.trim();
        const formattedDueDate = due_date ? due_date.replace('T', ' ').substring(0, 19) : null;

        const insertRes = await dbClient.query(
          `INSERT INTO crm_tasks (lead_phone, title, completed, due_date) 
           VALUES ($1, $2, FALSE, $3::timestamp) 
           RETURNING id, lead_phone, title, completed, to_char(due_date, 'YYYY-MM-DD"T"HH24:MI:SS') as due_date`,
          [cleanPhone, title.trim(), formattedDueDate]
        );

        return res.status(201).json({ task: insertRes.rows[0] });
      }
    } else if (req.method === 'DELETE') {
      const { id } = req.query || req.body || {};
      if (!id || !dbClient) return res.status(400).json({ error: 'ID é obrigatório' });
      await dbClient.query(`DELETE FROM crm_tasks WHERE id = $1`, [Number(id)]);
      return res.status(200).json({ success: true, deletedId: id });
    } else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Erro na API crm/tasks:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (dbClient) dbClient.release();
  }
}
