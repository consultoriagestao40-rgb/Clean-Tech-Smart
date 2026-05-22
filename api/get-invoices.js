import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT 
        i.*,
        c.name as client_name
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      ORDER BY i.due_date DESC;
    `);
    
    // Processar inteligência de "Vencida" no backend se estiver pendente e a data passou
    const today = new Date();
    today.setHours(0,0,0,0);

    const invoices = result.rows.map(inv => {
      const dueDate = new Date(inv.due_date);
      let status = inv.status;
      
      if (status === 'Pendente' && dueDate < today) {
        status = 'Vencida';
        // Opcional: atualizar no banco automaticamente ou apenas exibir assim.
        // Como é uma dashboard financeira, a leitura dinâmica é melhor.
      }

      return { ...inv, status };
    });

    return res.status(200).json({ success: true, invoices });
  } catch (error) {
    console.error('Erro ao buscar faturas:', error);
    return res.status(500).json({ error: 'Erro interno' });
  } finally {
    client.release();
  }
}
