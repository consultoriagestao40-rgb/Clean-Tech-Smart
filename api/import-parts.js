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

  const { parts } = req.body;
  if (!parts || !Array.isArray(parts) || parts.length === 0) {
    return res.status(400).json({ error: 'Nenhum item fornecido para importação.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const values = [];
    const valuePlaceholders = [];
    
    parts.forEach((part, index) => {
      const offset = index * 5;
      const sku = part.sku ? String(part.sku).trim() : null;
      const name = part.name ? String(part.name).trim() : 'Peça sem nome';
      const description = part.description ? String(part.description).trim() : null;
      const unit_price = Number(part.unit_price || 0);
      const quantity = Number(part.quantity || 0);
      
      values.push(sku, name, description, unit_price, quantity);
      valuePlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
    });
    
    // Para peças que possuem SKU, atualiza o nome, descrição e preço se houver conflito.
    // Peças sem SKU (nulo) serão simplesmente inseridas como novos registros.
    const query = `
      INSERT INTO parts (sku, name, description, unit_price, quantity)
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (sku) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        unit_price = EXCLUDED.unit_price;
    `;
    
    await client.query(query, values);
    await client.query('COMMIT');
    
    return res.status(200).json({ success: true, count: parts.length });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro na importação em lote:', error);
    return res.status(500).json({ error: 'Erro interno ao importar lote de peças: ' + error.message });
  } finally {
    client.release();
  }
}
