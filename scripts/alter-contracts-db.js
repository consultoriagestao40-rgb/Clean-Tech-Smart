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

async function alterContractsDB() {
  const client = await pool.connect();
  try {
    console.log('Alterando tabela contracts para adicionar colunas financeiras...');
    
    await client.query(`
      ALTER TABLE contracts 
      ADD COLUMN IF NOT EXISTS expiry_date DATE,
      ADD COLUMN IF NOT EXISTS readjustment_date DATE,
      ADD COLUMN IF NOT EXISTS cost_value DECIMAL(12, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tax_cost_percent DECIMAL(5, 2) DEFAULT 0;
    `);
    
    console.log('Colunas financeiras adicionadas com sucesso à tabela contracts!');
  } catch (error) {
    console.error('Erro ao alterar tabela contracts:', error);
  } finally {
    client.release();
    pool.end();
  }
}

alterContractsDB();
