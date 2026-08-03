import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  // CORS support
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const dbClient = await pool.connect();

  try {
    const settings = req.body || {};
    
    await dbClient.query('BEGIN');
    for (const [key, val] of Object.entries(settings)) {
      // Cast value to string for storage
      const valueStr = val === null || val === undefined ? '' : String(val);
      await dbClient.query(`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE 
        SET value = EXCLUDED.value, updated_at = NOW()
      `, [key, valueStr]);
    }
    await dbClient.query('COMMIT');

    return res.status(200).json({ success: true });
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Erro ao salvar configuracoes no banco:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar configuracoes' });
  } finally {
    dbClient.release();
  }
}
