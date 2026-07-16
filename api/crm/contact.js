import { Pool } from 'pg';
import { getAuthUser } from '../_utils/auth.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function findClientByPhone(dbClient, rawPhone) {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;
  
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
  return null;
}

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

  try {
    // Authenticate user
    const currentUser = getAuthUser(req);
    const dbClient = await pool.connect();
    
    try {
      if (req.method === 'GET') {
        const { phone, name: queryName } = req.query;
        if (!phone) {
          return res.status(400).json({ error: 'Número de telefone é obrigatório' });
        }

        const cleanPhone = phone.trim();

        // 1. Fetch Lead
        let leadResult = await dbClient.query(
          'SELECT l.*, u.name as assigned_to_name FROM leads l LEFT JOIN users u ON l.assigned_to = u.id WHERE l.phone = $1',
          [cleanPhone]
        );

        let lead;

        if (leadResult.rows.length === 0) {
          // Lead doesn't exist, create it!
          // Try to fetch name from existing clients
          const matchedClient = await findClientByPhone(dbClient, cleanPhone);
          const initialName = queryName || (matchedClient ? matchedClient.name : `Lead WhatsApp (${cleanPhone})`);

          const insertRes = await dbClient.query(
            `INSERT INTO leads (phone, name, stage, value, assigned_to) 
             VALUES ($1, $2, 'novo', 0.00, $3) 
             RETURNING *`,
            [cleanPhone, initialName, currentUser.userId]
          );
          
          lead = insertRes.rows[0];
          lead.assigned_to_name = currentUser.name;
        } else {
          lead = leadResult.rows[0];
        }

        // 2. Fetch matched client records
        const matchedClient = await findClientByPhone(dbClient, cleanPhone);
        let clientContracts = [];
        let clientTickets = [];
        let clientEquipments = [];
        let clientId = null;

        if (matchedClient) {
          clientId = matchedClient.id;
          // Get active contracts
          const contractsRes = await dbClient.query(
            "SELECT * FROM contracts WHERE client_id = $1 ORDER BY created_at DESC",
            [clientId]
          );
          clientContracts = contractsRes.rows;

          // Get tickets
          const ticketsRes = await dbClient.query(
            "SELECT * FROM service_tickets WHERE client_id = $1 ORDER BY created_at DESC",
            [clientId]
          );
          clientTickets = ticketsRes.rows;

          // Get equipments
          const eqRes = await dbClient.query(
            "SELECT * FROM equipments WHERE client_id = $1 ORDER BY name ASC",
            [clientId]
          );
          clientEquipments = eqRes.rows;
        }

        // 3. Fetch notes
        const notesRes = await dbClient.query(
          `SELECT n.*, u.name as author_name 
           FROM crm_notes n 
           LEFT JOIN users u ON n.user_id = u.id 
           WHERE n.lead_phone = $1 
           ORDER BY n.created_at DESC`,
          [cleanPhone]
        );

        // 4. Fetch tasks
        const tasksRes = await dbClient.query(
          `SELECT * FROM crm_tasks WHERE lead_phone = $1 ORDER BY due_date ASC`,
          [cleanPhone]
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
        const { phone, stage, value, assigned_to, next_contact_at, name } = req.body || {};
        if (!phone) {
          return res.status(400).json({ error: 'Número de telefone é obrigatório' });
        }

        const cleanPhone = phone.trim();

        // Check if lead exists
        const checkRes = await dbClient.query('SELECT * FROM leads WHERE phone = $1', [cleanPhone]);
        if (checkRes.rows.length === 0) {
          return res.status(404).json({ error: 'Lead não encontrado' });
        }

        const currentLead = checkRes.rows[0];

        // Update fields if provided
        const updatedName = name !== undefined ? name : currentLead.name;
        const updatedStage = stage !== undefined ? stage : currentLead.stage;
        const updatedValue = value !== undefined ? value : currentLead.value;
        const updatedAssigned = assigned_to !== undefined ? (assigned_to ? Number(assigned_to) : null) : currentLead.assigned_to;
        const updatedNextContact = next_contact_at !== undefined ? (next_contact_at ? new Date(next_contact_at) : null) : currentLead.next_contact_at;

        const updateRes = await dbClient.query(
          `UPDATE leads 
           SET name = $1, stage = $2, value = $3, assigned_to = $4, next_contact_at = $5, updated_at = NOW() 
           WHERE phone = $6 
           RETURNING *`,
          [updatedName, updatedStage, updatedValue, updatedAssigned, updatedNextContact, cleanPhone]
        );

        return res.status(200).json({ lead: updateRes.rows[0] });
      }
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error('Erro na API crm/contact:', error);
    return res.status(error.message.includes('Token') || error.message.includes('Authorization') ? 401 : 500)
      .json({ error: error.message });
  }
}
