import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  MessageSquare, 
  Calendar, 
  DollarSign, 
  User, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  LogOut,
  Lock,
  ClipboardList,
  ArrowRightLeft,
  X,
  Check
} from 'lucide-react';

const DEFAULT_STAGES = [
  { key: 'inbox', title: 'Inbox', color: 'border-t-2 border-slate-400 bg-slate-50/20 text-slate-700' },
  { key: 'lead', title: 'Lead de Serviço', color: 'border-t-2 border-blue-500 bg-blue-50/20 text-blue-700' },
  { key: 'tratar', title: 'Tratar', color: 'border-t-2 border-yellow-500 bg-yellow-50/20 text-yellow-700' },
  { key: 'atendimento', title: 'Atendimento', color: 'border-t-2 border-cyan-500 bg-cyan-50/20 text-cyan-700' },
  { key: 'programado', title: 'Programado', color: 'border-t-2 border-purple-500 bg-purple-50/20 text-purple-700' },
  { key: 'a_faturar', title: 'A Faturar', color: 'border-t-2 border-orange-500 bg-orange-50/20 text-orange-700' },
  { key: 'faturado', title: 'Fatura Enviada', color: 'border-t-2 border-green-500 bg-green-50/20 text-green-700' },
  { key: 'perdido', title: 'Perdido', color: 'border-t-2 border-red-500 bg-red-50/20 text-red-700' }
];

export default function Crm() {
  const [funnelStages, setFunnelStages] = useState(() => {
    const saved = localStorage.getItem('crm_stages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_STAGES;
  });

  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState('');
  const [draggedColumnIndex, setDraggedColumnIndex] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('crm_token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('crm_user') || 'null'));
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Leads and Sellers
  const [leads, setLeads] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Modal edit states for cards (WaSeller layout)
  const [activeNoteLead, setActiveNoteLead] = useState(null);
  const [quickNoteContent, setQuickNoteContent] = useState('');
  
  const [activeReminderLead, setActiveReminderLead] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskMessage, setTaskMessage] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [taskTime, setTaskTime] = useState('');

  const [activeMoveLead, setActiveMoveLead] = useState(null);

  const [isSavingQuick, setIsSavingQuick] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalCount: 0,
    activeValue: 0.00,
    closedValue: 0.00,
    conversionRate: 0
  });

  useEffect(() => {
    if (token) {
      fetchSellers();
      fetchLeads();
    }
  }, [token, selectedSeller]);

  useEffect(() => {
    let totalCount = leads.length;
    let activeValue = 0;
    let closedValue = 0;
    let closedCount = 0;

    leads.forEach(lead => {
      const val = parseFloat(lead.value) || 0;
      if (lead.stage === 'faturado') {
        closedValue += val;
        closedCount += 1;
      } else if (lead.stage !== 'perdido') {
        activeValue += val;
      }
    });

    const conversionRate = totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 0;

    setStats({
      totalCount,
      activeValue,
      closedValue,
      conversionRate
    });
  }, [leads]);

  const handleCreateStage = () => {
    if (!newStageTitle.trim()) return;
    const key = newStageTitle.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
    const exists = funnelStages.some(st => st.key === key);
    if (exists) {
      alert('Esta etapa já existe.');
      return;
    }
    const newStage = {
      key,
      title: newStageTitle.trim(),
      color: 'border-t-2 border-slate-400 bg-slate-50/20 text-slate-700'
    };
    const updated = [...funnelStages, newStage];
    setFunnelStages(updated);
    localStorage.setItem('crm_stages', JSON.stringify(updated));
    setIsAddingStage(false);
    setNewStageTitle('');
  };

  const handleColumnDragStart = (e, index) => {
    setDraggedColumnIndex(index);
    e.dataTransfer.setData('text/column-index', index);
  };

  const handleColumnDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/column-index');
    if (sourceIndexStr === '') return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex) return;

    const updated = [...funnelStages];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);
    
    setFunnelStages(updated);
    localStorage.setItem('crm_stages', JSON.stringify(updated));
    setDraggedColumnIndex(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('crm_token', data.token);
        localStorage.setItem('crm_user', JSON.stringify(data.user));
        setToken(data.token);
        setCurrentUser(data.user);
      } else {
        setAuthError(data.error || 'Erro de autenticação.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Erro de conexão ao servidor.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setToken('');
    setCurrentUser(null);
    setLeads([]);
    setSellers([]);
  };

  const fetchSellers = async () => {
    try {
      const res = await fetch('/api/crm/sellers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSellers(data.sellers || []);
      }
    } catch (err) {
      console.error('Erro ao buscar vendedores:', err);
    }
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const url = selectedSeller !== 'all' 
        ? `/api/crm/leads?assigned_to=${selectedSeller}`
        : '/api/crm/leads';

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e, leadPhone) => {
    e.dataTransfer.setData('text/plain', leadPhone);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, stageKey) => {
    e.preventDefault();
    const leadPhone = e.dataTransfer.getData('text/plain');
    if (!leadPhone) return;

    updateLeadStageDirectly(leadPhone, stageKey);
  };

  const updateLeadStageDirectly = async (leadPhone, newStage) => {
    const lead = leads.find(l => l.phone === leadPhone);
    if (!lead || lead.stage === newStage) return;

    // Optimistic update
    setLeads(prev => prev.map(l => l.phone === leadPhone ? { ...l, stage: newStage } : l));

    try {
      const res = await fetch('/api/crm/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: leadPhone,
          stage: newStage
        })
      });

      if (!res.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error('Erro ao mover lead:', err);
      fetchLeads();
    }
  };

  // Inline Quick Actions
  const handleSaveQuickNote = async (leadPhone) => {
    if (!quickNoteContent.trim()) return;
    setIsSavingQuick(true);
    try {
      const res = await fetch('/api/crm/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lead_phone: leadPhone,
          content: quickNoteContent.trim()
        })
      });

      if (res.ok) {
        setActiveNoteLead(null);
        setQuickNoteContent('');
        alert('Anotação salva com sucesso!');
      } else {
        alert('Erro ao salvar anotação.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar.');
    } finally {
      setIsSavingQuick(false);
    }
  };

  const handleSaveQuickReminder = async (leadPhone) => {
    if (!taskDate || !taskTime) {
      alert('Data e Hora são obrigatórias.');
      return;
    }
    const combinedDateTime = `${taskDate}T${taskTime}`;
    setIsSavingQuick(true);
    try {
      // 1. Update Lead Contact Return Date
      const resContact = await fetch('/api/crm/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: leadPhone,
          next_contact_at: combinedDateTime
        })
      });

      if (!resContact.ok) throw new Error('Erro ao atualizar data no lead');

      // 2. Create CRM Task
      const taskTitleString = taskTitle.trim() || 'Retorno de Contato';
      const taskDesc = taskMessage.trim() ? `: ${taskMessage.trim()}` : '';
      const resTask = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lead_phone: leadPhone,
          title: `${taskTitleString}${taskDesc}`,
          due_date: combinedDateTime
        })
      });

      if (resTask.ok) {
        setActiveReminderLead(null);
        setTaskTitle('');
        setTaskMessage('');
        setTaskDate('');
        setTaskTime('');
        fetchLeads(); // Refresh to update date badge in UI
        alert('Agendamento criado com sucesso!');
      } else {
        alert('Erro ao criar agendamento na tabela de tarefas.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao agendar.');
    } finally {
      setIsSavingQuick(false);
    }
  };

  // Format BRL Currency helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Initials Avatar helper
  const getInitials = (name) => {
    if (!name) return 'LD';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Filtered Leads list
  const filteredLeads = leads.filter(lead => {
    const search = searchTerm.toLowerCase();
    return (
      (lead.name || '').toLowerCase().includes(search) ||
      (lead.phone || '').includes(search) ||
      (lead.assigned_to_name || '').toLowerCase().includes(search)
    );
  });

  const getLeadsInStage = (stageKey) => {
    return filteredLeads.filter(lead => lead.stage === stageKey);
  };

  // ---------------- LOGIN OVERLAY SCREEN ----------------
  if (!token || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full min-h-[75vh]">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Acesso ao CRM</h2>
            <p className="text-sm text-gray-500">Entre com as credenciais do Clean Tech Smart para acessar o painel de vendas.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">E-mail</label>
              <input 
                required
                type="email"
                placeholder="vendedor@cleantech.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-gray-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Senha</label>
              <input 
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-gray-50/50"
              />
            </div>

            {authError && (
              <p className="text-xs text-red-500 font-semibold">{authError}</p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-blue-500/10 flex items-center justify-center space-x-2"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Entrar no CRM</span>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------- MAIN CRM BOARD SCREEN ----------------
  return (
    <div className="space-y-6 text-gray-800 font-sans">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">CRM - Funil de Vendas</h1>
          <p className="text-xs text-gray-500 mt-1">Acompanhe novos contatos, propostas ativas e conversões em tempo real.</p>
        </div>
        
        <div className="flex items-center space-x-3 text-sm">
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
            <User className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-gray-700">{currentUser.name}</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold uppercase">{currentUser.role}</span>
          </div>

          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Sair da sessão"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total de Leads</span>
            <span className="text-2xl font-bold text-gray-900">{stats.totalCount}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Valor em Negociação</span>
            <span className="text-xl font-bold text-yellow-600">{formatCurrency(stats.activeValue)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Faturamento Fechado</span>
            <span className="text-xl font-bold text-green-600">{formatCurrency(stats.closedValue)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Taxa de Conversão</span>
            <span className="text-2xl font-bold text-purple-600">{stats.conversionRate}%</span>
          </div>
        </div>
      </div>

      {/* Filters Box */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-gray-700 font-semibold text-sm">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <span>Filtros do Funil</span>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Adicionar Etapa Button */}
          <button
            onClick={() => setIsAddingStage(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Etapa</span>
          </button>

          {/* Search bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar por cliente, tel ou vendedor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-gray-50/50"
            />
          </div>

          {/* Seller Filter (Gestor role only) */}
          {currentUser.role === 'gestor' ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 font-semibold whitespace-nowrap font-sans">Vendedor:</span>
              <select
                value={selectedSeller}
                onChange={e => setSelectedSeller(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm"
              >
                <option value="all">Todos os vendedores</option>
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">Filtrado por seus leads.</div>
          )}
        </div>
      </div>

      {/* Kanban Board Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span>Carregando funil de vendas...</span>
        </div>
      ) : (
        <div className="flex space-x-6 overflow-x-auto pb-4 custom-scrollbar items-start">
          {funnelStages.map((stage, index) => {
            const stageLeads = getLeadsInStage(stage.key);
            const stageValueSum = stageLeads.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0);

            return (
              <div
                key={stage.key}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.key)}
                className="bg-gray-50/40 rounded-2xl border border-gray-200/50 p-4 space-y-4 min-w-[290px] w-[290px] shrink-0 min-h-[550px]"
              >
                {/* Stage Header (Draggable for reordering columns) */}
                <div 
                  draggable="true"
                  onDragStart={(e) => handleColumnDragStart(e, index)}
                  onDrop={(e) => handleColumnDrop(e, index)}
                  onDragOver={handleDragOver}
                  className={`p-3 rounded-xl flex flex-col space-y-1.5 shadow-sm border cursor-grab active:cursor-grabbing ${stage.color}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs uppercase tracking-wider truncate">{stage.title}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 shadow-sm text-gray-700">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-gray-500 text-left">
                    {formatCurrency(stageValueSum)}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                  {stageLeads.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center text-xs text-gray-400 italic">
                      Arraste chamados aqui
                    </div>
                  ) : (
                    stageLeads.map(lead => {
                      const leadVal = parseFloat(lead.value) || 0;
                      return (
                        <div
                          key={lead.phone}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.phone)}
                          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all space-y-3 text-left relative"
                        >
                          {/* Card Content Row */}
                          <div className="flex items-start justify-between gap-2">
                            {/* Initials Avatar and Details */}
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                                {getInitials(lead.name)}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-900 leading-tight max-w-[130px] truncate" title={lead.name}>
                                  {lead.name}
                                </h4>
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{lead.phone}</p>
                              </div>
                            </div>

                            {/* Value Display */}
                            <div className="text-[11px] font-bold text-gray-800 text-right whitespace-nowrap">
                              {formatCurrency(leadVal)}
                            </div>
                          </div>

                          {/* Next Contact Reminder Badge */}
                          {lead.next_contact_at && (
                            <div className="flex items-center text-[9px] font-bold text-orange-600 bg-orange-50/50 border border-orange-100 p-1.5 rounded-lg">
                              <Calendar className="w-3.5 h-3.5 mr-1 text-orange-400 shrink-0" />
                              <span className="truncate">Retorno: {new Date(lead.next_contact_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}

                          {/* Quick Toolbar Icons Row */}
                          <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                            {/* Seller name initials badge */}
                            {lead.assigned_to_name ? (
                              <div className="text-[9px] text-gray-400 font-semibold flex items-center bg-gray-50 px-1.5 py-0.5 rounded">
                                <User className="w-2.5 h-2.5 mr-0.5" />
                                <span>{lead.assigned_to_name.split(' ')[0]}</span>
                              </div>
                            ) : (
                              <span className="text-[9px] text-gray-300 italic">Sem vendedor</span>
                            )}

                            {/* Toolbar Buttons */}
                            <div className="flex space-x-1.5 items-center">
                              {/* Schedule reminder icon */}
                              <button
                                onClick={() => { setActiveReminderLead(lead); setActiveNoteLead(null); setActiveMoveLead(null); }}
                                className="p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-all"
                                title="Agendar Retorno"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>

                              {/* Add Note icon */}
                              <button
                                onClick={() => { setActiveNoteLead(lead); setActiveReminderLead(null); setActiveMoveLead(null); }}
                                className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all"
                                title="Adicionar Nota"
                              >
                                <ClipboardList className="w-3.5 h-3.5" />
                              </button>

                              {/* Move column shortcut dropdown */}
                              <button
                                onClick={() => { setActiveMoveLead(lead); setActiveNoteLead(null); setActiveReminderLead(null); }}
                                className="p-1 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded transition-all"
                                title="Mover de Etapa"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>

                              {/* WhatsApp Chat link */}
                              <a
                                href={`https://web.whatsapp.com/send?phone=${lead.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-all flex items-center"
                                title="Iniciar Chat WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- QUICK NOTE MODAL (WaSeller Style) ---------------- */}
      {activeNoteLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg">Criar anotação</h3>
              <button 
                onClick={() => { setActiveNoteLead(null); setQuickNoteContent(''); }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Drag & Drop Area Placeholder to match WaSeller layout perfectly */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50/50 flex flex-col items-center justify-center text-center space-y-1.5">
              <Plus className="w-6 h-6 text-gray-400" />
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Adicione uma mídia na anotação</p>
              <p className="text-[10px] text-gray-300">Arraste o arquivo aqui para upload (opcional)</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-gray-400 font-bold uppercase block">Lead</span>
              <span className="text-sm font-semibold text-gray-800 block">{activeNoteLead.name} ({activeNoteLead.phone})</span>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-gray-400 uppercase">Insira uma anotação</label>
              <textarea
                value={quickNoteContent}
                onChange={e => setQuickNoteContent(e.target.value)}
                placeholder="Insira sua nota..."
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-inner"
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => { setActiveNoteLead(null); setQuickNoteContent(''); }}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveQuickNote(activeNoteLead.phone)}
                disabled={isSavingQuick}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/10 flex items-center justify-center space-x-1.5 transition-all"
              >
                {isSavingQuick ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Salvar</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- QUICK REMINDER MODAL (WaSeller Style) ---------------- */}
      {activeReminderLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg">Criar Agendamento</h3>
              <button 
                onClick={() => {
                  setActiveReminderLead(null);
                  setTaskTitle('');
                  setTaskMessage('');
                  setTaskDate('');
                  setTaskTime('');
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Destinatário / Lead</span>
              <span className="text-sm font-bold text-gray-800 block">{activeReminderLead.name} ({activeReminderLead.phone})</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Título (Opcional)</label>
              <input
                type="text"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="Insira aqui o título do retorno..."
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 block">Escolha um tipo</label>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-default shadow-sm shadow-emerald-500/10">Criar texto</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-lg text-xs font-bold cursor-not-allowed">Mídia</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-lg text-xs font-bold cursor-not-allowed">Áudio</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Mensagem / Observações</label>
              <textarea
                value={taskMessage}
                onChange={e => setTaskMessage(e.target.value)}
                placeholder="Insira os detalhes do lembrete..."
                rows="3"
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Data</label>
                <input
                  type="date"
                  value={taskDate}
                  onChange={e => setTaskDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">Hora</label>
                <input
                  type="time"
                  value={taskTime}
                  onChange={e => setTaskTime(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Recorrência</label>
              <select className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50">
                <option value="none">Nenhuma selecionada</option>
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => {
                  setActiveReminderLead(null);
                  setTaskTitle('');
                  setTaskMessage('');
                  setTaskDate('');
                  setTaskTime('');
                }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveQuickReminder(activeReminderLead.phone)}
                disabled={isSavingQuick}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 flex items-center justify-center space-x-1.5 transition-all"
              >
                {isSavingQuick ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Criar</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- QUICK MOVE STAGE MODAL ---------------- */}
      {activeMoveLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl border border-gray-100 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Mover de Etapa</h3>
              <button 
                onClick={() => setActiveMoveLead(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-1 text-center">
              <span className="text-xs text-gray-400 font-bold uppercase block">Lead</span>
              <span className="text-sm font-semibold text-gray-800 block truncate">{activeMoveLead.name}</span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar text-left">
              <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Selecione a nova etapa:</label>
              <div className="grid grid-cols-1 gap-2">
                {funnelStages.map(st => (
                  <button
                    key={st.key}
                    onClick={() => { updateLeadStageDirectly(activeMoveLead.phone, st.key); setActiveMoveLead(null); }}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${st.key === activeMoveLead.stage ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}
                  >
                    {st.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- NEW CRM STAGE MODAL (WaSeller Style) ---------------- */}
      {isAddingStage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg">Criar Etapa</h3>
              <button 
                onClick={() => { setIsAddingStage(false); setNewStageTitle(''); }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Nome da nova aba / etapa *</label>
              <input
                type="text"
                value={newStageTitle}
                onChange={e => setNewStageTitle(e.target.value)}
                placeholder="Insira o nome da nova etapa..."
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => { setIsAddingStage(false); setNewStageTitle(''); }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateStage}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 transition-all"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
