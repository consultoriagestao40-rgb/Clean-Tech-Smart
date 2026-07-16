// content.js

let crmServerUrl = '';
let crmToken = '';
let crmUser = null;

let currentPhone = '';
let currentName = '';
let leadData = null;
let sellersList = [];
let leadsList = [];
let selectedSeller = 'all';
let activeFilterStage = 'all';

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
let funnelStages = [...DEFAULT_STAGES];

let isKanbanViewActive = false;

// Shadow Root reference
let shadowRoot = null;
let sidebarElement = null;

// Modal States inside Extension
let activeNoteLead = null;
let activeReminderLead = null;
let activeMoveLead = null;

// Initialize Session from Storage
chrome.storage.local.get(['crm_token', 'crm_user', 'crm_server_url', 'crm_stages'], (res) => {
  crmServerUrl = res.crm_server_url || 'https://clean-tech-smart.vercel.app';
  crmToken = res.crm_token || '';
  crmUser = res.crm_user || null;
  if (res.crm_stages && res.crm_stages.length > 0) {
    funnelStages = res.crm_stages;
  }
  
  if (crmToken) {
    startChatObserver();
  } else {
    injectLoginReminder();
    // Open sidebar for login if token not present
    initSidebar();
  }
});

// Watch for storage changes (e.g. login/logout from popup)
chrome.storage.onChanged.addListener((changes) => {
  chrome.storage.local.get(['crm_token', 'crm_user', 'crm_server_url', 'crm_stages'], (res) => {
    crmServerUrl = res.crm_server_url || 'https://clean-tech-smart.vercel.app';
    crmToken = res.crm_token || '';
    crmUser = res.crm_user || null;
    if (res.crm_stages && res.crm_stages.length > 0) {
      funnelStages = res.crm_stages;
    }
    
    // Remove login reminder if logged in
    const reminder = document.getElementById('crm-login-reminder');
    if (crmToken && reminder) {
      reminder.remove();
    } else if (!crmToken && !reminder) {
      injectLoginReminder();
    }

    // Toggle kanban mode off on logout
    if (!crmToken && isKanbanViewActive) {
      toggleKanbanMode(false);
    }

    removeSidebar();
    if (!crmToken) {
      initSidebar();
    } else {
      startChatObserver();
    }
  });
});

function injectLoginReminder() {
  if (document.getElementById('crm-login-reminder')) return;
  
  const div = document.createElement('div');
  div.id = 'crm-login-reminder';
  div.style.position = 'fixed';
  div.style.bottom = '20px';
  div.style.right = '20px';
  div.style.backgroundColor = '#2563eb';
  div.style.color = 'white';
  div.style.padding = '12px 18px';
  div.style.borderRadius = '12px';
  div.style.boxShadow = '0 4px 12px rgba(37,99,235,0.2)';
  div.style.zIndex = '999999';
  div.style.fontFamily = 'sans-serif';
  div.style.fontSize = '12px';
  div.style.fontWeight = 'bold';
  div.style.cursor = 'pointer';
  div.style.transition = 'transform 0.2s';
  div.innerHTML = '🔑 Clean Tech CRM: Clique aqui para fazer login';
  
  div.addEventListener('click', () => {
    initSidebar();
  });

  document.body.appendChild(div);
}

function removeSidebar() {
  const container = document.getElementById('crm-sidebar-root');
  if (container) container.remove();
  
  const appElement = document.getElementById('app') || document.querySelector('.app-wrapper');
  if (appElement) {
    appElement.style.setProperty('width', 'calc(100% - 60px)', 'important');
  }
  
  shadowRoot = null;
  sidebarElement = null;
}

// initSidebar is only used for Login Form or for Kanban view (not active sidebar details)
function initSidebar() {
  if (document.getElementById('crm-sidebar-root')) return;

  const rootContainer = document.createElement('div');
  rootContainer.id = 'crm-sidebar-root';
  rootContainer.style.position = 'fixed';
  rootContainer.style.right = '0';
  rootContainer.style.top = '0';
  rootContainer.style.width = isKanbanViewActive ? 'calc(100% - 460px)' : '350px';
  rootContainer.style.height = '100vh';
  rootContainer.style.zIndex = '99999';
  rootContainer.style.backgroundColor = '#ffffff';
  
  document.body.appendChild(rootContainer);

  // Attach Shadow DOM
  shadowRoot = rootContainer.attachShadow({ mode: 'open' });

  // Load stylesheet link
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('content.css');
  shadowRoot.appendChild(link);

  // Injected HTML template
  sidebarElement = document.createElement('div');
  sidebarElement.className = 'sidebar-container';

  if (!crmToken) {
    // Render Login Form in Sidebar
    sidebarElement.innerHTML = `
      <div class="sidebar-header">
        <h3 class="sidebar-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Clean Tech CRM
        </h3>
        <p class="sidebar-subtitle">Acesso ao CRM</p>
      </div>
      <div style="padding: 16px;">
        <div class="form-group">
          <label>Servidor do Painel</label>
          <input type="text" id="side-server-url" value="${crmServerUrl}">
        </div>
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" id="side-email" placeholder="vendedor@cleantech.com">
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input type="password" id="side-password" placeholder="••••••••">
        </div>
        <button id="btn-side-login" class="btn-primary">Entrar no CRM</button>
        <div id="side-login-error" style="color: #dc2626; font-size: 11px; margin-top: 8px; font-weight: bold; display: none;"></div>
      </div>
    `;
    shadowRoot.appendChild(sidebarElement);

    // Bind login form events
    shadowRoot.getElementById('btn-side-login').addEventListener('click', handleInlineLogin);

    const appElement = document.getElementById('app') || document.querySelector('.app-wrapper');
    if (appElement) {
      appElement.style.setProperty('width', 'calc(100% - 410px)', 'important');
    }
    return;
  }

  shadowRoot.appendChild(sidebarElement);

  if (isKanbanViewActive) {
    renderKanbanView();
  }
}

async function handleInlineLogin() {
  const serverUrl = shadowRoot.getElementById('side-server-url').value.trim().replace(/\/$/, '');
  const email = shadowRoot.getElementById('side-email').value.trim();
  const password = shadowRoot.getElementById('side-password').value;
  const errDiv = shadowRoot.getElementById('side-login-error');
  errDiv.style.display = 'none';

  if (!serverUrl || !email || !password) {
    errDiv.innerText = 'Preencha todos os campos.';
    errDiv.style.display = 'block';
    return;
  }

  const btn = shadowRoot.getElementById('btn-side-login');
  btn.disabled = true;
  btn.innerText = 'Conectando...';

  try {
    const response = await fetch(`${serverUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (response.ok) {
      chrome.storage.local.set({
        crm_token: data.token,
        crm_user: data.user,
        crm_server_url: serverUrl
      }, () => {
        crmServerUrl = serverUrl;
        crmToken = data.token;
        crmUser = data.user;

        // Remove login reminder if present
        const reminder = document.getElementById('crm-login-reminder');
        if (reminder) reminder.remove();

        removeSidebar();
        startChatObserver();
      });
    } else {
      errDiv.innerText = data.error || 'Credenciais inválidas.';
      errDiv.style.display = 'block';
    }
  } catch (err) {
    console.error(err);
    errDiv.innerText = 'Erro ao conectar ao servidor.';
    errDiv.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.innerText = 'Entrar no CRM';
  }
}

// ---------------- KANBAN BOARD VIEW RENDERING ----------------
function toggleKanbanMode(active) {
  isKanbanViewActive = active;
  const root = document.getElementById('crm-sidebar-root');
  const appElement = document.getElementById('app') || document.querySelector('.app-wrapper');
  
  const leftPanel = document.querySelector('[data-testid="side"]') || document.querySelector('.two');
  const rightPanel = leftPanel ? leftPanel.nextElementSibling : null;

  if (active) {
    // If sidebar root not initialized, create it
    if (!root) {
      initSidebar();
    } else {
      root.style.display = 'block';
    }

    const expandedRoot = document.getElementById('crm-sidebar-root');
    
    // Hide/Offscreen WhatsApp central panel
    if (rightPanel) {
      rightPanel.style.setProperty('position', 'absolute', 'important');
      rightPanel.style.setProperty('left', '-9999px', 'important');
      rightPanel.style.setProperty('width', '1px', 'important');
      rightPanel.style.setProperty('height', '1px', 'important');
      rightPanel.style.setProperty('overflow', 'hidden', 'important');
    }

    const leftPanelWidth = leftPanel ? leftPanel.getBoundingClientRect().width : 400;

    if (expandedRoot) {
      expandedRoot.style.left = `${leftPanelWidth + 60}px`; // leftPanelWidth + 60px left menu
      expandedRoot.style.width = `calc(100% - ${leftPanelWidth + 60}px)`;
    }
    if (appElement) {
      appElement.style.setProperty('width', `${leftPanelWidth}px`, 'important');
    }

    renderKanbanView();
  } else {
    // Hide the sidebar root completely (no right details sidebar at all!)
    removeSidebar();
    
    // Restore whatsapp central panel
    if (rightPanel) {
      rightPanel.style.removeProperty('position');
      rightPanel.style.removeProperty('left');
      rightPanel.style.removeProperty('width');
      rightPanel.style.removeProperty('height');
      rightPanel.style.removeProperty('overflow');
    }

    if (appElement) {
      appElement.style.setProperty('width', 'calc(100% - 60px)', 'important'); // just offset by 60px left menu
    }
  }
  updateLeftToolbarActiveStates();
}

async function renderKanbanView() {
  if (!sidebarElement) return;

  // Header showing seller filter and toggle back to chat button
  let sellerFilterHtml = '';
  if (crmUser && crmUser.role === 'gestor') {
    sellerFilterHtml = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase;">Filtrar:</span>
        <select id="kanban-seller-filter" style="padding: 4px 8px; font-size: 11px; width: auto; height: 26px; border-radius: 6px; margin: 0;">
          <option value="all">Todos</option>
          ${sellersList.map(s => `<option value="${s.id}" ${selectedSeller == s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
    `;
  } else {
    sellerFilterHtml = `<span style="font-size: 11px; color: #64748b; font-style: italic;">Leads de ${crmUser ? crmUser.name.split(' ')[0] : 'Vendedor'}</span>`;
  }

  sidebarElement.innerHTML = `
    <div class="sidebar-header" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 16px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <h3 class="sidebar-title" style="font-size: 15px;">Funil de Vendas CRM</h3>
      </div>
      
      <div style="display: flex; align-items: center; gap: 8px;">
        ${sellerFilterHtml}
        
        <!-- Add Stage Column Button -->
        <button id="btn-add-kanban-stage" style="padding: 4px 8px; font-size: 10px; font-weight: bold; background-color: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Nova Etapa
        </button>

        <button id="btn-toggle-chat" style="padding: 4px 8px; font-size: 10px; font-weight: bold; background-color: #475569; color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Abrir Chat
        </button>
      </div>
    </div>
    
    <div class="kanban-board-container" id="kanban-columns-wrapper">
      <!-- Loading state -->
      <div style="margin: auto; text-align: center; color: #64748b; font-size: 13px; font-weight: bold;">
        Carregando Quadro Funil...
      </div>
    </div>

    <!-- Modals container inside Shadow DOM -->
    <div id="extension-modal-container"></div>
  `;

  // Bind Header actions
  shadowRoot.getElementById('btn-toggle-chat').addEventListener('click', () => {
    toggleKanbanMode(false);
  });

  shadowRoot.getElementById('btn-add-kanban-stage').addEventListener('click', openAddStageModal);

  const sellerSelect = shadowRoot.getElementById('kanban-seller-filter');
  if (sellerSelect) {
    sellerSelect.addEventListener('change', (e) => {
      selectedSeller = e.target.value;
      loadKanbanLeads();
    });
  }

  // Load leads and populate board
  loadKanbanLeads();
}

async function loadKanbanLeads() {
  const container = shadowRoot.getElementById('kanban-columns-wrapper');
  if (!container) return;

  try {
    const url = selectedSeller !== 'all' 
      ? `${crmServerUrl}/api/crm/leads?assigned_to=${selectedSeller}`
      : `${crmServerUrl}/api/crm/leads`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${crmToken}` }
    });

    if (res.ok) {
      const data = await res.json();
      leadsList = data.leads || [];

      container.innerHTML = '';

      funnelStages.forEach((st, index) => {
        const stageLeads = leadsList.filter(l => l.stage === st.key);
        const stageValSum = stageLeads.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0);

        const colDiv = document.createElement('div');
        colDiv.className = 'kanban-column';
        colDiv.setAttribute('data-stage', st.key);
        
        colDiv.innerHTML = `
          <!-- Draggable Column Header for sideways reordering -->
          <div class="kanban-column-header" style="${st.color}; cursor: grab;" draggable="true" data-index="${index}">
            <div class="kanban-column-top">
              <span class="kanban-column-title">${st.title}</span>
              <span class="kanban-column-count">${stageLeads.length}</span>
            </div>
            <div class="kanban-column-sum">R$ ${stageValSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div class="kanban-cards-container" id="cards-container-${st.key}">
            ${stageLeads.length === 0 ? `
              <div class="kanban-empty-state">Sem leads</div>
            ` : ''}
          </div>
        `;

        container.appendChild(colDiv);

        // Bind Column Header drag & drop reordering
        const colHeader = colDiv.querySelector('.kanban-column-header');
        colHeader.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/column-index', index);
        });
        colHeader.addEventListener('dragover', (e) => {
          e.preventDefault();
        });
        colHeader.addEventListener('drop', (e) => {
          e.preventDefault();
          const sourceIdxStr = e.dataTransfer.getData('text/column-index');
          if (sourceIdxStr !== '') {
            const sourceIndex = parseInt(sourceIdxStr, 10);
            if (sourceIndex !== index) {
              const [moved] = funnelStages.splice(sourceIndex, 1);
              funnelStages.splice(index, 0, moved);
              chrome.storage.local.set({ crm_stages: funnelStages }, () => {
                loadKanbanLeads();
              });
            }
          }
        });

        // Render cards inside column container
        const cardsContainer = shadowRoot.getElementById(`cards-container-${st.key}`);
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
                <button class="kanban-card-icon-btn btn-action-reminder" title="Agendar Retorno" data-phone="${lead.phone}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </button>
                <button class="kanban-card-icon-btn btn-action-note" title="Adicionar Nota" data-phone="${lead.phone}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/></svg>
                </button>
                <button class="kanban-card-icon-btn btn-action-move" title="Mover Etapa" data-phone="${lead.phone}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
                </button>
                <button class="kanban-card-icon-btn btn-action-chat" title="Abrir Chat" data-phone="${lead.phone}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>
              </div>
            </div>
          `;

          // Card Drag Events (leads reordering)
          card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', lead.phone);
          });

          // Action Toolbar click listeners
          card.querySelector('.btn-action-reminder').addEventListener('click', (e) => {
            e.stopPropagation();
            openReminderModal(lead);
          });
          card.querySelector('.btn-action-note').addEventListener('click', (e) => {
            e.stopPropagation();
            openNoteModal(lead);
          });
          card.querySelector('.btn-action-move').addEventListener('click', (e) => {
            e.stopPropagation();
            openMoveModal(lead);
          });
          card.querySelector('.btn-action-chat').addEventListener('click', (e) => {
            e.stopPropagation();
            openChatModal(lead);
          });

          // Clicking the card body opens conversation overlay instantly! (WaSeller Print 03)
          card.addEventListener('click', (e) => {
            if (e.target.closest('.kanban-card-icon-btn')) return;
            openChatModal(lead);
          });

          cardsContainer.appendChild(card);
        });

        // Column drop listener for cards
        colDiv.addEventListener('dragover', (e) => {
          e.preventDefault();
        });
        colDiv.addEventListener('drop', async (e) => {
          e.preventDefault();
          const phone = e.dataTransfer.getData('text/plain');
          if (phone) {
            updateLeadStage(phone, st.key);
          }
        });
      });

    } else {
      container.innerHTML = '<div style="margin: auto; color: #dc2626; font-weight: bold;">Erro ao carregar leads.</div>';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div style="margin: auto; color: #dc2626; font-weight: bold;">Erro de conexão com o painel.</div>';
  }
}

function getInitialsName(name) {
  if (!name) return 'LD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function updateLeadStage(phone, stage) {
  try {
    const res = await fetch(`${crmServerUrl}/api/crm/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${crmToken}`
      },
      body: JSON.stringify({ phone, stage })
    });
    if (res.ok) {
      loadKanbanLeads();
      fetchLeadsAndRefresh();
    }
  } catch (err) {
    console.error(err);
  }
}

// Open chat/select in background
function selectChatInBackground(phone) {
  const chatListItem = document.querySelector(`[data-id*="${phone}"]`) || 
                       document.querySelector(`div[data-id="${phone}@c.us"]`);
  if (chatListItem) {
    const clickable = chatListItem.querySelector('[role="button"]') || chatListItem;
    clickable.click();
  } else {
    window.location.hash = `#/chat/${phone}@c.us`;
  }
}

function sendWhatsAppMessage(text) {
  const inputBox = document.querySelector('#main footer div[contenteditable="true"]');
  if (inputBox) {
    inputBox.focus();
    
    // Insert text into the contenteditable element
    document.execCommand('insertText', false, text);
    
    // Trigger input event
    const inputEvent = new Event('input', { bubbles: true });
    inputBox.dispatchEvent(inputEvent);
    
    // Click the send button
    setTimeout(() => {
      const sendBtn = document.querySelector('#main footer button[data-testid="compose-btn-send"]') || 
                      document.querySelector('#main footer span[data-testid="send"]') || 
                      document.querySelector('#main footer button');
      if (sendBtn) {
        sendBtn.click();
      }
    }, 100);
  }
}

function getActiveChatMessages() {
  const messages = [];
  const messageNodes = document.querySelectorAll('#main div[data-id*="@c.us"]');
  messageNodes.forEach(node => {
    const textNode = node.querySelector('.selectable-text span') || node.querySelector('[class*="selectable-text"]');
    const text = textNode ? textNode.innerText : '';
    const dataId = node.getAttribute('data-id') || '';
    const isIncoming = dataId.startsWith('false_');
    if (text) {
      messages.push({ text, isIncoming });
    }
  });
  return messages;
}

// ---------------- DIALOG MODALS RENDERING (Shadow DOM) ----------------
function openChatModal(lead) {
  const container = shadowRoot.getElementById('extension-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="extension-modal-overlay" id="chat-overlay-wrapper">
      <div class="extension-modal-box" style="max-width: 650px; height: 80vh; display: flex; flex-direction: column; padding: 0; gap: 0; overflow: hidden; border: 1px solid #cbd5e1; border-radius: 20px;">
        <!-- Modal Header -->
        <div class="extension-modal-header" style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background-color: #ffffff; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="kanban-card-avatar" style="width: 32px; height: 32px; font-size: 12px;">${getInitialsName(lead.name)}</div>
            <div style="text-align: left;">
              <h4 class="extension-modal-title" style="font-size: 14px; font-weight: 800; color: #1e293b; margin: 0;">${lead.name || lead.phone}</h4>
              <span style="font-size: 10px; color: #64748b; font-family: monospace;">${lead.phone}</span>
            </div>
          </div>
          <button class="extension-modal-close-btn" id="btn-close-chat-modal" style="padding: 6px; border: none; background: none; cursor: pointer; color: #94a3b8; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        
        <!-- Messages Container -->
        <div id="chat-modal-messages" style="flex: 1; overflow-y: auto; padding: 20px; background-color: #f1f5f9; display: flex; flex-direction: column; gap: 12px; box-sizing: border-box;">
          <div style="margin: auto; color: #64748b; font-size: 12px; font-style: italic;">Conectando e carregando conversa...</div>
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

  shadowRoot.getElementById('btn-close-chat-modal').addEventListener('click', closeModal);
  
  const inputField = shadowRoot.getElementById('chat-modal-input');
  const sendBtn = shadowRoot.getElementById('chat-modal-send-btn');
  
  const sendMessage = () => {
    const text = inputField.value.trim();
    if (!text) return;
    sendWhatsAppMessage(text);
    inputField.value = '';
    // Immediate sync trigger
    setTimeout(syncChatMessages, 200);
  };

  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  sendBtn.addEventListener('click', sendMessage);

  // Periodically sync chat messages
  let lastMsgCount = 0;
  const syncChatMessages = () => {
    const messages = getActiveChatMessages();
    const msgContainer = shadowRoot.getElementById('chat-modal-messages');
    if (!msgContainer) return;

    if (messages.length === 0) {
      msgContainer.innerHTML = '<div style="margin: auto; color: #64748b; font-size: 12px; font-style: italic;">Carregando histórico de mensagens...</div>';
      return;
    }

    // Render message bubbles
    msgContainer.innerHTML = messages.map(msg => {
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

    // Autoscroll to bottom if new messages arrived
    if (messages.length !== lastMsgCount) {
      lastMsgCount = messages.length;
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }
  };

  // Select chat and start polling
  selectChatInBackground(lead.phone);
  
  // Fast sync interval (800ms)
  const chatSyncInterval = setInterval(syncChatMessages, 800);
  // Run once immediately
  setTimeout(syncChatMessages, 400);
}

function openAddStageModal() {
  const container = shadowRoot.getElementById('extension-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="extension-modal-overlay">
      <div class="extension-modal-box" style="max-width: 340px;">
        <div class="extension-modal-header">
          <h4 class="extension-modal-title">Criar Etapa</h4>
          <button class="extension-modal-close-btn" id="btn-close-modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="extension-modal-body">
          <div class="form-group">
            <label>Nome da nova aba / etapa *</label>
            <input type="text" id="modal-stage-title" placeholder="Nome da etapa...">
          </div>
        </div>
        <div class="extension-modal-footer">
          <button class="btn-primary" id="btn-modal-cancel" style="margin: 0; background-color: #94a3b8; width: auto; padding: 8px 16px;">Cancelar</button>
          <button class="btn-primary" id="btn-modal-save" style="margin: 0; width: auto; padding: 8px 16px;">Criar</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { container.innerHTML = ''; };

  shadowRoot.getElementById('btn-close-modal').addEventListener('click', closeModal);
  shadowRoot.getElementById('btn-modal-cancel').addEventListener('click', closeModal);

  shadowRoot.getElementById('btn-modal-save').addEventListener('click', () => {
    const title = shadowRoot.getElementById('modal-stage-title').value.trim();
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
      loadKanbanLeads();
      injectHorizontalTabs();
    });
  });
}

function openNoteModal(lead) {
  const container = shadowRoot.getElementById('extension-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="extension-modal-overlay">
      <div class="extension-modal-box">
        <div class="extension-modal-header">
          <h4 class="extension-modal-title">Criar anotação</h4>
          <button class="extension-modal-close-btn" id="btn-close-modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="extension-modal-body">
          <div style="font-size: 12px; color: #64748b;">
            <strong>Lead:</strong> ${lead.name || lead.phone}
          </div>
          <div class="form-group">
            <label>Insira uma anotação</label>
            <textarea id="modal-note-content" rows="4" placeholder="Insira sua nota..."></textarea>
          </div>
        </div>
        <div class="extension-modal-footer">
          <button class="btn-primary" id="btn-modal-cancel" style="margin: 0; background-color: #94a3b8; width: auto; padding: 8px 16px;">Cancelar</button>
          <button class="btn-primary" id="btn-modal-save" style="margin: 0; width: auto; padding: 8px 16px;">Salvar</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { container.innerHTML = ''; };

  shadowRoot.getElementById('btn-close-modal').addEventListener('click', closeModal);
  shadowRoot.getElementById('btn-modal-cancel').addEventListener('click', closeModal);
  
  shadowRoot.getElementById('btn-modal-save').addEventListener('click', async () => {
    const content = shadowRoot.getElementById('modal-note-content').value.trim();
    if (!content) return;

    const btn = shadowRoot.getElementById('btn-modal-save');
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
        loadKanbanLeads();
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
  const container = shadowRoot.getElementById('extension-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="extension-modal-overlay">
      <div class="extension-modal-box">
        <div class="extension-modal-header">
          <h4 class="extension-modal-title">Criar Agendamento</h4>
          <button class="extension-modal-close-btn" id="btn-close-modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="extension-modal-body">
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
        <div class="extension-modal-footer">
          <button class="btn-primary" id="btn-modal-cancel" style="margin: 0; background-color: #94a3b8; width: auto; padding: 8px 16px;">Cancelar</button>
          <button class="btn-primary" id="btn-modal-save" style="margin: 0; width: auto; padding: 8px 16px;">Criar</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { container.innerHTML = ''; };

  shadowRoot.getElementById('btn-close-modal').addEventListener('click', closeModal);
  shadowRoot.getElementById('btn-modal-cancel').addEventListener('click', closeModal);
  
  shadowRoot.getElementById('btn-modal-save').addEventListener('click', async () => {
    const title = shadowRoot.getElementById('modal-task-title').value.trim() || 'Retorno de Contato';
    const message = shadowRoot.getElementById('modal-task-desc').value.trim();
    const dateVal = shadowRoot.getElementById('modal-task-date').value;
    const timeVal = shadowRoot.getElementById('modal-task-time').value;

    if (!dateVal || !timeVal) {
      alert('Data e hora são obrigatórias.');
      return;
    }

    const combinedDateTime = `${dateVal}T${timeVal}`;
    const btn = shadowRoot.getElementById('btn-modal-save');
    btn.disabled = true;
    btn.innerText = 'Criando...';

    try {
      // 1. Update Lead return time
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

      // 2. Create Task row
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
      loadKanbanLeads();
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
  const container = shadowRoot.getElementById('extension-modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="extension-modal-overlay">
      <div class="extension-modal-box" style="max-width: 320px;">
        <div class="extension-modal-header">
          <h4 class="extension-modal-title">Mover de Etapa</h4>
          <button class="extension-modal-close-btn" id="btn-close-modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="extension-modal-body" style="max-height: 380px; overflow-y: auto;">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
            <strong>Lead:</strong> ${lead.name || lead.phone}
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${funnelStages.map(st => `
              <button class="btn-stage-select" data-stage="${st.key}" style="padding: 10px; border-radius: 8px; border: 1px solid ${lead.stage === st.key ? '#2563eb' : '#e2e8f0'}; background-color: ${lead.stage === st.key ? '#eff6ff' : '#ffffff'}; color: ${lead.stage === st.key ? '#2563eb' : '#334155'}; font-size: 12px; font-weight: bold; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center;">
                <span>${st.title}</span>
                ${lead.stage === st.key ? '✓' : ''}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { container.innerHTML = ''; };

  shadowRoot.getElementById('btn-close-modal').addEventListener('click', closeModal);
  
  shadowRoot.querySelectorAll('.btn-stage-select').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedStage = btn.getAttribute('data-stage');
      updateLeadStage(lead.phone, selectedStage);
      closeModal();
    });
  });
}

// ---------------- OBSERVER & CHAT LOADERS ----------------
function startChatObserver() {
  console.log('CRM: Iniciando escuta de conversas...');
  injectLeftToolbar();
  fetchLeadsAndRefresh();
  
  // Refresh leads every 15 seconds to keep counts and tags updated in background
  setInterval(fetchLeadsAndRefresh, 15000);
  
  // Real-time sync for active chat and chat list filters
  setInterval(() => {
    detectActiveChat();
    applyChatListFilter();
    injectHorizontalTabs();
  }, 1500);
}

function detectActiveChat() {
  if (!crmToken || isKanbanViewActive) return;

  const headerNameElement = document.querySelector('#main header span[title]') || 
                            document.querySelector('#main header div[title]') || 
                            document.querySelector('[data-testid="conversation-info"] span[title]');
                            
  if (!headerNameElement) return;

  const chatName = headerNameElement.getAttribute('title') || headerNameElement.innerText;
  let detectedPhone = '';
  
  const selectedChatListItem = document.querySelector('[data-testid="chat-list-item"] [aria-selected="true"]') ||
                               document.querySelector('[data-testid="chat-list-item"] [class*="active"]') ||
                               document.querySelector('div[data-id*="@c.us"]');
                               
  if (selectedChatListItem) {
    const dataId = selectedChatListItem.closest('[data-id]')?.getAttribute('data-id') || '';
    if (dataId.endsWith('@c.us')) {
      detectedPhone = dataId.split('@')[0];
    }
  }

  if (!detectedPhone && /^\+?[\d\s\-()]{10,}$/.test(chatName)) {
    detectedPhone = chatName.replace(/\D/g, '');
  }

  if (!detectedPhone) {
    // Look inside messages for data-id values containing JID
    const msg = document.querySelector('#main div[data-id*="@c.us"]');
    if (msg) {
      const dataId = msg.getAttribute('data-id') || '';
      const match = dataId.match(/(?:true|false)_(\d+)@c\.us/);
      if (match) {
        detectedPhone = match[1];
      }
    }
  }

  if (!detectedPhone) {
    const headerSubtextElement = document.querySelector('#main header span[class*="selectable-text"]');
    if (headerSubtextElement) {
      const txt = headerSubtextElement.innerText;
      if (/^\+?[\d\s\-()]{10,}$/.test(txt)) {
        detectedPhone = txt.replace(/\D/g, '');
      }
    }
  }

  if (detectedPhone && detectedPhone !== currentPhone) {
    currentPhone = detectedPhone;
    currentName = chatName;
    loadContactData(currentPhone, currentName);
  }
}

async function fetchLeadsAndRefresh() {
  if (!crmToken) return;
  try {
    const url = `${crmServerUrl}/api/crm/leads`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${crmToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      leadsList = data.leads || [];
      injectHorizontalTabs();
      applyChatListFilter();
    }
  } catch (err) {
    console.error(err);
  }
}

// Left side panel horizontal filters tabs
function injectHorizontalTabs() {
  const sidePanel = document.querySelector('[data-testid="side"]') || document.querySelector('.two');
  if (!sidePanel || !crmToken) return;

  let tabsBar = document.getElementById('crm-horizontal-filter-tabs');
  if (!tabsBar) {
    tabsBar = document.createElement('div');
    tabsBar.id = 'crm-horizontal-filter-tabs';
    tabsBar.className = 'crm-horizontal-tabs';
    
    // Force CSS styles to override WhatsApp flex stretch behavior
    tabsBar.style.setProperty('height', '54px', 'important');
    tabsBar.style.setProperty('min-height', '54px', 'important');
    tabsBar.style.setProperty('max-height', '54px', 'important');
    tabsBar.style.setProperty('flex', 'none', 'important');
    tabsBar.style.setProperty('display', 'flex', 'important');
    tabsBar.style.setProperty('flex-direction', 'row', 'important');
    tabsBar.style.setProperty('align-items', 'center', 'important');
    tabsBar.style.setProperty('overflow-x', 'auto', 'important');
    tabsBar.style.setProperty('width', '100%', 'important');
    tabsBar.style.setProperty('box-sizing', 'border-box', 'important');
    tabsBar.style.setProperty('background-color', '#f8fafc', 'important');
    tabsBar.style.setProperty('border-bottom', '1px solid #e2e8f0', 'important');
    
    sidePanel.insertBefore(tabsBar, sidePanel.firstChild);
  }

  let tabsHtml = `
    <button class="crm-tab-tag ${activeFilterStage === 'all' ? 'active' : ''}" data-stage="all" style="height: 32px !important; min-height: 32px !important; max-height: 32px !important; flex: none !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; border-radius: 9999px !important; padding: 0 12px !important; font-size: 11px !important; font-weight: bold !important; cursor: pointer !important; white-space: nowrap !important; margin: 0 4px !important; border: 1px solid #cbd5e1 !important; background-color: #ffffff !important; color: #475569 !important;">
      <span>Tudo</span>
      <span class="crm-tab-tag-count" style="margin-left: 6px !important; font-size: 9px !important; background-color: #f1f5f9 !important; color: #64748b !important; padding: 1px 5px !important; border-radius: 999px !important;">${leadsList.length}</span>
    </button>
  `;

  funnelStages.forEach(st => {
    const stageLeadsCount = leadsList.filter(l => l.stage === st.key).length;
    const isActive = activeFilterStage === st.key;
    
    tabsHtml += `
      <button class="crm-tab-tag ${isActive ? 'active' : ''}" data-stage="${st.key}" style="height: 32px !important; min-height: 32px !important; max-height: 32px !important; flex: none !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; border-radius: 9999px !important; padding: 0 12px !important; font-size: 11px !important; font-weight: bold !important; cursor: pointer !important; white-space: nowrap !important; margin: 0 4px !important; border: 1px solid ${isActive ? '#bfdbfe' : '#cbd5e1'} !important; background-color: ${isActive ? '#eff6ff' : '#ffffff'} !important; color: ${isActive ? '#2563eb' : '#475569'} !important;">
        <span>${st.title}</span>
        <span class="crm-tab-tag-count" style="margin-left: 6px !important; font-size: 9px !important; background-color: ${isActive ? '#2563eb' : '#f1f5f9'} !important; color: ${isActive ? '#ffffff' : '#64748b'} !important; padding: 1px 5px !important; border-radius: 999px !important;">${stageLeadsCount}</span>
      </button>
    `;
  });

  tabsBar.innerHTML = tabsHtml;

  // Bind click actions
  tabsBar.querySelectorAll('.crm-tab-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      activeFilterStage = tag.getAttribute('data-stage');
      tabsBar.querySelectorAll('.crm-tab-tag').forEach(t => {
        t.classList.remove('active');
        t.style.setProperty('background-color', '#ffffff', 'important');
        t.style.setProperty('color', '#475569', 'important');
        t.style.setProperty('border-color', '#cbd5e1', 'important');
        const countSpan = t.querySelector('.crm-tab-tag-count');
        if (countSpan) {
          countSpan.style.setProperty('background-color', '#f1f5f9', 'important');
          countSpan.style.setProperty('color', '#64748b', 'important');
        }
      });
      
      tag.classList.add('active');
      tag.style.setProperty('background-color', '#eff6ff', 'important');
      tag.style.setProperty('color', '#2563eb', 'important');
      tag.style.setProperty('border-color', '#bfdbfe', 'important');
      const countSpan = tag.querySelector('.crm-tab-tag-count');
      if (countSpan) {
        countSpan.style.setProperty('background-color', '#2563eb', 'important');
        countSpan.style.setProperty('color', '#ffffff', 'important');
      }
      
      applyChatListFilter();
    });
  });
}

function applyChatListFilter() {
  if (!crmToken) return;

  const chatItems = document.querySelectorAll('[data-testid="chat-list-item"]');
  if (activeFilterStage === 'all') {
    chatItems.forEach(item => {
      item.style.removeProperty('display');
    });
    return;
  }

  const allowedPhones = leadsList
    .filter(l => l.stage === activeFilterStage)
    .map(l => l.phone);

  chatItems.forEach(item => {
    const dataId = item.closest('[data-id]')?.getAttribute('data-id') || 
                   item.querySelector('[data-id]')?.getAttribute('data-id') || 
                   item.getAttribute('data-id') || '';
    const phone = dataId.split('@')[0].replace(/\D/g, '');
    
    if (phone && allowedPhones.includes(phone)) {
      item.style.setProperty('display', 'flex', 'important');
    } else {
      item.style.setProperty('display', 'none', 'important');
    }
  });
}

// Left vertical toolbar manager
function injectLeftToolbar() {
  if (document.getElementById('crm-left-toolbar-root') || !crmToken) return;

  const toolbar = document.createElement('div');
  toolbar.id = 'crm-left-toolbar-root';
  toolbar.className = 'crm-left-toolbar';
  
  toolbar.innerHTML = `
    <div class="crm-left-logo" title="Clean Tech Smart">CT</div>
    
    <button class="crm-left-item" id="crm-left-btn-funnel" title="Funil de Vendas (Kanban)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
    </button>

    <button class="crm-left-item" id="crm-left-btn-link" title="Ir para o Painel Web">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </button>
  `;

  document.body.appendChild(toolbar);

  // Push the WhatsApp container to the right
  const app = document.getElementById('app') || document.querySelector('.app-wrapper');
  if (app) {
    app.style.setProperty('margin-left', '60px', 'important');
    app.style.setProperty('width', 'calc(100% - 60px)', 'important');
  }

  // Bind actions
  toolbar.querySelector('#crm-left-btn-funnel').addEventListener('click', () => {
    if (isKanbanViewActive) {
      toggleKanbanMode(false);
    } else {
      toggleKanbanMode(true);
    }
  });

  toolbar.querySelector('#crm-left-btn-link').addEventListener('click', () => {
    window.open(crmServerUrl + '/crm', '_blank');
  });

  updateLeftToolbarActiveStates();
}

function updateLeftToolbarActiveStates() {
  const toolbar = document.getElementById('crm-left-toolbar-root');
  if (!toolbar) return;
  
  const btnFunnel = toolbar.querySelector('#crm-left-btn-funnel');
  
  if (btnFunnel) {
    if (isKanbanViewActive) btnFunnel.classList.add('active');
    else btnFunnel.classList.remove('active');
  }
}

async function fetchSellersList() {
  try {
    const res = await fetch(`${crmServerUrl}/api/crm/sellers`, {
      headers: { 'Authorization': `Bearer ${crmToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      sellersList = data.sellers || [];
    }
  } catch (err) {
    console.error('Erro ao buscar lista de vendedores:', err);
  }
}

async function loadContactData(phone, name) {
  currentPhone = phone;
  currentName = name;

  try {
    const urlName = encodeURIComponent(name);
    const res = await fetch(`${crmServerUrl}/api/crm/contact?phone=${phone}&name=${urlName}`, {
      headers: { 'Authorization': `Bearer ${crmToken}` }
    });

    if (res.ok) {
      const data = await res.json();
      leadData = data;
    }
  } catch (err) {
    console.error('Erro ao buscar dados do CRM:', err);
  }
}
