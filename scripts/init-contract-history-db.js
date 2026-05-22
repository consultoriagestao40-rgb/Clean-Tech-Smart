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

async function initContractHistoryDB() {
  const client = await pool.connect();
  try {
    console.log('Criando tabela contract_history...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS contract_history (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER NOT NULL,
        action VARCHAR(255) NOT NULL,
        status VARCHAR(50),
        user_name VARCHAR(100) DEFAULT 'Sistema',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela contract_history criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela contract_history:', error);
  } finally {
    client.release();
    pool.end();
  }
}

initContractHistoryDB();
