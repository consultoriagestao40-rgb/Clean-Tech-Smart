import { Pool } from 'pg';

const defaultPool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper to fetch all configurations from database
async function getSystemSettings(dbClient) {
  let runner = defaultPool;
  if (dbClient && typeof dbClient.query === 'function') {
    try {
      // Verificar se o client não foi liberado
      runner = dbClient;
    } catch {
      runner = defaultPool;
    }
  }
  try {
    const result = await runner.query('SELECT key, value FROM system_settings');
    const settings = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }
    return settings;
  } catch (err) {
    if (runner !== defaultPool) {
      const result = await defaultPool.query('SELECT key, value FROM system_settings');
      const settings = {};
      for (const row of result.rows) {
        settings[row.key] = row.value;
      }
      return settings;
    }
    throw err;
  }
}

// WhatsApp Group notification for Ticket updates
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

// WhatsApp Group notification for Proposal / Budget Approvals
export async function sendProposalApprovalWhatsappGroupNotification(dbClient, data) {
  try {
    const {
      type, // 'locacao' | 'venda' | 'servico' | 'orcamento'
      id,
      clientName,
      itemDetails,
      value,
      approvedBy,
      feedback,
      status // 'Aprovada' | 'Fechada' | 'Aprovado' | 'Recusado' | 'Negociação'
    } = data;

    const settings = await getSystemSettings(dbClient);
    const instanceId = settings.app_zapi_instance_id;
    const token = settings.app_zapi_token;
    const clientToken = settings.app_zapi_client_token;

    if (!instanceId || !token) {
      console.warn('[Z-API] Instância ou Token não configurados.');
      return;
    }

    const zapiHeaders = { 'Content-Type': 'application/json' };
    if (clientToken) zapiHeaders['Client-Token'] = clientToken;

    const groupJid = settings.app_zapi_ticket_group_id || '120363419495845420-group';
    const dateFormatted = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const isApproved = ['Aprovada', 'Fechada', 'Aprovado'].includes(status);

    let typeTitle = 'PROPOSTA COMERCIAL';
    let icon = '📄';

    if (type === 'locacao') { typeTitle = 'PROPOSTA DE LOCAÇÃO'; icon = '📑'; }
    else if (type === 'venda') { typeTitle = 'PROPOSTA DE VENDA'; icon = '🛍️'; }
    else if (type === 'servico') { typeTitle = 'PROPOSTA DE SERVIÇOS RECORRENTES'; icon = '🛠️'; }
    else if (type === 'orcamento') { typeTitle = 'ORÇAMENTO DE ASSISTÊNCIA TÉCNICA'; icon = '⚙️'; }

    let message = '';

    if (isApproved) {
      message = `*🎉 ${typeTitle} APROVADA PELO CLIENTE!* ${icon}✍️
*Data/Hora:* ${dateFormatted}
*Código / ID:* #${String(id).padStart(4, '0')}
*Cliente:* ${clientName || 'Não informado'}
${itemDetails ? `*Item / Equipamento:* ${itemDetails}\n` : ''}${value ? `*Valor:* ${value}\n` : ''}*Aprovado por:* ${approvedBy || 'Cliente via aceite digital'}
${feedback ? `*Observações / Feedback:* ${feedback}\n` : ''}
_Mensagem automática gerada pelo sistema Clean Tech Smart._`;
    } else {
      message = `*⚠️ ${typeTitle} - RECUSADA / AJUSTE SOLICITADO* 🚨
*Data/Hora:* ${dateFormatted}
*Código / ID:* #${String(id).padStart(4, '0')}
*Cliente:* ${clientName || 'Não informado'}
*Status Atual:* ${status || 'Em Negociação'}
${feedback ? `*Motivo / Solicitação de Ajustes:* ${feedback}\n` : ''}
_Mensagem automática gerada pelo sistema Clean Tech Smart._`;
    }

    console.log(`[Z-API] Enviando notificação de aprovação de ${type} para o grupo ${groupJid}...`);
    const sendRes = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
      method: 'POST',
      headers: zapiHeaders,
      body: JSON.stringify({
        phone: groupJid,
        message: message
      })
    });

    if (!sendRes.ok) {
      console.error('[Z-API] Erro ao enviar notificação para o grupo:', await sendRes.text());
    } else {
      console.log(`[Z-API] Notificação de aprovação de ${type} enviada com sucesso para o WhatsApp!`);
    }
  } catch (error) {
    console.error('[Z-API] Erro ao processar notificação de aprovação:', error);
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

// WhatsApp notification for Billed Sales / Invoices (Financeiro)
export async function sendInvoiceBilledWhatsappNotification(dbClient, invoice, saleDetails = {}) {
  try {
    const settings = await getSystemSettings(dbClient);
    const instanceId = settings.app_zapi_instance_id;
    const token = settings.app_zapi_token;
    const clientToken = settings.app_zapi_client_token;

    if (!instanceId || !token) {
      console.warn('[Z-API] Instância ou Token não configurados. Notificação de venda faturada não enviada.');
      return { success: false, error: 'Instância ou Token Z-API não configurados' };
    }

    const enabled = settings.app_notification_invoice_billed_enabled !== 'false';
    if (!enabled) {
      console.log('[Z-API] Notificação de venda faturada desativada nas configurações.');
      return { success: false, skipped: true, reason: 'Desativada nas configurações' };
    }

    // Obter destinatários configurados para o Financeiro
    let rawRecipients = settings.app_notification_financial_recipients || settings.app_zapi_ticket_group_id || '';
    
    let recipients = [];
    try {
      if (rawRecipients.startsWith('[')) {
        recipients = JSON.parse(rawRecipients);
      } else {
        recipients = rawRecipients.split(/[,;\n]/).map(r => r.trim()).filter(Boolean);
      }
    } catch {
      recipients = rawRecipients.split(/[,;\n]/).map(r => r.trim()).filter(Boolean);
    }

    if (recipients.length === 0) {
      console.warn('[Z-API] Nenhum destinatário configurado para receber notificações do financeiro.');
      return { success: false, error: 'Nenhum destinatário configurado' };
    }

    const zapiHeaders = { 'Content-Type': 'application/json' };
    if (clientToken) {
      zapiHeaders['Client-Token'] = clientToken;
    }

    // Buscar dados complementares do cliente se necessário
    let clientName = invoice.client_name;
    let clientDoc = invoice.client_document;
    if ((!clientName || !clientDoc) && invoice.client_id) {
      try {
        const cRes = await dbClient.query('SELECT name, document FROM clients WHERE id::text = $1', [String(invoice.client_id)]);
        if (cRes.rows.length > 0) {
          clientName = clientName || cRes.rows[0].name;
          clientDoc = clientDoc || cRes.rows[0].document;
        }
      } catch (cErr) {}
    }

    const dateFormatted = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const formattedAmount = Number(invoice.amount || saleDetails.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formattedDueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'A combinar';

    let typeLabel = 'Serviço / Manutenção';
    if (invoice.invoice_type === 'pecas' || (invoice.contract_code || '').includes('PECA')) {
      typeLabel = 'Venda de Peças / Produtos';
    } else if (invoice.invoice_type === 'locacao' || (invoice.contract_code || '').includes('LOC')) {
      typeLabel = 'Locação de Equipamento';
    }

    const saleNumber = saleDetails.number || saleDetails.numero || (invoice.conta_azul_sale_id && !invoice.conta_azul_sale_id.includes('-') ? invoice.conta_azul_sale_id : null);
    const nfNumber = saleDetails.nfe?.number || saleDetails.invoice_number || null;

    const message = `*🔔 NOVA VENDA FATURADA NO CONTA AZUL* 💰🧾
*Data/Hora:* ${dateFormatted}
*Código da Fatura:* ${invoice.contract_code || `#${invoice.id}`}
${saleNumber ? `*Venda Conta Azul:* #${saleNumber}\n` : ''}*Cliente:* ${clientName || 'Cliente não identificado'}
${clientDoc ? `*CPF/CNPJ:* ${clientDoc}\n` : ''}*Tipo:* ${typeLabel}
*Valor:* ${formattedAmount}
*Vencimento:* ${formattedDueDate}
${nfNumber ? `*Nota Fiscal:* Nº ${nfNumber}\n` : ''}*Status:* Faturada (Aguardando tratativas financeiras)

ℹ️ *Notificação automática para o Financeiro dar tratativas e acompanhar o faturamento/recebimento.*

_Mensagem automática gerada pelo sistema Clean Tech Smart._`;

    const sendResults = [];
    for (const rawRecipient of recipients) {
      let recipientPhone = String(rawRecipient).trim();
      if (!recipientPhone) continue;

      if (!recipientPhone.includes('-group') && !recipientPhone.includes('@')) {
        recipientPhone = recipientPhone.replace(/\D/g, '');
        if (recipientPhone.length === 10 || recipientPhone.length === 11) {
          recipientPhone = '55' + recipientPhone;
        }
      }

      console.log(`[Z-API] Enviando notificação de venda faturada para ${recipientPhone}...`);
      try {
        const sendRes = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
          method: 'POST',
          headers: zapiHeaders,
          body: JSON.stringify({
            phone: recipientPhone,
            message: message
          })
        });

        if (!sendRes.ok) {
          const errTxt = await sendRes.text();
          console.error(`[Z-API] Falha ao enviar para ${recipientPhone}:`, errTxt);
          sendResults.push({ recipient: recipientPhone, success: false, error: errTxt });
        } else {
          console.log(`[Z-API] Notificação de venda faturada enviada com sucesso para ${recipientPhone}!`);
          sendResults.push({ recipient: recipientPhone, success: true });
        }
      } catch (sendErr) {
        console.error(`[Z-API] Erro ao enviar para ${recipientPhone}:`, sendErr.message);
        sendResults.push({ recipient: recipientPhone, success: false, error: sendErr.message });
      }
    }

    return { success: true, results: sendResults };
  } catch (error) {
    console.error('[Z-API] Erro ao processar notificação de venda faturada:', error);
    return { success: false, error: error.message };
  }
}
