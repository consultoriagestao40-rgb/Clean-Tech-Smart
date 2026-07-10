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
    const { id, name, brand, model, serial_number, ownership_type, supplier_name, client_id, status, category_id } = req.body;
    
    if (!name || !ownership_type) {
      return res.status(400).json({ error: 'Os campos Nome e Propriedade são obrigatórios.' });
    }

    const finalClientId = client_id ? Number(client_id) : null;
    const finalSupplierName = ownership_type === 'sublocado' ? supplier_name : null;
    const finalCategoryId = category_id ? Number(category_id) : null;

    let result;
    if (id) {
      result = await client.query(`
        UPDATE equipments 
        SET name = $1, brand = $2, model = $3, serial_number = $4, ownership_type = $5, supplier_name = $6, client_id = $7, status = $8, category_id = $9
        WHERE id = $10
        RETURNING *;
      `, [name, brand, model, serial_number, ownership_type, finalSupplierName, finalClientId, status || 'Disponível', finalCategoryId, id]);
    } else {
      result = await client.query(`
        INSERT INTO equipments (name, brand, model, serial_number, ownership_type, supplier_name, client_id, status, category_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `, [name, brand, model, serial_number, ownership_type, finalSupplierName, finalClientId, status || 'Disponível', finalCategoryId]);
    }
    
    return res.status(200).json({ success: true, equipment: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar equipamento:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar equipamento' });
  } finally {
    client.release();
  }
}
