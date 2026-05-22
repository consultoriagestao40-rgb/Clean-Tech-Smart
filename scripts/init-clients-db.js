import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

async function initClientsDB() {
  const client = await pool.connect();
  try {
    console.log('Criando tabela clients...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        document VARCHAR(50),
        email VARCHAR(100),
        phone VARCHAR(50),
        status VARCHAR(20) DEFAULT 'Ativo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela clients criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
  } finally {
    client.release();
    pool.end();
  }
}

initClientsDB();
