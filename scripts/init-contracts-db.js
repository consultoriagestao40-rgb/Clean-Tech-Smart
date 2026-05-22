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

async function initContractsDB() {
  const client = await pool.connect();
  try {
    console.log('Criando tabela contracts...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS contracts (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        client_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'Reserva',
        equipments JSONB DEFAULT '[]'::jsonb,
        services JSONB DEFAULT '[]'::jsonb,
        observations TEXT,
        total_rental_value DECIMAL(12, 2) DEFAULT 0,
        total_services_value DECIMAL(12, 2) DEFAULT 0,
        total_venal_value DECIMAL(12, 2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela contracts criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela contracts:', error);
  } finally {
    client.release();
    pool.end();
  }
}

initContractsDB();
