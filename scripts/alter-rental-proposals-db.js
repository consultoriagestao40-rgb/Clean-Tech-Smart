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

async function alterRentalProposalsDB() {
  const client = await pool.connect();
  try {
    console.log('Alterando tabela rental_proposals para adicionar coluna de status...');
    
    await client.query(`
      ALTER TABLE rental_proposals 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Rascunho';
    `);
    
    console.log('Coluna status adicionada com sucesso à tabela rental_proposals!');
  } catch (error) {
    console.error('Erro ao alterar tabela rental_proposals:', error);
  } finally {
    client.release();
    pool.end();
  }
}

alterRentalProposalsDB();
