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

  try {
    const currentUser = getAuthUser(req);
    const dbClient = await pool.connect();
    
    try {
      let queryStr = `
        SELECT l.*, u.name as assigned_to_name 
        FROM leads l 
        LEFT JOIN users u ON l.assigned_to = u.id
      `;
      const queryParams = [];

      // Access control
      if (currentUser.role === 'vendedor') {
        // Enforce salesperson to see only their leads
        queryStr += ' WHERE l.assigned_to = $1';
        queryParams.push(currentUser.userId);
      } else {
        // Manager can filter by assigned_to if passed
        const { assigned_to } = req.query;
        if (assigned_to && assigned_to !== 'all') {
          queryStr += ' WHERE l.assigned_to = $1';
          queryParams.push(Number(assigned_to));
        }
      }

      queryStr += ' ORDER BY l.created_at DESC';

      const result = await dbClient.query(queryStr, queryParams);
      return res.status(200).json({ leads: result.rows });

    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error('Erro na API crm/leads:', error);
    return res.status(error.message.includes('Token') || error.message.includes('Authorization') ? 401 : 500)
      .json({ error: error.message });
  }
}
