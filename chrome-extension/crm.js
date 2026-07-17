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
  { key: 'inbox', title: 'Inbox', color: 'border-bottom: 3px solid #64748b;' },
  { key: 'lead', title: 'Lead de Serviço', color: 'border-bottom: 3px solid #0d9488;' },
  { key: 'tratar', title: 'Tratar', color: 'border-bottom: 3px solid #f97316;' },
  { key: 'atendimento', title: 'Atendimento', color: 'border-bottom: 3px solid #2563eb;' },
  { key: 'programado', title: 'Programado', color: 'border-bottom: 3px solid #8b5cf6;' },
  { key: 'a_faturar', title: 'A Faturar', color: 'border-bottom: 3px solid #db2777;' },
  { key: 'faturado', title: 'Fatura Enviada', color: 'border-bottom: 3px solid #10b981;' },
  { key: 'perdido', title: 'Perdido', color: 'border-bottom: 3px solid #ef4444;' }
];

const WHATSAPP_LABELS = [
  { key: 'sem_etiqueta', title: 'Sem Etiqueta', color: 'border-bottom: 3px solid #64748b;' },
  { key: 'novo_cliente', title: 'Novo Cliente', color: 'border-bottom: 3px solid #3b82f6;' },
  { key: 'novo_pedido', title: 'Novo Pedido', color: 'border-bottom: 3px solid #eab308;' },
  { key: 'aguardando_pagamento', title: 'Aguardando Pagamento', color: 'border-bottom: 3px solid #f97316;' },
  { key: 'pago', title: 'Pago', color: 'border-bottom: 3px solid #10b981;' },
  { key: 'pedido_finalizado', title: 'Pedido Finalizado', color: 'border-bottom: 3px solid #a855f7;' }
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
    chrome.tabs.query({ url: "*://web.whatsapp.com/*" }, (tabs) => {
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
  // Also refresh board automatically every 15s to show new WhatsApp conversations
  let lastChatsCount = 0;
  setInterval(async () => {
    await loadWhatsAppChatsList();
    // If new chats arrived, re-render the board to show them in INBOX
    if (whatsAppChats.length !== lastChatsCount) {
      lastChatsCount = whatsAppChats.length;
      renderBoard();
    }
  }, 10000);

  // Full board refresh every 30s (includes server leads)
  setInterval(loadBoardData, 30000);

  // Debug listener to show DOM statistics at the bottom of the Kanban board
  setInterval(() => {
    chrome.storage.local.get(['crm_dom_debug', 'crm_whatsapp_chats'], (res) => {
      const debugPre = document.getElementById('debug-pre');
      if (debugPre) {
        const stats = {
          storage_chats_count: res.crm_whatsapp_chats ? res.crm_whatsapp_chats.length : 0,
          chats_sample: res.crm_whatsapp_chats ? res.crm_whatsapp_chats.slice(0, 3) : [],
          dom_debug: res.crm_dom_debug || "Sem dados coletados ainda"
        };
        debugPre.innerText = JSON.stringify(stats, null, 2);
      }
    });
  }, 1000);
}

// Fetch active chat contacts from WhatsApp Web DOM
async function loadWhatsAppChatsList() {
  return new Promise((resolve) => {
    // 1. Get from storage cache first (instant load)
    chrome.storage.local.get(['crm_whatsapp_chats'], (storageRes) => {
      if (storageRes && storageRes.crm_whatsapp_chats) {
        whatsAppChats = storageRes.crm_whatsapp_chats;
      }
      
      // 2. Query tab for live update
      chrome.tabs.query({ url: "*://web.whatsapp.com/*" }, (tabs) => {
        if (tabs && tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "getWhatsAppChats" }, (res) => {
            if (res && res.chats) {
              whatsAppChats = res.chats;
              chrome.storage.local.set({ crm_whatsapp_chats: res.chats });
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
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

function getColumnLeads(stageKey, isFirstColumn) {
  const isStagesGrouping = currentGroupBy === 'stages';
  if (isFirstColumn && isStagesGrouping) {
    // First stage displays both leads saved in 'inbox' AND active chats from whatsAppChats that are NOT saved in any other stage in CRM database.
    const trackedPhonesOtherStages = leadsList
      .filter(l => l.stage !== stageKey)
      .map(l => l.phone);

    const untrackedChats = whatsAppChats.filter(c => !trackedPhonesOtherStages.includes(c.phone));
    const list = [];
    
    // Add active chats
    untrackedChats.forEach(c => {
      const savedLead = leadsList.find(l => l.phone === c.phone && l.stage === stageKey);
      list.push({
        phone: c.phone,
        name: savedLead ? savedLead.name : c.name,
        stage: stageKey,
        value: savedLead ? savedLead.value : 0,
        next_contact_at: savedLead ? savedLead.next_contact_at : null,
        assigned_to_name: savedLead ? savedLead.assigned_to_name : null,
        lastMessage: c.lastMessage || 'Sem conversa',
        unreadCount: c.unreadCount || 0
      });
    });

    // Add saved leads in 'inbox' that are NOT matching the whatsAppChats list (so we don't duplicate!)
    const activeChatPhones = untrackedChats.map(c => c.phone);
    const savedInboxOnly = leadsList.filter(l => l.stage === stageKey && !activeChatPhones.includes(l.phone));
    savedInboxOnly.forEach(l => {
      list.push({
        ...l,
        lastMessage: 'Sem conversa ativa',
        unreadCount: 0
      });
    });

    return list;
  } else {
    // Return leads in this stage/label
    return leadsList.filter(l => {
      if (isStagesGrouping) {
        return l.stage === stageKey;
      } else {
        const leadLabel = l.label || 'sem_etiqueta';
        return leadLabel === stageKey;
      }
    }).map(l => {
      const liveChat = whatsAppChats.find(c => c.phone === l.phone);
      return {
        ...l,
        lastMessage: liveChat ? liveChat.lastMessage : 'Sem conversa ativa',
        unreadCount: liveChat ? liveChat.unreadCount : 0
      };
    });
  }
}

function renderBoard() {
  const container = document.getElementById('kanban-columns-wrapper');
  container.innerHTML = '';

  const isStagesGrouping = currentGroupBy === 'stages';
  const activeStages = isStagesGrouping ? funnelStages : WHATSAPP_LABELS;

  activeStages.forEach((st, colIndex) => {
    const isFirstColumn = colIndex === 0;
    const stageLeads = getColumnLeads(st.key, isFirstColumn);
    const stageValSum = stageLeads.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0);

    const colDiv = document.createElement('div');
    colDiv.className = 'kanban-column';
    colDiv.setAttribute('data-stage', st.key);
    
    colDiv.innerHTML = `
      <div class="kanban-column-header" style="${st.color}">
        <div class="kanban-column-top">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="kanban-column-title">${st.title}</span>
            <span class="kanban-column-count">${stageLeads.length}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button class="kanban-column-options-btn" title="Buscar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            ${isStagesGrouping ? `
              <button class="kanban-column-options-btn btn-col-menu" data-key="${st.key}" data-title="${st.title}" title="Opções da Etapa">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5"><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
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
      const optionsBtn = colDiv.querySelector('.btn-col-menu');
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

      // Profile photo: use WhatsApp photo if available, otherwise initials
      const chatData = whatsAppChats.find(c => c.phone === lead.phone);
      const photoUrl = (chatData && chatData.photo) ? chatData.photo : '';
      const avatarHtml = photoUrl
        ? `<img src="${photoUrl}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="kanban-card-avatar" style="display:none;">${initials}</div>`
        : `<div class="kanban-card-avatar">${initials}</div>`;
      
      card.innerHTML = `
        <div class="kanban-card-top">
          <div class="kanban-card-avatar-wrapper">
            ${avatarHtml}
            <div style="overflow: hidden; flex: 1;">
              <div class="kanban-card-name" title="${lead.name || lead.phone}">${lead.name || lead.phone}</div>
              <div class="kanban-card-message-preview">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5" style="margin-right: 4px; flex-shrink: 0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span title="${lead.lastMessage}">${lead.lastMessage}</span>
              </div>
            </div>
          </div>
          <div class="kanban-card-value">R$ ${formattedVal}</div>
        </div>
        
        ${reminderBadge}

        <div class="kanban-card-bottom">
          <div class="kanban-card-toolbar">
            <!-- 5 Standard tool icons -->
            <button class="kanban-card-icon-btn btn-action-note" title="Adicionar Nota" data-phone="${lead.phone}">
              <svg class="icon-note" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
            </button>
            <button class="kanban-card-icon-btn btn-action-reminder" title="Agendar Retorno" data-phone="${lead.phone}">
              <svg class="icon-reminder" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" x2="16" y1="2" x2="16" y2="6"/><line x1="8" x2="8" y1="2" x2="8" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><circle cx="16" cy="16" r="4"/><polyline points="16 14 16 16 17 17"/></svg>
            </button>
            <button class="kanban-card-icon-btn btn-action-chat" title="Abrir Conversa" data-phone="${lead.phone}" style="position: relative;">
              <svg class="icon-chat" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              ${lead.unreadCount > 0 ? `<div class="kanban-card-unread-badge-icon">${lead.unreadCount}</div>` : ''}
            </button>
            <button class="kanban-card-icon-btn btn-action-value" title="Atualizar Valor" data-phone="${lead.phone}">
              <svg class="icon-value" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M10 15h4"/></svg>
            </button>
            <button class="kanban-card-icon-btn btn-action-move" title="Definir Etapa / Etiqueta" data-phone="${lead.phone}">
              <svg class="icon-move" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h12l4 6-4 6H4l4-6-4-6z"/></svg>
            </button>
            
            <!-- Quick delete button on far right -->
            <button class="kanban-card-icon-btn btn-action-delete" title="Excluir Lead" data-phone="${lead.phone}" style="margin-left: auto;">
              <svg class="icon-delete" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
      card.querySelector('.btn-action-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Tem certeza que deseja excluir o lead "${lead.name || lead.phone}"?`)) {
          deleteLeadFromServer(lead.phone);
        }
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

async function deleteLeadFromServer(phone) {
  try {
    const res = await fetch(`${crmServerUrl}/api/crm/contact?phone=${phone}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${crmToken}`
      }
    });
    if (res.ok) {
      loadBoardData();
    } else {
      alert('Erro ao excluir lead do servidor.');
    }
  } catch (err) {
    console.error(err);
    alert('Erro de conexão ao servidor.');
  }
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
    chrome.tabs.query({ url: "*://web.whatsapp.com/*" }, (tabs) => {
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

// ---------------- INLINE CHAT MODAL OVERLAY (WaSeller layout match) ----------------
function openChatOverlay(lead) {
  const container = document.getElementById('crm-modal-container');
  if (!container) return;

  const liveChat = whatsAppChats.find(c => c.phone === lead.phone);
  const unreadCount = liveChat ? liveChat.unreadCount : 0;

  container.innerHTML = `
    <div class="modal-overlay" id="chat-overlay-wrapper">
      <div class="modal-box crm-whatsapp-chat-box">
        <!-- WhatsApp Header -->
        <div class="crm-chat-header">
          <div class="crm-chat-header-left">
            <div class="kanban-card-avatar" style="width: 40px; height: 40px; font-size: 14px;">${getInitialsName(lead.name)}</div>
            <div style="text-align: left;">
              <h4 class="crm-chat-header-title">${lead.name || lead.phone}</h4>
              <span class="crm-chat-header-phone">${lead.phone && !lead.phone.startsWith('name_') ? lead.phone : ''}</span>
            </div>
          </div>
          
          <div class="crm-chat-header-right">
            ${unreadCount > 0 ? `<div class="kanban-card-unread-badge" style="position: static; margin-right: 12px;">${unreadCount}</div>` : ''}
            <button class="crm-chat-header-options" title="Mais Opções">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
            </button>
            <button class="crm-chat-header-close-btn" id="btn-close-chat-modal">Fechar</button>
          </div>
        </div>
        
        <!-- Messages Area (Cream Background) -->
        <div id="chat-modal-messages" class="crm-chat-messages-container">
          <div style="margin: auto; color: #8696a0; font-size: 13px; font-style: italic;">Carregando histórico do WhatsApp...</div>
        </div>
        
        <!-- WhatsApp Footer Input -->
        <div class="crm-chat-footer">
          <button class="crm-chat-footer-action-btn" title="Anexar Arquivo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <button class="crm-chat-footer-action-btn" title="Perfil do Cliente">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>
          <button class="crm-chat-footer-action-btn" title="Etiquetas / Tags">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          </button>
          
          <input type="text" id="chat-modal-input" placeholder="Digite uma mensagem" class="crm-chat-input-field" autocomplete="off">
          
          <button class="crm-chat-footer-action-btn" title="Emojis" style="margin-left: 8px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </button>
          
          <button id="chat-modal-send-btn" class="crm-chat-send-btn" title="Enviar Mensagem">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" style="transform: rotate(45deg); margin-left: -2px; margin-top: 1px;"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
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
    // Always read live from WhatsApp DOM - no cache to avoid stale messages from other conversations
    const res = await sendToWhatsAppTab({ action: "getMessages" });
    const msgContainer = document.getElementById('chat-modal-messages');
    if (!msgContainer) return;

    let messages = [];
    if (res && res.messages && res.messages.length > 0) {
      messages = res.messages;
    }
    // Note: no storage fallback - if WhatsApp tab hasn't loaded the conversation yet,
    // we show "Carregando..." until it's ready. This prevents showing wrong conversations.

    if (messages.length === 0) {
      msgContainer.innerHTML = '<div style="margin: auto; color: #8696a0; font-size: 13px; font-style: italic;">Carregando histórico do WhatsApp...</div>';
      return;
    }

    msgContainer.innerHTML = messages.map(msg => {
      const bg = msg.isIncoming ? '#ffffff' : '#d9fdd3';
      const align = msg.isIncoming ? 'flex-start' : 'flex-end';
      const borderRadius = msg.isIncoming ? '0 12px 12px 12px' : '12px 0 12px 12px';
      
      return `
        <div style="align-self: ${align}; max-width: 65%; background-color: ${bg}; color: #111b21; padding: 8px 12px; border-radius: ${borderRadius}; font-size: 13.5px; line-height: 1.45; box-shadow: 0 1px 1px rgba(11,20,26,0.12); word-break: break-word; text-align: left; position: relative;">
          ${msg.text}
        </div>
      `;
    }).join('');

    if (messages.length !== lastMsgCount) {
      lastMsgCount = messages.length;
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }
  };

  // Open Chat in background tab and trigger storage bridge
  // First clear cached messages to avoid showing stale conversation
  chrome.storage.local.set({ crm_whatsapp_messages: [], crm_whatsapp_active_name: '' });
  chrome.storage.local.set({ crm_pending_open_chat: lead.phone });
  sendToWhatsAppTab({ action: "openChat", phone: lead.phone });

  // Polling sync - start after 3s to allow WhatsApp to fully load the conversation
  const chatSyncInterval = setInterval(syncChatMessages, 1200);
  setTimeout(syncChatMessages, 3000);
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
  funnelStages = funnelStages.filter(st => st.key !== stageKey);
  chrome.storage.local.set({ crm_stages: funnelStages }, () => {
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
      color: 'border-bottom: 3px solid #64748b;'
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
