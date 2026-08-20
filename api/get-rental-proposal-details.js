import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'ID da proposta inválido.' });
  }

  try {
    const { rows } = await pool.query(`
      SELECT rp.*, 
             c.name as client_name, c.document as client_document, c.email as client_email, c.phone as client_phone, c.address as client_address, c.contact_person as client_contact, c.razao_social as client_razao_social,
             mm.name as machine_name, mm.photo_urls as machine_photos, mm.technical_description as machine_specs,
             r.code as rental_code, r.list_price as rental_list_price
      FROM rental_proposals rp
      LEFT JOIN clients c ON rp.client_id::text = c.id::text
      LEFT JOIN machine_models mm ON rp.machine_model_id = mm.id
      LEFT JOIN rental_prices r ON rp.rental_price_id = r.id
      WHERE rp.id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada.' });
    }

    const proposal = rows[0];
    let parsedItems = [];
    if (proposal.items) {
      parsedItems = typeof proposal.items === 'string' ? JSON.parse(proposal.items) : proposal.items;
    } else if (proposal.machine_model_id) {
      parsedItems = [{
        id: 'opt_1',
        machine_model_id: proposal.machine_model_id,
        equipment_id: proposal.equipment_id,
        rental_price_id: proposal.rental_price_id,
        period_months: proposal.period_months,
        quantity: 1,
        monthly_value: proposal.monthly_value,
        contract_type: proposal.contract_type,
        hours_per_month: proposal.hours_per_month,
        notes: ''
      }];
    }

    if (parsedItems && parsedItems.length > 0) {
      const machineIds = [...new Set(parsedItems.map(i => parseInt(i.machine_model_id, 10)).filter(n => !isNaN(n) && n > 0))];
      const rentalIds = [...new Set(parsedItems.map(i => parseInt(i.rental_price_id, 10)).filter(n => !isNaN(n) && n > 0))];
      const eqIds = [...new Set(parsedItems.map(i => parseInt(i.equipment_id, 10)).filter(n => !isNaN(n) && n > 0))];

      let machinesMap = {};
      let rentalMap = {};
      let eqMap = {};

      try {
        if (machineIds.length > 0) {
          const { rows: machines } = await pool.query(`SELECT id, name, photo_urls, technical_description FROM machine_models WHERE id = ANY($1::int[])`, [machineIds]);
          machines.forEach(m => { machinesMap[m.id] = m; });
        }
      } catch (e) { console.error('Err machines:', e); }

      try {
        if (rentalIds.length > 0) {
          const { rows: rentals } = await pool.query(`SELECT id, code, description, list_price, price_12, price_24, price_36, price_48, price_60 FROM rental_prices WHERE id = ANY($1::int[])`, [rentalIds]);
          rentals.forEach(r => { rentalMap[r.id] = r; });
        }
      } catch (e) { console.error('Err rentals:', e); }

      try {
        if (eqIds.length > 0) {
          const { rows: eqs } = await pool.query(`SELECT id, name, serial_number, ownership_type, status FROM equipments WHERE id = ANY($1::int[])`, [eqIds]);
          eqs.forEach(e => { eqMap[e.id] = e; });
        }
      } catch (e) { console.error('Err eqs:', e); }

      proposal.items = parsedItems.map((item, idx) => {
        const m = machinesMap[item.machine_model_id] || {};
        const r = rentalMap[item.rental_price_id] || {};
        const eq = eqMap[item.equipment_id] || {};
        return {
          ...item,
          option_number: idx + 1,
          machine_name: m.name || proposal.machine_name || 'Equipamento',
          machine_photos: m.photo_urls || proposal.machine_photos || '',
          machine_specs: m.technical_description || proposal.machine_specs || '',
          rental_code: r.code || proposal.rental_code || '',
          rental_description: r.description || '',
          equipment_name: eq.name || '',
          equipment_serial: eq.serial_number || ''
        };
      });
    } else {
      proposal.items = [];
    }

    return res.status(200).json({ proposal });
  } catch (error) {
    console.error('Erro ao buscar detalhes da proposta:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar detalhes.' });
  }
}
