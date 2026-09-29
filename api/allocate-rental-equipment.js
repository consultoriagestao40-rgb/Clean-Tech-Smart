import { Pool } from 'pg';
import { sendTicketWhatsappGroupNotification } from './_utils/notifications.js';

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
    const {
      proposal_id,
      equipment_id,
      scheduled_date,
      technician_id,
      technician_name,
      create_delivery_ticket = true,
      delivery_notes
    } = req.body;

    if (!proposal_id || !equipment_id) {
      return res.status(400).json({ error: 'Proposta e Equipamento do Parque são obrigatórios.' });
    }

    // 1. Garantir coluna delivery_ticket_id na tabela rental_proposals
    await client.query(`
      ALTER TABLE rental_proposals ADD COLUMN IF NOT EXISTS delivery_ticket_id INT;
    `);

    // 2. Buscar proposta
    const proposalRes = await client.query(`
      SELECT rp.*, c.name as client_name, mm.name as machine_name
      FROM rental_proposals rp
      LEFT JOIN clients c ON rp.client_id::text = c.id::text
      LEFT JOIN machine_models mm ON rp.machine_model_id = mm.id
      WHERE rp.id = $1
    `, [proposal_id]);

    if (proposalRes.rows.length === 0) {
      return res.status(404).json({ error: 'Proposta de locação não encontrada.' });
    }
    const proposal = proposalRes.rows[0];

    // 3. Buscar equipamento selecionado do parque
    const eqRes = await client.query('SELECT * FROM equipments WHERE id = $1', [equipment_id]);
    if (eqRes.rows.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado no parque.' });
    }
    const equipment = eqRes.rows[0];

    // Se a proposta já tinha outro equipamento alocado anteriormente, liberar o anterior
    if (proposal.equipment_id && String(proposal.equipment_id) !== String(equipment_id)) {
      await client.query(`
        UPDATE equipments
        SET status = 'Disponível', client_id = NULL
        WHERE id = $1
      `, [proposal.equipment_id]);
    }

    // 4. Atualizar o equipamento alocado para 'Locado' e vincular ao cliente
    await client.query(`
      UPDATE equipments
      SET status = 'Locado', client_id = $1
      WHERE id = $2
    `, [proposal.client_id, equipment_id]);

    // 5. Criar chamado de Entrega Técnica se solicitado
    let createdTicketId = proposal.delivery_ticket_id || null;
    const finalDate = scheduled_date || new Date().toISOString().split('T')[0];

    if (create_delivery_ticket) {
      const ticketDesc = `Entrega Técnica e Instalação de Locação - Proposta #${proposal.id} ` +
        `(${equipment.name || proposal.machine_name} - S/N: ${equipment.serial_number || 'S/N'}). ` +
        `Cliente: ${proposal.client_name}. ` +
        (delivery_notes ? `Instruções: ${delivery_notes}` : '');

      const ticketRes = await client.query(`
        INSERT INTO service_tickets (
          client_id,
          equipment_id,
          ticket_type,
          status,
          priority,
          description,
          technician_name,
          technician_id,
          scheduled_date,
          internal_notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        proposal.client_id,
        equipment.id,
        'Entrega',
        'Aberto',
        'Média',
        ticketDesc,
        technician_name || null,
        technician_id ? Number(technician_id) : null,
        finalDate,
        `Gerado a partir da aprovação da Proposta de Locação #${proposal.id}`
      ]);

      if (ticketRes.rows.length > 0) {
        createdTicketId = ticketRes.rows[0].id;

        // Disparar notificação WhatsApp do grupo de chamados
        try {
          sendTicketWhatsappGroupNotification(pool, {
            id: createdTicketId,
            clientName: proposal.client_name || 'Cliente',
            equipmentName: `${equipment.name} (S/N: ${equipment.serial_number || 'S/N'})`,
            ticketType: 'Entrega',
            priority: 'Média',
            status: 'Aberto',
            technicianName: technician_name || 'A designar',
            scheduledDate: finalDate,
            description: ticketDesc
          }).catch(err => console.error('Erro ao notificar entrega no WhatsApp:', err));
        } catch (notifErr) {
          console.error('Erro notificacao chamado entrega:', notifErr);
        }
      }
    }

    // 6. Atualizar a proposta com o ativo e o id do chamado
    const updatedProposalRes = await client.query(`
      UPDATE rental_proposals
      SET equipment_id = $1,
          delivery_ticket_id = $2
      WHERE id = $3
      RETURNING *
    `, [equipment.id, createdTicketId, proposal.id]);

    return res.status(200).json({
      success: true,
      message: 'Ativo alocado com sucesso e chamado de entrega registrado!',
      proposal: updatedProposalRes.rows[0],
      equipment: equipment,
      delivery_ticket_id: createdTicketId
    });

  } catch (error) {
    console.error('Erro ao alocar equipamento para locação:', error);
    return res.status(500).json({ error: 'Erro interno ao alocar ativo para locação.' });
  } finally {
    client.release();
  }
}
