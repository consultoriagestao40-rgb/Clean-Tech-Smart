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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let dbClient;
  try {
    dbClient = await pool.connect();
  } catch (e) {
    console.error('[CRM Leads DB Connection Error]:', e.message);
  }

  try {
    let currentUser = null;
    try {
      currentUser = getAuthUser(req);
    } catch (authErr) {
      console.warn('[leads] JWT auth fallback:', authErr.message);
    }

    if (!dbClient) {
      return res.status(200).json({ leads: [] });
    }

    let queryStr = `
      SELECT 
        l.phone,
        l.name,
        l.company,
        l.contact_name,
        l.stage,
        l.value,
        l.assigned_to,
        l.label,
        to_char(l.next_contact_at, 'YYYY-MM-DD"T"HH24:MI:SS') as next_contact_at,
        to_char(l.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') as created_at,
        to_char(l.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS') as updated_at,
        u.name as assigned_to_name 
      FROM leads l 
      LEFT JOIN users u ON l.assigned_to = u.id
    `;
    const queryParams = [];

    // Access control
    if (currentUser && currentUser.role === 'vendedor') {
      queryStr += ' WHERE l.assigned_to = $1';
      queryParams.push(currentUser.userId);
    } else {
      const { assigned_to } = req.query || {};
      if (assigned_to && assigned_to !== 'all') {
        queryStr += ' WHERE l.assigned_to = $1';
        queryParams.push(Number(assigned_to));
      }
    }

    queryStr += ' ORDER BY l.created_at DESC';

    const result = await dbClient.query(queryStr, queryParams);
    return res.status(200).json({ leads: result.rows });
  } catch (error) {
    console.error('Erro na API crm/leads:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (dbClient) dbClient.release();
  }
}
