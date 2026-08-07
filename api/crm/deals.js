import { Pool } from 'pg';
import { getAuthUser } from '../_utils/auth.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper to ensure crm_deals table exists
async function initDealsTable(dbClient) {
  await dbClient.query(`
    CREATE TABLE IF NOT EXISTS crm_deals (
      id SERIAL PRIMARY KEY,
      lead_phone VARCHAR(50) NOT NULL,
      client_id INT REFERENCES clients(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL,
      value NUMERIC(12, 2) DEFAULT 0.00,
      stage VARCHAR(100) DEFAULT 'qualificado',
      status VARCHAR(50) DEFAULT 'em_aberto',
      proposal_type VARCHAR(50),
      proposal_id INT,
      assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
      description TEXT,
      expected_close_date DATE,
      closed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let dbClient;
  try {
    dbClient = await pool.connect();
    await initDealsTable(dbClient);
  } catch (e) {
    console.error('[CRM Deals DB Connection Error]:', e.message);
    return res.status(500).json({ error: 'Erro de conexão com banco de dados' });
  }

  try {
    let currentUser = null;
    try {
      currentUser = getAuthUser(req);
    } catch (authErr) {
      console.warn('[deals] JWT auth fallback:', authErr.message);
    }

    // ---------------- GET DEALS ----------------
    if (req.method === 'GET') {
      const { phone, client_id } = req.query;

      let queryStr = `
        SELECT 
          d.*,
          u.name as assigned_to_name,
          c.name as client_name,
          to_char(d.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') as created_at_formatted,
          to_char(d.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS') as updated_at_formatted
        FROM crm_deals d
        LEFT JOIN users u ON d.assigned_to = u.id
        LEFT JOIN clients c ON d.client_id = c.id
      `;
      const params = [];

      if (phone) {
        const cleanPhone = phone.trim();
        const suffix = cleanPhone.length >= 8 ? cleanPhone.slice(-8) : cleanPhone;
        queryStr += ` WHERE (d.lead_phone = $1 OR replace(d.lead_phone, '-', '') LIKE $2)`;
        params.push(cleanPhone, `%${suffix}`);
      } else if (client_id) {
        queryStr += ` WHERE d.client_id = $1`;
        params.push(Number(client_id));
      }

      queryStr += ` ORDER BY d.created_at DESC`;

      const result = await dbClient.query(queryStr, params);
      const deals = result.rows;

      // Fetch linked proposals/budgets for this phone/client if phone passed
      let linkedProposals = {
        rental: [],
        sales: [],
        service: [],
        budgets: []
      };

      if (phone || client_id) {
        try {
          let clientClause = '';
          const clientParams = [];
          if (client_id) {
            clientClause = 'WHERE client_id = $1';
            clientParams.push(Number(client_id));
          } else if (phone) {
            const cRes = await dbClient.query(`
              SELECT id FROM clients 
              WHERE phone = $1 OR replace(phone, '-', '') LIKE $2 
              LIMIT 1
            `, [phone, `%${phone.slice(-8)}`]);
            if (cRes.rows.length > 0) {
              clientClause = 'WHERE client_id = $1';
              clientParams.push(cRes.rows[0].id);
            }
          }

          if (clientClause) {
            const rentalRes = await dbClient.query(`SELECT id, monthly_value, status, created_at FROM rental_proposals ${clientClause} ORDER BY created_at DESC`, clientParams);
            const salesRes = await dbClient.query(`SELECT id, total_price, sale_price, status, created_at FROM sales_proposals ${clientClause} ORDER BY created_at DESC`, clientParams);
            const serviceRes = await dbClient.query(`SELECT id, monthly_value, status, created_at FROM service_proposals ${clientClause} ORDER BY created_at DESC`, clientParams);
            const budgetsRes = await dbClient.query(`SELECT id, total_budget_value, status, created_at FROM budgets ${clientClause} ORDER BY created_at DESC`, clientParams);

            linkedProposals = {
              rental: rentalRes.rows,
              sales: salesRes.rows,
              service: serviceRes.rows,
              budgets: budgetsRes.rows
            };
          }
        } catch (propErr) {
          console.error('Erro ao buscar propostas vinculadas:', propErr);
        }
      }

      return res.status(200).json({ success: true, deals, linkedProposals });
    }

    // ---------------- POST (CREATE / UPDATE DEAL) ----------------
    if (req.method === 'POST') {
      const {
        id,
        lead_phone,
        client_id,
        title,
        value,
        stage,
        status,
        proposal_type,
        proposal_id,
        assigned_to,
        description,
        expected_close_date
      } = req.body;

      if (!title || (!lead_phone && !client_id)) {
        return res.status(400).json({ error: 'Título e Contato (telefone ou cliente) são obrigatórios.' });
      }

      const finalPhone = lead_phone ? lead_phone.trim() : '';
      const finalClientId = client_id ? Number(client_id) : null;
      const finalValue = value ? Number(value) : 0.00;
      const finalAssignedTo = assigned_to ? Number(assigned_to) : (currentUser?.userId || null);
      const finalStatus = status || 'em_aberto';
      const closedAt = (finalStatus === 'ganho' || finalStatus === 'perdido') ? new Date() : null;

      let result;

      if (id) {
        // Update existing deal
        result = await dbClient.query(`
          UPDATE crm_deals
          SET title = $1,
              value = $2,
              stage = $3,
              status = $4,
              proposal_type = $5,
              proposal_id = $6,
              assigned_to = $7,
              description = $8,
              expected_close_date = $9,
              closed_at = CASE WHEN $4 IN ('ganho', 'perdido') THEN NOW() ELSE closed_at END,
              updated_at = NOW()
          WHERE id = $10
          RETURNING *
        `, [
          title,
          finalValue,
          stage || 'qualificado',
          finalStatus,
          proposal_type || null,
          proposal_id ? Number(proposal_id) : null,
          finalAssignedTo,
          description || '',
          expected_close_date || null,
          Number(id)
        ]);
      } else {
        // Insert new deal
        result = await dbClient.query(`
          INSERT INTO crm_deals (
            lead_phone,
            client_id,
            title,
            value,
            stage,
            status,
            proposal_type,
            proposal_id,
            assigned_to,
            description,
            expected_close_date,
            closed_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `, [
          finalPhone,
          finalClientId,
          title,
          finalValue,
          stage || 'qualificado',
          finalStatus,
          proposal_type || null,
          proposal_id ? Number(proposal_id) : null,
          finalAssignedTo,
          description || '',
          expected_close_date || null,
          closedAt
        ]);
      }

      // Also update overall lead value or stage if lead exists
      if (finalPhone && result.rows[0]) {
        try {
          await dbClient.query(`
            UPDATE leads
            SET value = (SELECT COALESCE(SUM(value), 0) FROM crm_deals WHERE lead_phone = $1 AND status = 'em_aberto'),
                updated_at = NOW()
            WHERE phone = $1
          `, [finalPhone]);
        } catch (lErr) {
          console.error('Erro ao atualizar resumo do lead:', lErr);
        }
      }

      return res.status(200).json({ success: true, deal: result.rows[0] });
    }

    // ---------------- DELETE DEAL ----------------
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'ID do negócio é obrigatório' });
      }

      await dbClient.query('DELETE FROM crm_deals WHERE id = $1', [Number(id)]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Erro na API crm/deals:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (dbClient) dbClient.release();
  }
}
