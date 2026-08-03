import { Pool } from 'pg';
import { sha256 } from './_utils/auth.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id, name, email, password, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Nome, E-mail e Perfil são obrigatórios.' });
  }

  const client = await pool.connect();

  try {
    const emailLower = email.toLowerCase().trim();

    // Check if email already exists for another user
    const checkUser = await client.query(
      'SELECT id FROM users WHERE email = $1 AND id <> $2',
      [emailLower, id ? Number(id) : -1]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está sendo utilizado por outro usuário.' });
    }

    let result;

    if (id) {
      // Update existing user
      if (password && password.trim() !== '') {
        const passwordHash = sha256(password);
        result = await client.query(`
          UPDATE users
          SET name = $1, email = $2, password_hash = $3, role = $4, updated_at = NOW()
          WHERE id = $5
          RETURNING id, name, email, role;
        `, [name, emailLower, passwordHash, role, Number(id)]);
      } else {
        result = await client.query(`
          UPDATE users
          SET name = $1, email = $2, role = $3, updated_at = NOW()
          WHERE id = $4
          RETURNING id, name, email, role;
        `, [name, emailLower, role, Number(id)]);
      }
    } else {
      // Create new user
      if (!password || password.trim() === '') {
        return res.status(400).json({ error: 'Senha é obrigatória para novos usuários.' });
      }
      const passwordHash = sha256(password);
      result = await client.query(`
        INSERT INTO users (name, email, password_hash, role, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, name, email, role;
      `, [name, emailLower, passwordHash, role]);
    }

    return res.status(200).json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar usuário' });
  } finally {
    client.release();
  }
}
