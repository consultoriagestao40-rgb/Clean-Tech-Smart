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

async function initMachineModelsDB() {
  const client = await pool.connect();
  try {
    console.log('Criando tabela machine_models...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS machine_models (
        id SERIAL PRIMARY KEY,
        name VARCHAR(250) NOT NULL,
        photo_urls TEXT,
        technical_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Adicionando coluna machine_model_id na tabela budgets...');
    await client.query(`
      ALTER TABLE budgets 
      ADD COLUMN IF NOT EXISTS machine_model_id INT REFERENCES machine_models(id) ON DELETE SET NULL;
    `);

    console.log('Tabela machine_models e relações criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar banco de modelos de máquinas:', error);
  } finally {
    client.release();
    pool.end();
  }
}

initMachineModelsDB();
