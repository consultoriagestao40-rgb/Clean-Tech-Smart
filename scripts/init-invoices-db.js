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

async function initInvoicesDB() {
  const client = await pool.connect();
  try {
    console.log('Criando tabela invoices...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        contract_code VARCHAR(50),
        client_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        due_date DATE NOT NULL,
        payment_date DATE,
        status VARCHAR(50) DEFAULT 'Pendente',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela invoices criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela invoices:', error);
  } finally {
    client.release();
    pool.end();
  }
}

initInvoicesDB();
