import pg from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function initCRM() {
  const client = await pool.connect();
  try {
    console.log('Criando tabela users...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(30) DEFAULT 'vendedor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Criando tabela leads...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        phone VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150),
        stage VARCHAR(50) DEFAULT 'novo',
        value DECIMAL(10,2) DEFAULT 0.00,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        next_contact_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Criando tabela crm_notes...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_notes (
        id SERIAL PRIMARY KEY,
        lead_phone VARCHAR(50) REFERENCES leads(phone) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Criando tabela crm_tasks...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_tasks (
        id SERIAL PRIMARY KEY,
        lead_phone VARCHAR(50) REFERENCES leads(phone) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Inserindo usuários padrão...');
    const gestorHash = sha256('gestor123');
    const vendedorHash = sha256('vendedor123');

    await client.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES 
        ('Cristiano Gestor', 'gestor@cleantech.com', $1, 'gestor'),
        ('Carlos Vendedor', 'vendedor@cleantech.com', $2, 'vendedor')
      ON CONFLICT (email) DO NOTHING;
    `, [gestorHash, vendedorHash]);

    console.log('Banco de dados do CRM inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados do CRM:', error);
  } finally {
    client.release();
    pool.end();
  }
}

initCRM();
