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

async function initEquipmentsDB() {
  const client = await pool.connect();
  try {
    console.log('Criando tabela equipments...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS equipments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        brand VARCHAR(100),
        model VARCHAR(100),
        serial_number VARCHAR(100),
        ownership_type VARCHAR(50) NOT NULL, -- 'proprio', 'sublocado', 'cliente'
        supplier_name VARCHAR(150),
        client_id INT REFERENCES clients(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'Disponível',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela equipments criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela equipments:', error);
  } finally {
    client.release();
    pool.end();
  }
}

initEquipmentsDB();
