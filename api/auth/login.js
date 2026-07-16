import { Pool } from 'pg';
import { sha256, signToken } from '../_utils/auth.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }

  const dbClient = await pool.connect();
  try {
    const result = await dbClient.query(
      'SELECT * FROM users WHERE email = LOWER($1)',
      [email.trim()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }

    const user = result.rows[0];
    const computedHash = sha256(password);
    
    if (user.password_hash !== computedHash) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }

    const token = signToken(user);
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor no login' });
  } finally {
    dbClient.release();
  }
}
