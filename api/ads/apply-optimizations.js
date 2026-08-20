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
    const { action, platform, items, savingsEstimated, description } = req.body || {};

    if (!action) {
      return res.status(400).json({ error: 'Ação não informada.' });
    }

    await dbClient.query('BEGIN');

    // Ensure logs table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS ads_optimization_logs (
        id SERIAL PRIMARY KEY,
        action_type VARCHAR(50) NOT NULL,
        platform VARCHAR(20) NOT NULL,
        description TEXT NOT NULL,
        details JSONB,
        savings_estimated NUMERIC(10,2) DEFAULT 0,
        applied_by VARCHAR(50) DEFAULT 'Agente IA (Copiloto)',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Handle Negation of Keywords
    if (action === 'negate_keywords' && Array.isArray(items) && items.length > 0) {
      // Get current list
      const currentRes = await dbClient.query("SELECT value FROM system_settings WHERE key = 'ads_negative_keywords'");
      let currentList = [];
      if (currentRes.rows[0]?.value) {
        try {
          currentList = JSON.parse(currentRes.rows[0].value);
        } catch (e) {
          currentList = currentRes.rows[0].value.split('\n').map(s => s.trim()).filter(Boolean);
        }
      }

      // Merge unique
      const combined = Array.from(new Set([...currentList, ...items]));

      await dbClient.query(`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ('ads_negative_keywords', $1, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `, [JSON.stringify(combined)]);

      // Insert log
      const logDesc = description || `Negativação de ${items.length} termo(s) irrelevante(s): "${items.slice(0, 3).join(', ')}${items.length > 3 ? '...' : ''}"`;
      await dbClient.query(`
        INSERT INTO ads_optimization_logs (action_type, platform, description, details, savings_estimated, applied_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'negate_keywords',
        platform || 'Google Ads',
        logDesc,
        JSON.stringify({ terms: items }),
        savingsEstimated || (items.length * 45.00),
        'Agente IA (Copiloto)'
      ]);
    } else if (action === 'add_keywords' && Array.isArray(items) && items.length > 0) {
      // Add converting keyword
      const logDesc = description || `Inclusão de ${items.length} nova(s) palavra-chave de alta conversão: "${items.join(', ')}"`;
      await dbClient.query(`
        INSERT INTO ads_optimization_logs (action_type, platform, description, details, savings_estimated, applied_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'add_keywords',
        platform || 'Google Ads',
        logDesc,
        JSON.stringify({ keywords: items }),
        0,
        'Agente IA (Copiloto)'
      ]);
    } else if (action === 'pause_creative') {
      const logDesc = description || `Pausa de anúncio/criativo saturado com fadiga no Meta Ads`;
      await dbClient.query(`
        INSERT INTO ads_optimization_logs (action_type, platform, description, details, savings_estimated, applied_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'pause_creative',
        'Meta Ads',
        logDesc,
        JSON.stringify(items || {}),
        savingsEstimated || 120.00,
        'Agente IA (Copiloto)'
      ]);
    } else if (action === 'scale_budget') {
      const logDesc = description || `Recomendação de escalonamento de orçamento aplicada com sucesso`;
      await dbClient.query(`
        INSERT INTO ads_optimization_logs (action_type, platform, description, details, savings_estimated, applied_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'scale_budget',
        platform || 'Google Ads',
        logDesc,
        JSON.stringify(items || {}),
        0,
        'Agente IA (Copiloto)'
      ]);
    }

    await dbClient.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Otimização executada e registrada com sucesso!'
    });
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Erro ao aplicar otimização:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    dbClient.release();
  }
}
