import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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
    const { mode = 'clean' } = req.body || {};
    
    await dbClient.query('BEGIN');

    // Salva o status de dados limpos / zerados
    await dbClient.query(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('ads_clean_data_mode', $1, NOW())
      ON CONFLICT (key) DO UPDATE 
      SET value = EXCLUDED.value, updated_at = NOW()
    `, [mode === 'clean' ? 'true' : 'false']);

    // Se solicitado zerar os logs também
    if (mode === 'clean') {
      try {
        await dbClient.query("DELETE FROM ads_optimization_logs WHERE reason ILIKE '%demo%' OR reason ILIKE '%teste%'");
      } catch (e) {
        // ignora se tabela de logs tiver schema diferente
      }
    }

    await dbClient.query('COMMIT');

    return res.status(200).json({ 
      success: true, 
      message: mode === 'clean' 
        ? 'Dados de teste zerados com sucesso! O painel agora iniciará a contagem real das suas campanhas.' 
        : 'Modo de dados de exemplo restaurado.'
    });
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Erro ao resetar dados de Ads:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    dbClient.release();
  }
}
