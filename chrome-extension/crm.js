// crm.js

let crmServerUrl = '';
let crmToken = '';
let crmUser = null;

let funnelStages = [];
let leadsList = [];
let whatsAppChats = [];
let sellersList = [];

let currentFilterSeller = 'all';
let currentGroupBy = 'stages'; // 'stages' or 'labels'

const DEFAULT_STAGES = [
  { key: 'inbox', title: 'Inbox', color: 'border-top: 3px solid #64748b;' },
  { key: 'lead', title: 'Lead de Serviço', color: 'border-top: 3px solid #3b82f6;' },
  { key: 'tratar', title: 'Tratar', color: 'border-top: 3px solid #eab308;' },
  { key: 'atendimento', title: 'Atendimento', color: 'border-top: 3px solid #06b6d4;' },
  { key: 'programado', title: 'Programado', color: 'border-top: 3px solid #a855f7;' },
  { key: 'a_faturar', title: 'A Faturar', color: 'border-top: 3px solid #f97316;' },
  { key: 'faturado', title: 'Fatura Enviada', color: 'border-top: 3px solid #10b981;' },
  { key: 'perdido', title: 'Perdido', color: 'border-top: 3px solid #ef4444;' }
];

const WHATSAPP_LABELS = [
  { key: 'sem_etiqueta', title: 'Sem Etiqueta', color: 'border-top: 3px solid #64748b;' },
  { key: 'novo_cliente', title: 'Novo Cliente', color: 'border-top: 3px solid #3b82f6;' },
  { key: 'novo_pedido', title: 'Novo Pedido', color: 'border-top: 3px solid #eab308;' },
  { key: 'aguardando_pagamento', title: 'Aguardando Pagamento', color: 'border-top: 3px solid #f97316;' },
  { key: 'pago', title: 'Pago', color: 'border-top: 3px solid #10b981;' },
  { key: 'pedido_finalizado', title: 'Pedido Finalizado', color: 'border-top: 3px solid #a855f7;' }
];

// Load Session
chrome.storage.local.get(['crm_token', 'crm_user', 'crm_server_url', 'crm_stages'], (res) => {
  crmServerUrl = res.crm_server_url || 'https://clean-tech-smart.vercel.app';
  crmToken = res.crm_token || '';
  crmUser = res.crm_user || null;
  funnelStages = res.crm_stages && res.crm_stages.length > 0 ? res.crm_stages : [...DEFAULT_STAGES];

  if (!crmToken) {
    alert('Sessão expirada ou não autenticada no CRM. Por favor, faça login pela extensão no WhatsApp.');
    window.close();
    return;
  }

  initApp();
});

function initApp() {
  // Bind left sidebar navigation
  document.getElementById('btn-back-to-whatsapp').addEventListener('click', () => {
    chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, { active: true });
      } else {
        window.open('https://web.whatsapp.com', '_blank');
      }
    });
  });

  document.getElementById('btn-open-panel').addEventListener('click', () => {
    window.open(`${crmServerUrl}/crm`, '_blank');
  });

  // Bind Top bar filter events
  document.getElementById('btn-refresh-board').addEventListener('click', loadBoardData);
  document.getElementById('btn-add-stage').addEventListener('click', openAddStageModal);

  document.getElementById('kanban-group-by').addEventListener('change', (e) => {
    currentGroupBy = e.target.value;
    renderBoard();
  });

  const sellerSelect = document.getElementById('kanban-seller-filter');
  sellerSelect.addEventListener('change', (e) => {
    currentFilterSeller = e.target.value;
    loadBoardData();
  });

  // Initial load
  fetchSellersList();
  loadBoardData();

  // Fast interval to refresh chat lists in background
  setInterval(loadWhatsAppChatsList, 10000);
}

// Fetch active chat contacts from WhatsApp Web DOM
async function loadWhatsAppChatsList() {
  return new Promise((resolve) => {
    chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getWhatsAppChats" }, (res) => {
          if (res && res.chats) {
            whatsAppChats = res.chats;
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

async function fetchSellersList() {
  try {
    const res = await fetch(`${crmServerUrl}/api/crm/sellers`, {
      headers: { 'Authorization': `Bearer ${crmToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      sellersList = data.sellers || [];
      
      const select = document.getElementById('kanban-seller-filter');
      const selectWrapper = document.getElementById('seller-filter-wrapper');
      
      if (crmUser && crmUser.role === 'gestor') {
        selectWrapper.style.display = 'flex';
        select.innerHTML = '<option value="all">Todos os Vendedores</option>';
        sellersList.forEach(s => {
          select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });
      }
    }
  } catch (err) {
    console.error('Erro ao buscar lista de vendedores:', err);
  }
}

async function loadBoardData() {
  const container = document.getElementById('kanban-columns-wrapper');
  container.innerHTML = '<div class="loading-state">Atualizando quadro Kanban...</div>';

  try {
    // 1. Get WhatsApp Active Chats from Dom
    await loadWhatsAppChatsList();

    // 2. Get Lead List from CRM server
    const url = currentFilterSeller !== 'all' 
      ? `${crmServerUrl}/api/crm/leads?assigned_to=${currentFilterSeller}`
      : `${crmServerUrl}/api/crm/leads`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${crmToken}` }
    });

    if (res.ok) {
      const data = await res.json();
      leadsList = data.leads || [];
      renderBoard();
    } else {
      container.innerHTML = '<div class="loading-state" style="color: #dc2626;">Erro ao obter leads do servidor.</div>';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="loading-state" style="color: #dc2626;">Falha na conexão com o servidor.</div>';
  }
}

function renderBoard() {
  const container = document.getElementById('kanban-columns-wrapper');
  container.innerHTML = '';

  const isStagesGrouping = currentGroupBy === 'stages';
  const activeStages = isStagesGrouping ? funnelStages : WHATSAPP_LABELS;

  // ---------------- Render First Column: "Conversas WhatsApp" ----------------
  if (isStagesGrouping) {
    // Filter chats that are NOT yet in leadsList (CRM leads)
    const trackedPhones = leadsList.map(l => l.phone);
    const untrackedChats = whatsAppChats.filter(c => !trackedPhones.includes(c.phone));

    const backlogCol = document.createElement('div');
    backlogCol.className = 'kanban-column';
    backlogCol.setAttribute('data-stage', 'backlog');
    
    backlogCol.innerHTML = `
      <div class="kanban-column-header" style="border-top: 3px solid #94a3b8;">
        <div class="kanban-column-top">
          <span class="kanban-column-title">Conversas WhatsApp</span>
          <span class="kanban-column-count">${untrackedChats.length}</span>
        </div>
        <div class="kanban-column-sum">Sem funil</div>
      </div>
      <div class="kanban-cards-container">
        ${untrackedChats.length === 0 ? '<div class="kanban-empty-state">Nenhum chat novo</div>' : ''}
      </div>
    `;

    container.appendChild(backlogCol);

    const cardsContainer = backlogCol.querySelector('.kanban-cards-container');
    untrackedChats.forEach(chat => {
      const initials = getInitialsName(chat.name);
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.draggable = true;
      card.setAttribute('data-phone', chat.phone);
      
      card.innerHTML = `
        <div class="kanban-card-top">
          <div class="kanban-card-avatar-wrapper">
            <div class="kanban-card-avatar">${initials}</div>
            <div>
              <div class="kanban-card-name" title="${chat.name}">${chat.name}</div>
              <div class="kanban-card-phone">${chat.phone}</div>
            </div>
          </div>
          <div class="kanban-card-value">R$ 0,00</div>
        </div>
        
        <div class="kanban-card-bottom">
          <span class="kanban-card-seller">Não rastreado</span>
          <div class="kanban-card-toolbar">
            <!-- 5 Standard tool icons -->
            <button class="kanban-card-icon-btn btn-action-note" title="Adicionar Nota" data-phone="${chat.phone}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/></svg>
            </button>
            <button class="kanban-card-icon-btn btn-action-reminder" title="Agendar Retorno" data-phone="${chat.phone}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><circle cx="17" cy="17" r="5"/><path d="M17 15v2l1 1"/></svg>
            </button>
            <button class="kanban-card-icon-btn btn-action-chat" title="Abrir Conversa" data-phone="${chat.phone}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button class="kanban-card-icon-btn btn-action-value" title="Atualizar Valor" data-phone="${chat.phone}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M10 15h4"/></svg>
            </button>
            <button class="kanban-card-icon-btn btn-action-move" title="Definir Etapa / Etiqueta" data-phone="${chat.phone}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 4h9l5.5 8-5.5 8H5l5.5-8L5 4z"/></svg>
            </button>
          </div>
        </div>
      `;

      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', chat.phone);
        e.dataTransfer.setData('text/source', 'backlog');
        e.dataTransfer.setData('text/name', chat.name);
      });

      card.querySelector('.btn-action-note').addEventListener('click', (e) => {
        e.stopPropagation();
        openNoteModal({ phone: chat.phone, name: chat.name });
      });
      card.querySelector('.btn-action-reminder').addEventListener('click', (e) => {
        e.stopPropagation();
        openReminderModal({ phone: chat.phone, name: chat.name });
      });
      card.querySelector('.btn-action-chat').addEventListener('click', (e) => {
        e.stopPropagation();
        openChatOverlay({ phone: chat.phone, name: chat.name });
      });
      card.querySelector('.btn-action-value').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditValueModal({ phone: chat.phone, name: chat.name, value: 0 });
      });
      card.querySelector('.btn-action-move').addEventListener('click', (e) => {
        e.stopPropagation();
        openMoveModal({ phone: chat.phone, name: chat.name });
      });

      card.addEventListener('click', (e) => {
        if (e.target.closest('.kanban-card-icon-btn')) return;
        openChatOverlay({ phone: chat.phone, name: chat.name });
      });

      cardsContainer.appendChild(card);
    });
  }

  // ---------------- Render Stages Columns ----------------
  activeStages.forEach((st, colIndex) => {
    const stageLeads = leadsList.filter(l => {
      if (isStagesGrouping) {
        return l.stage === st.key;
      } else {
        const leadLabel = l.label || 'sem_etiqueta';
        return leadLabel === st.key;
      }
    });

    const stageValSum = stageLeads.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0);

    const colDiv = document.createElement('div');
    colDiv.className = 'kanban-column';
    colDiv.setAttribute('data-stage', st.key);
    
    colDiv.innerHTML = `
      <div class="kanban-column-header" style="${st.color}; cursor: grab;" draggable="true" data-index="${colIndex}">
        <div class="kanban-column-top">
          <span class="kanban-column-title">${st.title}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="kanban-column-count">${stageLeads.length}</span>
            
            <!-- Column options menu (Rename / Delete) - Only active in Stages Grouping -->
            ${isStagesGrouping ? `
              <button class="kanban-column-options-btn" data-key="${st.key}" data-title="${st.title}" title="Opções da Etapa">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
              </button>
            ` : ''}
          </div>
        </div>
        <div class="kanban-column-sum">R$ ${stageValSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div class="kanban-cards-container">
        ${stageLeads.length === 0 ? '<div class="kanban-empty-state">Sem contatos</div>' : ''}
      </div>
    `;

    container.appendChild(colDiv);

    // Bind Column Header Menu click
    if (isStagesGrouping) {
      const optionsBtn = colDiv.querySelector('.kanban-column-options-btn');
      if (optionsBtn) {
        optionsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openStageOptionsMenu(st);
        });
      }
    }

    // Column drag sideways reordering (only for stages mode)
    if (isStagesGrouping) {
      const colHeader = colDiv.querySelector('.kanban-column-header');
      colHeader.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/column-index', colIndex);
      });
      colHeader.addEventListener('dragover', (e) => { e.preventDefault(); });
      colHeader.addEventListener('drop', (e) => {
        e.preventDefault();
        const sourceIdxStr = e.dataTransfer.getData('text/column-index');
        if (sourceIdxStr !== '') {
          const sourceIndex = parseInt(sourceIdxStr, 10);
          if (sourceIndex !== colIndex) {
            const [moved] = funnelStages.splice(sourceIndex, 1);
            funnelStages.splice(colIndex, 0, moved);
            chrome.storage.local.set({ crm_stages: funnelStages }, () => {
              renderBoard();
            });
          }
        }
      });
    }

    // Render cards inside column container
    const cardsContainer = colDiv.querySelector('.kanban-cards-container');
    stageLeads.forEach(lead => {
      const initials = getInitialsName(lead.name);
      const val = parseFloat(lead.value) || 0;
      const formattedVal = val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      let reminderBadge = '';
      if (lead.next_contact_at) {
        const dateStr = new Date(lead.next_contact_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        reminderBadge = `
          <div class="kanban-card-reminder">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            <span>${dateStr}</span>
          </div>
        `;
      }

      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.draggable = true;
      card.setAttribute('data-phone', lead.phone);
      
      card.innerHTML = `
        <div class="kanban-card-top">
          <div class="kanban-card-avatar-wrapper">
            <div class="kanban-card-avatar">${initials}</div>
            <div>
              <div class="kanban-card-name" title="${lead.name || lead.phone}">${lead.name || lead.phone}</div>
              <div class="kanban-card-phone">${lead.phone}</div>
            </div>
          </div>
          <div class="kanban-card-value">R$ ${formattedVal}</div>
        </div>
        
        ${reminderBadge}

        <div class="kanban-card-bottom">
          <span class="kanban-card-seller">${lead.assigned_to_name ? lead.assigned_to_name.split(' ')[0] : 'Sem vendedor'}</span>
          <div class="kanban-card-toolbar">
            <!-- 5 Standard tool icons -->
            <button class="kanban-card-icon-btn btn-action-note" title="Adicionar Nota" data-phone="${lead.phone}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/></svg>
            </button>
            <button class="kanban-card-icon-btn btn-action-reminder" title="Agendar Retorno" data-phone="${lead.phone}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><circle cx="17" cy="17" r="5"/><path d="M17 15v2l1 1"/></svg>
            </button>
            <button class="kanban-card-icon-btn btn-action-chat" title="Abrir Conversa" data-phone="${lead.phone}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button class="kanban-card-icon-btn btn-action-value" title="Atualizar Valor" data-phone="${lead.phone}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M10 15h4"/></svg>
            </button>
            <button class="kanban-card-icon-btn btn-action-move" title="Definir Etapa / Etiqueta" data-phone="${lead.phone}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 4h9l5.5 8-5.5 8H5l5.5-8L5 4z"/></svg>
            </button>
          </div>
        </div>
      `;

      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', lead.phone);
        e.dataTransfer.setData('text/source', st.key);
        e.dataTransfer.setData('text/name', lead.name);
      });

      card.querySelector('.btn-action-note').addEventListener('click', (e) => {
        e.stopPropagation();
        openNoteModal(lead);
      });
      card.querySelector('.btn-action-reminder').addEventListener('click', (e) => {
        e.stopPropagation();
        openReminderModal(lead);
      });
      card.querySelector('.btn-action-chat').addEventListener('click', (e) => {
        e.stopPropagation();
        openChatOverlay(lead);
      });
      card.querySelector('.btn-action-value').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditValueModal(lead);
      });
      card.querySelector('.btn-action-move').addEventListener('click', (e) => {
        e.stopPropagation();
        openMoveModal(lead);
      });

      card.addEventListener('click', (e) => {
        if (e.target.closest('.kanban-card-icon-btn')) return;
        openChatOverlay(lead);
      });

      cardsContainer.appendChild(card);
    });

    // Column card drop listeners
    colDiv.addEventListener('dragover', (e) => { e.preventDefault(); });
    colDiv.addEventListener('drop', async (e) => {
      e.preventDefault();
      const phone = e.dataTransfer.getData('text/plain');
      const source = e.dataTransfer.getData('text/source');
      const name = e.dataTransfer.getData('text/name');
      
      if (phone && source !== st.key) {
        if (isStagesGrouping) {
          await updateLeadStage(phone, st.key, name);
        } else {
          await updateLeadLabel(phone, st.key);
        }
      }
    });
  });
}

function getInitialsName(name) {
  if (!name) return 'LD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function updateLeadStage(phone, stage, name) {
  try {
    const res = await fetch(`${crmServerUrl}/api/crm/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${crmToken}`
      },
      body: JSON.stringify({ phone, stage, name })
    });
    if (res.ok) {
      loadBoardData();
    }
  } catch (err) {
    console.error(err);
  }
}

async function updateLeadLabel(phone, label) {
  try {
    const res = await fetch(`${crmServerUrl}/api/crm/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${crmToken}`
      },
      body: JSON.stringify({ phone, label })
    });
    if (res.ok) {
      loadBoardData();
    }
  } catch (err) {
    console.error(err);
  }
}

// Communicating with WhatsApp Web active page
async function sendToWhatsAppTab(message) {
  return new Promise((resolve) => {
    chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, message, (res) => {
          resolve(res);
        });
      } else {
        resolve(null);
      }
    });
  });
}

// ---------------- INLINE CHAT MODAL OVERLAY ----------------
function openChatOverlay(lead) {
  const container = document.getElementById('crm-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay" id="chat-overlay-wrapper">
      <div class="modal-box" style="max-width: 650px; height: 80vh; display: flex; flex-direction: column; padding: 0; gap: 0; overflow: hidden; border-radius: 20px;">
        <!-- Modal Header -->
        <div class="modal-header" style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background-color: #ffffff; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="kanban-card-avatar" style="width: 32px; height: 32px; font-size: 12px;">${getInitialsName(lead.name)}</div>
            <div style="text-align: left;">
              <h4 class="modal-title" style="font-size: 14px; font-weight: 800; color: #1e293b; margin: 0;">${lead.name || lead.phone}</h4>
              <span style="font-size: 10px; color: #64748b; font-family: monospace;">${lead.phone}</span>
            </div>
          </div>
          <button class="modal-close-btn" id="btn-close-chat-modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        
        <!-- Messages Container -->
        <div id="chat-modal-messages" style="flex: 1; overflow-y: auto; padding: 20px; background-color: #f1f5f9; display: flex; flex-direction: column; gap: 12px; box-sizing: border-box;">
          <div style="margin: auto; color: #64748b; font-size: 12px; font-style: italic;">Carregando histórico de conversas...</div>
        </div>
        
        <!-- Message Input Footer -->
        <div style="padding: 14px 20px; border-top: 1px solid #e2e8f0; background-color: #ffffff; display: flex; gap: 10px; align-items: center; flex-shrink: 0; box-sizing: border-box; width: 100%;">
          <input type="text" id="chat-modal-input" placeholder="Digite uma mensagem..." style="flex: 1; padding: 10px 16px; border: 1px solid #cbd5e1; border-radius: 20px; font-size: 13px; box-sizing: border-box; outline: none; background-color: #f8fafc;" autocomplete="off">
          <button id="chat-modal-send-btn" style="border: none; background-color: #2563eb; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background-color 0.2s; flex-shrink: 0; box-shadow: 0 2px 6px rgba(37,99,235,0.2);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transform: rotate(45deg); margin-left: -2px; margin-top: 2px;"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => {
    clearInterval(chatSyncInterval);
    container.innerHTML = '';
  };

  document.getElementById('btn-close-chat-modal').addEventListener('click', closeModal);
  
  const inputField = document.getElementById('chat-modal-input');
  const sendBtn = document.getElementById('chat-modal-send-btn');
  
  const sendMessage = async () => {
    const text = inputField.value.trim();
    if (!text) return;
    await sendToWhatsAppTab({ action: "sendMessage", text: text });
    inputField.value = '';
    setTimeout(syncChatMessages, 200);
  };

  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  sendBtn.addEventListener('click', sendMessage);

  let lastMsgCount = 0;
  const syncChatMessages = async () => {
    const res = await sendToWhatsAppTab({ action: "getMessages" });
    const msgContainer = document.getElementById('chat-modal-messages');
    if (!msgContainer) return;

    if (!res || !res.messages || res.messages.length === 0) {
      msgContainer.innerHTML = '<div style="margin: auto; color: #64748b; font-size: 12px; font-style: italic;">Carregando histórico do WhatsApp...</div>';
      return;
    }

    msgContainer.innerHTML = res.messages.map(msg => {
      const bg = msg.isIncoming ? '#ffffff' : '#e2f7cb';
      const align = msg.isIncoming ? 'flex-start' : 'flex-end';
      const color = '#1e293b';
      const borderRadius = msg.isIncoming ? '0 12px 12px 12px' : '12px 0 12px 12px';
      
      return `
        <div style="align-self: ${align}; max-width: 80%; background-color: ${bg}; color: ${color}; padding: 8px 14px; border-radius: ${borderRadius}; font-size: 13px; line-height: 1.45; box-shadow: 0 1px 2px rgba(0,0,0,0.05); word-break: break-word; text-align: left;">
          ${msg.text}
        </div>
      `;
    }).join('');

    if (res.messages.length !== lastMsgCount) {
      lastMsgCount = res.messages.length;
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }
  };

  // Open Chat in background tab
  sendToWhatsAppTab({ action: "openChat", phone: lead.phone });

  // Polling sync
  const chatSyncInterval = setInterval(syncChatMessages, 1000);
  setTimeout(syncChatMessages, 500);
}

// ---------------- DIALOG MODALS ----------------
function openStageOptionsMenu(stage) {
  const container = document.getElementById('crm-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-box" style="max-width: 320px;">
        <div class="modal-header">
          <h4 class="modal-title">Opções da Etapa</h4>
          <button class="modal-close-btn" id="btn-close-modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body" style="gap: 16px;">
          <button class="btn btn-secondary" id="btn-rename-stage-opt" style="width: 100%; justify-content: center; padding: 10px;">✏️ Renomear Etapa</button>
          <button class="btn" id="btn-delete-stage-opt" style="width: 100%; justify-content: center; padding: 10px; background-color: #ef4444; color: white;">🗑️ Excluir Etapa</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { container.innerHTML = ''; };

  document.getElementById('btn-close-modal').addEventListener('click', closeModal);

  document.getElementById('btn-rename-stage-opt').addEventListener('click', () => {
    closeModal();
    openRenameStageModal(stage);
  });

  document.getElementById('btn-delete-stage-opt').addEventListener('click', () => {
    if (confirm(`Tem certeza que deseja excluir a etapa "${stage.title}"? Todos os leads nela retornarão para a etapa inicial.`)) {
      closeModal();
      deleteStage(stage.key);
    }
  });
}

function openRenameStageModal(stage) {
  const container = document.getElementById('crm-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-box" style="max-width: 340px;">
        <div class="modal-header">
          <h4 class="modal-title">Renomear Etapa</h4>
          <button class="modal-close-btn" id="btn-close-modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Novo nome para a etapa *</label>
            <input type="text" id="modal-rename-title" value="${stage.title}" placeholder="Nome da etapa...">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-modal-cancel">Cancelar</button>
          <button class="btn btn-primary" id="btn-modal-save">Salvar</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { container.innerHTML = ''; };

  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);

  document.getElementById('btn-modal-save').addEventListener('click', () => {
    const newTitle = document.getElementById('modal-rename-title').value.trim();
    if (!newTitle) return;

    const target = funnelStages.find(st => st.key === stage.key);
    if (target) {
      target.title = newTitle;
      chrome.storage.local.set({ crm_stages: funnelStages }, () => {
        closeModal();
        renderBoard();
      });
    }
  });
}

function deleteStage(stageKey) {
  // Filter out from array
  funnelStages = funnelStages.filter(st => st.key !== stageKey);
  chrome.storage.local.set({ crm_stages: funnelStages }, () => {
    // Return leads to inbox stage on the server
    const stageLeads = leadsList.filter(l => l.stage === stageKey);
    const updates = stageLeads.map(lead => updateLeadStage(lead.phone, 'inbox', lead.name));
    Promise.all(updates).then(() => {
      loadBoardData();
    });
  });
}

function openAddStageModal() {
  const container = document.getElementById('crm-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-box" style="max-width: 340px;">
        <div class="modal-header">
          <h4 class="modal-title">Criar Etapa</h4>
          <button class="modal-close-btn" id="btn-close-modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nome da nova aba / etapa *</label>
            <input type="text" id="modal-stage-title" placeholder="Nome da etapa...">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-modal-cancel">Cancelar</button>
          <button class="btn btn-primary" id="btn-modal-save">Criar</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { container.innerHTML = ''; };

  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);

  document.getElementById('btn-modal-save').addEventListener('click', () => {
    const title = document.getElementById('modal-stage-title').value.trim();
    if (!title) return;
    const key = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
    
    const exists = funnelStages.some(st => st.key === key);
    if (exists) {
      alert('Esta etapa já existe.');
      return;
    }

    const newStage = {
      key,
      title,
      color: 'border-top: 3px solid #64748b;'
    };

    funnelStages.push(newStage);
    chrome.storage.local.set({ crm_stages: funnelStages }, () => {
      closeModal();
      renderBoard();
    });
  });
}

function openEditValueModal(lead) {
  const container = document.getElementById('crm-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-box" style="max-width: 340px;">
        <div class="modal-header">
          <h4 class="modal-title">Editar Valor do Negócio</h4>
          <button class="modal-close-btn" id="btn-close-modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
            <strong>Lead:</strong> ${lead.name || lead.phone}
          </div>
          <div class="form-group">
            <label>Valor do Negócio (R$)</label>
            <input type="number" step="0.01" id="modal-lead-value" value="${lead.value || 0}" placeholder="0,00">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-modal-cancel">Cancelar</button>
          <button class="btn btn-primary" id="btn-modal-save">Salvar</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { container.innerHTML = ''; };

  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);

  document.getElementById('btn-modal-save').addEventListener('click', async () => {
    const newValue = parseFloat(document.getElementById('modal-lead-value').value) || 0;
    const btn = document.getElementById('btn-modal-save');
    btn.disabled = true;
    btn.innerText = 'Salvando...';

    try {
      const res = await fetch(`${crmServerUrl}/api/crm/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${crmToken}`
        },
        body: JSON.stringify({
          phone: lead.phone,
          value: newValue,
          name: lead.name
        })
      });

      if (res.ok) {
        closeModal();
        loadBoardData();
      } else {
        alert('Erro ao atualizar valor.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao servidor.');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Salvar';
    }
  });
}

function openNoteModal(lead) {
  const container = document.getElementById('crm-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <h4 class="modal-title">Criar anotação</h4>
          <button class="modal-close-btn" id="btn-close-modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div style="font-size: 12px; color: #64748b;">
            <strong>Lead:</strong> ${lead.name || lead.phone}
          </div>
          <div class="form-group">
            <label>Insira uma anotação</label>
            <textarea id="modal-note-content" rows="4" placeholder="Insira sua nota..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-modal-cancel">Cancelar</button>
          <button class="btn btn-primary" id="btn-modal-save">Salvar</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { container.innerHTML = ''; };

  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);
  
  document.getElementById('btn-modal-save').addEventListener('click', async () => {
    const content = document.getElementById('modal-note-content').value.trim();
    if (!content) return;

    const btn = document.getElementById('btn-modal-save');
    btn.disabled = true;
    btn.innerText = 'Salvando...';

    try {
      const res = await fetch(`${crmServerUrl}/api/crm/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${crmToken}`
        },
        body: JSON.stringify({
          lead_phone: lead.phone,
          content
        })
      });

      if (res.ok) {
        closeModal();
        loadBoardData();
      } else {
        alert('Erro ao salvar anotação.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar.');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Salvar';
    }
  });
}

function openReminderModal(lead) {
  const container = document.getElementById('crm-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <h4 class="modal-title">Criar Agendamento</h4>
          <button class="modal-close-btn" id="btn-close-modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
            <strong>Lead:</strong> ${lead.name || lead.phone}
          </div>
          <div class="form-group">
            <label>Título (Opcional)</label>
            <input type="text" id="modal-task-title" placeholder="Ex: Retorno de orçamento">
          </div>
          <div class="form-group">
            <label>Mensagem / Observações</label>
            <textarea id="modal-task-desc" rows="2" placeholder="Insira os detalhes do lembrete..."></textarea>
          </div>
          <div style="display: flex; gap: 10px;">
            <div class="form-group" style="flex: 1; margin: 0;">
              <label>Data</label>
              <input type="date" id="modal-task-date">
            </div>
            <div class="form-group" style="flex: 1; margin: 0;">
              <label>Hora</label>
              <input type="time" id="modal-task-time">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-modal-cancel">Cancelar</button>
          <button class="btn btn-primary" id="btn-modal-save">Criar</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { container.innerHTML = ''; };

  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);
  
  document.getElementById('btn-modal-save').addEventListener('click', async () => {
    const title = document.getElementById('modal-task-title').value.trim() || 'Retorno de Contato';
    const message = document.getElementById('modal-task-desc').value.trim();
    const dateVal = document.getElementById('modal-task-date').value;
    const timeVal = document.getElementById('modal-task-time').value;

    if (!dateVal || !timeVal) {
      alert('Data e hora são obrigatórias.');
      return;
    }

    const combinedDateTime = `${dateVal}T${timeVal}`;
    const btn = document.getElementById('btn-modal-save');
    btn.disabled = true;
    btn.innerText = 'Criando...';

    try {
      const resContact = await fetch(`${crmServerUrl}/api/crm/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${crmToken}`
        },
        body: JSON.stringify({
          phone: lead.phone,
          next_contact_at: combinedDateTime
        })
      });

      if (!resContact.ok) throw new Error('Erro ao salvar retorno no lead');

      const finalTitle = message ? `${title}: ${message}` : title;
      await fetch(`${crmServerUrl}/api/crm/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${crmToken}`
        },
        body: JSON.stringify({
          lead_phone: lead.phone,
          title: finalTitle,
          due_date: combinedDateTime
        })
      });

      closeModal();
      loadBoardData();
    } catch (err) {
      console.error(err);
      alert('Erro ao agendar lembrete.');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Criar';
    }
  });
}

function openMoveModal(lead) {
  const container = document.getElementById('crm-modal-container');
  if (!container) return;

  const isStagesGrouping = currentGroupBy === 'stages';
  const activeStages = isStagesGrouping ? funnelStages : WHATSAPP_LABELS;

  container.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-box" style="max-width: 320px;">
        <div class="modal-header">
          <h4 class="modal-title">Mover Etapa / Etiqueta</h4>
          <button class="modal-close-btn" id="btn-close-modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body" style="max-height: 380px; overflow-y: auto;">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
            <strong>Lead:</strong> ${lead.name || lead.phone}
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${activeStages.map(st => {
              const matchesCurrent = isStagesGrouping ? (lead.stage === st.key) : (lead.label === st.key);
              return `
                <button class="btn-stage-select" data-stage="${st.key}" style="padding: 10px; border-radius: 8px; border: 1px solid ${matchesCurrent ? '#2563eb' : '#e2e8f0'}; background-color: ${matchesCurrent ? '#eff6ff' : '#ffffff'}; color: ${matchesCurrent ? '#2563eb' : '#334155'}; font-size: 12px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
                  <span>${st.title}</span>
                  ${matchesCurrent ? '✓' : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { container.innerHTML = ''; };

  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  
  document.querySelectorAll('.btn-stage-select').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetStage = btn.getAttribute('data-stage');
      if (isStagesGrouping) {
        await updateLeadStage(lead.phone, targetStage, lead.name);
      } else {
        await updateLeadLabel(lead.phone, targetStage);
      }
      closeModal();
    });
  });
}
