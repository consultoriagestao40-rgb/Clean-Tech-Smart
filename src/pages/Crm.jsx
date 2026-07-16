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
  Lock
} from 'lucide-react';

const FUNNEL_STAGES = [
  { key: 'novo', title: 'Novo', color: 'border-t-2 border-blue-500 bg-blue-50/20 text-blue-700' },
  { key: 'contato', title: 'Contato', color: 'border-t-2 border-yellow-500 bg-yellow-50/20 text-yellow-700' },
  { key: 'proposta', title: 'Proposta', color: 'border-t-2 border-purple-500 bg-purple-50/20 text-purple-700' },
  { key: 'negociacao', title: 'Negociação', color: 'border-t-2 border-orange-500 bg-orange-50/20 text-orange-700' },
  { key: 'fechado', title: 'Fechado', color: 'border-t-2 border-green-500 bg-green-50/20 text-green-700' },
  { key: 'perdido', title: 'Perdido', color: 'border-t-2 border-red-500 bg-red-50/20 text-red-700' }
];

export default function Crm() {
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
    // Calculate Stats
    let totalCount = leads.length;
    let activeValue = 0;
    let closedValue = 0;
    let closedCount = 0;

    leads.forEach(lead => {
      const val = parseFloat(lead.value) || 0;
      if (lead.stage === 'fechado') {
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

    const lead = leads.find(l => l.phone === leadPhone);
    if (!lead || lead.stage === stageKey) return;

    // Optimistic update
    setLeads(prev => prev.map(l => l.phone === leadPhone ? { ...l, stage: stageKey } : l));

    try {
      const res = await fetch('/api/crm/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: leadPhone,
          stage: stageKey
        })
      });

      if (!res.ok) {
        // Rollback on failure
        fetchLeads();
      }
    } catch (err) {
      console.error('Erro ao mover lead:', err);
      fetchLeads();
    }
  };

  // Format BRL Currency helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
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
          {FUNNEL_STAGES.map(stage => {
            const stageLeads = getLeadsInStage(stage.key);

            return (
              <div
                key={stage.key}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.key)}
                className="bg-gray-50/50 rounded-2xl border border-gray-200/60 p-4 space-y-4 min-w-[280px] w-[280px] shrink-0 min-h-[500px]"
              >
                {/* Stage Header */}
                <div className={`p-3 rounded-xl flex justify-between items-center ${stage.color}`}>
                  <span className="font-bold text-xs uppercase tracking-wider">{stage.title}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 shadow-sm">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                  {stageLeads.length === 0 ? (
                    <div className="border border-dashed border-gray-200 rounded-xl py-8 text-center text-xs text-gray-400 italic">
                      Nenhum lead aqui
                    </div>
                  ) : (
                    stageLeads.map(lead => {
                      const leadVal = parseFloat(lead.value) || 0;
                      return (
                        <div
                          key={lead.phone}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.phone)}
                          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all space-y-3 text-left"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-gray-900 leading-tight">{lead.name}</h4>
                            <p className="text-[10px] text-gray-400 font-mono">{lead.phone}</p>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center text-gray-600 font-bold">
                              <DollarSign className="w-3.5 h-3.5 text-green-500 mr-0.5" />
                              <span>{formatCurrency(leadVal)}</span>
                            </div>
                            
                            {lead.assigned_to_name && (
                              <div className="text-[10px] text-gray-400 flex items-center">
                                <User className="w-3.5 h-3.5 mr-0.5" />
                                <span className="truncate max-w-[90px]">{lead.assigned_to_name.split(' ')[0]}</span>
                              </div>
                            )}
                          </div>

                          {/* Next Contact schedule */}
                          {lead.next_contact_at && (
                            <div className="flex items-center text-[9px] font-bold text-orange-600 bg-orange-50 p-1.5 rounded-lg">
                              <Calendar className="w-3 h-3 mr-1 text-orange-400" />
                              <span>Retorno: {new Date(lead.next_contact_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}

                          {/* Card Footer WhatsApp Redirect */}
                          <div className="pt-2 border-t border-gray-100 flex justify-end">
                            <a
                              href={`https://web.whatsapp.com/send?phone=${lead.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[10px] font-bold transition-all space-x-1 border border-green-200/50"
                            >
                              <MessageSquare className="w-3 h-3 text-green-600" />
                              <span>Iniciar Chat</span>
                            </a>
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
    </div>
  );
}
