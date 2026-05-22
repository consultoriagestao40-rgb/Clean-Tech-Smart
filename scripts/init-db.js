import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDB() {
  const client = await pool.connect();
  try {
    console.log('Criando tabela budgets...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(50),
        contact_name VARCHAR(100),
        contact_info VARCHAR(150),
        service_type VARCHAR(50),
        initial_km INT,
        final_km INT,
        price_per_km DECIMAL(10,2),
        total_labor DECIMAL(10,2),
        total_parts DECIMAL(10,2),
        total_logistics DECIMAL(10,2),
        grand_total DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Criando tabela budget_labor...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS budget_labor (
        id SERIAL PRIMARY KEY,
        budget_id INT REFERENCES budgets(id) ON DELETE CASCADE,
        description VARCHAR(200),
        hours DECIMAL(10,2),
        unit_price DECIMAL(10,2)
      );
    `);

    console.log('Criando tabela budget_parts...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS budget_parts (
        id SERIAL PRIMARY KEY,
        budget_id INT REFERENCES budgets(id) ON DELETE CASCADE,
        part_name VARCHAR(200),
        quantity INT,
        unit_price DECIMAL(10,2)
      );
    `);

    console.log('Tabelas criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
  } finally {
    client.release();
    pool.end();
  }
}

initDB();
