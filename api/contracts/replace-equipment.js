import { Pool } from 'pg';
import { sendTicketWhatsappGroupNotification } from '../_utils/notifications.js';

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
      contract_id,
      old_equipment_id,
      old_equipment_serial,
      new_equipment_id,
      reason_type, // 'manutencao' | 'troca'
      reason_description,
      replacement_date,
      create_ticket = true,
      technician_id,
      technician_name
    } = req.body;

    if (!contract_id || !new_equipment_id) {
      return res.status(400).json({ error: 'Contrato e Novo Equipamento são obrigatórios.' });
    }

    // Garantir coluna replacements na tabela contracts
    await client.query(`
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS replacements JSONB DEFAULT '[]'::jsonb;
    `);

    // 1. Buscar dados do contrato
    const contractRes = await client.query('SELECT * FROM contracts WHERE id = $1', [contract_id]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ error: 'Contrato não encontrado.' });
    }
    const contract = contractRes.rows[0];

    // 2. Buscar dados do novo equipamento
    const newEqRes = await client.query('SELECT * FROM equipments WHERE id = $1', [new_equipment_id]);
    if (newEqRes.rows.length === 0) {
      return res.status(404).json({ error: 'Novo equipamento não encontrado no inventário.' });
    }
    const newEq = newEqRes.rows[0];

    // 3. Buscar dados do equipamento antigo (se tiver id)
    let oldEq = null;
    if (old_equipment_id) {
      const oldEqRes = await client.query('SELECT * FROM equipments WHERE id = $1', [old_equipment_id]);
      if (oldEqRes.rows.length > 0) {
        oldEq = oldEqRes.rows[0];
      }
    }

    // 4. Atualizar o array de equipamentos do contrato
    let currentEquipments = [];
    if (typeof contract.equipments === 'string') {
      try {
        currentEquipments = JSON.parse(contract.equipments);
      } catch (e) {
        currentEquipments = [];
      }
    } else if (Array.isArray(contract.equipments)) {
      currentEquipments = [...contract.equipments];
    }

    let foundIndex = -1;
    if (old_equipment_id) {
      foundIndex = currentEquipments.findIndex(e => String(e.equipment_id || e.id) === String(old_equipment_id));
    }
    if (foundIndex === -1 && old_equipment_serial) {
      foundIndex = currentEquipments.findIndex(e => String(e.serial_number || '').trim().toLowerCase() === String(old_equipment_serial).trim().toLowerCase());
    }

    const oldName = oldEq?.name || (foundIndex !== -1 ? currentEquipments[foundIndex]?.name : 'Equipamento Anterior');
    const oldSerial = oldEq?.serial_number || (foundIndex !== -1 ? currentEquipments[foundIndex]?.serial_number : old_equipment_serial || 'S/N');

    const updatedEqItem = {
      ...(foundIndex !== -1 ? currentEquipments[foundIndex] : {}),
      equipment_id: newEq.id,
      name: newEq.name || newEq.model,
      serial_number: newEq.serial_number || 'S/N',
      brand: newEq.brand || 'Tennant'
    };

    if (foundIndex !== -1) {
      currentEquipments[foundIndex] = updatedEqItem;
    } else {
      currentEquipments.push(updatedEqItem);
    }

    // 5. Se solicitado, criar o chamado de troca/substituição técnica
    let createdTicketId = null;
    const finalDate = replacement_date || new Date().toISOString().split('T')[0];

    if (create_ticket) {
      const ticketDesc = `Substituição de Ativo no Contrato ${contract.code}: ` +
        `Retirada da máquina avariada/anterior ${oldName} (S/N: ${oldSerial}) ` +
        `e Entrega da nova máquina ${newEq.name} (S/N: ${newEq.serial_number || 'S/N'}). ` +
        `Motivo: ${reason_type === 'manutencao' ? 'Manutenção Corretiva' : 'Troca de Ativo / Upgrade'}. ` +
        (reason_description ? `Detalhes: ${reason_description}` : '');

      const ticketPriority = reason_type === 'manutencao' ? 'Alta' : 'Média';

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
        contract.client_id,
        newEq.id,
        'Troca de Equipamento',
        'Aberto',
        ticketPriority,
        ticketDesc,
        technician_name || null,
        technician_id ? Number(technician_id) : null,
        finalDate,
        `Gerado automaticamente pela substituição de ativo do Contrato ${contract.code}`
      ]);

      if (ticketRes.rows.length > 0) {
        createdTicketId = ticketRes.rows[0].id;

        // Notificar via WhatsApp operacional
        try {
          const cliNameRes = await client.query('SELECT name FROM clients WHERE id = $1', [contract.client_id]);
          const clientName = cliNameRes.rows[0]?.name || 'Cliente';
          
          sendTicketWhatsappGroupNotification(pool, {
            id: createdTicketId,
            clientName: clientName,
            equipmentName: `${newEq.name} (Substituindo ${oldName})`,
            ticketType: 'Troca de Equipamento',
            priority: ticketPriority,
            status: 'Aberto',
            technicianName: technician_name || 'A designar',
            scheduledDate: finalDate,
            description: ticketDesc
          }).catch(err => console.error('Erro ao notificar WhatsApp troca de ativo:', err));
        } catch (notifErr) {
          console.error('Erro ao preparar notificacao de troca:', notifErr);
        }
      }
    }

    // 6. Registrar histórico de substituições no contrato
    let currentReplacements = [];
    if (typeof contract.replacements === 'string') {
      try {
        currentReplacements = JSON.parse(contract.replacements);
      } catch (e) {
        currentReplacements = [];
      }
    } else if (Array.isArray(contract.replacements)) {
      currentReplacements = [...contract.replacements];
    }

    const replacementRecord = {
      id: Date.now(),
      date: finalDate,
      reason_type: reason_type || 'troca',
      reason_description: reason_description || '',
      ticket_id: createdTicketId,
      old_equipment: {
        id: oldEq?.id || old_equipment_id || null,
        name: oldName,
        serial_number: oldSerial
      },
      new_equipment: {
        id: newEq.id,
        name: newEq.name,
        serial_number: newEq.serial_number
      }
    };
    currentReplacements.unshift(replacementRecord);

    // 7. Atualizar o Contrato
    const updatedContractRes = await client.query(`
      UPDATE contracts
      SET equipments = $1::jsonb,
          replacements = $2::jsonb
      WHERE id = $3
      RETURNING *
    `, [JSON.stringify(currentEquipments), JSON.stringify(currentReplacements), contract_id]);

    // 8. Atualizar status dos equipamentos no parque (controle de entrada e saída)
    // Ativo antigo: se motivo for manutenção vai para 'Manutenção', se for troca volta para 'Disponível'
    if (oldEq?.id || old_equipment_id) {
      const oldId = oldEq?.id || old_equipment_id;
      const targetOldStatus = reason_type === 'manutencao' ? 'Manutenção' : 'Disponível';
      const targetOldClientId = reason_type === 'manutencao' ? contract.client_id : null;

      await client.query(`
        UPDATE equipments
        SET status = $1, client_id = $2
        WHERE id = $3
      `, [targetOldStatus, targetOldClientId, oldId]);
    }

    // Novo ativo que entrou no contrato: vai para 'Locado' associado ao cliente do contrato
    await client.query(`
      UPDATE equipments
      SET status = 'Locado', client_id = $1
      WHERE id = $2
    `, [contract.client_id, newEq.id]);

    // Registrar no histórico de logs do contrato
    await client.query(`
      INSERT INTO contract_history (contract_id, action, status)
      VALUES ($1, $2, $3)
    `, [contract_id, `Ativo substituído: ${oldName} (${oldSerial}) por ${newEq.name} (${newEq.serial_number})`, contract.status]);

    return res.status(200).json({
      success: true,
      message: 'Equipamento substituído com sucesso no contrato!',
      contract: updatedContractRes.rows[0],
      replacement: replacementRecord,
      ticket_id: createdTicketId
    });

  } catch (error) {
    console.error('Erro ao substituir equipamento do contrato:', error);
    return res.status(500).json({ error: 'Erro interno ao processar substituição de equipamento.' });
  } finally {
    client.release();
  }
}
