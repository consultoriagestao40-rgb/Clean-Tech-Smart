import { Pool } from 'pg';
import { getAuthUser } from '../_utils/auth.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  // CORS support
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    getAuthUser(req); // Authentication check
    const { id, completed, lead_phone, title, due_date } = req.body || {};

    const dbClient = await pool.connect();
    try {
      if (id !== undefined) {
        // Toggle completion or update existing task
        const updateRes = await dbClient.query(
          `UPDATE crm_tasks 
           SET completed = $1 
           WHERE id = $2 
           RETURNING *`,
          [Boolean(completed), Number(id)]
        );
        if (updateRes.rows.length === 0) {
          return res.status(404).json({ error: 'Tarefa não encontrada' });
        }
        return res.status(200).json({ task: updateRes.rows[0] });
      } else {
        // Create new task
        if (!lead_phone || !title) {
          return res.status(400).json({ error: 'lead_phone e title são obrigatórios para nova tarefa' });
        }

        const cleanPhone = lead_phone.trim();
        const parsedDueDate = due_date ? new Date(due_date) : null;

        const insertRes = await dbClient.query(
          `INSERT INTO crm_tasks (lead_phone, title, completed, due_date) 
           VALUES ($1, $2, FALSE, $3) 
           RETURNING *`,
          [cleanPhone, title.trim(), parsedDueDate]
        );

        return res.status(201).json({ task: insertRes.rows[0] });
      }
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error('Erro na API crm/tasks:', error);
    return res.status(error.message.includes('Token') || error.message.includes('Authorization') ? 401 : 500)
      .json({ error: error.message });
  }
}
