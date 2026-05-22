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

async function alterClientsDB() {
  const client = await pool.connect();
  try {
    console.log('Adicionando novas colunas na tabela clients...');
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS contact_person VARCHAR(150),
      ADD COLUMN IF NOT EXISTS address TEXT;
    `);
    console.log('Colunas contact_person e address adicionadas com sucesso!');
  } catch (error) {
    console.error('Erro ao alterar tabela clients:', error);
  } finally {
    client.release();
    pool.end();
  }
}

alterClientsDB();
