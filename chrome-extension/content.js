// content.js

// Safe wrappers to prevent "Extension context invalidated" errors
function safeStorageSet(data, callback) {
  if (!chrome.runtime?.id) return;
  try {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        console.warn('[CRM] safeStorageSet warning:', chrome.runtime.lastError.message);
      } else if (callback) {
        callback();
      }
    });
  } catch (e) {
    console.warn('[CRM] safeStorageSet catch:', e.message);
  }
}

function safeStorageGet(keys, callback) {
  if (!chrome.runtime?.id) {
    if (callback) callback({});
    return;
  }
  try {
    chrome.storage.local.get(keys, (res) => {
      if (chrome.runtime.lastError) {
        console.warn('[CRM] safeStorageGet warning:', chrome.runtime.lastError.message);
        if (callback) callback({});
      } else if (callback) {
        callback(res || {});
      }
    });
  } catch (e) {
    console.warn('[CRM] safeStorageGet catch:', e.message);
    if (callback) callback({});
  }
}

function safeStorageRemove(keys, callback) {
  if (!chrome.runtime?.id) return;
  try {
    chrome.storage.local.remove(keys, () => {
      if (chrome.runtime.lastError) {
        console.warn('[CRM] safeStorageRemove warning:', chrome.runtime.lastError.message);
      } else if (callback) {
        callback();
      }
    });
  } catch (e) {
    console.warn('[CRM] safeStorageRemove catch:', e.message);
  }
}

function simulateClick(element) {
  if (!element) return;
  const mouseEvents = ['mousedown', 'mouseup', 'click'];
  mouseEvents.forEach(eventType => {
    const event = new MouseEvent(eventType, {
      view: window,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
  });
}

let crmServerUrl = '';
let crmToken = '';
let crmUser = null;

let currentPhone = '';
let currentName = '';
let leadData = null;
let sellersList = [];
let leadsList = [];
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

let isSidebarVisible = false; // Sidebar drawer hidden by default

// Shadow Root reference
let shadowRoot = null;
let sidebarElement = null;

// Initialize Session from Storage
safeStorageGet(['crm_token', 'crm_user', 'crm_server_url', 'crm_stages'], (res) => {
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
    isSidebarVisible = true;
    initSidebar();
  }
});

// Watch for storage changes (e.g. login/logout from popup, state requests from crm.js)
if (chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes) => {
    safeStorageGet(['crm_token', 'crm_user', 'crm_server_url', 'crm_stages'], (res) => {
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

      removeSidebar();
      if (!crmToken) {
        isSidebarVisible = true;
        initSidebar();
      } else {
        startChatObserver();
      }
    });


  // State-bridge triggers
  if (changes.crm_pending_open_chat && changes.crm_pending_open_chat.newValue) {
    const phone = changes.crm_pending_open_chat.newValue;
    selectChatInBackground(phone);
    safeStorageRemove('crm_pending_open_chat');
  }
  if (changes.crm_pending_send_message && changes.crm_pending_send_message.newValue) {
    const { text, phone } = changes.crm_pending_send_message.newValue;
    selectChatInBackground(phone);
    setTimeout(() => {
      sendWhatsAppMessage(text);
    }, 400);
    safeStorageRemove('crm_pending_send_message');
  }
  });
}


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
  div.style.zIndex = '99999';
  div.style.fontFamily = 'sans-serif';
  div.style.fontSize = '12px';
  div.style.fontWeight = 'bold';
  div.style.cursor = 'pointer';
  div.style.transition = 'transform 0.2s';
  div.innerHTML = '🔑 Clean Tech CRM: Clique aqui para fazer login';
  
  div.addEventListener('click', () => {
    isSidebarVisible = true;
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
  updateLeftToolbarActiveStates();
}

function initSidebar() {
  if (!isSidebarVisible) {
    removeSidebar();
    return;
  }

  if (document.getElementById('crm-sidebar-root')) return;

  const rootContainer = document.createElement('div');
  rootContainer.id = 'crm-sidebar-root';
  rootContainer.style.position = 'fixed';
  rootContainer.style.right = '0';
  rootContainer.style.top = '0';
  rootContainer.style.width = '350px';
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
  renderSidebarView();
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
      safeStorageSet({
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

// ---------------- SIDEBAR VIEW RENDERING ----------------
function renderSidebarView() {
  if (!sidebarElement) return;

  sidebarElement.innerHTML = `
    <div class="sidebar-header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 class="sidebar-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Clean Tech CRM
        </h3>
        
        <!-- Close Sidebar icon -->
        <button id="btn-close-sidebar-drawer" style="padding: 4px 8px; font-size: 10px; font-weight: bold; background-color: #475569; color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
          Fechar
        </button>
      </div>
      <p class="sidebar-subtitle">Integração WhatsApp Web</p>
    </div>

    <!-- Active Lead info section -->
    <div style="padding: 12px 16px 4px; border-bottom: 1px solid #f3f4f6;">
      <div class="form-group" style="margin-bottom: 8px;">
        <label>Telefone do Lead</label>
        <div style="display: flex; gap: 6px;">
          <input type="text" id="phone-input" style="flex: 1; padding: 6px 10px;" placeholder="Ex: 5511999999999">
          <button id="btn-manual-fetch" class="btn-primary" style="margin: 0; padding: 0 12px; width: auto; font-size: 11px;">Buscar</button>
        </div>
      </div>
      <div id="active-lead-header" style="font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #374151;">
        Selecione uma conversa...
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="tabs-nav">
      <button class="tab-btn active" data-tab="tab-crm">CRM</button>
      <button class="tab-btn" data-tab="tab-notes">Notas</button>
      <button class="tab-btn" data-tab="tab-related">Sistema</button>
    </div>

    <!-- Tab Contents -->
    <div class="tab-content">
      <!-- Tab CRM -->
      <div id="tab-crm" class="tab-panel active">
        <form id="crm-form" style="display: none;">
          <div class="form-group">
            <label for="lead-name">Nome do Lead</label>
            <input type="text" id="lead-name">
          </div>
          
          <div class="form-group">
            <label for="lead-stage">Etapa do Funil</label>
            <select id="lead-stage">
              <!-- Render stages dynamically -->
              ${funnelStages.map(st => `<option value="${st.key}">${st.title}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label for="lead-value">Valor do Negócio (R$)</label>
            <input type="number" step="0.01" id="lead-value" placeholder="0.00">
          </div>

          <div class="form-group">
            <label for="lead-seller">Vendedor Responsável</label>
            <select id="lead-seller">
              <option value="">Nenhum</option>
            </select>
          </div>

          <div class="form-group">
            <label for="lead-next-contact">Agendar Próximo Contato</label>
            <input type="datetime-local" id="lead-next-contact">
            <div id="reminder-info" style="margin-top: 6px; display: none;">
              <span class="reminder-badge">Lembrete Ativo</span>
            </div>
          </div>

          <button type="submit" class="btn-primary">Salvar CRM</button>
          <div id="crm-save-status" style="font-size: 11px; text-align: center; margin-top: 8px; font-weight: bold; color: #10b981;"></div>
        </form>
        <div id="crm-empty-state" class="auth-warning" style="background-color: #f9fafb; border-color: #e5e7eb; color: #6b7280; font-weight: normal; margin: 24px 0;">
          Carregue um lead para atualizar os dados de vendas.
        </div>
      </div>

      <!-- Tab Notes -->
      <div id="tab-notes" class="tab-panel">
        <div id="notes-container" style="display: none;">
          <div class="form-group">
            <label for="new-note-content">Nova Anotação</label>
            <textarea id="new-note-content" rows="3" placeholder="Escreva um resumo do atendimento..."></textarea>
            <button id="btn-save-note" class="btn-primary" style="margin-top: 6px;">Adicionar Nota</button>
          </div>
          
          <div class="divider"></div>
          <label>Histórico do Cliente</label>
          <div class="notes-list" id="notes-list-items">
            <!-- Dynamic notes here -->
          </div>
        </div>
        <div id="notes-empty-state" class="auth-warning" style="background-color: #f9fafb; border-color: #e5e7eb; color: #6b7280; font-weight: normal; margin: 24px 0;">
          Carregue um lead para ver o histórico de anotações.
        </div>
      </div>

      <!-- Tab Related / System -->
      <div id="tab-related" class="tab-panel">
        <div id="related-container" style="display: none;">
          
          <!-- Contratos Section -->
          <div class="related-section">
            <h4 class="section-title">Contratos de Locação</h4>
            <div class="items-grid" id="contracts-grid-items">
              <!-- Dynamic contracts here -->
            </div>
          </div>

          <!-- Chamados Section -->
          <div class="related-section">
            <h4 class="section-title">Chamados Técnicos</h4>
            <div class="items-grid" id="tickets-grid-items">
              <!-- Dynamic tickets here -->
            </div>
          </div>

          <!-- Quick Add Ticket Form -->
          <div class="quick-add-box" id="quick-ticket-box" style="display: none;">
            <h5 class="quick-add-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              Novo Chamado Rápido
            </h5>
            <form id="quick-ticket-form">
              <div class="form-group">
                <label for="ticket-equip">Ativo / Equipamento *</label>
                <select id="ticket-equip" required>
                  <!-- Matched client equipments -->
                </select>
              </div>
              <div class="form-group">
                <label for="ticket-type">Tipo de Chamado *</label>
                <select id="ticket-type" required>
                  <option value="corretiva">M. Corretiva</option>
                  <option value="preventiva">M. Preventiva</option>
                  <option value="garantia">Garantia</option>
                  <option value="entrega_tecnica">Entrega Técnica</option>
                  <option value="treinamento">Treinamento</option>
                </select>
              </div>
              <div class="form-group">
                <label for="ticket-priority">Prioridade</label>
                <select id="ticket-priority">
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>
              <div class="form-group">
                <label for="ticket-desc">Descrição do Laudo / Problema *</label>
                <textarea id="ticket-desc" rows="2" placeholder="O que precisa ser feito..." required></textarea>
              </div>
              <div class="form-group">
                <label for="ticket-date">Data Agendada</label>
                <input type="datetime-local" id="ticket-date">
              </div>
              <button type="submit" class="btn-primary" style="background-color: #1e40af;">Abrir Chamado</button>
            </form>
            <div id="ticket-save-status" style="font-size: 11px; text-align: center; margin-top: 6px; font-weight: bold; color: #1e40af;"></div>
          </div>
        </div>

        <div id="related-empty-state" class="auth-warning" style="background-color: #f9fafb; border-color: #e5e7eb; color: #6b7280; font-weight: normal; margin: 24px 0;">
          Carregue um cliente vinculado para gerenciar contratos e chamados.
        </div>
      </div>
    </div>
  `;

  // Adjust App width
  const appElement = document.getElementById('app') || document.querySelector('.app-wrapper');
  if (appElement) {
    appElement.style.setProperty('width', 'calc(100% - 410px)', 'important');
  }

  // Setup Event Listeners for Tabs
  const tabButtons = shadowRoot.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      shadowRoot.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const targetPanel = shadowRoot.getElementById(btn.getAttribute('data-tab'));
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Setup manual search listener
  shadowRoot.getElementById('btn-manual-fetch').addEventListener('click', () => {
    const inputPhone = shadowRoot.getElementById('phone-input').value.trim();
    if (inputPhone) {
      loadContactData(inputPhone, `Lead Manual (${inputPhone})`);
    }
  });

  // Setup note submission
  shadowRoot.getElementById('btn-save-note').addEventListener('click', handleSaveNote);

  // Setup CRM lead data submission
  shadowRoot.getElementById('crm-form').addEventListener('submit', handleSaveLead);

  // Setup Quick Ticket submission
  shadowRoot.getElementById('quick-ticket-form').addEventListener('submit', handleSaveQuickTicket);

  // Close Sidebar click listener
  shadowRoot.getElementById('btn-close-sidebar-drawer').addEventListener('click', () => {
    isSidebarVisible = false;
    removeSidebar();
  });

  // Reload current contact values if loaded
  if (currentPhone) {
    loadContactData(currentPhone, currentName);
  }
}

// ---------------- OBSERVER & CHAT LOADERS ----------------
function startChatObserver() {
  console.log('CRM: Iniciando escuta de conversas...');
  injectLeftToolbar();
  fetchLeadsAndRefresh();
  
  setInterval(fetchLeadsAndRefresh, 15000);
  
  // Real-time state-sharing loop using local storage
  const syncInterval = setInterval(() => {
    // Guard: stop interval if extension context is no longer valid
    if (!chrome.runtime?.id) {
      clearInterval(syncInterval);
      return;
    }

    try {
      detectActiveChat();
      // Note: applyChatListFilter() is NOT called here automatically - only on explicit tab click
      // to prevent it from hiding conversations while we're trying to open them
      injectHorizontalTabs();
      
      // Merge visible DOM chats (provides real-time dynamic updates)
      const visibleChats = getAllChatsFromDom();
      if (visibleChats.length > 0) {
        safeStorageGet(['crm_whatsapp_chats'], (res) => {
          const existingChats = res.crm_whatsapp_chats || [];
          const mergedMap = new Map();
          
          // 1. Populate map with existing chats
          existingChats.forEach(c => {
            if (c.phone) mergedMap.set(c.phone.slice(-8), c);
          });
          
          // 2. Merge visible DOM chats (provides real-time dynamic updates)
          visibleChats.forEach(c => {
            if (c.phone) {
              const suffix = c.phone.slice(-8);
              const existing = mergedMap.get(suffix);
              if (existing) {
                mergedMap.set(suffix, {
                  ...existing,
                  name: c.name || existing.name,
                  lastMessage: c.lastMessage || existing.lastMessage,
                  unreadCount: typeof c.unreadCount === 'number' ? c.unreadCount : existing.unreadCount,
                  photo: c.photo || existing.photo
                });
              } else {
                mergedMap.set(suffix, c);
              }
            }
          });
          
          safeStorageSet({ crm_whatsapp_chats: Array.from(mergedMap.values()) });
        });
      }
      
      // Sync current active chat messages
      if (currentPhone || currentName) {
        const messages = getActiveChatMessages();
        // Get the active conversation name from WhatsApp header for name-matching
        const activeHeaderName = (
          document.querySelector('[data-testid="conversation-info-header"] [data-testid="conversation-info-header-chat-title"] span') ||
          document.querySelector('header [data-testid="chatlist-header"]') ||
          document.querySelector('header span[title]') ||
          document.querySelector('header span[dir="auto"]')
        )?.innerText?.trim() || currentName || '';

        safeStorageSet({
          crm_whatsapp_messages: messages,
          crm_whatsapp_active_phone: currentPhone,
          crm_whatsapp_active_name: activeHeaderName.toLowerCase()
        });
      }

      // Sync debug stats to local storage for crm.html to display
      safeStorageGet(['crm_dom_debug'], (storedRes) => {
        const debug = storedRes.crm_dom_debug || {};
        const paneSide = document.getElementById('pane-side');
        debug.has_pane_side = !!paneSide;
        
        if (paneSide) {
          const elementsWithDataId = paneSide.querySelectorAll('[data-id]');
          debug.data_id_count = elementsWithDataId.length;
          if (elementsWithDataId.length > 0) {
            debug.data_ids_sample = Array.from(elementsWithDataId).slice(0, 5).map(el => el.getAttribute('data-id'));
          }
          
          const elementsWithTestId = paneSide.querySelectorAll('[data-testid]');
          debug.testid_count = elementsWithTestId.length;
          if (elementsWithTestId.length > 0) {
            debug.testids_sample = Array.from(elementsWithTestId).slice(0, 5).map(el => el.getAttribute('data-testid'));
          }
          
          const elementsWithRole = paneSide.querySelectorAll('[role]');
          debug.role_count = elementsWithRole.length;
          if (elementsWithRole.length > 0) {
            debug.roles_sample = Array.from(elementsWithRole).slice(0, 5).map(el => el.getAttribute('role'));
          }

          const children = paneSide.children;
          debug.children_count = children.length;
          if (children.length > 0) {
            debug.children_tags = Array.from(children).slice(0, 3).map(c => {
              return {
                tagName: c.tagName,
                className: c.className,
                htmlSlice: c.outerHTML.substring(0, 200)
              };
            });
          }
        }
        
        const listItems = document.querySelectorAll('[data-testid="chat-list-item"]');
        debug.list_items_count = listItems.length;

        // Inspect the confirmed chat list container
        const chatListContainer = document.querySelector(
          '[data-testid="chat-list"] [aria-label="Lista de conversas"], ' +
          '[data-testid="chat-list"] [aria-label="Chat list"], ' +
          '[data-testid="chat-list"] [aria-label*="conversa"], ' +
          '[data-testid="chat-list"] [role="list"]'
        );
        debug.chat_list_container_found = !!chatListContainer;
        if (chatListContainer) {
          debug.chat_list_children_count = chatListContainer.children.length;
          debug.chat_list_aria = chatListContainer.getAttribute('aria-label');
          debug.chat_list_role = chatListContainer.getAttribute('role');
          if (chatListContainer.children.length > 0) {
            const firstChild = chatListContainer.children[0];
            debug.first_chat_row_html = firstChild.outerHTML.substring(0, 400);
          }
        } else {
          // Show all aria-labels inside chat-list to find correct container
          const chatList = document.querySelector('[data-testid="chat-list"]');
          if (chatList) {
            const allAriaLabels = Array.from(chatList.querySelectorAll('[aria-label]')).slice(0, 10).map(el => ({
              tag: el.tagName, aria: el.getAttribute('aria-label'), role: el.getAttribute('role')
            }));
            debug.chat_list_aria_labels = allAriaLabels;
          }
        }
        
        // Inspect #main area for message structure (may not exist in Business Web)
        const mainEl = document.getElementById('main');
        debug.has_main = !!mainEl;

        // Search for conversation panel alternatives in WhatsApp Business Web
        const convPanelCandidates = [
          document.querySelector('[role="main"]'),
          document.querySelector('[data-testid="conversation-panel-messages"]'),
          document.querySelector('[data-testid="conversation-panel"]'),
          document.querySelector('[data-testid="msg-list"]'),
          document.querySelector('[aria-label="Lista de mensagens"]'),
          document.querySelector('[aria-label="Message list"]'),
          document.querySelector('[aria-label*="mensagen"]'),
          document.querySelector('[aria-label*="message"]'),
        ];
        const foundConvPanel = convPanelCandidates.find(el => el !== null);
        debug.conv_panel_found = !!foundConvPanel;
        if (foundConvPanel) {
          debug.conv_panel_tag = foundConvPanel.tagName;
          debug.conv_panel_aria = foundConvPanel.getAttribute('aria-label');
          debug.conv_panel_testid = foundConvPanel.getAttribute('data-testid');
          debug.conv_panel_role = foundConvPanel.getAttribute('role');
        }

        // Scan full document for message-related testids (not just pane-side)
        const globalMsgTestIds = Array.from(document.querySelectorAll('[data-testid]'))
          .map(el => el.getAttribute('data-testid'))
          .filter(id => id && (id.includes('msg') || id.includes('message') || id.includes('conversation') || id.includes('bubble')));
        debug.global_msg_testids = [...new Set(globalMsgTestIds)].slice(0, 15);

        // Find all data-tab elements (WhatsApp Business Web panels)
        const dataTabs = Array.from(document.querySelectorAll('[data-tab]')).map(el => ({
          tab: el.getAttribute('data-tab'),
          testid: el.getAttribute('data-testid'),
          id: el.id,
          role: el.getAttribute('role'),
          childrenCount: el.children.length
        }));
        debug.data_tabs = dataTabs.slice(0, 8);

        // Check for large divs that might be the conversation panel
        const appDiv = document.getElementById('app');
        if (appDiv) {
          const topChildren = Array.from(appDiv.children).map(c => ({
            id: c.id, tag: c.tagName, role: c.getAttribute('role'),
            testid: c.getAttribute('data-testid'), children: c.children.length
          }));
          debug.app_top_children = topChildren;
        }

        // Query IndexedDB databases list for visual debugging in the CRM footer
        if (window.indexedDB && window.indexedDB.databases) {
          window.indexedDB.databases().then(dbs => {
            debug.indexed_dbs = dbs.map(d => d.name);
            safeStorageSet({ crm_dom_debug: debug });
          }).catch(e => {
            debug.indexed_dbs_error = e.message;
            safeStorageSet({ crm_dom_debug: debug });
          });
        } else {
          debug.indexed_dbs = 'not_supported';
          safeStorageSet({ crm_dom_debug: debug });
        }

        safeStorageSet({ crm_dom_debug: debug });
      });
    } catch (e) {
      // Extension context invalidated - stop the interval
      clearInterval(syncInterval);
    }
  }, 2000);

  const syncIdb = () => {
    if (!chrome.runtime?.id) return;
    console.log('[CRM] Executando sincronização de banco de dados IndexedDB...');
    getChatsFromIndexedDB().then((idbChats) => {
      if (!idbChats || idbChats.length === 0) {
        console.log('[CRM] Nenhum chat retornado do IndexedDB.');
        return;
      }
      console.log(`[CRM] Sincronizando ${idbChats.length} conversas do banco de dados...`);
      safeStorageGet(['crm_whatsapp_chats'], (res) => {
        const existingChats = res.crm_whatsapp_chats || [];
        const mergedMap = new Map();
        
        // 1. Populate map with existing chats
        existingChats.forEach(c => {
          if (c.phone) mergedMap.set(c.phone.slice(-8), c);
        });
        
        // 2. Merge IndexedDB chats (contains all historical chats!)
        idbChats.forEach(c => {
          if (c.phone) {
            const suffix = c.phone.slice(-8);
            const existing = mergedMap.get(suffix);
            if (existing) {
              mergedMap.set(suffix, {
                ...existing,
                name: c.name || existing.name,
                lastMessage: c.lastMessage || existing.lastMessage,
                unreadCount: typeof c.unreadCount === 'number' ? c.unreadCount : existing.unreadCount,
                photo: c.photo || existing.photo
              });
            } else {
              mergedMap.set(suffix, c);
            }
          }
        });
        
        safeStorageSet({ crm_whatsapp_chats: Array.from(mergedMap.values()) });
        if (crmPanelVisible) renderCrmInPageBoard();
      });
    });
  };

  // Run first IndexedDB sync after 8 seconds (to let WhatsApp Web fully load safely)
  setTimeout(syncIdb, 8000);
  // Run periodic IndexedDB sync every 45 seconds
  setInterval(syncIdb, 45000);

  // Expose syncIdb to window so we can trigger it from message listeners
  window._crmSyncIdb = syncIdb;

  // MutationObserver: save messages to storage immediately when conversation panel DOM changes
  // This handles the case where messages render AFTER our polling attempts
  let msgObserverDebounce = null;
  const msgObserver = new MutationObserver(() => {
    if (!chrome.runtime?.id) { msgObserver.disconnect(); return; }
    clearTimeout(msgObserverDebounce);
    msgObserverDebounce = setTimeout(() => {
      if (!(currentPhone || currentName)) return;
      const messages = getActiveChatMessages();
      if (messages.length > 0) {
        const activeHeaderName = (
          document.querySelector('[data-testid="conversation-info-header-chat-title"] span') ||
          document.querySelector('[data-testid="conversation-info-header"] span[dir]') ||
          document.querySelector('header span[title]') ||
          document.querySelector('header span[dir="auto"]')
        )?.innerText?.trim() || currentName || '';
        safeStorageSet({
          crm_whatsapp_messages: messages,
          crm_whatsapp_active_phone: currentPhone || '',
          crm_whatsapp_active_name: activeHeaderName.toLowerCase()
        });
      }
    }, 300);
  });

  // Start observing once the main panel exists (retry every second until found)
  const startObserving = () => {
    const mainPanel = document.getElementById('main') ||
                      document.querySelector('[role="main"]') ||
                      document.querySelector('[data-testid="conversation-panel"]');
    if (mainPanel) {
      msgObserver.observe(mainPanel, { childList: true, subtree: true });
      console.log('[CRM] MutationObserver attached to conversation panel');
    } else {
      setTimeout(startObserving, 1000);
    }
  };
  setTimeout(startObserving, 2000);
}

function detectActiveChat() {
  if (!crmToken) return;

  let detectedPhone = '';
  
  // 1. Try URL hash first (instant and 100% reliable on WhatsApp Web)
  const hash = window.location.hash || '';
  if (hash.includes('/chat/')) {
    const parts = hash.split('/chat/')[1];
    if (parts && parts.includes('@c.us')) {
      detectedPhone = parts.split('@')[0].replace(/\D/g, '');
    }
  }

  // 2. Fetch name from DOM header (multiple fallbacks for Business Web)
  const headerNameElement = 
    document.querySelector('#main header span[title]') || 
    document.querySelector('#main header div[title]') || 
    document.querySelector('[data-testid="conversation-info-header-chat-title"] span') ||
    document.querySelector('[data-testid="conversation-header"] span[dir="auto"]') ||
    document.querySelector('header span[dir="auto"]') ||
    document.querySelector('[data-testid="conversation-info"] span[title]');
                            
  const chatName = headerNameElement ? (headerNameElement.getAttribute('title') || headerNameElement.innerText || '').trim() : '';

  // 3. Fallback DOM detection via selected list item (Business Web)
  if (!detectedPhone) {
    // Check the selected row in the chat list (aria-selected="true")
    const selectedRow = document.querySelector('[data-testid^="list-item-"] [aria-selected="true"]')?.closest('[data-testid^="list-item-"]') ||
                        document.querySelector('[aria-selected="true"]')?.closest('[data-testid^="list-item-"]');
    if (selectedRow) {
      const img = selectedRow.querySelector('img[src*="%40c.us"], img[src*="u="]');
      if (img) {
        const match = img.src.match(/u=(\d+)%40c\.us/);
        if (match) detectedPhone = match[1];
      }
    }
  }

  // 4. Fallback via data-id (WhatsApp personal)
  if (!detectedPhone) {
    const selectedChatListItem = document.querySelector('[data-testid="chat-list-item"] [aria-selected="true"]') ||
                                 document.querySelector('div[data-id*="@c.us"]');
    if (selectedChatListItem) {
      const dataId = selectedChatListItem.closest('[data-id]')?.getAttribute('data-id') || '';
      if (dataId.endsWith('@c.us')) {
        detectedPhone = dataId.split('@')[0];
      }
    }
  }

  if (!detectedPhone && chatName && /^\+?[\d\s\-()]{10,}$/.test(chatName)) {
    detectedPhone = chatName.replace(/\D/g, '');
  }

  // Always sync the active chat name for message matching
  if (chatName && chatName !== currentName) {
    safeStorageSet({ crm_whatsapp_active_name: chatName.toLowerCase() });
  }

  if (detectedPhone && detectedPhone !== currentPhone) {
    currentPhone = detectedPhone;
    currentName = chatName || detectedPhone;
    loadContactData(currentPhone, currentName);
  } else if (!detectedPhone && chatName && chatName !== currentName) {
    // We have a name but no phone yet - still update currentName for message matching
    currentName = chatName;
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
      // Save to storage so in-page CRM panel can read them
      safeStorageSet({ crm_leads: leadsList, crm_stages: funnelStages });
      injectHorizontalTabs();
      applyChatListFilter();
      // Refresh in-page panel if visible
      if (crmPanelVisible) renderCrmInPageBoard();
    }
  } catch (err) {
    console.error(err);
  }
}

// Left side panel horizontal filters tabs (fixed at top of page, offset by left vertical menu)
function injectHorizontalTabs() {
  if (!crmToken) return;

  let tabsBar = document.getElementById('crm-horizontal-filter-tabs');
  if (!tabsBar) {
    tabsBar = document.createElement('div');
    tabsBar.id = 'crm-horizontal-filter-tabs';
    tabsBar.className = 'crm-horizontal-tabs';
    
    tabsBar.style.setProperty('position', 'fixed', 'important');
    tabsBar.style.setProperty('left', '60px', 'important');
    tabsBar.style.setProperty('top', '0', 'important');
    tabsBar.style.setProperty('right', '0', 'important');
    tabsBar.style.setProperty('height', '50px', 'important');
    tabsBar.style.setProperty('z-index', '99998', 'important');
    tabsBar.style.setProperty('background-color', '#f8fafc', 'important');
    tabsBar.style.setProperty('border-bottom', '1px solid #e2e8f0', 'important');
    tabsBar.style.setProperty('display', 'flex', 'important');
    tabsBar.style.setProperty('align-items', 'center', 'important');
    tabsBar.style.setProperty('padding', '0 20px', 'important');
    tabsBar.style.setProperty('gap', '8px', 'important');
    tabsBar.style.setProperty('overflow-x', 'auto', 'important');
    tabsBar.style.setProperty('box-sizing', 'border-box', 'important');
    
    document.body.appendChild(tabsBar);
  }

  const app = document.getElementById('app') || document.querySelector('.app-wrapper');
  if (app) {
    app.style.setProperty('margin-top', '50px', 'important');
    app.style.setProperty('height', 'calc(100vh - 50px)', 'important');
  }

  let tabsHtml = `
    <button class="crm-tab-tag ${activeFilterStage === 'all' ? 'active' : ''}" data-stage="all" style="height: 30px !important; min-height: 30px !important; max-height: 30px !important; flex: none !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; border-radius: 9999px !important; padding: 0 12px !important; font-size: 11px !important; font-weight: bold !important; cursor: pointer !important; white-space: nowrap !important; margin: 0 2px !important; border: 1px solid #cbd5e1 !important; background-color: #ffffff !important; color: #475569 !important; box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important;">
      <span>Tudo</span>
      <span class="crm-tab-tag-count" style="margin-left: 6px !important; font-size: 9px !important; background-color: #f1f5f9 !important; color: #64748b !important; padding: 1px 5px !important; border-radius: 999px !important;">${leadsList.length}</span>
    </button>
  `;

  funnelStages.forEach(st => {
    const stageLeadsCount = leadsList.filter(l => l.stage === st.key).length;
    const isActive = activeFilterStage === st.key;
    
    tabsHtml += `
      <button class="crm-tab-tag ${isActive ? 'active' : ''}" data-stage="${st.key}" style="height: 30px !important; min-height: 30px !important; max-height: 30px !important; flex: none !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; border-radius: 9999px !important; padding: 0 12px !important; font-size: 11px !important; font-weight: bold !important; cursor: pointer !important; white-space: nowrap !important; margin: 0 2px !important; border: 1px solid ${isActive ? '#bfdbfe' : '#cbd5e1'} !important; background-color: ${isActive ? '#eff6ff' : '#ffffff'} !important; color: ${isActive ? '#2563eb' : '#475569'} !important; box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important;">
        <span>${st.title}</span>
        <span class="crm-tab-tag-count" style="margin-left: 6px !important; font-size: 9px !important; background-color: ${isActive ? '#2563eb' : '#f1f5f9'} !important; color: ${isActive ? '#ffffff' : '#64748b'} !important; padding: 1px 5px !important; border-radius: 999px !important;">${stageLeadsCount}</span>
      </button>
    `;
  });

  tabsBar.innerHTML = tabsHtml;

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

  // WhatsApp Business Web uses data-testid^="list-item-" for chat rows
  // Personal WhatsApp Web uses data-testid="chat-list-item"
  const chatItems = document.querySelectorAll(
    '[data-testid^="list-item-"], [data-testid="chat-list-item"], [role="row"][data-id]'
  );

  if (activeFilterStage === 'all') {
    chatItems.forEach(item => {
      item.style.removeProperty('display');
    });
    return;
  }

  const stageLeads = leadsList.filter(l => l.stage === activeFilterStage);
  const allowedPhones = new Set(stageLeads.map(l => l.phone));
  // Also build a set of last-8-digits for fuzzy matching
  const allowedSuffixes = new Set(
    stageLeads
      .map(l => l.phone && !l.phone.startsWith('name_') ? l.phone.replace(/\D/g, '').slice(-8) : '')
      .filter(s => s.length >= 8)
  );

  chatItems.forEach(item => {
    // Method 1: extract from data-testid="list-item-PHONE@c.us"
    const testid = item.getAttribute('data-testid') || '';
    let phone = '';
    if (testid.includes('@c.us')) {
      phone = testid.replace('list-item-', '').split('@')[0].replace(/\D/g, '');
    }

    // Method 2: extract from data-id
    if (!phone) {
      const dataId = item.closest('[data-id]')?.getAttribute('data-id') ||
                     item.querySelector('[data-id]')?.getAttribute('data-id') ||
                     item.getAttribute('data-id') || '';
      if (dataId) phone = dataId.split('@')[0].replace(/\D/g, '');
    }

    const suffix = phone ? phone.slice(-8) : '';
    const isAllowed = (phone && allowedPhones.has(phone)) ||
                      (suffix && suffix.length >= 8 && allowedSuffixes.has(suffix));

    if (isAllowed) {
      item.style.setProperty('display', 'flex', 'important');
    } else {
      item.style.setProperty('display', 'none', 'important');
    }
  });
}

// Helper: Safely send message to extension background, catching context invalidation
function safeSendMessage(message, callback) {
  try {
    if (chrome.runtime && chrome.runtime.id) {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.log('[CRM] safeSendMessage runtime error:', chrome.runtime.lastError.message);
        }
        if (callback) callback(response);
      });
    } else {
      console.log('[CRM] Não foi possível enviar mensagem: Contexto de extensão inválido ou recarregado.');
    }
  } catch (e) {
    console.log('[CRM] Erro capturado no envio de mensagem (contexto inválido):', e.message);
  }
}

// Left vertical toolbar manager
// ===== CRM IN-PAGE FULL-SCREEN PANEL =====
let crmPanelVisible = false;
let crmPanelDragPhone = null;

function getInitialsIP(name) {
  const nameStr = String(name || '');
  if (!nameStr) return '?';
  const parts = nameStr.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColorIP(name) {
  const nameStr = String(name || '');
  const colors = [
    ['#0d9488','#0891b2'],['#7c3aed','#6366f1'],['#db2777','#e11d48'],
    ['#ea580c','#d97706'],['#16a34a','#0d9488'],['#0369a1','#0284c7']
  ];
  let hash = 0;
  for (let i = 0; i < nameStr.length; i++) hash = (hash + nameStr.charCodeAt(i)) % colors.length;
  return colors[Math.abs(hash) % colors.length];
}

function openChatFromPanel(lead) {
  // Switch to WhatsApp mode and open that conversation
  const panel = document.getElementById('crm-inpage-panel');
  if (panel) { panel.classList.remove('visible'); }
  crmPanelVisible = false;

  // Show the "← CRM" back button
  const backBtn = document.getElementById('crm-back-to-crm-btn');
  if (backBtn) { backBtn.classList.add('visible'); }

  // Update toolbar button
  const funnelBtn = document.getElementById('crm-left-btn-funnel');
  if (funnelBtn) funnelBtn.classList.remove('crm-mode-active');

  // Click the conversation in WhatsApp sidebar
  if (lead.phone) {
    selectChatInBackground(lead.phone);
  }
}

// Custom clean Modal replacement for prompt()
function showCrmInPageModal(title, fields, onSave) {
  const existing = document.getElementById('crm-ip-custom-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'crm-ip-custom-modal';
  modal.style = `
    position: fixed;
    inset: 0;
    z-index: 100005;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  let inputsHtml = '';
  fields.forEach(f => {
    if (f.type === 'textarea') {
      inputsHtml += `
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">${f.label}</label>
          <textarea id="modal-field-${f.id}" rows="4" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; font-size: 13px; outline: none; resize: none; box-sizing: border-box;" placeholder="${f.placeholder || ''}">${f.value || ''}</textarea>
        </div>
      `;
    } else if (f.type === 'datetime-local') {
      inputsHtml += `
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">${f.label}</label>
          <input type="datetime-local" id="modal-field-${f.id}" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; font-size: 13px; outline: none; box-sizing: border-box;" value="${f.value || ''}">
        </div>
      `;
    }
  });

  modal.innerHTML = `
    <div style="background: #ffffff; width: 90%; max-width: 400px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); overflow: hidden; animation: crmModalFadeIn 0.2s ease-out; box-sizing: border-box;">
      <div style="padding: 16px 20px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 13px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.3px;">${title}</span>
        <button id="crm-ip-modal-close" style="background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; padding: 4px; line-height: 1;">&times;</button>
      </div>
      <div style="padding: 20px; box-sizing: border-box;">
        ${inputsHtml}
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px;">
          <button id="crm-ip-modal-cancel" style="background: #f1f5f9; color: #475569; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer;">Cancelar</button>
          <button id="crm-ip-modal-save" style="background: #0d9488; color: #ffffff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer;">Salvar</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  if (!document.getElementById('crm-modal-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'crm-modal-animation-styles';
    style.innerHTML = `
      @keyframes crmModalFadeIn {
        from { transform: scale(0.96); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  const closeModal = () => modal.remove();
  modal.querySelector('#crm-ip-modal-close').addEventListener('click', closeModal);
  modal.querySelector('#crm-ip-modal-cancel').addEventListener('click', closeModal);

  modal.querySelector('#crm-ip-modal-save').addEventListener('click', () => {
    const result = {};
    fields.forEach(f => {
      const el = modal.querySelector(`#modal-field-${f.id}`);
      if (el) result[f.id] = el.value;
    });
    onSave(result, closeModal);
  });
}


function renderCrmInPageBoard() {
  const panel = document.getElementById('crm-inpage-panel');
  if (!panel) return;

  safeStorageGet(['crm_leads', 'crm_stages', 'crm_sellers', 'crm_whatsapp_chats', 'crm_dom_debug'], (stored) => {
    const leads = stored.crm_leads || leadsList || [];
    const stages = (stored.crm_stages && stored.crm_stages.length > 0) ? stored.crm_stages : funnelStages;
    const waChats = stored.crm_whatsapp_chats || [];
    const sellers = stored.crm_sellers || sellersList || [];

    // Enrich leads with WhatsApp data
    const enrichedLeads = leads.map(l => {
      const chat = waChats.find(c => c.phone === l.phone || 
        (c.phone && l.phone && c.phone.slice(-8) === l.phone.slice(-8)));
      return { ...l, lastMessage: chat ? chat.lastMessage : (l.lastMessage || ''), 
               photo: chat ? chat.photo : '', unreadCount: chat ? chat.unreadCount : 0 };
    });

    // Auto-inbox: include ALL WhatsApp chats that don't have an explicit lead in another stage
    // This mirrors the original CRM behavior that shows 66+ contacts in Inbox
    const leadedPhoneSuffixes = new Set(
      leads
        .filter(l => l.stage && l.stage !== 'inbox')
        .map(l => l.phone ? l.phone.replace(/\D/g, '').slice(-8) : '')
        .filter(s => s.length >= 8)
    );
    const explicitPhoneSuffixes = new Set(
      leads.map(l => l.phone ? l.phone.replace(/\D/g, '').slice(-8) : '').filter(s => s.length >= 8)
    );

    const autoInboxChats = waChats
      .filter(c => {
        if (!c.phone) return false;
        const suffix = c.phone.replace(/\D/g, '').slice(-8);
        if (suffix.length < 8) return false;
        // Skip if this chat belongs to a lead that's in a non-inbox stage
        if (leadedPhoneSuffixes.has(suffix)) return false;
        // Skip if this chat already has an explicit lead entry (avoids duplicates)
        if (explicitPhoneSuffixes.has(suffix)) return false;
        return true;
      })
      .map(c => ({
        phone: c.phone,
        name: c.name || c.phone,
        stage: 'inbox',
        lastMessage: c.lastMessage || '',
        photo: c.photo || '',
        unreadCount: c.unreadCount || 0,
        value: 0,
        _autoInbox: true
      }));

    // Merge: explicit leads + auto-inbox chats
    const allLeads = [...enrichedLeads, ...autoInboxChats];

    const dbDebug = stored.crm_dom_debug || {};
    const dbInfoObj = dbDebug.indexed_db_debug;
    let idbInfo = 'Carregando diagnósticos do banco...';
    if (dbInfoObj) {
      const errText = dbInfoObj.error ? ` | Erro: ${dbInfoObj.error}` : '';
      const listDbs = dbInfoObj.dbs ? dbInfoObj.dbs.join(', ') : 'nenhum';
      let sampleText = '';
      if (dbInfoObj.rawSample && dbInfoObj.rawSample.length > 0) {
        const miniSample = dbInfoObj.rawSample.slice(0, 2).map(s => `[ID:${s.idVal},ContactKeys:${s.contactKeys},PicKeys:${s.picKeys},RecordKeys:${s.recordKeys}]`).join(';');
        sampleText = ` | Amostra: ${miniSample.substring(0, 450)}`;
      }
      idbInfo = `Banco: ${dbInfoObj.selectedDb || 'nenhum'} (Lidos: ${dbInfoObj.recordsCount || 0}, Filtrados: ${dbInfoObj.extractedCount || 0})${errText}${sampleText} | Bancos: [${listDbs}]`;
    } else if (dbDebug.indexed_db_debug_error) {
      idbInfo = `Erro de execução: ${dbDebug.indexed_db_debug_error}`;
    }

    const sellerOptions = sellers.length > 0
      ? `<option value="all">Todos os Vendedores</option>` + sellers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')
      : `<option value="all">Todos os Vendedores</option>`;

    // Save scroll positions of all cards containers
    const scrollPositions = {};
    const crmIpCards = panel.querySelectorAll('.crm-ip-cards');
    crmIpCards.forEach(el => {
      const stage = el.dataset.stage;
      if (stage) {
        scrollPositions[stage] = el.scrollTop;
      }
    });

    panel.innerHTML = `
      <div class="crm-ip-topbar">
        <div class="crm-ip-topbar-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Clean Tech Smart CRM
        </div>
        <span class="crm-ip-title">Funil de Vendas</span>
        <div class="crm-ip-topbar-spacer"></div>
        <div class="crm-ip-filter-group">
          <span class="crm-ip-filter-label">Vendedor:</span>
          <select class="crm-ip-filter-select" id="crm-ip-seller-filter">${sellerOptions}</select>
        </div>
        <button class="crm-ip-btn-whatsapp" id="crm-ip-go-whatsapp">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Ir para WhatsApp
        </button>
      </div>
      <div class="crm-ip-board" id="crm-ip-board-area"></div>
      <div class="crm-ip-debug-footer" style="padding: 8px 16px; background: #1e293b; color: #38bdf8; border-top: 1px solid #334155; font-family: monospace; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
        🔍 <strong>Diag:</strong> ${idbInfo}
      </div>
    `;

    // Render columns
    const boardArea = panel.querySelector('#crm-ip-board-area');
    stages.forEach(st => {
      const stageLeads = allLeads.filter(l => l.stage === st.key || (!l.stage && st.key === 'inbox'));
      const colEl = document.createElement('div');
      colEl.className = 'crm-ip-col';
      const borderColor = (st.color || '').match(/#[0-9a-fA-F]{3,6}/)?.[0] || '#94a3b8';
      colEl.style.borderTopColor = borderColor;
      colEl.innerHTML = `
        <div class="crm-ip-col-header">
          <span class="crm-ip-col-title">${st.title}</span>
          <span class="crm-ip-col-count">${stageLeads.length}</span>
        </div>
        <div class="crm-ip-cards" data-stage="${st.key}"></div>
      `;

      const cardsContainer = colEl.querySelector('.crm-ip-cards');

      if (stageLeads.length === 0) {
        cardsContainer.innerHTML = '<div class="crm-ip-empty">Sem contatos</div>';
      }

      stageLeads.forEach(lead => {
        const card = document.createElement('div');
        card.className = 'crm-ip-card';
        card.draggable = true;
        card.dataset.phone = lead.phone;

        const [c1, c2] = getAvatarColorIP(lead.name || lead.phone);
        const initials = getInitialsIP(lead.name || lead.phone);
        const displayPhone = lead.phone && !lead.phone.startsWith('name_') ? lead.phone : '';
        const preview = lead.lastMessage ? lead.lastMessage.substring(0, 40) : (lead.notes ? lead.notes.substring(0, 40) : '');

        card.innerHTML = `
          <div class="crm-ip-card-top">
            <div class="crm-ip-avatar" style="background: linear-gradient(135deg, ${c1}, ${c2});">
              ${lead.photo ? `<img src="${lead.photo}" alt="" onerror="this.style.display='none'">` : initials}
            </div>
            <div style="flex:1;min-width:0;">
              <div class="crm-ip-card-name">${lead.name || lead.phone}</div>
              ${displayPhone ? `<div class="crm-ip-card-phone">${displayPhone}</div>` : ''}
            </div>
            ${lead.unreadCount > 0 ? `<span style="background:#ef4444;color:#fff;font-size:9px;font-weight:800;border-radius:999px;padding:2px 6px;">${lead.unreadCount}</span>` : ''}
          </div>
          ${preview ? `<div class="crm-ip-card-preview">${preview}</div>` : ''}
          <div class="crm-ip-card-footer">
            ${lead.value > 0 ? `<span class="crm-ip-card-badge">R$ ${Number(lead.value).toLocaleString('pt-BR')}</span>` : ''}
          </div>
          <div class="crm-ip-card-actions">
            <button class="crm-ip-action-btn note" title="Nota" data-action="note">📝</button>
            <button class="crm-ip-action-btn reminder" title="Lembrete" data-action="reminder">⏰</button>
            <button class="crm-ip-action-btn ticket" title="Ticket" data-action="ticket">🎫</button>
          </div>
          <span class="crm-ip-open-chat-hint">💬 Abrir</span>
        `;

        // Click card → open conversation
        card.addEventListener('click', (e) => {
          if (e.target.closest('.crm-ip-action-btn')) return;
          openChatFromPanel(lead);
        });

        // Action buttons (replaces standard ugly prompt windows)
        card.querySelector('[data-action="note"]').addEventListener('click', (e) => {
          e.stopPropagation();
          showCrmInPageModal(`Nota para ${lead.name || lead.phone}`, [
            { id: 'noteText', type: 'textarea', label: 'Nova Anotação', placeholder: 'Escreva a anotação...' }
          ], (data, close) => {
            if (data.noteText && data.noteText.trim()) {
              fetch(`${crmServerUrl}/api/crm/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${crmToken}` },
                body: JSON.stringify({ phone: lead.phone, name: lead.name, note: data.noteText.trim(), seller_id: crmUser?.id })
              }).then(() => {
                alert('✅ Nota salva com sucesso!');
                close();
              }).catch(() => alert('❌ Erro ao salvar nota'));
            } else {
              alert('A nota não pode estar vazia.');
            }
          });
        });

        card.querySelector('[data-action="reminder"]').addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Pre-populate input box local timezone ISO string helper
          const tzoffset = (new Date()).getTimezoneOffset() * 60000;
          const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);

          showCrmInPageModal(`Lembrete para ${lead.name || lead.phone}`, [
            { id: 'timeStr', type: 'datetime-local', label: 'Data e Hora', value: localISOTime }
          ], (data, close) => {
            if (data.timeStr) {
              const time = new Date(data.timeStr).toISOString();
              safeSendMessage({ action: 'scheduleReminder', phone: lead.phone, name: lead.name, time });
              alert('✅ Lembrete agendado com sucesso!');
              close();
            } else {
              alert('Defina a data e hora.');
            }
          });
        });

        card.querySelector('[data-action="ticket"]').addEventListener('click', (e) => {
          e.stopPropagation();
          alert('🎫 Para abrir chamado, use a barra lateral do cliente ativo clicando no ícone de chat (💬) no menu esquerdo.');
        });


        // Drag & Drop
        card.addEventListener('dragstart', (ev) => {
          crmPanelDragPhone = lead.phone;
          ev.dataTransfer.setData('text/plain', lead.phone);
          ev.dataTransfer.setData('text/stage', st.key);
          document.body.classList.add('crm-dragging-active');
          card.classList.add('dragging');
        });
        card.addEventListener('dragend', () => {
          document.body.classList.remove('crm-dragging-active');
          card.classList.remove('dragging');
        });

        cardsContainer.appendChild(card);
      });

      // Column drop zone
      colEl.addEventListener('dragover', (ev) => {
        ev.preventDefault();
        colEl.classList.add('drag-over');
      });
      colEl.addEventListener('dragleave', () => colEl.classList.remove('drag-over'));
      colEl.addEventListener('drop', async (ev) => {
        ev.preventDefault();
        colEl.classList.remove('drag-over');
        document.body.classList.remove('crm-dragging-active');
        const phone = ev.dataTransfer.getData('text/plain');
        const sourceStage = ev.dataTransfer.getData('text/stage');
        if (phone && sourceStage !== st.key) {
          try {
            await fetch(`${crmServerUrl}/api/crm/lead-stage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${crmToken}` },
              body: JSON.stringify({ phone, stage: st.key })
            });
            // Update local leadsList
            const lead = leadsList.find(l => l.phone === phone);
            if (lead) lead.stage = st.key;
            renderCrmInPageBoard();
          } catch(err) { console.error('[CRM Panel] drop error:', err); }
        }
      });

      boardArea.appendChild(colEl);
    });

    // Restore scroll positions of all cards containers
    const newCrmIpCards = panel.querySelectorAll('.crm-ip-cards');
    newCrmIpCards.forEach(el => {
      const stage = el.dataset.stage;
      if (stage && scrollPositions[stage] !== undefined) {
        el.scrollTop = scrollPositions[stage];
      }
    });

    // Go to WhatsApp button
    panel.querySelector('#crm-ip-go-whatsapp').addEventListener('click', () => {
      toggleCrmPanel();
    });
  });
}

function injectCrmPanel() {
  if (document.getElementById('crm-inpage-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'crm-inpage-panel';
  document.body.appendChild(panel);

  // Back to CRM button (shown when in WhatsApp mode)
  const backBtn = document.createElement('button');
  backBtn.id = 'crm-back-to-crm-btn';
  backBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
    ← CRM
  `;
  backBtn.addEventListener('click', () => {
    toggleCrmPanel(true);
  });
  document.body.appendChild(backBtn);
}

function toggleCrmPanel(forceShow) {
  const panel = document.getElementById('crm-inpage-panel');
  const backBtn = document.getElementById('crm-back-to-crm-btn');
  const funnelBtn = document.getElementById('crm-left-btn-funnel');
  if (!panel) { injectCrmPanel(); return; }

  if (forceShow === true || !crmPanelVisible) {
    // Show CRM panel
    crmPanelVisible = true;
    if (typeof window._crmSyncIdb === 'function') {
      window._crmSyncIdb();
    }
    renderCrmInPageBoard();
    panel.classList.add('visible');
    if (backBtn) backBtn.classList.remove('visible');
    if (funnelBtn) funnelBtn.classList.add('crm-mode-active');
  } else {
    // Hide CRM panel (go to WhatsApp)
    crmPanelVisible = false;
    panel.classList.remove('visible');
    if (backBtn) backBtn.classList.add('visible');
    if (funnelBtn) funnelBtn.classList.remove('crm-mode-active');
  }
}

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

    <button class="crm-left-item" id="crm-left-btn-sidebar" title="CRM do Cliente Ativo">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </button>

    <button class="crm-left-item" id="crm-left-btn-link" title="Ir para o Painel Web">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </button>
  `;

  document.body.appendChild(toolbar);

  const app = document.getElementById('app') || document.querySelector('.app-wrapper');
  if (app) {
    app.style.setProperty('margin-left', '60px', 'important');
    app.style.setProperty('width', 'calc(100% - 60px)', 'important');
  }

  // Opens the in-page CRM panel (full-screen toggle)
  toolbar.querySelector('#crm-left-btn-funnel').addEventListener('click', () => {
    if (!document.getElementById('crm-inpage-panel')) injectCrmPanel();
    toggleCrmPanel();
  });

  toolbar.querySelector('#crm-left-btn-sidebar').addEventListener('click', () => {
    if (isSidebarVisible) {
      isSidebarVisible = false;
      removeSidebar();
    } else {
      isSidebarVisible = true;
      removeSidebar();
      initSidebar();
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
  
  const btnSidebar = toolbar.querySelector('#crm-left-btn-sidebar');
  if (btnSidebar) {
    if (isSidebarVisible) btnSidebar.classList.add('active');
    else btnSidebar.classList.remove('active');
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
      
      if (shadowRoot) {
        const select = shadowRoot.getElementById('lead-seller');
        if (select) {
          select.innerHTML = '<option value="">Nenhum</option>';
          sellersList.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
          });
        }
      }
    }
  } catch (err) {
    console.error('Erro ao buscar lista de vendedores:', err);
  }
}

async function loadContactData(phone, name) {
  currentPhone = phone;
  currentName = name;

  if (!shadowRoot || !isSidebarVisible) return;

  const headerSpan = shadowRoot.getElementById('active-lead-header');
  headerSpan.innerText = `🔄 Carregando dados de ${name}...`;

  try {
    const urlName = encodeURIComponent(name);
    const res = await fetch(`${crmServerUrl}/api/crm/contact?phone=${phone}&name=${urlName}`, {
      headers: { 'Authorization': `Bearer ${crmToken}` }
    });

    if (res.ok) {
      const data = await res.json();
      leadData = data;

      headerSpan.innerHTML = `👤 ${data.lead.name || name}`;
      
      shadowRoot.getElementById('crm-form').style.display = 'block';
      shadowRoot.getElementById('crm-empty-state').style.display = 'none';

      shadowRoot.getElementById('notes-container').style.display = 'block';
      shadowRoot.getElementById('notes-empty-state').style.display = 'none';

      shadowRoot.getElementById('related-container').style.display = 'block';
      shadowRoot.getElementById('related-empty-state').style.display = 'none';

      shadowRoot.getElementById('lead-name').value = data.lead.name || '';
      shadowRoot.getElementById('lead-stage').value = data.lead.stage || 'inbox';
      shadowRoot.getElementById('lead-value').value = data.lead.value || 0;
      shadowRoot.getElementById('lead-seller').value = data.lead.assigned_to || '';
      
      const nextContactInput = shadowRoot.getElementById('lead-next-contact');
      const reminderBadge = shadowRoot.getElementById('reminder-info');
      
      if (data.lead.next_contact_at) {
        const dateObj = new Date(data.lead.next_contact_at);
        const tzOffset = dateObj.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
        nextContactInput.value = localISOTime;
        reminderBadge.style.display = 'block';
      } else {
        nextContactInput.value = '';
        reminderBadge.style.display = 'none';
      }

      renderNotes(data.notes);
      renderContracts(data.contracts);
      renderTickets(data.tickets);

      const ticketBox = shadowRoot.getElementById('quick-ticket-box');
      const ticketEquipSelect = shadowRoot.getElementById('ticket-equip');
      
      if (data.clientId) {
        ticketBox.style.display = 'block';
        ticketEquipSelect.innerHTML = '<option value="">Selecione o Equipamento</option>';
        if (data.equipments && data.equipments.length > 0) {
          data.equipments.forEach(eq => {
            ticketEquipSelect.innerHTML += `<option value="${eq.id}">${eq.name} (${eq.brand} ${eq.model})</option>`;
          });
        } else {
          ticketEquipSelect.innerHTML = '<option value="">Nenhum equipamento cadastrado</option>';
        }
      } else {
        ticketBox.style.display = 'none';
      }

    } else {
      headerSpan.innerText = '❌ Erro ao carregar dados do CRM.';
    }
  } catch (err) {
    console.error('Erro ao buscar dados do CRM:', err);
    headerSpan.innerText = '❌ Erro de conexão com o painel.';
  }
}

function renderNotes(notes) {
  if (!shadowRoot) return;
  const container = shadowRoot.getElementById('notes-list-items');
  if (!container) return;
  container.innerHTML = '';
  
  if (notes.length === 0) {
    container.innerHTML = '<p style="font-size: 11px; color: #9ca3af; font-style: italic; margin: 0;">Nenhuma anotação registrada.</p>';
    return;
  }

  notes.forEach(note => {
    const formattedDate = new Date(note.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    container.innerHTML += `
      <div class="note-item">
        <div class="note-header">
          <span class="note-author">${note.author_name || 'Vendedor'}</span>
          <span>${formattedDate}</span>
        </div>
        <div class="note-content">${note.content}</div>
      </div>
    `;
  });
}

function renderContracts(contracts) {
  if (!shadowRoot) return;
  const container = shadowRoot.getElementById('contracts-grid-items');
  if (!container) return;
  container.innerHTML = '';

  if (!contracts || contracts.length === 0) {
    container.innerHTML = '<p style="font-size: 11px; color: #9ca3af; font-style: italic; margin: 0;">Nenhum contrato ativo.</p>';
    return;
  }

  contracts.forEach(c => {
    const startDate = new Date(c.start_date).toLocaleDateString('pt-BR');
    const badgeClass = c.status === 'Ativo' ? 'badge-active' : 'badge-pending';
    container.innerHTML += `
      <div class="item-card">
        <div class="item-card-title flex justify-between">
          <span>Contrato #${c.id}</span>
          <span class="badge ${badgeClass}">${c.status}</span>
        </div>
        <div class="item-card-meta">
          <span>Início: ${startDate}</span>
          <span>Valor: R$ ${c.total_price || '0,00'}</span>
        </div>
      </div>
    `;
  });
}

function renderTickets(tickets) {
  if (!shadowRoot) return;
  const container = shadowRoot.getElementById('tickets-grid-items');
  if (!container) return;
  container.innerHTML = '';

  if (!tickets || tickets.length === 0) {
    container.innerHTML = '<p style="font-size: 11px; color: #9ca3af; font-style: italic; margin: 0;">Nenhum chamado aberto.</p>';
    return;
  }

  tickets.forEach(t => {
    const ticketDate = t.scheduled_date ? new Date(t.scheduled_date).toLocaleDateString('pt-BR') : 'Sem data';
    const badgeClass = t.status === 'Aberto' ? 'badge-active' : (t.status === 'Concluído' ? 'badge-closed' : 'badge-pending');
    container.innerHTML += `
      <div class="item-card">
        <div class="item-card-title flex justify-between">
          <span>Chamado #${t.id} - ${t.ticket_type.toUpperCase()}</span>
          <span class="badge ${badgeClass}">${t.status}</span>
        </div>
        <div class="item-card-meta">
          <span>Agendado: ${ticketDate}</span>
        </div>
      </div>
    `;
  });
}

async function handleSaveLead(e) {
  e.preventDefault();
  const statusDiv = shadowRoot.getElementById('crm-save-status');
  statusDiv.innerText = 'Salvando...';

  const name = shadowRoot.getElementById('lead-name').value.trim();
  const stage = shadowRoot.getElementById('lead-stage').value;
  const value = shadowRoot.getElementById('lead-value').value;
  const assigned_to = shadowRoot.getElementById('lead-seller').value;
  const next_contact_at = shadowRoot.getElementById('lead-next-contact').value;

  try {
    const res = await fetch(`${crmServerUrl}/api/crm/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${crmToken}`
      },
      body: JSON.stringify({
        phone: currentPhone,
        name,
        stage,
        value,
        assigned_to: assigned_to || null,
        next_contact_at: next_contact_at || null
      })
    });

    if (res.ok) {
      statusDiv.innerText = '✅ CRM Atualizado!';
      setTimeout(() => { statusDiv.innerText = ''; }, 3000);

      if (next_contact_at) {
        safeSendMessage({
          action: 'scheduleReminder',
          phone: currentPhone,
          name: name || currentPhone,
          time: next_contact_at
        }, (response) => {
          if (response && response.success) {
            shadowRoot.getElementById('reminder-info').style.display = 'block';
          }
        });
      } else {
        shadowRoot.getElementById('reminder-info').style.display = 'none';
      }

      loadContactData(currentPhone, name || currentName);
      fetchLeadsAndRefresh();
    } else {
      statusDiv.innerText = '❌ Erro ao salvar dados.';
    }
  } catch (err) {
    console.error(err);
    statusDiv.innerText = '❌ Erro ao conectar ao servidor.';
  }
}

async function handleSaveNote() {
  const contentInput = shadowRoot.getElementById('new-note-content');
  const content = contentInput.value.trim();
  if (!content) return;

  const btn = shadowRoot.getElementById('btn-save-note');
  btn.disabled = true;
  btn.innerText = 'Adicionando...';

  try {
    const res = await fetch(`${crmServerUrl}/api/crm/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${crmToken}`
      },
      body: JSON.stringify({
        lead_phone: currentPhone,
        content
      })
    });

    if (res.ok) {
      contentInput.value = '';
      loadContactData(currentPhone, currentName);
    } else {
      alert('Erro ao salvar anotação.');
    }
  } catch (err) {
    console.error(err);
    alert('Erro de conexão ao servidor.');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Adicionar Nota';
  }
}

async function handleSaveQuickTicket(e) {
  e.preventDefault();
  const statusDiv = shadowRoot.getElementById('ticket-save-status');
  statusDiv.innerText = 'Abrindo chamado...';

  const equipment_id = shadowRoot.getElementById('ticket-equip').value;
  const ticket_type = shadowRoot.getElementById('ticket-type').value;
  const priority = shadowRoot.getElementById('ticket-priority').value;
  const description = shadowRoot.getElementById('ticket-desc').value.trim();
  const scheduled_date = shadowRoot.getElementById('ticket-date').value;

  if (!equipment_id || !description) {
    statusDiv.innerText = '❌ Equipamento e descrição obrigatórios.';
    return;
  }

  try {
    const res = await fetch(`${crmServerUrl}/api/save-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${crmToken}`
      },
      body: JSON.stringify({
        client_id: leadData.clientId,
        equipment_id,
        ticket_type,
        priority,
        description,
        scheduled_date: scheduled_date || null,
        status: 'Aberto'
      })
    });

    if (res.ok) {
      statusDiv.innerHTML = '✅ Chamado aberto com sucesso!';
      shadowRoot.getElementById('ticket-desc').value = '';
      shadowRoot.getElementById('ticket-date').value = '';
      loadContactData(currentPhone, currentName);
      setTimeout(() => { statusDiv.innerHTML = ''; }, 3000);
    } else {
      statusDiv.innerHTML = '❌ Erro ao salvar chamado.';
    }
  } catch (err) {
    console.error(err);
    statusDiv.innerHTML = '❌ Erro de conexão com o servidor.';
  }
}

// Reads all chats directly from WhatsApp Web local IndexedDB database (model-storage)
// Resolves Content Security Policy (CSP) blocking by executing via Background scripting service worker
async function getChatsFromIndexedDB() {
  return new Promise((resolve) => {
    if (!chrome.runtime?.id) {
      resolve([]);
      return;
    }
    try {
      chrome.runtime.sendMessage({ action: 'readIndexedDB' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[CRM] getChatsFromIndexedDB error:', chrome.runtime.lastError.message);
          resolve([]);
        } else {
          resolve(response || []);
        }
      });
    } catch (e) {
      console.warn('[CRM] getChatsFromIndexedDB catch:', e.message);
      resolve([]);
    }
  });
}


// Robust extractor for WhatsApp Business Web chat list
// Confirmed DOM: [data-testid="chat-list"] > [aria-label="Lista de conversas"][role="grid"] > children (rows)
// Each row contains: [data-testid="cell-frame-title"] for name, img for phone via URL
function getAllChatsFromDom() {
  const chats = [];

  // STRATEGY 1: Use confirmed structure - list-item-N rows inside chat-list
  // testids_sample confirmed: "list-item-0", "cell-frame-container", "cell-frame-title", "cell-frame-primary-detail"
  const listItems = document.querySelectorAll(
    '[data-testid^="list-item-"], [data-testid="cell-frame-container"]'
  );
  
  if (listItems.length > 0) {
    listItems.forEach(item => {
      const row = item.closest('[data-testid^="list-item-"]') || item;
      extractChatFromRow(row, chats);
    });
  }

  // STRATEGY 2: Children of the grid container
  if (chats.length === 0) {
    const chatListContainer = document.querySelector(
      '[data-testid="chat-list"] [aria-label="Lista de conversas"], ' +
      '[data-testid="chat-list"] [aria-label="Chat list"], ' +
      '[data-testid="chat-list"] [role="grid"]'
    );
    if (chatListContainer) {
      Array.from(chatListContainer.children).forEach(row => extractChatFromRow(row, chats));
    }
  }

  // STRATEGY 3: Direct image URL scan (always captures phone if photo loads)
  if (chats.length === 0) {
    const imgs = document.querySelectorAll('#pane-side img[src*="u="][src*="%40c.us"]');
    imgs.forEach(img => {
      const match = img.src.match(/u=(\d+)%40c\.us/);
      if (!match) return;
      const phone = match[1];
      if (chats.some(c => c.phone === phone)) return;
      // Get name from nearest title
      const row = img.closest('[data-testid^="list-item-"]') || img.parentElement?.parentElement;
      const nameNode = row ? row.querySelector('[data-testid="cell-frame-title"]') : null;
      const name = nameNode ? nameNode.innerText.trim() : phone;
      if (name) chats.push({ name, phone, lastMessage: '', unreadCount: 0 });
    });
  }

  return chats;
}


// Helper: extract chat info from a row element (list-item-N)
function extractChatFromRow(row, chats) {
  // NAME: Try cell-frame-title first (WhatsApp Business), then [title] attr, then aria-label
  const titleNode = row.querySelector('[data-testid="cell-frame-title"]');
  
  let name = '';
  if (titleNode) {
    name = (titleNode.getAttribute('title') || titleNode.innerText || '').trim();
  }
  
  if (!name) {
    // Try a span or element with title attribute (not inside cell-frame-primary-detail = preview text)
    const titleAttrEl = row.querySelector('span[title]:not([data-testid*="detail"]):not([data-testid*="preview"])') ||
                        row.querySelector('h3[title]');
    if (titleAttrEl) {
      name = (titleAttrEl.getAttribute('title') || titleAttrEl.innerText || '').trim();
    }
  }
  
  if (!name) {
    // Fallback aria-label but CLEAN the unread count prefix
    let ariaLabel = row.getAttribute('aria-label') || '';
    // Remove "N mensagem(ns) não lida(s) de ..." prefix
    ariaLabel = ariaLabel.replace(/^\d+\s+mensagen?s?\s+não\s+lida[s]?[,.]?\s*(de\s+)?/i, '');
    // Remove "N unread message(s) from ..." prefix  
    ariaLabel = ariaLabel.replace(/^\d+\s+unread\s+messages?[,.]?\s*(from\s+)?/i, '');
    name = ariaLabel.trim();
  }

  if (!name || name.length < 2) return;

  const skipped = ['Menu', 'Nova conversa', 'Configurações', 'Perfil', 'Status', 'Canais', 'Comunidades', 'Novo grupo', 'Arquivadas', 'Favoritas'];
  if (skipped.some(s => name.toLowerCase().includes(s.toLowerCase()))) return;

  // PHONE: Try data-id directly on row, or its children, then fallback to testid/img
  let phone = '';
  const dataId = row.getAttribute('data-id') || 
                 row.querySelector('[data-id*="@c.us"]')?.getAttribute('data-id') ||
                 row.closest('[data-id*="@c.us"]')?.getAttribute('data-id') || '';
  if (dataId && dataId.includes('@c.us')) {
    phone = dataId.split('@')[0].replace(/\D/g, '');
  }

  if (!phone) {
    const testid = row.getAttribute('data-testid') || '';
    if (testid) {
      if (testid.includes('@g.us') || testid.includes('-group')) {
        return; // Skip groups
      }
      if (testid.includes('@c.us')) {
        phone = testid.replace('list-item-', '').split('@')[0].replace(/\D/g, '');
      }
    }
  }

  if (!phone) {
    const img = row.querySelector('img[src*="%40c.us"], img[src*="u="]');
    if (img) {
      const m = img.src.match(/u=(\d+)%40c\.us/) || img.src.match(/(\d+)%40c\.us/);
      if (m) phone = m[1];
    }
  }


  // If still no phone, use name as temporary key (for display only, can't link to CRM)
  // We'll store with a placeholder so the UI shows the name at least
  if (!phone) {
    // Create a hash from name for deduplication
    const tempKey = 'name_' + name.toLowerCase().replace(/\s+/g, '_').substring(0, 20);
    if (chats.some(c => c.phone === tempKey)) return;
    phone = tempKey;
  }

  if (chats.some(c => c.phone === phone)) return;

  const lastMsgNode = row.querySelector('[data-testid="cell-frame-primary-detail"]') ||
                      row.querySelector('[data-testid="last-msg-status"]')?.parentElement?.querySelector('span') ||
                      row.querySelector('span[dir="auto"]');
  const lastMessage = lastMsgNode ? lastMsgNode.innerText.trim() : '';

  const badgeNode = row.querySelector('[aria-label*="não lida"], [aria-label*="unread"], [class*="unread"]');
  const unreadCount = badgeNode ? parseInt(badgeNode.innerText.replace(/\D/g, '')) || 0 : 0;

  // PHOTO: Extract profile picture URL (WhatsApp Business Web lists avatars in img tags)
  let photo = '';
  const imgEl = row.querySelector('img');
  if (imgEl && imgEl.src && imgEl.src.startsWith('http') && !imgEl.src.includes('emoji')) {
    photo = imgEl.src;
  }


  chats.push({ name, phone, lastMessage, unreadCount, photo });
}

function selectChatInBackground(phone) {
  if (!phone) return;

  const saveMessagesToStorage = (chatName, chatPhone) => {
    const messages = getActiveChatMessages();
    const nameFromHeader = (
      document.querySelector('[data-testid="conversation-info-header-chat-title"] span') ||
      document.querySelector('[data-testid="conversation-info-header"] span[dir]') ||
      document.querySelector('header span[title]') ||
      document.querySelector('header span[dir="auto"]')
    )?.innerText?.trim() || chatName || '';

    safeStorageSet({
      crm_whatsapp_messages: messages,
      crm_whatsapp_active_phone: chatPhone || '',
      crm_whatsapp_active_name: nameFromHeader.toLowerCase()
    });
  };


  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned || cleaned.length < 8) {
    // If it's a name-based key (e.g. name_Ryan)
    const approxName = phone.replace(/^name_/, '').replace(/_/g, ' ').toLowerCase();
    searchAndClickContact(approxName, saveMessagesToStorage);
    return;
  }

  const suffix = cleaned.slice(-8);

  // Before clicking, make ALL chat items visible (remove any filter hiding)
  document.querySelectorAll('[data-testid^="list-item-"], [data-testid="chat-list-item"]').forEach(el => {
    el.style.removeProperty('display');
  });

  // Strategy 1: Check if visible in sidebar
  const listItem = document.querySelector(`[data-testid*="${suffix}@c.us"]`) ||
                   document.querySelector(`[data-testid*="${suffix}@s.whatsapp.net"]`) ||
                   document.querySelector(`[data-id*="${suffix}"]`);
  if (listItem) {
    const clickable = listItem.querySelector('[role="button"]') || listItem;
    simulateClick(clickable);
    currentPhone = cleaned;
    setTimeout(() => saveMessagesToStorage('', cleaned), 800);
    setTimeout(() => saveMessagesToStorage('', cleaned), 2000);
    setTimeout(() => saveMessagesToStorage('', cleaned), 4500);
    return;
  }

  // Strategy 2: URL Hash navigation (forces SPA router reload by toggling first)
  let formatted = cleaned;
  if (cleaned.length === 10 || cleaned.length === 11) {
    formatted = '55' + cleaned;
  }
  
  // Clear hash first to force routing event trigger
  window.location.hash = '';
  setTimeout(() => {
    window.location.hash = `#/chat/${formatted}@c.us`;
    currentPhone = formatted;
    setTimeout(() => saveMessagesToStorage('', formatted), 1000);
    setTimeout(() => saveMessagesToStorage('', formatted), 2500);
    setTimeout(() => saveMessagesToStorage('', formatted), 5000);
  }, 50);

  // Strategy 3 (Fallback): Click search icon, type suffix/name and click result
  setTimeout(() => {
    const activeHeader = document.querySelector('[data-testid="conversation-info-header"]');
    if (!activeHeader) {
      console.log('[CRM] Chat did not open via Hash. Falling back to search query...');
      searchAndClickContact(suffix, saveMessagesToStorage, cleaned);
    }
  }, 1500);
}

function searchAndClickContact(query, saveCallback, realPhone) {
  // 1. Click search container to focus and activate React state
  const searchContainer = document.querySelector('[data-testid="search-input-container"]') ||
                          document.querySelector('[data-testid="chatlist-search-container"]') ||
                          document.querySelector('.search-container');
  if (searchContainer) {
    simulateClick(searchContainer);
  }

  setTimeout(() => {
    // 2. Find search box using dynamic contenteditable scan (extremely robust)
    let searchBox = null;
    const editables = document.querySelectorAll('div[contenteditable="true"]');
    for (const el of editables) {
      const html = el.outerHTML || '';
      const placeholder = el.getAttribute('placeholder') || '';
      if (
        html.includes('Pesquisar') || 
        html.includes('Search') || 
        placeholder.includes('Pesquisar') ||
        placeholder.includes('Search') ||
        el.getAttribute('data-tab') === '3' || 
        el.closest('[data-testid="search-input-container"]')
      ) {
        searchBox = el;
        break;
      }
    }

    if (!searchBox) {
      // Fallback to querySelector
      searchBox = document.querySelector('[data-testid="chat-list-search"]') ||
                  document.querySelector('[data-testid="search-input-container"] [role="textbox"]') ||
                  document.querySelector('div[contenteditable="true"][data-tab="3"]') ||
                  document.querySelector('[data-testid="chatlist-search"]');
    }

    if (!searchBox) {
      console.error('[CRM] Search box not found!');
      return;
    }

    searchBox.focus();
    
    // Select all and clear
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    
    // Insert text
    document.execCommand('insertText', false, query);
    
    // Dispatch input events
    searchBox.dispatchEvent(new Event('input', { bubbles: true }));
    searchBox.dispatchEvent(new Event('change', { bubbles: true }));

    // 3. Wait for search results
    setTimeout(() => {
      const firstResult = document.querySelector('[data-testid^="list-item-"]') ||
                          document.querySelector('[data-testid="chat-list-item"]') ||
                          document.querySelector('[role="row"][data-id]');
      if (firstResult) {
        const btn = firstResult.querySelector('[role="button"]') || firstResult;
        simulateClick(btn);
        
        // Clear search input to restore regular sidebar view
        const clearBtn = document.querySelector('[data-testid="chatlist-search-clear"]');
        if (clearBtn) simulateClick(clearBtn);
        
        if (realPhone) currentPhone = realPhone;
        setTimeout(() => saveCallback('', realPhone || ''), 1000);
      } else {
        console.warn('[CRM] Search returned no results for query:', query);
      }
    }, 1000);
  }, 100);
}



function sendWhatsAppMessage(text) {
  // WhatsApp Business Web compose box is id="_r_a_" with role="textbox" and data-tab="3"
  const inputBox = 
    document.getElementById('_r_a_') ||
    document.querySelector('[data-tab="3"][role="textbox"]') ||
    document.querySelector('[data-tab="3"][contenteditable="true"]') ||
    document.querySelector('[data-testid="conversation-compose-box-input"]') ||
    document.querySelector('footer div[contenteditable="true"]') ||
    document.querySelector('div[contenteditable="true"][data-tab]') ||
    document.querySelector('div[contenteditable="true"]');

  if (inputBox) {
    inputBox.focus();
    document.execCommand('insertText', false, text);
    
    const inputEvent = new Event('input', { bubbles: true });
    inputBox.dispatchEvent(inputEvent);
    
    setTimeout(() => {
      const sendBtn = 
        document.querySelector('[data-testid="compose-btn-send"]') ||
        document.querySelector('[data-testid="send"]') ||
        document.querySelector('button[aria-label*="enviar"]') ||
        document.querySelector('button[aria-label*="Enviar"]') ||
        document.querySelector('button[aria-label*="send"]') ||
        document.querySelector('span[data-icon="send"]')?.closest('button');
      if (sendBtn) {
        sendBtn.click();
      }
    }, 100);
  } else {
    console.warn('[CRM] Não encontrou a caixa de texto do WhatsApp. id=_r_a_ e outros seletores falharam.');
  }
}

function getActiveChatMessages() {
  const messages = [];

  // Diagnostic dump of message elements in WhatsApp Web DOM
  try {
    const allContainers = document.querySelectorAll('[data-testid="msg-container"], [data-testid="incoming-msg"], [data-testid="outgoing-msg"], .message-in, .message-out');
    const msgDetails = [];
    allContainers.forEach((c, idx) => {
      if (idx < 3) {
        msgDetails.push({
          idx,
          tag: c.tagName,
          testid: c.getAttribute('data-testid'),
          className: c.className,
          text: c.innerText ? c.innerText.substring(0, 50).replace(/\n/g, ' ') : ''
        });
      }
    });
    chrome.storage.local.set({ crm_msg_dom_debug: `Containers: ${allContainers.length} | Top: ${JSON.stringify(msgDetails)}` });
  } catch (e) {
    console.log('[CRM] Erro ao gravar debug de mensagens:', e.message);
  }

  // Strategy 1: Direct scan for WhatsApp message testids.
  // These testids ONLY appear in conversation panels, NEVER in the sidebar.
  // Safe to scan entire document.
  const safeMsgSelectors = [
    '[data-testid="msg-container"]',
    '[data-testid="incoming-msg"]',
    '[data-testid="outgoing-msg"]'
  ].join(', ');
  
  const directMsgs = document.querySelectorAll(safeMsgSelectors);
  directMsgs.forEach(node => {
    const textNode = node.querySelector('[data-testid="msg-text"]') ||
                     node.querySelector('.selectable-text span[dir]') ||
                     node.querySelector('span[dir="ltr"]') ||
                     node.querySelector('span[dir="rtl"]');
    const text = textNode ? textNode.innerText.trim() : '';
    const isIncoming = node.getAttribute('data-testid') === 'incoming-msg';
    if (text && text.length > 0) messages.push({ text, isIncoming });
  });
  
  if (messages.length > 0) return messages;

  // Strategy 2: class-based bubbles (WhatsApp personal)
  document.querySelectorAll('.message-in, .message-out').forEach(node => {
    // Skip if inside pane-side (sidebar)
    if (document.getElementById('pane-side')?.contains(node)) return;
    const textNode = node.querySelector('.selectable-text span') || node.querySelector('[class*="copyable-text"]');
    const text = textNode ? textNode.innerText : '';
    if (text) messages.push({ text, isIncoming: node.classList.contains('message-in') });
  });
  
  if (messages.length > 0) return messages;

  // Strategy 3: data-id based (WhatsApp personal legacy)
  document.querySelectorAll('div[data-id*="@c.us"]').forEach(node => {
    if (document.getElementById('pane-side')?.contains(node)) return;
    const textNode = node.querySelector('.selectable-text span') || node.querySelector('span[dir="ltr"]');
    const text = textNode ? textNode.innerText : '';
    const dataId = node.getAttribute('data-id') || '';
    if (text) messages.push({ text, isIncoming: dataId.startsWith('false_') });
  });
  
  if (messages.length > 0) return messages;

  // Strategy 4: Find the conversation panel (right side) using known selectors
  // then scan rows within it (excluding sidebar rows)
  const paneSide = document.getElementById('pane-side');
  const panelEl = 
    document.getElementById('main') ||
    document.getElementById('pane-two') ||
    document.querySelector('[role="main"]') ||
    document.querySelector('[data-testid="conversation-panel-messages"]') ||
    document.querySelector('[data-testid="conversation-panel"]') ||
    document.querySelector('[aria-label="Lista de mensagens"]') ||
    document.querySelector('[aria-label="Message list"]');

  if (panelEl) {
    // role="row" scan - ONLY within panel, never sidebar
    panelEl.querySelectorAll('[role="row"]').forEach(row => {
      if (paneSide?.contains(row)) return;
      if (row.querySelector('[data-testid="cell-frame-container"]')) return;
      const textSpan = row.querySelector('span[dir="ltr"], span[dir="rtl"]');
      if (textSpan) {
        const text = textSpan.innerText.trim();
        if (text && text.length > 1) {
          const hasTick = !!row.querySelector('[data-testid="msg-dblcheck"], [data-testid="msg-check"]');
          messages.push({ text, isIncoming: !hasTick });
        }
      }
    });
  }

  return messages;
}
// Listen for messages from standalone crm.html page tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getWhatsAppChats') {
    if (typeof window._crmSyncIdb === 'function') {
      window._crmSyncIdb();
    }
    safeStorageGet(['crm_whatsapp_chats'], (res) => {
      let chats = res.crm_whatsapp_chats || [];
      if (chats.length === 0) {
        chats = getAllChatsFromDom();
      }
      sendResponse({ chats });
    });
    return true;
  }
  if (message.action === 'openChat') {
    selectChatInBackground(message.phone);
    sendResponse({ success: true });
    return true;
  }
  if (message.action === 'getMessages') {
    const messages = getActiveChatMessages();
    sendResponse({ messages });
    return true;
  }
  if (message.action === 'sendMessage') {
    sendWhatsAppMessage(message.text);
    sendResponse({ success: true });
    return true;
  }
});
