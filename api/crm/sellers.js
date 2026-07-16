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
    // Authenticate user
    getAuthUser(req);

    const dbClient = await pool.connect();
    try {
      const result = await dbClient.query(
        'SELECT id, name, email, role FROM users ORDER BY name ASC'
      );
      return res.status(200).json({ sellers: result.rows });
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error('Erro ao buscar vendedores:', error);
    return res.status(error.message.includes('Token') || error.message.includes('Authorization') ? 401 : 500)
      .json({ error: error.message });
  }
}
