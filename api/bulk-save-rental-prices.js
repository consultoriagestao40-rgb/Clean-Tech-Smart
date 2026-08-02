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

  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Lista de itens inválida.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const item of items) {
      const { code, type, description, list_price, distributor_price, price_12, price_24, price_36, price_48, price_60 } = item;
      
      await client.query(`
        INSERT INTO rental_prices (
          code, type, description, list_price, distributor_price,
          price_12, price_24, price_36, price_48, price_60
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (code) DO UPDATE SET
          type = EXCLUDED.type,
          description = EXCLUDED.description,
          list_price = EXCLUDED.list_price,
          distributor_price = EXCLUDED.distributor_price,
          price_12 = EXCLUDED.price_12,
          price_24 = EXCLUDED.price_24,
          price_36 = EXCLUDED.price_36,
          price_48 = EXCLUDED.price_48,
          price_60 = EXCLUDED.price_60;
      `, [code, type, description, list_price, distributor_price, price_12, price_24, price_36, price_48, price_60]);
    }

    await client.query('COMMIT');
    return res.status(200).json({ success: true, count: items.length });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao fazer importação em lote:', error);
    return res.status(500).json({ error: 'Erro interno ao importar planilha.' });
  } finally {
    client.release();
  }
}
