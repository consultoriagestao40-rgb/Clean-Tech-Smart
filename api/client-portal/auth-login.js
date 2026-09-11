import { Pool } from 'pg';
import { sha256, signToken } from '../_utils/auth.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

function cleanDoc(val) {
  if (!val) return '';
  return String(val).replace(/\D/g, '');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { login, password } = req.body || {};
  if (!login || !password) {
    return res.status(400).json({ error: 'Identificação (E-mail ou CNPJ/CPF) e senha são obrigatórios.' });
  }

  const cleanLogin = login.trim();
  const docDigits = cleanDoc(cleanLogin);
  const computedHash = sha256(password);

  const client = await pool.connect();
  try {
    // Search by email, exact document, or cleaned document digits
    let query = `
      SELECT * FROM clients 
      WHERE (LOWER(email) = LOWER($1) OR document = $1 OR regexp_replace(document, '[^0-9]', '', 'g') = $2)
        AND (is_portal_active IS NULL OR is_portal_active = TRUE)
      LIMIT 1
    `;
    const result = await client.query(query, [cleanLogin, docDigits || cleanLogin]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Cliente não encontrado. Verifique seu e-mail ou documento, ou realize seu cadastro.' });
    }

    const c = result.rows[0];

    // If client has no password yet (registered internally), allow setting password or verify
    if (!c.password_hash) {
      return res.status(401).json({ 
        error: 'Este cadastro ainda não possui senha de acesso ao portal. Clique em "Primeiro Acesso / Cadastrar" para ativar sua senha com seu CNPJ/CPF.',
        needs_password_setup: true,
        client_id: c.id
      });
    }

    if (c.password_hash !== computedHash) {
      return res.status(401).json({ error: 'Senha incorreta. Verifique seus dados e tente novamente.' });
    }

    const token = signToken({
      id: c.id,
      clientId: c.id,
      name: c.name || c.razao_social,
      email: c.email,
      role: 'client'
    });

    return res.status(200).json({
      success: true,
      token,
      client: {
        id: c.id,
        name: c.name,
        razao_social: c.razao_social,
        document: c.document,
        email: c.email,
        phone: c.phone,
        address: c.address,
        contact_person: c.contact_person
      }
    });
  } catch (error) {
    console.error('Erro no login do cliente:', error);
    return res.status(500).json({ error: 'Erro interno ao autenticar no portal do cliente.' });
  } finally {
    client.release();
  }
}
