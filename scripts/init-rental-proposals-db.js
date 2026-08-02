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

async function initRentalProposalsDB() {
  const client = await pool.connect();
  try {
    console.log('Criando tabela rental_proposals...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS rental_proposals (
        id SERIAL PRIMARY KEY,
        client_id INT REFERENCES clients(id) ON DELETE SET NULL,
        machine_model_id INT REFERENCES machine_models(id) ON DELETE SET NULL,
        rental_price_id INT REFERENCES rental_prices(id) ON DELETE SET NULL,
        period_months INT,
        monthly_value NUMERIC(12, 2),
        contract_type VARCHAR(100) DEFAULT '0 - Sem cobertura.',
        hours_per_month VARCHAR(50),
        region_used VARCHAR(150),
        delivery_time VARCHAR(100),
        freight_cost NUMERIC(12, 2),
        validity_days VARCHAR(100),
        notes TEXT,
        seller_info TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela rental_proposals criada com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar tabela rental_proposals:', error);
  } finally {
    client.release();
    pool.end();
  }
}

initRentalProposalsDB();
