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

async function initModalitiesDB() {
  const client = await pool.connect();
  try {
    console.log('Criando tabela modalities...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS modalities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        days_count INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela modalities criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela modalities:', error);
  } finally {
    client.release();
    pool.end();
  }
}

initModalitiesDB();
