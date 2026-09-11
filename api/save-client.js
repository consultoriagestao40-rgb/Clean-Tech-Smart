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

  const client = await pool.connect();

  try {
    const { 
      id, 
      name, 
      document, 
      email, 
      phone, 
      status, 
      contact_person, 
      address, 
      razao_social,
      password,
      lgpd_accepted,
      is_portal_active
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'O nome do cliente é obrigatório.' });
    }

    let result;
    const passwordHash = password ? sha256(password) : null;
    const lgpdValid = !!lgpd_accepted;

    if (id) {
      // Atualizar cliente existente
      if (passwordHash) {
        result = await client.query(`
          UPDATE clients 
          SET name = $1, document = $2, email = $3, phone = $4, status = $5, contact_person = $6, address = $7, razao_social = $8,
              password_hash = $9, lgpd_accepted = CASE WHEN $10 THEN TRUE ELSE lgpd_accepted END,
              lgpd_accepted_at = CASE WHEN $10 THEN NOW() ELSE lgpd_accepted_at END,
              lgpd_version = CASE WHEN $10 THEN 'v1.0-2026' ELSE lgpd_version END,
              is_portal_active = COALESCE($11, is_portal_active, TRUE)
          WHERE id = $12
          RETURNING *;
        `, [name, document, email, phone, status || 'Ativo', contact_person, address, razao_social, passwordHash, lgpdValid, is_portal_active, id]);
      } else {
        result = await client.query(`
          UPDATE clients 
          SET name = $1, document = $2, email = $3, phone = $4, status = $5, contact_person = $6, address = $7, razao_social = $8,
              lgpd_accepted = CASE WHEN $9 THEN TRUE ELSE lgpd_accepted END,
              lgpd_accepted_at = CASE WHEN $9 THEN NOW() ELSE lgpd_accepted_at END,
              lgpd_version = CASE WHEN $9 THEN 'v1.0-2026' ELSE lgpd_version END,
              is_portal_active = COALESCE($10, is_portal_active, TRUE)
          WHERE id = $11
          RETURNING *;
        `, [name, document, email, phone, status || 'Ativo', contact_person, address, razao_social, lgpdValid, is_portal_active, id]);
      }
    } else {
      // Inserir novo cliente
      result = await client.query(`
        INSERT INTO clients (
          name, document, email, phone, status, contact_person, address, razao_social,
          password_hash, lgpd_accepted, lgpd_accepted_at, lgpd_version, lgpd_ip, is_portal_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CASE WHEN $10 THEN NOW() ELSE NULL END, CASE WHEN $10 THEN 'v1.0-2026' ELSE NULL END, 'admin_crm', TRUE)
        RETURNING *;
      `, [name, document, email, phone, status || 'Ativo', contact_person, address, razao_social, passwordHash, lgpdValid]);
    }
    
    return res.status(200).json({ success: true, client: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar cliente' });
  } finally {
    client.release();
  }
}
