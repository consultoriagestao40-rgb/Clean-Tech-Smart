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
    const { id, sku, name, description, unit_price, quantity, min_quantity } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'O nome da peça é obrigatório.' });
    }

    const cleanSku = sku ? String(sku).trim() : null;
    const price = Number(unit_price || 0);
    const qty = Number(quantity || 0);
    const minQty = Number(min_quantity || 0);

    let result;

    if (id) {
      result = await client.query(`
        UPDATE parts
        SET sku = $1, name = $2, description = $3, unit_price = $4, quantity = $5, min_quantity = $6
        WHERE id = $7
        RETURNING *;
      `, [cleanSku, name.trim(), description || null, price, qty, minQty, id]);
    } else {
      result = await client.query(`
        INSERT INTO parts (sku, name, description, unit_price, quantity, min_quantity)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (sku) 
        DO UPDATE SET 
          name = EXCLUDED.name, 
          description = EXCLUDED.description, 
          unit_price = EXCLUDED.unit_price, 
          quantity = EXCLUDED.quantity, 
          min_quantity = EXCLUDED.min_quantity
        RETURNING *;
      `, [cleanSku, name.trim(), description || null, price, qty, minQty]);
    }

    return res.status(200).json({ success: true, part: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar peça:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Já existe uma peça cadastrada com este código SKU.' });
    }
    return res.status(500).json({ error: 'Erro interno ao salvar peça' });
  } finally {
    client.release();
  }
}
