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
    const currentUser = getAuthUser(req);
    const { lead_phone, content } = req.body || {};
    
    if (!lead_phone || !content) {
      return res.status(400).json({ error: 'lead_phone e content são obrigatórios' });
    }

    const dbClient = await pool.connect();
    try {
      // Create Note
      const insertRes = await dbClient.query(
        `INSERT INTO crm_notes (lead_phone, user_id, content) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [lead_phone.trim(), currentUser.userId, content.trim()]
      );

      const note = insertRes.rows[0];
      note.author_name = currentUser.name;

      return res.status(201).json({ note });
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error('Erro na API crm/notes:', error);
    return res.status(error.message.includes('Token') || error.message.includes('Authorization') ? 401 : 500)
      .json({ error: error.message });
  }
}
