import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const client = await pool.connect();

  try {
    const { id, name, clauses } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome do template é obrigatório.' });
    }

    let result;
    const clausesJson = JSON.stringify(clauses || []);

    if (id) {
      result = await client.query(`
        UPDATE contract_templates 
        SET name = $1, clauses = $2::jsonb
        WHERE id = $3
        RETURNING *;
      `, [name, clausesJson, id]);
    } else {
      result = await client.query(`
        INSERT INTO contract_templates (name, clauses)
        VALUES ($1, $2::jsonb)
        RETURNING *;
      `, [name, clausesJson]);
    }
    
    return res.status(200).json({ success: true, template: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar template:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar template' });
  } finally {
    client.release();
  }
}
