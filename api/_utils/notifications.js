import { Pool } from 'pg';

// Helper to fetch all configurations from database
async function getSystemSettings(dbClient) {
  const result = await dbClient.query('SELECT key, value FROM system_settings');
  const settings = {};
  for (const row of result.rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

// WhatsApp Group notification helper
export async function sendTicketWhatsappGroupNotification(dbClient, ticket, clientName, technicianName, actionType, changesList = []) {
  try {
    const settings = await getSystemSettings(dbClient);
    const instanceId = settings.app_zapi_instance_id;
    const token = settings.app_zapi_token;
    const clientToken = settings.app_zapi_client_token;

    if (!instanceId || !token) {
      console.warn('[Z-API] Instância ou Token não configurados em system_settings. Notificação não enviada.');
      return;
    }

    const zapiHeaders = { 'Content-Type': 'application/json' };
    if (clientToken) {
      zapiHeaders['Client-Token'] = clientToken;
    }

    let groupJid = settings.app_zapi_ticket_group_id || '120363419495845420-group';

    const cleanAddress = ticket.address || 'Não informado';
    const serviceTypeLabel = getServiceTypeLabel(ticket.ticket_type || ticket.service_type);
    const dateFormatted = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const scheduledFormatted = ticket.scheduled_date ? new Date(ticket.scheduled_date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Não agendado';

    let message = '';

    if (actionType === 'close' || ticket.status === 'Concluído') {
      message = `*✅ CHAMADO FINALIZADO / CONCLUÍDO* 🛠️
*Data/Hora:* ${dateFormatted}
*Chamado ID:* #${ticket.id}
*Cliente:* ${clientName || 'Não cadastrado'}
*Endereço:* ${cleanAddress}
*Equipamento:* ${ticket.equipment_info || 'Não informado'}
*Técnico Responsável:* ${technicianName || 'Não atribuído'}
*Recebido por:* ${ticket.signed_by_name ? `${ticket.signed_by_name} (${ticket.signed_by_document || 'Sem documento'})` : 'Não assinado'}

*Laudo Técnico / Resolução:*
${ticket.resolution_notes || 'Serviço concluído pelo técnico.'}

_Mensagem automática gerada pelo sistema Clean Tech Smart._`;
    } else if (ticket.status === 'Em Rota') {
      message = `*🚗 TÉCNICO EM ROTA PARA ATENDIMENTO* 🛠️
*Data/Hora:* ${dateFormatted}
*Chamado ID:* #${ticket.id}
*Cliente:* ${clientName || 'Não cadastrado'}
*Endereço:* ${cleanAddress}
*Equipamento:* ${ticket.equipment_info || 'Não informado'}
*Técnico:* ${technicianName || 'Não atribuído'}

ℹ️ *O técnico iniciou o deslocamento para o local do cliente.*

_Mensagem automática gerada pelo sistema Clean Tech Smart._`;
    } else if (ticket.status === 'Em Atendimento') {
      message = `*🛠️ TÉCNICO INICIOU ATENDIMENTO NO CLIENTE* 🛠️
*Data/Hora:* ${dateFormatted}
*Chamado ID:* #${ticket.id}
*Cliente:* ${clientName || 'Não cadastrado'}
*Endereço:* ${cleanAddress}
*Equipamento:* ${ticket.equipment_info || 'Não informado'}
*Técnico:* ${technicianName || 'Não atribuído'}

ℹ️ *O técnico chegou no local e iniciou a manutenção.*

_Mensagem automática gerada pelo sistema Clean Tech Smart._`;
    } else if (actionType === 'update') {
      const changesText = changesList.length > 0 ? changesList.map(c => `• ${c}`).join('\n') : '• Detalhes do chamado atualizados.';
      message = `*⚠️ CHAMADO ATUALIZADO* 🛠️
*Data/Hora:* ${dateFormatted}
*Chamado ID:* #${ticket.id}
*Cliente:* ${clientName || 'Não cadastrado'}
*Equipamento:* ${ticket.equipment_info || 'Não informado'}
*Status Atual:* ${ticket.status || 'Aberto'}

*Alterações Realizadas:*
${changesText}

_Mensagem automática gerada pelo sistema Clean Tech Smart._`;
    } else {
      // Novo Chamado
      message = `*🆕 NOVO CHAMADO DE MANUTENÇÃO* 🛠️
*Data/Hora:* ${dateFormatted}
*Chamado ID:* #${ticket.id}
*Cliente:* ${clientName || 'Não cadastrado'}
*Endereço:* ${cleanAddress}
*Equipamento:* ${ticket.equipment_info || 'Não informado'}
*Tipo de Serviço:* ${serviceTypeLabel}
*Agendamento:* ${scheduledFormatted}
*Técnico Responsável:* ${technicianName || 'Não atribuído'}
*Prioridade:* ${ticket.priority || 'Média'}
*Status:* ${ticket.status || 'Aberto'}
*Defeito / Solicitação:* ${ticket.description || 'Nenhum detalhe informado'}

_Mensagem automática gerada pelo sistema Clean Tech Smart._`;
    }

    console.log(`[Z-API] Enviando notificação para o grupo ${groupJid}...`);
    const sendRes = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
      method: 'POST',
      headers: zapiHeaders,
      body: JSON.stringify({
        phone: groupJid,
        message: message
      })
    });

    if (!sendRes.ok) {
      const errTxt = await sendRes.text();
      console.error('[Z-API] Falha ao enviar mensagem para o grupo:', errTxt);
    } else {
      console.log('[Z-API] Notificação enviada com sucesso para o grupo do WhatsApp!');
    }
  } catch (error) {
    console.error('[Z-API] Erro ao processar notificação de grupo:', error);
  }
}

// E-mail notification helper
export async function sendTicketEmailNotification(dbClient, ticket, clientName, technicianName, actionType) {
  try {
    const settings = await getSystemSettings(dbClient);
    
    const host = settings.smtp_host;
    const port = settings.smtp_port;
    const user = settings.smtp_user;
    const pass = settings.smtp_pass;
    const senderName = settings.smtp_sender_name || 'Clean Tech Smart';
    const senderEmail = settings.smtp_sender_email || user;
    const recipientEmail = settings.smtp_recipient_email;

    if (!host || !user || !pass || !recipientEmail) {
      return;
    }

    let actionLabel = 'Novo Chamado Aberto';
    if (actionType === 'update') actionLabel = 'Chamado Atualizado';
    if (actionType === 'close' || ticket.status === 'Concluído') actionLabel = 'Chamado Finalizado';

    const serviceTypeLabel = getServiceTypeLabel(ticket.ticket_type || ticket.service_type);
    const dateFormatted = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const htmlContent = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #009AC7; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px;">🚨 Notificação de Chamado</h2>
          <p style="margin: 5px 0 0 0; font-size: 14px;">${actionLabel} no Clean Tech Smart</p>
        </div>
        
        <div style="padding: 20px; line-height: 1.6;">
          <h3 style="margin-top: 0; color: #009AC7; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Dados do Chamado #${ticket.id}</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; width: 150px;">Data/Hora:</td>
              <td style="padding: 6px 0;">${dateFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Cliente:</td>
              <td style="padding: 6px 0;">${clientName || 'Não cadastrado'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Tipo de Serviço:</td>
              <td style="padding: 6px 0;">${serviceTypeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Equipamento:</td>
              <td style="padding: 6px 0;">${ticket.equipment_info || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Endereço:</td>
              <td style="padding: 6px 0;">${ticket.address || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Técnico Atribuído:</td>
              <td style="padding: 6px 0;">${technicianName || 'Não atribuído'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Status Atual:</td>
              <td style="padding: 6px 0;">
                <span style="background-color: #f0f0f0; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
                  ${ticket.status || 'Aberto'}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Prioridade:</td>
              <td style="padding: 6px 0;">${ticket.priority || 'Normal'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Descrição / Defeito:</td>
              <td style="padding: 6px 0;">${ticket.description || 'Nenhum detalhe informado'}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #888;">
          Este é um e-mail automático gerado pelo sistema Clean Tech Smart.
        </div>
      </div>
    `;

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: recipientEmail,
      subject: `[Clean Tech Smart] ${actionLabel} - Chamado #${ticket.id}`,
      html: htmlContent
    });

  } catch (error) {
    console.error('[SMTP] Erro ao enviar e-mail de notificação:', error);
  }
}

function getServiceTypeLabel(type) {
  const str = String(type || '').toLowerCase();
  if (str.includes('corretiva')) return '🔧 Manutenção Corretiva';
  if (str.includes('preventiva')) return '📅 Manutenção Preventiva';
  if (str.includes('instalacao')) return '🛠️ Instalação';
  return '📋 Manutenção / Serviço Geral';
}
