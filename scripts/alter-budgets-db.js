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

async function alterBudgetsDB() {
  const client = await pool.connect();
  try {
    console.log('Adicionando nova coluna status na tabela budgets...');
    await client.query(`
      ALTER TABLE budgets 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pendente';
    `);
    console.log('Coluna status adicionada com sucesso!');
  } catch (error) {
    console.error('Erro ao alterar tabela budgets:', error);
  } finally {
    client.release();
    pool.end();
  }
}

alterBudgetsDB();
