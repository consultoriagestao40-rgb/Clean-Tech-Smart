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

async function addProposalMarkupColumns() {
  const client = await pool.connect();
  try {
    console.log('Adicionando colunas de premissas customizadas na tabela rental_proposals...');
    
    await client.query(`
      ALTER TABLE rental_proposals 
      ADD COLUMN IF NOT EXISTS insumos_percent NUMERIC(5,2) DEFAULT 20.00,
      ADD COLUMN IF NOT EXISTS manutencao_percent NUMERIC(5,2) DEFAULT 20.00,
      ADD COLUMN IF NOT EXISTS lucro_percent NUMERIC(5,2) DEFAULT 50.00,
      ADD COLUMN IF NOT EXISTS tributos_percent NUMERIC(5,2) DEFAULT 8.00;
    `);
    
    console.log('Colunas de premissas customizadas adicionadas com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar colunas:', error);
  } finally {
    client.release();
    pool.end();
  }
}

addProposalMarkupColumns();
