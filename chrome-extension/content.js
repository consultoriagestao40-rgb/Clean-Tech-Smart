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
let isSidebarVisible = false; // Sidebar drawer hidden by default

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
    isSidebarVisible = true;
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
      isSidebarVisible = true;
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

// initSidebar is only used for Login Form or for Kanban view
function initSidebar() {
  try {
    if (!isSidebarVisible && !isKanbanViewActive) {
      removeSidebar();
      return;
    }

    if (document.getElementById('crm-sidebar-root')) return;

    const rootContainer = document.createElement('div');
    rootContainer.id = 'crm-sidebar-root';
    rootContainer.style.position = 'fixed';
    rootContainer.style.right = '0';
    rootContainer.style.top = '0';
    rootContainer.style.width = isKanbanViewActive ? 'calc(100% - 60px)' : '350px';
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
    } else {
      renderSidebarView();
    }
  } catch (err) {
    console.error('Error in initSidebar:', err);
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

// ---------------- KANBAN BOARD VIEW RENDERING ----------------
function toggleKanbanMode(active) {
  try {
    isKanbanViewActive = active;
    const root = document.getElementById('crm-sidebar-root');
    const appElement = document.getElementById('app') || document.querySelector('.app-wrapper');
    
    if (active) {
      // If sidebar root not initialized, create it
      if (!root) {
        initSidebar();
      } else {
        root.style.display = 'block';
      }

      const expandedRoot = document.getElementById('crm-sidebar-root');
      
      // Hide the entire WhatsApp Web app offscreen to prevent squishing and overlap
      if (appElement) {
        appElement.style.setProperty('position', 'absolute', 'important');
        appElement.style.setProperty('left', '-9999px', 'important');
        appElement.style.setProperty('width', '1px', 'important');
        appElement.style.setProperty('height', '1px', 'important');
        appElement.style.setProperty('overflow', 'hidden', 'important');
      }

      if (expandedRoot) {
        expandedRoot.style.setProperty('position', 'fixed', 'important');
        expandedRoot.style.setProperty('left', '60px', 'important');
        expandedRoot.style.setProperty('top', '50px', 'important'); // below horizontal bar
        expandedRoot.style.setProperty('width', 'calc(100% - 60px)', 'important');
        expandedRoot.style.setProperty('height', 'calc(100vh - 50px)', 'important');
        expandedRoot.style.setProperty('display', 'block', 'important');
        expandedRoot.style.setProperty('z-index', '99999', 'important');
      }

      renderKanbanView();
    } else {
      // Hide the sidebar root completely
      removeSidebar();
      
      // Restore whatsapp central panel
      if (appElement) {
        appElement.style.removeProperty('position');
        appElement.style.removeProperty('left');
        appElement.style.removeProperty('width');
        appElement.style.removeProperty('height');
        appElement.style.removeProperty('overflow');
        appElement.style.setProperty('margin-left', '60px', 'important');
        appElement.style.setProperty('margin-top', '50px', 'important');
        appElement.style.setProperty('width', 'calc(100% - 60px)', 'important');
        appElement.style.setProperty('height', 'calc(100vh - 50px)', 'important');
      }
    }
  } catch (err) {
    console.error('Error in toggleKanbanMode:', err);
  }
  updateLeftToolbarActiveStates();
}

async function renderKanbanView() {
  if (!sidebarElement) return;

  try {
    // Header showing seller filter and toggle back to chat button
    let sellerFilterHtml = '';
    let userName = 'Vendedor';
    if (crmUser && crmUser.name) {
      userName = crmUser.name.split(' ')[0];
    }

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
      sellerFilterHtml = `<span style="font-size: 11px; color: #64748b; font-style: italic;">Leads de ${userName}</span>`;
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
  } catch (err) {
    console.error('Error in renderKanbanView:', err);
  }
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

        // Column Header drag reordering
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
        const cardsContainer = colDiv.querySelector('.kanban-cards-container');
        if (cardsContainer) {
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

            card.addEventListener('dragstart', (e) => {
              e.dataTransfer.setData('text/plain', lead.phone);
            });

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

            card.addEventListener('click', (e) => {
              if (e.target.closest('.kanban-card-icon-btn')) return;
              openChatModal(lead);
            });

            cardsContainer.appendChild(card);
          });
        }
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
    document.execCommand('insertText', false, text);
    
    const inputEvent = new Event('input', { bubbles: true });
    inputBox.dispatchEvent(inputEvent);
    
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
    setTimeout(syncChatMessages, 200);
  };

  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  sendBtn.addEventListener('click', sendMessage);

  let lastMsgCount = 0;
  const syncChatMessages = () => {
    const messages = getActiveChatMessages();
    const msgContainer = shadowRoot.getElementById('chat-modal-messages');
    if (!msgContainer) return;

    if (messages.length === 0) {
      msgContainer.innerHTML = '<div style="margin: auto; color: #64748b; font-size: 12px; font-style: italic;">Carregando histórico de mensagens...</div>';
      return;
    }

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

    if (messages.length !== lastMsgCount) {
      lastMsgCount = messages.length;
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }
  };

  selectChatInBackground(lead.phone);
  
  const chatSyncInterval = setInterval(syncChatMessages, 800);
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
  
  setInterval(fetchLeadsAndRefresh, 15000);
  
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

  // Push #app wrapper down to make space for top bar (only if Kanban view is inactive)
  const app = document.getElementById('app') || document.querySelector('.app-wrapper');
  if (app && !isKanbanViewActive) {
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

  toolbar.querySelector('#crm-left-btn-funnel').addEventListener('click', () => {
    if (isKanbanViewActive) {
      toggleKanbanMode(false);
    } else {
      isSidebarVisible = false;
      toggleKanbanMode(true);
    }
  });

  toolbar.querySelector('#crm-left-btn-sidebar').addEventListener('click', () => {
    if (isSidebarVisible) {
      isSidebarVisible = false;
      removeSidebar();
    } else {
      isKanbanViewActive = false;
      isSidebarVisible = true;
      toggleKanbanMode(false);
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
  
  const btnFunnel = toolbar.querySelector('#crm-left-btn-funnel');
  const btnSidebar = toolbar.querySelector('#crm-left-btn-sidebar');
  
  if (btnFunnel) {
    if (isKanbanViewActive) btnFunnel.classList.add('active');
    else btnFunnel.classList.remove('active');
  }

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
        chrome.runtime.sendMessage({
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
