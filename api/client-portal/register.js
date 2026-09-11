import { Pool } from 'pg';
import { sha256, signToken } from '../_utils/auth.js';
import { sendTicketWhatsappGroupNotification, sendTicketEmailNotification } from '../_utils/notifications.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

function cleanDoc(val) {
  if (!val) return '';
  return String(val).replace(/\D/g, '');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    name,
    razao_social,
    document,
    email,
    phone,
    contact_person,
    address,
    password,
    lgpd_accepted,
    // Optional immediate equipment
    equipment_model,
    equipment_brand,
    equipment_serial,
    equipment_name,
    hour_meter,
    // Optional immediate ticket
    ticket_type,
    ticket_description,
    ticket_priority,
    evidence_photos
  } = req.body || {};

  // LGPD Consent Validation (Lei 13.709/2018)
  if (!lgpd_accepted) {
    return res.status(400).json({ 
      error: 'Para realizar o cadastro e abertura de chamados, é obrigatório ler e aceitar os Termos de Uso e a Política de Privacidade (LGPD).' 
    });
  }

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'Nome/Razão Social, E-mail, WhatsApp e Senha são obrigatórios.' });
  }

  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const passwordHash = sha256(password);
  const docDigits = cleanDoc(document);

  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    // Check if client already exists by email or document
    let existingQuery = `
      SELECT * FROM clients 
      WHERE LOWER(email) = LOWER($1) 
         OR (document IS NOT NULL AND document != '' AND (document = $2 OR regexp_replace(document, '[^0-9]', '', 'g') = $3))
      LIMIT 1
    `;
    const existing = await dbClient.query(existingQuery, [email.trim(), document?.trim() || '', docDigits || '___none___']);

    let finalClientId;
    let clientRow;

    if (existing.rows.length > 0) {
      clientRow = existing.rows[0];
      // If already has password, inform that user already has an active account
      if (clientRow.password_hash) {
        await dbClient.query('ROLLBACK');
        return res.status(409).json({ 
          error: 'Já existe uma conta ativa com este e-mail ou documento. Por favor, acesse a tela de login com sua senha.' 
        });
      }

      // If client exists in CRM without password, activate their portal access
      const updateRes = await dbClient.query(`
        UPDATE clients
        SET name = COALESCE(NULLIF($1, ''), name),
            razao_social = COALESCE(NULLIF($2, ''), razao_social),
            phone = COALESCE(NULLIF($3, ''), phone),
            contact_person = COALESCE(NULLIF($4, ''), contact_person),
            address = COALESCE(NULLIF($5, ''), address),
            password_hash = $6,
            lgpd_accepted = TRUE,
            lgpd_accepted_at = NOW(),
            lgpd_version = 'v1.0-2026',
            lgpd_ip = $7,
            is_portal_active = TRUE
        WHERE id = $8
        RETURNING *
      `, [
        name.trim(),
        razao_social?.trim() || name.trim(),
        phone.trim(),
        contact_person?.trim() || name.trim(),
        address?.trim() || '',
        passwordHash,
        clientIp,
        clientRow.id
      ]);
      clientRow = updateRes.rows[0];
      finalClientId = clientRow.id;
    } else {
      // Create new client
      const insertRes = await dbClient.query(`
        INSERT INTO clients (
          name,
          razao_social,
          document,
          email,
          phone,
          contact_person,
          address,
          status,
          password_hash,
          lgpd_accepted,
          lgpd_accepted_at,
          lgpd_version,
          lgpd_ip,
          is_portal_active
        )
        VALUES ($1, $2, $3, LOWER($4), $5, $6, $7, 'Ativo', $8, TRUE, NOW(), 'v1.0-2026', $9, TRUE)
        RETURNING *
      `, [
        name.trim(),
        razao_social?.trim() || name.trim(),
        document?.trim() || null,
        email.trim(),
        phone.trim(),
        contact_person?.trim() || name.trim(),
        address?.trim() || '',
        passwordHash,
        clientIp
      ]);
      clientRow = insertRes.rows[0];
      finalClientId = clientRow.id;
    }

    // Optional: Register equipment
    let finalEquipmentId = null;
    if (equipment_model || equipment_serial || equipment_name) {
      const eqBrand = equipment_brand?.trim() || 'Tennant';
      const eqModel = equipment_model?.trim() || 'Equipamento Tennant';
      const eqName = equipment_name?.trim() || `${eqBrand} ${eqModel}`;
      const eqSerial = equipment_serial?.trim() || 'Não informado';

      const eqRes = await dbClient.query(`
        INSERT INTO equipments (
          client_id,
          name,
          brand,
          model,
          serial_number,
          ownership_type,
          status
        )
        VALUES ($1, $2, $3, $4, $5, 'Próprio do Cliente', 'Em Operação')
        RETURNING *
      `, [
        finalClientId,
        eqName,
        eqBrand,
        eqModel,
        eqSerial
      ]);
      finalEquipmentId = eqRes.rows[0].id;
    }

    // Optional: Open immediate ticket
    let ticketRow = null;
    if (ticket_description || ticket_type) {
      const tType = ticket_type?.trim() || 'Corretiva';
      const tPriority = ticket_priority?.trim() || 'Média';
      const tDesc = ticket_description?.trim() || 'Abertura rápida pelo Portal do Cliente';
      const hMeter = hour_meter ? parseInt(hour_meter, 10) : null;
      const photos = evidence_photos ? JSON.stringify(evidence_photos) : null;

      const tickRes = await dbClient.query(`
        INSERT INTO service_tickets (
          client_id,
          equipment_id,
          ticket_type,
          status,
          priority,
          description,
          origin,
          hour_meter,
          evidence_photos
        )
        VALUES ($1, $2, $3, 'Aberto', $4, $5, 'portal_cliente', $6, $7)
        RETURNING *
      `, [
        finalClientId,
        finalEquipmentId,
        tType,
        tPriority,
        tDesc,
        hMeter,
        photos
      ]);
      ticketRow = tickRes.rows[0];
    }

    await dbClient.query('COMMIT');

    // Trigger async notifications if ticket was created
    if (ticketRow) {
      try {
        const fullTicketInfo = {
          ...ticketRow,
          client_name: clientRow.name,
          client_phone: clientRow.phone,
          client_address: clientRow.address,
          equipment_model: equipment_model || 'Não especificado',
          equipment_serial_number: equipment_serial || 'S/N'
        };
        sendTicketWhatsappGroupNotification(dbClient, fullTicketInfo, clientRow.name, null, 'novo', []).catch(console.error);
        sendTicketEmailNotification(dbClient, fullTicketInfo, clientRow.name, null, 'novo').catch(console.error);
      } catch (notifErr) {
        console.warn('Erro ao disparar notificações de novo chamado:', notifErr);
      }
    }

    const token = signToken({
      id: clientRow.id,
      clientId: clientRow.id,
      name: clientRow.name,
      email: clientRow.email,
      role: 'client'
    });

    return res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso!',
      token,
      client: {
        id: clientRow.id,
        name: clientRow.name,
        razao_social: clientRow.razao_social,
        document: clientRow.document,
        email: clientRow.email,
        phone: clientRow.phone,
        address: clientRow.address,
        contact_person: clientRow.contact_person
      },
      equipment_id: finalEquipmentId,
      ticket_id: ticketRow ? ticketRow.id : null
    });

  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Erro no autocadastro do cliente:', error);
    return res.status(500).json({ error: 'Erro interno ao processar cadastro no portal.' });
  } finally {
    dbClient.release();
  }
}
