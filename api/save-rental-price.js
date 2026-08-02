import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const client = await pool.connect();

  try {
    const { id, code, type, description, list_price, distributor_price, price_12, price_24, price_36, price_48, price_60 } = req.body;
    
    if (!code || !description) {
      return res.status(400).json({ error: 'Código e Descrição são obrigatórios.' });
    }

    let result;
    if (id) {
      result = await client.query(`
        UPDATE rental_prices 
        SET code = $1, type = $2, description = $3, list_price = $4, distributor_price = $5, price_12 = $6, price_24 = $7, price_36 = $8, price_48 = $9, price_60 = $10
        WHERE id = $11
        RETURNING *;
      `, [code, type, description, list_price, distributor_price, price_12, price_24, price_36, price_48, price_60, id]);
    } else {
      result = await client.query(`
        INSERT INTO rental_prices (code, type, description, list_price, distributor_price, price_12, price_24, price_36, price_48, price_60)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `, [code, type, description, list_price, distributor_price, price_12, price_24, price_36, price_48, price_60]);
    }
    
    return res.status(200).json({ success: true, rentalPrice: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar registro de locação:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar registro de locação' });
  } finally {
    client.release();
  }
}
