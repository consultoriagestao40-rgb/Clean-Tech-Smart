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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { lead_phone } = req.query || {};
    if (!lead_phone) {
      return res.status(400).json({ error: 'lead_phone é obrigatório' });
    }

    const dbClient = await pool.connect();
    try {
      const digits = lead_phone.replace(/\D/g, '');
      const suffix = digits.length >= 8 ? digits.slice(-8) : digits;
      const notesRes = await dbClient.query(
        `SELECT n.*, u.name as author_name 
         FROM crm_notes n 
         LEFT JOIN users u ON n.user_id = u.id 
         WHERE n.lead_phone = $1 OR replace(n.lead_phone, '-', '') LIKE $2 
         ORDER BY n.created_at ASC`,
        [lead_phone.trim(), `%${suffix}`]
      );
      return res.status(200).json({ notes: notesRes.rows });
    } finally {
      dbClient.release();
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const currentUser = getAuthUser(req);
    const { lead_phone, content } = req.body || {};
    
    if (!lead_phone || !content) {
      return res.status(400).json({ error: 'lead_phone e content são obrigatórios' });
    }

    const dbClient = await pool.connect();
    try {
      const result = await dbClient.query(
        `INSERT INTO crm_notes (lead_phone, user_id, content) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [lead_phone.trim(), currentUser?.id || null, content.trim()]
      );
      
      const newNote = result.rows[0];
      newNote.author_name = currentUser?.name || 'Usuário';

      return res.status(201).json({ note: newNote });
    } finally {
      dbClient.release();
    }
  } catch (err) {
    console.error('Erro em notes handler:', err);
    return res.status(500).json({ error: err.message });
  }
}
