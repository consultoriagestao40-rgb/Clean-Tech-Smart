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

async function alterBudgetsEquipment() {
  const client = await pool.connect();
  try {
    console.log('Adicionando coluna equipment_id na tabela budgets...');
    await client.query(`
      ALTER TABLE budgets 
      ADD COLUMN IF NOT EXISTS equipment_id INT REFERENCES equipments(id) ON DELETE SET NULL;
    `);
    console.log('Coluna equipment_id adicionada com sucesso!');
  } catch (error) {
    console.error('Erro ao alterar tabela budgets:', error);
  } finally {
    client.release();
    pool.end();
  }
}

alterBudgetsEquipment();
