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
  Check,
  Edit,
  Trash2,
  Scale,
  Smartphone,
  Tag,
  Target,
  ChevronRight
} from 'lucide-react';

const DEFAULT_STAGES = [
  { key: 'qualificado', title: 'Qualificado', color: '#10B981' },
  { key: 'contatado', title: 'Contatado', color: '#3B82F6' },
  { key: 'demo_agendada', title: 'Demo agendada', color: '#8B5CF6' },
  { key: 'proposta_feita', title: 'Proposta feita', color: '#F59E0B' },
  { key: 'negociacoes', title: 'Negociações iniciadas', color: '#06B6D4' }
];

const STAGE_COLORS = [
  { name: 'Cinza', value: '#4B5563' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Esmeralda', value: '#10B981' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Amarelo', value: '#F59E0B' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Rosa/Vermelho', value: '#EF4444' },
  { name: 'Ciano', value: '#06B6D4' }
];

// Helper to calculate soft pastel background tint for columns based on stage hex color
function getStageBgTint(hex) {
  if (!hex || !hex.startsWith('#')) return 'rgba(241, 245, 249, 0.5)';
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, 0.08)`;
}

// Migrate old Tailwind color strings to hex
function migrateColor(color) {
  if (!color || color.startsWith('#')) return color;
  if (color.includes('blue')) return '#3B82F6';
  if (color.includes('teal')) return '#14B8A6';
  if (color.includes('emerald')) return '#10B981';
  if (color.includes('indigo')) return '#6366F1';
  if (color.includes('purple')) return '#8B5CF6';
  if (color.includes('amber')) return '#F59E0B';
  if (color.includes('yellow')) return '#F59E0B';
  if (color.includes('orange')) return '#F97316';
  if (color.includes('rose')) return '#EF4444';
  if (color.includes('red')) return '#EF4444';
  if (color.includes('cyan')) return '#06B6D4';
  if (color.includes('green')) return '#10B981';
  return '#4B5563';
}

export default function Crm() {
  const [funnelStages, setFunnelStages] = useState(() => {
    // Clear old localStorage to ensure exact default database stages are used
    localStorage.removeItem('crm_stages');
    localStorage.setItem('crm_stages', JSON.stringify(DEFAULT_STAGES));
    return DEFAULT_STAGES;
  });

  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState('');
  const [draggedColumnIndex, setDraggedColumnIndex] = useState(null);
  
  // Custom Stage Editing States
  const [isEditingStage, setIsEditingStage] = useState(false);
  const [editingStageKey, setEditingStageKey] = useState('');
  const [editingStageTitle, setEditingStageTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('#4B5563');
  const [insertAfterIndex, setInsertAfterIndex] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  
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
  const [sendViaWhatsapp, setSendViaWhatsapp] = useState(false);
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

  const handleOpenAddStageAfter = (index) => {
    setInsertAfterIndex(index);
    setIsAddingStage(true);
  };

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
      color: selectedColor
    };
    
    const updated = [...funnelStages];
    if (insertAfterIndex !== null && insertAfterIndex !== undefined) {
      updated.splice(insertAfterIndex + 1, 0, newStage);
    } else {
      updated.push(newStage);
    }

    setFunnelStages(updated);
    localStorage.setItem('crm_stages', JSON.stringify(updated));
    setIsAddingStage(false);
    setNewStageTitle('');
    setSelectedColor('border-t-2 border-slate-400 bg-slate-50/20 text-slate-700');
    setInsertAfterIndex(null);
  };

  const handleOpenEditStage = (stage) => {
    setEditingStageKey(stage.key);
    setEditingStageTitle(stage.title);
    setSelectedColor(stage.color || 'border-t-2 border-slate-400 bg-slate-50/20 text-slate-700');
    setIsEditingStage(true);
  };

  const handleSaveEditStage = () => {
    if (!editingStageTitle.trim()) {
      alert('O nome da etapa não pode ser vazio.');
      return;
    }
    const updated = funnelStages.map(st => 
      st.key === editingStageKey 
        ? { ...st, title: editingStageTitle.trim(), color: selectedColor } 
        : st
    );
    setFunnelStages(updated);
    localStorage.setItem('crm_stages', JSON.stringify(updated));
    setIsEditingStage(false);
    setEditingStageKey('');
    setEditingStageTitle('');
    setSelectedColor('border-t-2 border-slate-400 bg-slate-50/20 text-slate-700');
  };

  const handleDeleteStage = (stageKey) => {
    const stage = funnelStages.find(st => st.key === stageKey);
    if (!stage) return;
    const stageLeads = getLeadsInStage(stageKey);
    if (stageLeads.length > 0) {
      if (!confirm(`Esta etapa contém ${stageLeads.length} leads. Se você a excluir, os leads permanecerão cadastrados mas não aparecerão nesta coluna. Deseja excluir mesmo assim?`)) {
        return;
      }
    } else {
      if (!confirm(`Deseja excluir a etapa "${stage.title}"?`)) return;
    }
    const updated = funnelStages.filter(st => st.key !== stageKey);
    setFunnelStages(updated);
    localStorage.setItem('crm_stages', JSON.stringify(updated));
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
      const noteText = quickNoteContent.trim();
      const res = await fetch('/api/crm/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lead_phone: leadPhone,
          content: noteText
        })
      });

      if (res.ok) {
        // Enviar via WhatsApp (Z-API) se ativado e credenciais configuradas
        if (sendViaWhatsapp) {
          const zapiInstance = localStorage.getItem('app_zapi_instance_id');
          const zapiToken = localStorage.getItem('app_zapi_token');
          const zapiClientToken = localStorage.getItem('app_zapi_client_token');

          if (zapiInstance && zapiToken) {
            const zapiHeaders = { 'Content-Type': 'application/json' };
            if (zapiClientToken) {
              zapiHeaders['Client-Token'] = zapiClientToken;
            }
            
            // Clean phone for Brazil
            let cleanPhoneDigits = leadPhone.replace(/\D/g, '');
            if (cleanPhoneDigits.length === 11 && !cleanPhoneDigits.startsWith('55')) {
              cleanPhoneDigits = '55' + cleanPhoneDigits;
            } else if (cleanPhoneDigits.length === 10 && !cleanPhoneDigits.startsWith('55')) {
              cleanPhoneDigits = '55' + cleanPhoneDigits;
            }

            try {
              const whatsRes = await fetch(`https://api.z-api.io/instances/${zapiInstance}/token/${zapiToken}/send-text`, {
                method: 'POST',
                headers: zapiHeaders,
                body: JSON.stringify({
                  phone: cleanPhoneDigits,
                  message: noteText
                })
              });
              if (!whatsRes.ok) {
                console.error('Erro ao enviar mensagem via Z-API:', await whatsRes.text());
              }
            } catch (whatsErr) {
              console.error('Erro de rede na Z-API:', whatsErr);
            }
          }
        }

        setActiveNoteLead(null);
        setQuickNoteContent('');
        setSendViaWhatsapp(false);
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
    return filteredLeads.filter(lead => {
      if (!lead.stage) return stageKey === 'qualificado';
      const s = String(lead.stage).toLowerCase().trim();
      if (s === stageKey) return true;
      if (stageKey === 'qualificado' && (s === 'inbox' || s === 'prospect' || s === 'qualificado')) return true;
      if (stageKey === 'contatado' && (s === 'tratar' || s === 'contato' || s === 'contatado')) return true;
      if (stageKey === 'demo_agendada' && (s === 'lead' || s === 'reuniao' || s === 'atendimento' || s === 'demo_agendada')) return true;
      if (stageKey === 'proposta_feita' && (s === 'proposta' || s === 'a_faturar' || s === 'faturado' || s === 'proposta_feita')) return true;
      if (stageKey === 'negociacoes' && (s === 'programado' || s === 'perdido' || s === 'desqualificado' || s === 'negociacoes')) return true;
      return false;
    });
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
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja aplicar as etapas padrão do Kanban (PROSPECT, CONTATO, REUNIÃO, QUALIFICADO, DESQUALIFICADO, PROPOSTA)?')) {
                setFunnelStages(DEFAULT_STAGES);
                localStorage.setItem('crm_stages', JSON.stringify(DEFAULT_STAGES));
              }
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-100"
          >
            Restaurar Etapas (Foto)
          </button>
          <div className="flex items-center space-x-2 text-gray-700 font-semibold text-sm">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <span>Filtros do Funil</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">


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

      {/* Kanban Board Grid — Pipedrive Light Gray Chevron Pipeline */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span>Carregando negócios...</span>
        </div>
      ) : (
        <div className="overflow-x-auto pb-6 custom-scrollbar select-none">
          <div className="flex items-start gap-0.5 min-w-max pr-4">
            {funnelStages.map((stage, index) => {
              const stageLeads = getLeadsInStage(stage.key);
              const stageValueSum = stageLeads.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0);
              const isFirst = index === 0;
              const isLast = index === funnelStages.length - 1;

              // SVG Path for 260x56 Chevron Header:
              // Base width = 246px (X=0 to X=246). Arrow tip extends from X=246 to X=260.
              let svgPath;
              if (isFirst)      svgPath = 'M 0 0 H 246 L 260 28 L 246 56 H 0 Z';
              else if (isLast)  svgPath = 'M 0 0 H 246 A 12 12 0 0 1 258 12 V 44 A 12 12 0 0 1 246 56 H 0 L 14 28 Z';
              else              svgPath = 'M 0 0 H 246 L 260 28 L 246 56 H 0 L 14 28 Z';

              return (
                <div key={stage.key} className="flex flex-col min-w-[260px] w-[260px] shrink-0">
                  {/* 1. Header Chevron */}
                  <div
                    draggable="true"
                    onDragStart={(e) => handleColumnDragStart(e, index)}
                    onDrop={(e) => handleColumnDrop(e, index)}
                    onDragOver={handleDragOver}
                    className="group/header select-none cursor-grab active:cursor-grabbing relative w-full h-[56px]"
                  >
                    <svg
                      viewBox="0 0 260 56"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full block"
                    >
                      <path
                        d={svgPath}
                        fill="#F4F5F7"
                      />
                    </svg>

                    <div className="relative z-10 h-full flex items-center justify-between" style={{ paddingLeft: isFirst ? '14px' : '24px', paddingRight: '24px' }}>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-bold text-xs text-gray-900 leading-snug truncate" title={stage.title}>
                          {stage.title}
                        </div>
                        <div className="text-[11px] text-gray-500 font-normal mt-0.5 flex items-center space-x-1">
                          <span>{formatCurrency(stageValueSum)}</span>
                          <span>·</span>
                          <span>{stageLeads.length} {stageLeads.length === 1 ? 'negócio' : 'negócios'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenAddStageAfter(index); }} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenEditStage(stage); }} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteStage(stage.key); }} className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-200/60 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. Column Body — Exact width 246px matching header base (X=0 to X=246) */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.key)}
                    className="bg-[#F4F5F7] rounded-b-2xl rounded-t-none p-3 pt-2.5 min-h-[600px] flex flex-col mt-[-1px] w-[246px]"
                  >
                    <div className="space-y-2.5 flex-grow">
                      {stageLeads.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-200/80 rounded-xl py-12 text-center text-xs text-gray-400 font-medium italic">
                          Sem negócios nesta etapa
                        </div>
                      ) : (
                        stageLeads.map((lead, leadIdx) => {
                          const leadVal = parseFloat(lead.value) || 0;
                          const hasActivity = !!lead.next_contact_at;

                          return (
                            <div
                              key={lead.phone || lead.id || leadIdx}
                              draggable
                              onDragStart={(e) => handleDragStart(e, lead.phone)}
                              className="group bg-white p-3.5 rounded-xl border border-gray-200/90 shadow-xs cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-300 transition-all space-y-1.5 text-left relative min-w-0"
                            >
                              {/* Deal Title (Pipedrive format: [Amostra] Deal Name) */}
                              <h4 className="text-xs font-bold text-gray-900 leading-snug truncate" title={lead.name}>
                                {lead.name ? `[Amostra] ${lead.name}` : `[Amostra] Lead ${lead.phone}`}
                              </h4>

                              {/* Subtitle / Organization or Contact */}
                              <p className="text-[11px] text-gray-500 truncate leading-tight">
                                {lead.name ? `[Amostra] ${lead.name}, ${lead.phone}` : lead.phone}
                              </p>

                              {/* Card Footer Row: Owner Icon + Value on Left, Status Circle Arrow on Right */}
                              <div className="pt-2 flex items-center justify-between min-w-0">
                                {/* Owner Icon & Value */}
                                <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-700 min-w-0">
                                  <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span className="truncate">{formatCurrency(leadVal)}</span>
                                </div>

                                {/* Status Circle Arrow Button (Pipedrive Green / Gray Circle) */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMoveLead(lead);
                                  }}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                    hasActivity 
                                      ? 'bg-[#22C55E] text-white shadow-xs hover:bg-emerald-600' 
                                      : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                                  }`}
                                  title={hasActivity ? 'Atividade Agendada' : 'Mover de Etapa / Opções'}
                                >
                                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              </div>

                              {/* Scheduled Return Date Badge (if present) */}
                              {lead.next_contact_at && (
                                <div className="flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 p-1.5 rounded-lg mt-1">
                                  <Calendar className="w-3 h-3 mr-1 text-emerald-500 shrink-0" />
                                  <span className="truncate">Atividade: {new Date(lead.next_contact_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              )}

                              {/* Quick Action Toolbar on Hover */}
                              <div className="pt-1 flex justify-end space-x-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setActiveReminderLead(lead); setActiveNoteLead(null); setActiveMoveLead(null); }}
                                  className="p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-all"
                                  title="Agendar Retorno / Atividade"
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setActiveNoteLead(lead); setActiveReminderLead(null); setActiveMoveLead(null); }}
                                  className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all"
                                  title="Adicionar Nota"
                                >
                                  <ClipboardList className="w-3.5 h-3.5" />
                                </button>
                                <a
                                  href={`https://web.whatsapp.com/send?phone=${lead.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-all flex items-center"
                                  title="Chat WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

            <div className="flex items-center space-x-2 text-left bg-slate-50 p-3 rounded-xl border border-slate-100">
              <input
                id="send-whats"
                type="checkbox"
                checked={sendViaWhatsapp}
                onChange={e => setSendViaWhatsapp(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="send-whats" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                💬 Enviar esta mensagem também via WhatsApp (Z-API) para o lead
              </label>
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

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 block">Cor de Destaque</label>
              <div className="grid grid-cols-5 gap-2">
                {STAGE_COLORS.map(color => {
                  const isSelected = selectedColor === color.value;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      title={color.name}
                      style={{ backgroundColor: color.value, border: isSelected ? '3px solid #1E293B' : '3px solid transparent' }}
                      className="h-8 rounded-lg transition-all relative flex items-center justify-center"
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>
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

      {/* ---------------- EDIT CRM STAGE MODAL ---------------- */}
      {isEditingStage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg">Editar Etapa</h3>
              <button 
                onClick={() => { setIsEditingStage(false); setEditingStageKey(''); setEditingStageTitle(''); }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Nome da etapa *</label>
              <input
                type="text"
                value={editingStageTitle}
                onChange={e => setEditingStageTitle(e.target.value)}
                placeholder="Insira o nome da etapa..."
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 block">Cor de Destaque</label>
              <div className="grid grid-cols-5 gap-2">
                {STAGE_COLORS.map(color => {
                  const isSelected = selectedColor === color.value;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      title={color.name}
                      style={{ backgroundColor: color.value, border: isSelected ? '3px solid #1E293B' : '3px solid transparent' }}
                      className="h-8 rounded-lg transition-all relative flex items-center justify-center"
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => { setIsEditingStage(false); setEditingStageKey(''); setEditingStageTitle(''); }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditStage}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-all"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
