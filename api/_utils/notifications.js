import nodemailer from 'nodemailer';

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
export async function sendTicketWhatsappGroupNotification(dbClient, ticket, clientName, technicianName, actionType) {
  try {
    const settings = await getSystemSettings(dbClient);
    const instanceId = settings.app_zapi_instance_id;
    const token = settings.app_zapi_token;
    const clientToken = settings.app_zapi_client_token;

    if (!instanceId || !token) {
      console.warn('[Z-API] Instância ou Token não configurados. Notificação não enviada.');
      return;
    }

    // 1. Get Group JID for "CHAMADOS CLEAN TECH"
    const zapiHeaders = { 'Content-Type': 'application/json' };
    if (clientToken) {
      zapiHeaders['Client-Token'] = clientToken;
    }

    console.log('[Z-API] Buscando JID do grupo "CHAMADOS CLEAN TECH"...');
    let groupJid = null;

    // Tenta primeiro o endpoint /groups (lista todos os grupos)
    try {
      const groupsRes = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/groups`, {
        headers: zapiHeaders
      });
      if (groupsRes.ok) {
        const groups = await groupsRes.json();
        const found = groups.find(c => c.name && c.name.trim().toUpperCase() === 'CHAMADOS CLEAN TECH');
        if (found) {
          groupJid = found.phone || found.id;
          console.log('[Z-API] Grupo encontrado via /groups:', groupJid);
        }
      }
    } catch (err) {
      console.warn('[Z-API] Erro ao buscar grupos via /groups:', err);
    }

    // Fallback: Tenta o endpoint /chats (lista conversas recentes)
    if (!groupJid) {
      try {
        const chatsRes = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/chats`, {
          headers: zapiHeaders
        });
        if (chatsRes.ok) {
          const chats = await chatsRes.json();
          const found = chats.find(c => c.name && c.name.trim().toUpperCase() === 'CHAMADOS CLEAN TECH');
          if (found) {
            groupJid = found.phone || found.id;
            console.log('[Z-API] Grupo encontrado via /chats:', groupJid);
          }
        }
      } catch (err) {
        console.warn('[Z-API] Erro ao buscar grupos via /chats:', err);
      }
    }

    if (!groupJid) {
      console.warn('[Z-API] Grupo "CHAMADOS CLEAN TECH" não foi encontrado em /groups nem em /chats.');
      return;
    }

    // 2. Format notification text message
    let actionLabel = '🆕 NOVO CHAMADO ABERTO';
    if (actionType === 'update') actionLabel = '⚠️ CHAMADO ATUALIZADO';
    if (actionType === 'close') actionLabel = '✅ CHAMADO FINALIZADO';

    const cleanAddress = ticket.address || 'Não informado';
    const serviceTypeLabel = getServiceTypeLabel(ticket.service_type);
    const dateFormatted = new Date().toLocaleString('pt-BR');

    const message = `*${actionLabel}* 🛠️
*Data/Hora:* ${dateFormatted}
*Chamado ID:* #${ticket.id}
*Cliente:* ${clientName || 'Não cadastrado'}
*Tipo de Serviço:* ${serviceTypeLabel}
*Endereço:* ${cleanAddress}
*Técnico Responsável:* ${technicianName || 'Não atribuído'}
*Status:* ${ticket.status || 'Pendente'}
*Prioridade:* ${ticket.priority || 'Normal'}
*Descrição / Defeito:* ${ticket.description || 'Nenhum detalhe informado'}

_Mensagem automática gerada pelo sistema Clean Tech Smart._`;

    // 3. Send text message
    const sendRes = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
      method: 'POST',
      headers: zapiHeaders,
      body: JSON.stringify({
        phone: groupJid,
        message: message
      })
    });

    if (!sendRes.ok) {
      console.error('[Z-API] Falha ao enviar mensagem para o grupo:', await sendRes.text());
    } else {
      console.log('[Z-API] Notificação de chamado enviada com sucesso para o grupo.');
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
      console.warn('[SMTP] Credenciais SMTP ou E-mail do destinatário não configurados. E-mail não enviado.');
      return;
    }

    let actionLabel = 'Novo Chamado Aberto';
    if (actionType === 'update') actionLabel = 'Chamado Atualizado';
    if (actionType === 'close') actionLabel = 'Chamado Finalizado';

    const serviceTypeLabel = getServiceTypeLabel(ticket.service_type);
    const dateFormatted = new Date().toLocaleString('pt-BR');

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
                  ${ticket.status || 'Pendente'}
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
          Este é um e-mail automático gerado pelo sistema Clean Tech Smart.<br/>
          Por favor, não responda a este e-mail.
        </div>
      </div>
    `;

    console.log(`[SMTP] Enviando e-mail de notificação para ${recipientEmail}...`);
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: {
        user,
        pass
      }
    });

    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: recipientEmail,
      subject: `[Clean Tech Smart] ${actionLabel} - Chamado #${ticket.id}`,
      html: htmlContent
    });

    console.log('[SMTP] Notificação de e-mail enviada com sucesso.');
  } catch (error) {
    console.error('[SMTP] Erro ao enviar e-mail de notificação:', error);
  }
}

function getServiceTypeLabel(type) {
  switch (String(type).toLowerCase()) {
    case 'corretiva':
      return '🔧 Manutenção Corretiva';
    case 'preventiva':
      return '📅 Manutenção Preventiva';
    case 'instalacao':
      return '🛠️ Instalação';
    default:
      return '📋 Serviço Geral';
  }
}
