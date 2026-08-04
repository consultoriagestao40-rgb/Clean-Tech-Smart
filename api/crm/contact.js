import { Pool } from 'pg';
import { getAuthUser } from '../_utils/auth.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

async function findClientByPhone(dbClient, rawPhone) {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;
  
  try {
    const result = await dbClient.query('SELECT id, name, phone FROM clients');
    for (const row of result.rows) {
      if (!row.phone) continue;
      const clientDigits = row.phone.replace(/\D/g, '');
      if (clientDigits.length >= 8 && digits.length >= 8) {
        const suffix1 = clientDigits.slice(-8);
        const suffix2 = digits.slice(-8);
        if (suffix1 === suffix2) {
          return row;
        }
      }
    }
  } catch (e) {}
  return null;
}

export default async function handler(req, res) {
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

  let dbClient;
  try {
    dbClient = await pool.connect();
    // Ensure company and contact_name columns exist in leads table
    await dbClient.query(`
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS company VARCHAR(150);
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_name VARCHAR(150);
    `);
  } catch (e) {
    console.error('[CRM Contact DB Connection Error]:', e.message);
  }

  try {
    let currentUser = null;
    try {
      currentUser = getAuthUser(req);
    } catch (authErr) {
      console.warn('[contact] JWT auth fallback:', authErr.message);
    }

    if (!dbClient) {
      return res.status(500).json({ error: 'Banco de dados indisponível' });
    }

    if (req.method === 'GET') {
      const { phone, name: queryName } = req.query;
      if (!phone) {
        return res.status(400).json({ error: 'Número de telefone é obrigatório' });
      }

      const cleanPhone = phone.trim();
      const suffix = cleanPhone.length >= 8 ? cleanPhone.slice(-8) : cleanPhone;

      let leadResult = await dbClient.query(
        `SELECT l.*, u.name as assigned_to_name, to_char(l.next_contact_at, 'YYYY-MM-DD"T"HH24:MI:SS') as next_contact_at 
         FROM leads l 
         LEFT JOIN users u ON l.assigned_to = u.id 
         WHERE l.phone = $1 OR replace(l.phone, '-', '') LIKE $2 
         LIMIT 1`,
        [cleanPhone, `%${suffix}`]
      );

      let lead;
      if (leadResult.rows.length === 0) {
        const matchedClient = await findClientByPhone(dbClient, cleanPhone);
        const initialName = queryName || (matchedClient ? matchedClient.name : `Lead (${cleanPhone})`);

        const insertRes = await dbClient.query(
          `INSERT INTO leads (phone, name, company, contact_name, stage, value, assigned_to) 
           VALUES ($1, $2, $2, NULL, 'inbox', 0.00, $3) 
           RETURNING *, to_char(next_contact_at, 'YYYY-MM-DD"T"HH24:MI:SS') as next_contact_at`,
          [cleanPhone, initialName, currentUser?.userId || null]
        );
        lead = insertRes.rows[0];
      } else {
        lead = leadResult.rows[0];
      }

      const matchedClient = await findClientByPhone(dbClient, cleanPhone);
      let clientContracts = [];
      let clientTickets = [];
      let clientEquipments = [];
      let clientId = null;

      if (matchedClient) {
        clientId = matchedClient.id;
        const contractsRes = await dbClient.query("SELECT * FROM contracts WHERE client_id = $1 ORDER BY created_at DESC", [clientId]);
        clientContracts = contractsRes.rows;
      }

      const notesRes = await dbClient.query(
        `SELECT n.*, u.name as author_name 
         FROM crm_notes n 
         LEFT JOIN users u ON n.user_id = u.id 
         WHERE n.lead_phone = $1 OR replace(n.lead_phone, '-', '') LIKE $2 
         ORDER BY n.created_at DESC`,
        [cleanPhone, `%${suffix}`]
      );

      const tasksRes = await dbClient.query(
        `SELECT id, lead_phone, title, completed, to_char(due_date, 'YYYY-MM-DD"T"HH24:MI:SS') as due_date 
         FROM crm_tasks 
         WHERE lead_phone = $1 OR replace(lead_phone, '-', '') LIKE $2 
         ORDER BY completed ASC, due_date ASC NULLS LAST`,
        [cleanPhone, `%${suffix}`]
      );

      return res.status(200).json({
        lead,
        clientId,
        notes: notesRes.rows,
        tasks: tasksRes.rows,
        contracts: clientContracts,
        tickets: clientTickets,
        equipments: clientEquipments
      });

    } else if (req.method === 'POST') {
      const { phone, stage, value, assigned_to, next_contact_at, name, company, contact_name, label } = req.body || {};
      if (!phone) {
        return res.status(400).json({ error: 'Número de telefone é obrigatório' });
      }

      const cleanPhone = phone.trim();
      const suffix = cleanPhone.length >= 8 ? cleanPhone.slice(-8) : cleanPhone;

      const checkRes = await dbClient.query(
        `SELECT * FROM leads WHERE phone = $1 OR replace(phone, '-', '') LIKE $2 LIMIT 1`,
        [cleanPhone, `%${suffix}`]
      );

      let currentLead;
      if (checkRes.rows.length === 0) {
        const matchedClient = await findClientByPhone(dbClient, cleanPhone);
        const initialCompany = company || name || (matchedClient ? matchedClient.name : `Lead (${cleanPhone})`);
        const initialContact = contact_name || null;
        const initialName = initialContact ? `${initialCompany} (${initialContact})` : initialCompany;

        const insertRes = await dbClient.query(
          `INSERT INTO leads (phone, name, company, contact_name, stage, value, assigned_to) 
           VALUES ($1, $2, $3, $4, $5, 0.00, $6) 
           RETURNING *`,
          [cleanPhone, initialName, initialCompany, initialContact, stage || 'inbox', currentUser?.userId || null]
        );
        currentLead = insertRes.rows[0];
      } else {
        currentLead = checkRes.rows[0];
      }

      const updatedCompany = company !== undefined ? company : (currentLead.company || currentLead.name);
      const updatedContactName = contact_name !== undefined ? contact_name : currentLead.contact_name;
      
      let updatedName = name;
      if (name === undefined) {
        if (updatedCompany && updatedContactName) {
          updatedName = `${updatedCompany} (${updatedContactName})`;
        } else if (updatedCompany) {
          updatedName = updatedCompany;
        } else {
          updatedName = currentLead.name;
        }
      }

      const updatedStage = stage !== undefined ? stage : currentLead.stage;
      const updatedLabel = label !== undefined ? label : currentLead.label;
      const updatedValue = value !== undefined ? (value === "" || value === null ? 0.00 : parseFloat(value)) : currentLead.value;
      const updatedAssigned = assigned_to !== undefined ? (assigned_to === "" || assigned_to === null ? null : Number(assigned_to)) : currentLead.assigned_to;

      let formattedNextContact = null;
      if (next_contact_at !== undefined && next_contact_at !== null && next_contact_at !== "") {
        formattedNextContact = String(next_contact_at).replace('T', ' ').substring(0, 19);
      } else if (next_contact_at === null || next_contact_at === "") {
        formattedNextContact = null;
      } else {
        formattedNextContact = currentLead.next_contact_at;
      }

      const updateRes = await dbClient.query(
        `UPDATE leads 
         SET name = $1, company = $2, contact_name = $3, stage = $4, value = $5, assigned_to = $6, next_contact_at = $7::timestamp, label = $8, updated_at = NOW() 
         WHERE phone = $9 
         RETURNING *, to_char(next_contact_at, 'YYYY-MM-DD"T"HH24:MI:SS') as next_contact_at`,
        [updatedName, updatedCompany, updatedContactName, updatedStage, updatedValue, updatedAssigned, formattedNextContact, updatedLabel, currentLead.phone]
      );

      return res.status(200).json({ lead: updateRes.rows[0] });
    }
  } catch (error) {
    console.error('Erro na API crm/contact:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (dbClient) dbClient.release();
  }
}
