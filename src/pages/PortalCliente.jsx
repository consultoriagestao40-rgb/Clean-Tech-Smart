import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  ShieldCheck, 
  Clock, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Plus, 
  X, 
  Search, 
  User, 
  Users, 
  LogOut, 
  DollarSign, 
  Layers, 
  Settings, 
  Cpu, 
  ChevronRight, 
  Check, 
  ExternalLink,
  MessageSquare,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Award,
  Calendar,
  Eye,
  Camera,
  Trash2,
  Lock,
  ArrowRight
} from 'lucide-react';

// WhatsApp SVG Icon
function WhatsAppIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

export default function PortalCliente() {
  const WHATSAPP_NUMBER = "5541985083658";
  const WHATSAPP_DISPLAY = "(41) 98508-3658";
  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Estou no Portal do Cliente Clean Tech Pro e gostaria de atendimento técnico Tennant.")}`;

  // Session State
  const [clientToken, setClientToken] = useState(() => localStorage.getItem('client_token') || '');
  const [clientData, setClientData] = useState(() => {
    try {
      const saved = localStorage.getItem('client_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Navigation State inside authenticated portal
  const [activeTab, setActiveTab] = useState('chamados'); // 'chamados' | 'equipamentos' | 'usuarios'

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLgpdModal, setShowLgpdModal] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showNewEquipmentModal, setShowNewEquipmentModal] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [selectedEquipmentDetail, setSelectedEquipmentDetail] = useState(null);
  const [equipmentHistoryData, setEquipmentHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Tickets & Data
  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState({
    total_tickets: 0,
    open_tickets: 0,
    completed_tickets: 0,
    total_maintenance_cost: 0
  });
  const [equipments, setEquipments] = useState([]);
  const [portalUsers, setPortalUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Form States - Login
  const [loginForm, setLoginForm] = useState({ login: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Form States - Registration
  const [regForm, setRegForm] = useState({
    name: '',
    razao_social: '',
    document: '',
    email: '',
    phone: '',
    contact_person: '',
    address: '',
    password: '',
    lgpd_accepted: false,
    // Optional equipment
    has_equipment: false,
    equipment_model: '',
    equipment_brand: 'Tennant',
    equipment_serial: '',
    hour_meter: '',
    // Optional initial ticket
    ticket_type: 'Corretiva',
    ticket_priority: 'Média',
    ticket_description: ''
  });
  const [regError, setRegError] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Form States - New Ticket
  const [ticketForm, setTicketForm] = useState({
    equipment_id: '',
    new_equipment_model: '',
    new_equipment_brand: 'Tennant',
    new_equipment_serial: '',
    ticket_type: 'Corretiva',
    priority: 'Média',
    description: '',
    hour_meter: ''
  });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  // Form States - New Equipment
  const [eqForm, setEqForm] = useState({
    brand: 'Tennant',
    model: '',
    serial_number: '',
    ownership_type: 'Próprio do Cliente'
  });
  const [eqSubmitting, setEqSubmitting] = useState(false);

  // Form States - New User
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Operador / Solicitante'
  });
  const [userSubmitting, setUserSubmitting] = useState(false);

  // Fetch client data when authenticated
  useEffect(() => {
    if (clientToken) {
      fetchTicketsAndMetrics();
      fetchEquipments();
      fetchPortalUsers();
    }
  }, [clientToken]);

  const fetchTicketsAndMetrics = async () => {
    if (!clientToken) return;
    setLoadingData(true);
    try {
      const res = await fetch('/api/client-portal/tickets', {
        headers: { 'Authorization': `Bearer ${clientToken}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Erro ao carregar chamados:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchEquipments = async () => {
    if (!clientToken) return;
    try {
      const res = await fetch('/api/client-portal/equipments', {
        headers: { 'Authorization': `Bearer ${clientToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setEquipments(data.equipments || []);
      }
    } catch (err) {
      console.error('Erro ao buscar equipamentos:', err);
    }
  };

  const fetchPortalUsers = async () => {
    if (!clientToken) return;
    try {
      const res = await fetch('/api/client-portal/users', {
        headers: { 'Authorization': `Bearer ${clientToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setPortalUsers(data.users || []);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);
    try {
      const res = await fetch('/api/client-portal/auth-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar login.');
      }
      localStorage.setItem('client_token', data.token);
      localStorage.setItem('client_user', JSON.stringify(data.client));
      setClientToken(data.token);
      setClientData(data.client);
      setShowLoginModal(false);
      setLoginForm({ login: '', password: '' });
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');

    if (!regForm.lgpd_accepted) {
      setRegError('Você deve concordar com os Termos de Uso e Política de Privacidade (LGPD) para prosseguir.');
      return;
    }

    setRegSubmitting(true);
    try {
      const payload = {
        name: regForm.name,
        razao_social: regForm.razao_social || regForm.name,
        document: regForm.document,
        email: regForm.email,
        phone: regForm.phone,
        contact_person: regForm.contact_person,
        address: regForm.address,
        password: regForm.password,
        lgpd_accepted: true,
        ...(regForm.has_equipment ? {
          equipment_model: regForm.equipment_model,
          equipment_brand: regForm.equipment_brand,
          equipment_serial: regForm.equipment_serial,
          hour_meter: regForm.hour_meter,
          ticket_type: regForm.ticket_type,
          ticket_priority: regForm.ticket_priority,
          ticket_description: regForm.ticket_description
        } : {})
      };

      const res = await fetch('/api/client-portal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar cadastro.');
      }

      localStorage.setItem('client_token', data.token);
      localStorage.setItem('client_user', JSON.stringify(data.client));
      setClientToken(data.token);
      setClientData(data.client);
      setShowRegisterModal(false);
      alert('Cadastro realizado com sucesso! Bem-vindo ao Portal do Cliente Clean Tech Pro.');
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setTicketSubmitting(true);
    try {
      const res = await fetch('/api/client-portal/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientToken}`
        },
        body: JSON.stringify(ticketForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao abrir chamado.');

      alert(`Chamado aberto com sucesso! Protocolo #${data.ticket.id}. Nossa equipe técnica foi notificada.`);
      setShowNewTicketModal(false);
      setTicketForm({
        equipment_id: '',
        new_equipment_model: '',
        new_equipment_brand: 'Tennant',
        new_equipment_serial: '',
        ticket_type: 'Corretiva',
        priority: 'Média',
        description: '',
        hour_meter: ''
      });
      fetchTicketsAndMetrics();
      fetchEquipments();
    } catch (err) {
      alert(err.message);
    } finally {
      setTicketSubmitting(false);
    }
  };

  const handleCreateEquipment = async (e) => {
    e.preventDefault();
    setEqSubmitting(true);
    try {
      const res = await fetch('/api/client-portal/equipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientToken}`
        },
        body: JSON.stringify(eqForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar equipamento.');

      alert('Equipamento cadastrado com sucesso!');
      setShowNewEquipmentModal(false);
      setEqForm({ brand: 'Tennant', model: '', serial_number: '', ownership_type: 'Próprio do Cliente' });
      fetchEquipments();
    } catch (err) {
      alert(err.message);
    } finally {
      setEqSubmitting(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserSubmitting(true);
    try {
      const res = await fetch('/api/client-portal/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientToken}`
        },
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao adicionar usuário.');

      alert('Usuário autorizado adicionado com sucesso!');
      setShowNewUserModal(false);
      setUserForm({ name: '', email: '', phone: '', role: 'Operador / Solicitante' });
      fetchPortalUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setUserSubmitting(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Deseja realmente remover este usuário autorizado?')) return;
    try {
      const res = await fetch(`/api/client-portal/users?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${clientToken}` }
      });
      if (res.ok) fetchPortalUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const openEquipmentDetails = async (eq) => {
    setSelectedEquipmentDetail(eq);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/client-portal/equipment-history?equipment_id=${eq.id}`, {
        headers: { 'Authorization': `Bearer ${clientToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setEquipmentHistoryData(data);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico do equipamento:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('client_token');
    localStorage.removeItem('client_user');
    setClientToken('');
    setClientData(null);
    setActiveTab('chamados');
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = 
        String(t.id).includes(searchQuery) ||
        (t.equipment_model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.equipment_serial_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchSearch) return false;

      if (statusFilter === 'abertos') {
        const s = (t.status || '').toLowerCase();
        return !s.includes('conclu') && !s.includes('cancel');
      }
      if (statusFilter === 'concluidos') {
        const s = (t.status || '').toLowerCase();
        return s.includes('conclu');
      }
      return true;
    });
  }, [tickets, searchQuery, statusFilter]);

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-[#007481] selection:text-white">

      {/* ========================================================================= */}
      {/* 🔝 CABEÇALHO OFICIAL SUPERIOR (PADRÃO A-260 TEAL #007481)                  */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#007481] text-white shadow-lg border-b border-[#005d68]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Logos Oficiais Clean Tech Pro + Alfa Tennant */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <a href="/chamados" className="flex items-center gap-2 flex-shrink-0">
              <img 
                src="/cleantechpro-official-white.png" 
                alt="Clean Tech Pro" 
                className="h-8 sm:h-11 w-auto object-contain"
              />
            </a>

            <div className="h-7 sm:h-8 w-[1px] bg-white/30 flex-shrink-0" />

            <div className="bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl shadow-md flex items-center flex-shrink-0">
              <img 
                src="/alfa-tennant-logo-hd.png" 
                alt="Alfa Tennant" 
                className="h-5 sm:h-7 w-auto object-contain"
              />
            </div>

            <div className="hidden xl:block h-8 w-[1px] bg-white/30" />

            <div className="min-w-0 hidden lg:block">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base tracking-wide uppercase text-white truncate">
                  Portal do Cliente
                </span>
                <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded text-[11px] font-semibold text-teal-100 uppercase tracking-wider">
                  <Award className="w-3 h-3 text-amber-300" /> Autorizada Oficial
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-teal-100/90 truncate">
                Representante & Assistência Técnica Autorizada Tennant • Curitiba & Região Metropolitana
              </p>
            </div>
          </div>

          {/* WhatsApp CTA & Ações de Login/Cadastro */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Botão de WhatsApp Oficial (Verde Vibrante) */}
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] text-white px-3 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm shadow-md hover:shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              title="Fale direto com a assistência técnica"
            >
              <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
              <span className="hidden sm:inline">{WHATSAPP_DISPLAY}</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>

            {/* Se logado: Perfil & Sair */}
            {clientToken ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                <div className="text-right hidden md:block">
                  <div className="text-xs font-bold text-white truncate max-w-[140px]">
                    {clientData?.name || 'Cliente'}
                  </div>
                  <div className="text-[10px] text-teal-200">Acesso Restrito</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-white/20 rounded-lg text-white/90 hover:text-white transition-colors"
                  title="Sair do Portal"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setLoginError(''); setShowLoginModal(true); }}
                  className="bg-white/15 hover:bg-white/25 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors border border-white/20"
                >
                  Login
                </button>
                <button
                  onClick={() => { setRegError(''); setShowRegisterModal(true); }}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-3 sm:px-4 py-2 rounded-lg font-black text-xs sm:text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                >
                  Criar sua Conta
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 👤 ÁREA DO CLIENTE AUTENTICADO (COM MENU LATERAL & DASHBOARD)             */}
      {/* ========================================================================= */}
      {clientToken ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          {/* Layout com Sidebar e Conteúdo Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Menu Lateral do Cliente */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sticky top-24 shadow-xl">
                
                {/* Selo Oficial Alfa Tennant na Sidebar */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="bg-white px-2.5 py-1 rounded-lg shadow-xs flex items-center">
                    <img src="/alfa-tennant-logo-hd.png" alt="Alfa Tennant" className="h-5 w-auto object-contain" />
                  </div>
                  <span className="text-[10px] font-black text-teal-400 uppercase bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/50">
                    Autorizada
                  </span>
                </div>

                {/* Perfil Compacto */}
                <div className="pb-4 mb-4 border-b border-slate-800">
                  <div className="text-xs text-[#00a3b4] font-bold uppercase tracking-wider mb-1">Empresa Cadastrada</div>
                  <h3 className="font-extrabold text-white text-base truncate">{clientData?.name || 'Cliente Clean Tech Pro'}</h3>
                  <p className="text-xs text-slate-400 truncate">{clientData?.email || clientData?.phone}</p>
                </div>

                {/* Navegação da Barra Lateral */}
                <nav className="space-y-1.5">
                  <button
                    onClick={() => setActiveTab('chamados')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      activeTab === 'chamados'
                        ? 'bg-[#007481] text-white shadow-lg shadow-[#007481]/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Wrench className="w-4 h-4" />
                      <span>1. Chamados</span>
                    </div>
                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-extrabold">
                      {metrics.open_tickets}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('equipamentos')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      activeTab === 'equipamentos'
                        ? 'bg-[#007481] text-white shadow-lg shadow-[#007481]/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Cpu className="w-4 h-4" />
                      <span>2. Equipamentos</span>
                    </div>
                    <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                      {equipments.length}
                    </span>
                  </button>
                </nav>

                {/* Gestão de Contatos/Usuários da Empresa do Cliente (Ação Secundária) */}
                <div className="pt-3 mt-3 border-t border-slate-800">
                  <button
                    onClick={() => setShowNewUserModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-teal-400" />
                    <span>+ Adicionar Usuário da Empresa</span>
                  </button>
                </div>

                {/* Box de Suporte Oficial Tennant */}
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-[#007481]/20 to-slate-800/50 border border-[#007481]/30">
                  <div className="flex items-center gap-2 text-[#00a3b4] font-bold text-xs mb-1">
                    <ShieldCheck className="w-4 h-4" /> Suporte Dedicado
                  </div>
                  <p className="text-xs text-slate-300 mb-3">
                    Precisa de atendimento técnico de emergência ou agendamento?
                  </p>
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-2 rounded-lg text-xs transition-colors"
                  >
                    <WhatsAppIcon className="w-4 h-4" /> Falar no WhatsApp
                  </a>
                </div>

                {/* Botão de Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors border border-slate-800"
                >
                  <LogOut className="w-3.5 h-3.5" /> Encerrar Sessão
                </button>
              </div>
            </div>

            {/* Conteúdo Central Principal */}
            <div className="lg:col-span-3">

              {/* =============================================================== */}
              {/* ABA 1: CHAMADOS (PRIMEIRO MENU) + DASHBOARD DE CUSTOS           */}
              {/* =============================================================== */}
              {activeTab === 'chamados' && (
                <div className="space-y-6">
                  
                  {/* Dashboard de KPIs (Cards de Quantidade e Custos Realizados) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    
                    {/* Card 1: Chamados Abertos */}
                    <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Em Andamento</span>
                        <Clock className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white">{metrics.open_tickets}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Chamados aguardando conclusão</div>
                    </div>

                    {/* Card 2: Chamados Concluídos */}
                    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Concluídos</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white">{metrics.completed_tickets}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Atendimentos finalizados</div>
                    </div>

                    {/* Card 3: Total Geral de Chamados */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 relative overflow-hidden shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
                        <Wrench className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white">{metrics.total_tickets}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Histórico completo registrado</div>
                    </div>

                    {/* Card 4: Custos Totais Realizados em Manutenções */}
                    <div className="bg-gradient-to-br from-slate-900 to-[#005d68]/40 border border-[#007481]/50 rounded-2xl p-4 relative overflow-hidden shadow-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#00a3b4] uppercase tracking-wider">Custos Realizados</span>
                        <DollarSign className="w-4 h-4 text-[#00a3b4]" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-emerald-400 truncate">
                        {formatCurrency(metrics.total_maintenance_cost)}
                      </div>
                      <div className="text-[11px] text-teal-100/70 mt-1">Total investido no parque</div>
                    </div>
                  </div>

                  {/* Barra de Filtros & Abertura de Novo Chamado */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar por protocolo, máquina..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#007481]"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#007481]"
                      >
                        <option value="todos">Todos Status</option>
                        <option value="abertos">Abertos / Em Andamento</option>
                        <option value="concluidos">Concluídos</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setShowNewTicketModal(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#007481] hover:bg-[#005d68] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#007481]/30 transition-all transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-4 h-4" /> Abrir Novo Chamado
                    </button>
                  </div>

                  {/* Listagem de Chamados */}
                  {loadingData ? (
                    <div className="p-12 text-center text-slate-400">
                      <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#007481]" />
                      Carregando seus chamados...
                    </div>
                  ) : filteredTickets.length === 0 ? (
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-10 text-center">
                      <Wrench className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                      <h4 className="text-lg font-bold text-white mb-1">Nenhum chamado encontrado</h4>
                      <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                        Você não possui chamados ativos neste filtro. Se sua máquina precisa de revisão ou reparo, abra um chamado imediato!
                      </p>
                      <button
                        onClick={() => setShowNewTicketModal(true)}
                        className="bg-[#007481] hover:bg-[#005d68] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all"
                      >
                        + Abrir Primeiro Chamado
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTickets.map(ticket => {
                        const isCompleted = (ticket.status || '').toLowerCase().includes('conclu');
                        const isUrgent = (ticket.priority || '').toLowerCase() === 'urgente' || (ticket.priority || '').toLowerCase() === 'alta';
                        
                        return (
                          <div 
                            key={ticket.id} 
                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                              <div className="flex items-center gap-3">
                                <span className="bg-[#007481]/20 border border-[#007481]/40 text-[#00a3b4] font-black px-2.5 py-1 rounded-lg text-xs">
                                  #{ticket.id}
                                </span>
                                <div>
                                  <h4 className="font-extrabold text-white text-base">
                                    {ticket.equipment_model || 'Equipamento Tennant'}
                                  </h4>
                                  <div className="text-xs text-slate-400">
                                    Série: {ticket.equipment_serial_number || 'S/N'} • Aberto em {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  isCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {ticket.status || 'Aberto'}
                                </span>
                                <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-700">
                                  Tipo: {ticket.ticket_type}
                                </span>
                                {isUrgent && (
                                  <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded text-xs font-bold">
                                    {ticket.priority}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Descrição do Chamado */}
                            <div className="py-3 text-sm text-slate-300 leading-relaxed">
                              {ticket.description}
                            </div>

                            {/* Detalhes Técnicos (Técnico e Data Agendada) */}
                            {(ticket.assigned_technician || ticket.scheduled_date) && (
                              <div className="bg-slate-950/70 rounded-xl p-3 mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-400 border border-slate-800/80">
                                {ticket.assigned_technician && (
                                  <div className="flex items-center gap-1.5 text-teal-300 font-medium">
                                    <User className="w-3.5 h-3.5" />
                                    <span>Técnico Responsável: <strong>{ticket.assigned_technician}</strong></span>
                                  </div>
                                )}
                                {ticket.scheduled_date && (
                                  <div className="flex items-center gap-1.5 text-slate-300">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Agendado para: {new Date(ticket.scheduled_date).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* DESTAQUE DO ORÇAMENTO VINCULADO (quando houver orçamento, exibe o valor em destaque!) */}
                            {ticket.budget_grand_total ? (
                              <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/40 rounded-xl p-4 my-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                    <DollarSign className="w-4 h-4" /> Orçamento Vinculado a este Chamado
                                  </div>
                                  <div className="text-xs text-slate-300 mt-0.5">
                                    Status da Proposta: <span className="font-semibold text-white">{ticket.budget_status || 'Aprovado'}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-slate-400">Valor Total do Atendimento</div>
                                  <div className="text-xl sm:text-2xl font-black text-emerald-400">
                                    {formatCurrency(ticket.budget_grand_total)}
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {/* Botão de Ação Rápida WhatsApp */}
                            <div className="pt-2 flex justify-end">
                              <a
                                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Gostaria de informações sobre o meu chamado #${ticket.id} (${ticket.equipment_model || 'Tennant'}).`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-800/40 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" /> Falar com Técnico sobre Chamado #{ticket.id}
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* =============================================================== */}
              {/* ABA 2: EQUIPAMENTOS (SEGUNDO MENU) + HISTÓRICO & TROCA          */}
              {/* =============================================================== */}
              {activeTab === 'equipamentos' && (
                <div className="space-y-6">
                  
                  {/* Topo da Aba */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                    <div>
                      <h3 className="text-lg font-black text-white">Parque de Máquinas Cadastradas</h3>
                      <p className="text-xs text-slate-400">
                        Consulte o histórico de manutenções, custos acumulados e o momento ideal de substituição de cada máquina.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNewEquipmentModal(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#007481] hover:bg-[#005d68] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#007481]/30 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Cadastrar Equipamento
                    </button>
                  </div>

                  {/* Cards de Equipamentos */}
                  {equipments.length === 0 ? (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center">
                      <Cpu className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                      <h4 className="text-lg font-bold text-white mb-1">Nenhum equipamento cadastrado ainda</h4>
                      <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                        Cadastre suas lavadoras e varredeiras Tennant para acompanhar custos e histórico de serviços.
                      </p>
                      <button
                        onClick={() => setShowNewEquipmentModal(true)}
                        className="bg-[#007481] hover:bg-[#005d68] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg"
                      >
                        + Cadastrar Minha Primeira Máquina
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {equipments.map(eq => (
                        <div
                          key={eq.id}
                          className="bg-slate-900 border border-slate-800 hover:border-[#007481]/60 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="bg-[#007481]/20 text-[#00a3b4] text-xs font-extrabold px-2.5 py-0.5 rounded uppercase border border-[#007481]/30">
                                {eq.brand || 'Tennant'}
                              </span>
                              <span className="text-xs text-slate-400">
                                {eq.ownership_type || 'Próprio'}
                              </span>
                            </div>

                            <h4 className="text-lg font-black text-white mb-1">{eq.model || eq.name}</h4>
                            <div className="text-xs text-slate-400 space-y-1 mb-4">
                              <div>Chassi / Série: <strong className="text-slate-200">{eq.serial_number || 'Não informado'}</strong></div>
                              <div>Manutenções Realizadas: <strong className="text-slate-200">{eq.tickets_count || 0} chamados</strong></div>
                            </div>
                          </div>

                          {/* Custo Acumulado & Botão Ver Histórico */}
                          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase font-bold">Custo Acumulado</div>
                              <div className="text-base font-black text-emerald-400">
                                {formatCurrency(eq.total_maintenance_cost)}
                              </div>
                            </div>

                            <button
                              onClick={() => openEquipmentDetails(eq)}
                              className="flex items-center gap-1.5 bg-slate-800 hover:bg-[#007481] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                            >
                              <span>Ver Histórico & Troca</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* =============================================================== */}
              {/* ABA 3: USUÁRIOS AUTORIZADOS DA EMPRESA                         */}
              {/* =============================================================== */}
              {activeTab === 'usuarios' && (
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                    <div>
                      <h3 className="text-lg font-black text-white">Usuários & Contatos Autorizados</h3>
                      <p className="text-xs text-slate-400">
                        Equipe da sua empresa autorizada a abrir e acompanhar chamados no portal.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNewUserModal(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#007481] hover:bg-[#005d68] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Usuário
                    </button>
                  </div>

                  {/* Usuário Principal (Titular do Acesso) */}
                  <div className="bg-slate-900 border border-[#007481]/40 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#007481] text-white flex items-center justify-center font-black">
                          {clientData?.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-white text-base">{clientData?.name}</h4>
                            <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-500/30">
                              Titular da Conta
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {clientData?.email} • {clientData?.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Usuários Secundários */}
                  <div className="space-y-3">
                    {portalUsers.map(u => (
                      <div 
                        key={u.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-sm">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{u.name}</div>
                            <div className="text-xs text-slate-400">{u.role} {u.phone ? `• ${u.phone}` : ''} {u.email ? `• ${u.email}` : ''}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors"
                          title="Remover usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      ) : (

        /* ========================================================================= */
        /* 🌐 PÁGINA PÚBLICA / INFORMATIVA (QUANDO NÃO LOGADO)                       */
        /* ========================================================================= */
        <div className="relative">

          {/* Hero Banner Oficial Tennant Clean Tech Pro */}
          <section className="relative overflow-hidden pt-12 pb-16 lg:py-24 border-b border-slate-800 bg-gradient-to-b from-slate-950 via-[#0a192f] to-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,116,129,0.18),transparent_50%)] pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl">
                
                {/* Selo Oficial com Logo Alfa Tennant */}
                <div className="inline-flex items-center gap-3 bg-slate-900/90 border border-teal-500/40 p-2 pr-4 rounded-2xl shadow-xl mb-6">
                  <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs flex items-center">
                    <img 
                      src="/alfa-tennant-logo-hd.png" 
                      alt="Alfa Tennant" 
                      className="h-6 sm:h-7 w-auto object-contain" 
                    />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] sm:text-xs font-black text-teal-300 uppercase tracking-wide flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" /> Representante & Assistência Técnica Autorizada Alfa Tennant
                    </div>
                    <div className="text-[10px] text-slate-400">Peças Originais, Manutenção Certificada e Entrega Técnica • Paraná</div>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
                  Suporte Especializado & <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00a3b4] via-teal-300 to-emerald-400">
                    Portal de Chamados Tennant
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8">
                  Abra chamados em menos de 1 minuto, acompanhe manutenções em tempo real, consulte orçamentos vinculados e monitore o histórico completo de custos do seu parque de máquinas.
                </p>

                {/* CTAs Principais */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={() => { setRegError(''); setShowRegisterModal(true); }}
                    className="flex items-center justify-center gap-2 bg-[#007481] hover:bg-[#005d68] text-white px-7 py-4 rounded-xl font-black text-base shadow-xl shadow-[#007481]/30 transition-all transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" /> Cadastrar & Abrir Chamado
                  </button>

                  <button
                    onClick={() => { setLoginError(''); setShowLoginModal(true); }}
                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 px-6 py-4 rounded-xl font-bold text-base transition-colors"
                  >
                    <Lock className="w-4 h-4 text-teal-400" /> Já sou Cadastrado (Login)
                  </button>
                </div>

                {/* LGPD Assurance Badge */}
                <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Cadastro rápido, 100% seguro e em total conformidade com a LGPD (Lei 13.709/2018).</span>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 🛠️ SEÇÕES INFORMATIVAS DOS NOSSOS SERVIÇOS (100% INFORMATIVO - SEM ECOMMERCE) */}
          {/* ========================================================================= */}
          <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold text-[#00a3b4] uppercase tracking-wider">Excelência & Credibilidade</span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-2 mb-4">
                Serviços Oficiais de Assistência Técnica Tennant
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                A Clean Tech Pro é referência em atendimento técnico especializado, peças genuínas de fábrica e capacitação para garantir a máxima vida útil da sua máquina.
              </p>
            </div>

            {/* Grid dos 4 Pilares de Serviços */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Pilar 1: Assistência Técnica Autorizada */}
              <div className="bg-slate-900 border border-slate-800 hover:border-[#007481] rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#007481]/20 text-[#00a3b4] flex items-center justify-center mb-5 border border-[#007481]/30">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Assistência Autorizada</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Manutenções preventivas programadas e corretivas emergenciais. Diagnóstico eletrônico com ferramentas oficiais Tennant.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Técnicos credenciados de fábrica
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Atendimento ágil em campo
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Revisões completas periódicas
                    </li>
                  </ul>
                </div>
              </div>

              {/* Pilar 2: Peças e Insumos 100% Genuínos */}
              <div className="bg-slate-900 border border-slate-800 hover:border-[#007481] rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#007481]/20 text-[#00a3b4] flex items-center justify-center mb-5 border border-[#007481]/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Peças 100% Originais</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Aplicação exclusiva de peças e insumos originais Tennant, preservando a garantia e durabilidade do equipamento.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Escovas e lâminas de rodo Linatex
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Motores de aspiração e tração
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Baterias tracionárias certificadas
                    </li>
                  </ul>
                </div>
              </div>

              {/* Pilar 3: Entrega Técnica & Treinamento */}
              <div className="bg-slate-900 border border-slate-800 hover:border-[#007481] rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#007481]/20 text-[#00a3b4] flex items-center justify-center mb-5 border border-[#007481]/30">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Entrega Técnica</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Treinamento presencial de operadores para o uso correto das máquinas, com checklist de entrega e normas de segurança.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Capacitação prática de equipe
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Instruções de higienização diária
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Checklist operacional detalhado
                    </li>
                  </ul>
                </div>
              </div>

              {/* Pilar 4: Gestão e Momento Ideal de Troca */}
              <div className="bg-slate-900 border border-slate-800 hover:border-[#007481] rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#007481]/20 text-[#00a3b4] flex items-center justify-center mb-5 border border-[#007481]/30">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Gestão de Custos & Troca</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Tenha visibilidade total de quanto cada máquina gasta em reparos e saiba o momento exato em que compensa renovar o ativo.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Histórico por número de série
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Valores de orçamentos vinculados
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Alerta de viabilidade econômica
                    </li>
                  </ul>
                </div>
              </div>

            </div>

            {/* Banner Call-to-Action Inferior */}
            <div className="mt-16 bg-gradient-to-r from-[#005d68] to-[#007481] rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
              <div className="max-w-2xl mx-auto relative z-10">
                <h3 className="text-2xl sm:text-3xl font-black mb-3">
                  Pronto para gerenciar seus chamados com agilidade?
                </h3>
                <p className="text-teal-100 text-sm sm:text-base mb-6">
                  Crie seu cadastro agora mesmo, informe seu equipamento e tenha todo o histórico de manutenções na ponta dos dedos.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => { setRegError(''); setShowRegisterModal(true); }}
                    className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-900 font-black px-8 py-3.5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    Criar Minha Conta no Portal
                  </button>
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto bg-white/15 hover:bg-white/25 text-white font-bold px-6 py-3.5 rounded-xl border border-white/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <WhatsAppIcon className="w-4 h-4" /> Dúvidas via WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Rodapé da Página Pública com Link LGPD e Logos */}
          <footer className="border-t border-slate-900 bg-slate-950 py-10 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 space-y-4">
              
              {/* Logos no Rodapé */}
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <img 
                  src="/cleantechpro-official-white.png" 
                  alt="Clean Tech Pro" 
                  className="h-8 w-auto object-contain opacity-80" 
                />
                <span className="text-slate-700">|</span>
                <div className="bg-white px-2.5 py-1 rounded-lg opacity-90 flex items-center shadow-xs">
                  <img 
                    src="/alfa-tennant-logo-hd.png" 
                    alt="Alfa Tennant" 
                    className="h-5 w-auto object-contain" 
                  />
                </div>
              </div>

              <p>© {new Date().getFullYear()} Clean Tech Pro • Representante & Assistência Técnica Autorizada Tennant. Todos os direitos reservados.</p>
              <div className="flex items-center justify-center gap-4 text-slate-400">
                <button 
                  onClick={() => setShowLgpdModal(true)}
                  className="hover:text-[#00a3b4] underline transition-colors"
                >
                  Termos de Uso e Política de Privacidade (LGPD)
                </button>
                <span>•</span>
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                  Suporte: {WHATSAPP_DISPLAY}
                </a>
              </div>
            </div>
          </footer>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 📝 MODAL DE AUTOCADASTRO COM CONFORMIDADE LGPD OBRIGATÓRIA                 */}
      {/* ========================================================================= */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white px-2.5 py-1 rounded-lg shadow-xs flex items-center">
                  <img src="/alfa-tennant-logo-hd.png" alt="Alfa Tennant" className="h-5 w-auto object-contain" />
                </div>
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                  Assistência Técnica Autorizada
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">Criar Conta no Portal do Cliente</h3>
              <p className="text-xs text-slate-400 mt-1">
                Cadastre sua empresa para abrir chamados, acompanhar serviços e gerenciar seus equipamentos.
              </p>
            </div>

            {regError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Dados Principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nome / Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="Ex: Empresa ou Seu Nome"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#007481]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">CNPJ ou CPF</label>
                  <input
                    type="text"
                    value={regForm.document}
                    onChange={(e) => setRegForm({ ...regForm, document: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#007481]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    required
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="(41) 99999-9999"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#007481]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Pessoa de Contato</label>
                  <input
                    type="text"
                    value={regForm.contact_person}
                    onChange={(e) => setRegForm({ ...regForm, contact_person: e.target.value })}
                    placeholder="Nome do responsável"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#007481]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">E-mail de Acesso *</label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="seuemail@empresa.com.br"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#007481]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Senha de Acesso *</label>
                  <input
                    type="password"
                    required
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#007481]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Endereço / Cidade / Estado</label>
                <input
                  type="text"
                  value={regForm.address}
                  onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  placeholder="Endereço onde as máquinas operam"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#007481]"
                />
              </div>

              {/* Opção Rápida: Cadastrar Equipamento e Abrir Chamado Imediato */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={regForm.has_equipment}
                    onChange={(e) => setRegForm({ ...regForm, has_equipment: e.target.checked })}
                    className="rounded text-[#007481] focus:ring-[#007481] w-4 h-4"
                  />
                  <span className="text-xs font-bold text-white">
                    Desejo cadastrar meu equipamento e abrir um chamado imediato agora
                  </span>
                </label>
              </div>

              {/* Seção Condicional de Equipamento e Chamado */}
              {regForm.has_equipment && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-[#007481]/40 space-y-3">
                  <div className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                    Dados do Equipamento & Chamado Inicial
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Modelo da Máquina *</label>
                      <input
                        type="text"
                        placeholder="Ex: Lavadora Tennant A-260"
                        value={regForm.equipment_model}
                        onChange={(e) => setRegForm({ ...regForm, equipment_model: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Número de Série / Chassi</label>
                      <input
                        type="text"
                        placeholder="Ex: TN-2026-X49"
                        value={regForm.equipment_serial}
                        onChange={(e) => setRegForm({ ...regForm, equipment_serial: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tipo de Serviço</label>
                      <select
                        value={regForm.ticket_type}
                        onChange={(e) => setRegForm({ ...regForm, ticket_type: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      >
                        <option value="Corretiva">Manutenção Corretiva (Reparo)</option>
                        <option value="Preventiva">Manutenção Preventiva / Revisão</option>
                        <option value="Entrega Técnica">Entrega Técnica / Treinamento</option>
                        <option value="Peças">Cotação / Solicitação de Peças</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Prioridade</label>
                      <select
                        value={regForm.ticket_priority}
                        onChange={(e) => setRegForm({ ...regForm, ticket_priority: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      >
                        <option value="Baixa">Baixa</option>
                        <option value="Média">Média</option>
                        <option value="Alta">Alta</option>
                        <option value="Urgente">Urgente (Máquina Parada)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Descrição do Problema / Solicitação</label>
                    <textarea
                      rows={2}
                      placeholder="Descreva o que está acontecendo com a máquina..."
                      value={regForm.ticket_description}
                      onChange={(e) => setRegForm({ ...regForm, ticket_description: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* =============================================================== */}
              {/* ⚖️ ACEITE FORMAL LGPD (LEI 13.709/2018)                          */}
              {/* =============================================================== */}
              <div className="pt-2 p-3.5 rounded-2xl bg-teal-950/30 border border-teal-500/30">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={regForm.lgpd_accepted}
                    onChange={(e) => setRegForm({ ...regForm, lgpd_accepted: e.target.checked })}
                    className="mt-0.5 rounded text-[#007481] focus:ring-[#007481] w-4 h-4 flex-shrink-0"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    Declaro que li e concordo expressamente com os{' '}
                    <button
                      type="button"
                      onClick={() => setShowLgpdModal(true)}
                      className="text-teal-300 underline font-bold hover:text-teal-200"
                    >
                      Termos de Uso e a Política de Privacidade e Tratamento de Dados (LGPD)
                    </button>{' '}
                    da Clean Tech Pro / Tennant, autorizando o tratamento de meus dados cadastrais e de equipamentos estritamente para fins de suporte técnico, ordens de serviço e garantias.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={regSubmitting}
                className="w-full bg-[#007481] hover:bg-[#005d68] disabled:opacity-50 text-white font-black py-3.5 rounded-xl shadow-lg transition-all text-sm mt-4"
              >
                {regSubmitting ? 'Processando Cadastro...' : 'Concluir Cadastro & Acessar Portal'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Já possui conta? <strong className="text-teal-400">Clique aqui para entrar</strong>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔑 MODAL DE LOGIN                                                         */}
      {/* ========================================================================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="bg-white px-3 py-1.5 rounded-xl shadow-md flex items-center">
                  <img src="/alfa-tennant-logo-hd.png" alt="Alfa Tennant" className="h-6 w-auto object-contain" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white">Login do Cliente</h3>
              <p className="text-xs text-slate-400 mt-1">Acesse seus chamados e equipamentos cadastrados</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">E-mail ou CNPJ/CPF</label>
                <input
                  type="text"
                  required
                  value={loginForm.login}
                  onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })}
                  placeholder="Seu e-mail ou documento"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#007481]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Senha de Acesso</label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Sua senha cadastrada"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#007481]"
                />
              </div>

              <button
                type="submit"
                disabled={loginSubmitting}
                className="w-full bg-[#007481] hover:bg-[#005d68] disabled:opacity-50 text-white font-black py-3 rounded-xl shadow-lg transition-all text-sm mt-2"
              >
                {loginSubmitting ? 'Verificando...' : 'Acessar Meu Painel'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Não tem conta ainda? <strong className="text-teal-400">Cadastre-se gratuitamente</strong>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📄 MODAL COMPLETO DE TERMOS E POLÍTICAS DE PRIVACIDADE LGPD               */}
      {/* ========================================================================= */}
      {showLgpdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-black text-white">Termos de Uso & Política de Privacidade (LGPD)</h3>
              </div>
              <button
                onClick={() => setShowLgpdModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 text-xs text-slate-300 space-y-4 pr-2 leading-relaxed">
              <p className="font-semibold text-teal-300">
                Em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).
              </p>

              <div>
                <h4 className="font-bold text-white mb-1">1. Identificação do Controlador</h4>
                <p>
                  A <strong>CLEAN TECH PRO</strong>, como representante e assistência técnica autorizada Tennant Company no Paraná, atua como controladora dos dados cadastrais inseridos neste portal.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">2. Finalidade do Tratamento de Dados</h4>
                <p>Os dados coletados (Razão Social, CNPJ/CPF, Telefone, E-mail, Endereço e identificação dos equipamentos) destinam-se exclusivamente para:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Abertura, triagem, agendamento e execução de chamados técnicos de manutenção;</li>
                  <li>Elaboração e envio de orçamentos de peças originais e serviços autorizados;</li>
                  <li>Emissão de ordens de serviço, relatórios técnicos e notas fiscais;</li>
                  <li>Comunicação em tempo real via WhatsApp e E-mail sobre o status dos atendimentos;</li>
                  <li>Gestão do histórico do ciclo de vida e custos dos equipamentos cadastrados.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">3. Segurança e Sigilo dos Dados</h4>
                <p>
                  Implementamos rígidas medidas técnicas de criptografia (senhas criptografadas em SHA-256 e tokens de sessão seguros), impedindo acessos não autorizados. Seus dados nunca serão comercializados ou cedidos para fins publicitários de terceiros.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">4. Direitos do Titular</h4>
                <p>
                  Conforme o Artigo 18 da Lei nº 13.709/2018, você possui o direito de confirmar a existência de tratamento, acessar seus dados, solicitar a correção de dados incompletos ou a exclusão de dados não obrigatórios para fins fiscais e legais, mediante solicitação formal pelo canal oficial de suporte.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">5. Registro do Consentimento</h4>
                <p>
                  Ao assinalar o campo de aceite no cadastro, o usuário confirma seu consentimento livre, informado e inequívoco. Registramos a data, horário e endereço IP para fins de auditoria e conformidade legal.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowLgpdModal(false)}
                className="bg-[#007481] hover:bg-[#005d68] text-white px-6 py-2.5 rounded-xl font-bold text-xs"
              >
                Entendido e Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ➕ MODAL DE NOVO CHAMADO (PARA CLIENTE LOGADO)                            */}
      {/* ========================================================================= */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setShowNewTicketModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <div className="flex items-center gap-2 text-[#00a3b4] font-bold text-xs uppercase mb-1">
                <Wrench className="w-4 h-4" /> Abertura Rápida
              </div>
              <h3 className="text-xl font-black text-white">Abrir Novo Chamado</h3>
              <p className="text-xs text-slate-400">Nossa equipe técnica será notificada imediatamente</p>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Selecione o Equipamento</label>
                <select
                  value={ticketForm.equipment_id}
                  onChange={(e) => setTicketForm({ ...ticketForm, equipment_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#007481]"
                >
                  <option value="">+ Cadastrar Novo Equipamento Neste Chamado</option>
                  {equipments.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.model || eq.name} (Série: {eq.serial_number || 'S/N'})
                    </option>
                  ))}
                </select>
              </div>

              {!ticketForm.equipment_id && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-[11px] font-bold text-teal-400 uppercase">Novo Equipamento</div>
                  <input
                    type="text"
                    placeholder="Modelo da Máquina (Ex: Tennant T300 / A-260)"
                    value={ticketForm.new_equipment_model}
                    onChange={(e) => setTicketForm({ ...ticketForm, new_equipment_model: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Número de Série / Chassi"
                    value={ticketForm.new_equipment_serial}
                    onChange={(e) => setTicketForm({ ...ticketForm, new_equipment_serial: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tipo de Chamado</label>
                  <select
                    value={ticketForm.ticket_type}
                    onChange={(e) => setTicketForm({ ...ticketForm, ticket_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Corretiva">Corretiva (Reparo)</option>
                    <option value="Preventiva">Preventiva (Revisão)</option>
                    <option value="Entrega Técnica">Entrega Técnica</option>
                    <option value="Peças">Peças / Consumíveis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Prioridade</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente (Parada)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Horímetro Atual (Opcional)</label>
                <input
                  type="number"
                  placeholder="Horas de uso marcadas no painel"
                  value={ticketForm.hour_meter}
                  onChange={(e) => setTicketForm({ ...ticketForm, hour_meter: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descrição do Problema *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explique o que ocorreu com a máquina ou o que precisa ser verificado..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007481]"
                />
              </div>

              <button
                type="submit"
                disabled={ticketSubmitting}
                className="w-full bg-[#007481] hover:bg-[#005d68] disabled:opacity-50 text-white font-black py-3 rounded-xl shadow-lg transition-all text-sm mt-3"
              >
                {ticketSubmitting ? 'Enviando Chamado...' : 'Abrir Chamado Imediato'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ➕ MODAL DE NOVO EQUIPAMENTO                                              */}
      {/* ========================================================================= */}
      {showNewEquipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowNewEquipmentModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-1">Cadastrar Equipamento</h3>
            <p className="text-xs text-slate-400 mb-5">Adicione sua máquina Tennant ao seu parque</p>

            <form onSubmit={handleCreateEquipment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Marca</label>
                <input
                  type="text"
                  value={eqForm.brand}
                  onChange={(e) => setEqForm({ ...eqForm, brand: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Modelo da Máquina *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lavadora A-260, T300, S10..."
                  value={eqForm.model}
                  onChange={(e) => setEqForm({ ...eqForm, model: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Número de Série / Chassi *</label>
                <input
                  type="text"
                  required
                  placeholder="Gravado na placa de identificação"
                  value={eqForm.serial_number}
                  onChange={(e) => setEqForm({ ...eqForm, serial_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={eqSubmitting}
                className="w-full bg-[#007481] hover:bg-[#005d68] text-white font-bold py-2.5 rounded-xl text-xs mt-3 shadow-lg"
              >
                {eqSubmitting ? 'Salvando...' : 'Salvar Equipamento'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 MODAL DE NOVO USUÁRIO AUTORIZADO                                       */}
      {/* ========================================================================= */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowNewUserModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-1">Adicionar Usuário Autorizado</h3>
            <p className="text-xs text-slate-400 mb-5">Permita que mais pessoas da sua empresa abram chamados</p>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do colaborador"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Função / Cargo</label>
                <input
                  type="text"
                  placeholder="Ex: Operador, Encarregado de Limpeza, Comprador"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp / Telefone</label>
                <input
                  type="text"
                  placeholder="(41) 99999-9999"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="email@empresa.com.br"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={userSubmitting}
                className="w-full bg-[#007481] hover:bg-[#005d68] text-white font-bold py-2.5 rounded-xl text-xs mt-3 shadow-lg"
              >
                {userSubmitting ? 'Adicionando...' : 'Adicionar Usuário'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 MODAL DE HISTÓRICO COMPLETO & INDICADOR DE TROCA DE EQUIPAMENTO         */}
      {/* ========================================================================= */}
      {selectedEquipmentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-[#00a3b4] uppercase tracking-wider">Ficha Técnica & Ciclo de Vida</span>
                <h3 className="text-xl font-black text-white">
                  {selectedEquipmentDetail.model || selectedEquipmentDetail.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Chassi/Série: {selectedEquipmentDetail.serial_number || 'S/N'}
                </p>
              </div>
              <button
                onClick={() => { setSelectedEquipmentDetail(null); setEquipmentHistoryData(null); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-5 space-y-6 pr-2">
              
              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#007481]" />
                  Calculando histórico de manutenções e diagnóstico de viabilidade...
                </div>
              ) : equipmentHistoryData ? (
                <>
                  {/* =========================================================== */}
                  {/* 🚨 INDICADOR INTELIGENTE: HORA DE TROCAR O EQUIPAMENTO      */}
                  {/* =========================================================== */}
                  <div className={`p-5 rounded-2xl border ${
                    equipmentHistoryData.metrics.recommendation.level === 'replace'
                      ? 'bg-rose-950/30 border-rose-500/50'
                      : equipmentHistoryData.metrics.recommendation.level === 'warning'
                      ? 'bg-amber-950/30 border-amber-500/50'
                      : 'bg-emerald-950/30 border-emerald-500/50'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`w-5 h-5 ${
                          equipmentHistoryData.metrics.recommendation.level === 'replace' ? 'text-rose-400' :
                          equipmentHistoryData.metrics.recommendation.level === 'warning' ? 'text-amber-400' :
                          'text-emerald-400'
                        }`} />
                        <h4 className="text-sm font-black text-white">
                          {equipmentHistoryData.metrics.recommendation.title}
                        </h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                        equipmentHistoryData.metrics.recommendation.level === 'replace' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        equipmentHistoryData.metrics.recommendation.level === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {equipmentHistoryData.metrics.recommendation.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {equipmentHistoryData.metrics.recommendation.description}
                    </p>

                    {/* Barra de Progresso de Custo Acumulado vs Ativo */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">Custo Acumulado em Manutenções:</span>
                        <span className="text-white">{formatCurrency(equipmentHistoryData.metrics.total_cost)} ({equipmentHistoryData.metrics.maintenance_ratio}% do valor de referência)</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            equipmentHistoryData.metrics.maintenance_ratio >= 65 ? 'bg-rose-500' :
                            equipmentHistoryData.metrics.maintenance_ratio >= 45 ? 'bg-amber-400' :
                            'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, equipmentHistoryData.metrics.maintenance_ratio || 5)}%` }}
                        />
                      </div>
                    </div>

                    {/* Botão de Ação Sugerida */}
                    <div className="flex justify-end">
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Gostaria de consultar sobre a substituição/locação para o equipamento ${selectedEquipmentDetail.model} (S/N: ${selectedEquipmentDetail.serial_number}).`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white shadow-md transition-colors ${
                          equipmentHistoryData.metrics.recommendation.level === 'replace'
                            ? 'bg-rose-600 hover:bg-rose-500'
                            : 'bg-[#007481] hover:bg-[#005d68]'
                        }`}
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                        {equipmentHistoryData.metrics.recommendation.actionCta}
                      </a>
                    </div>
                  </div>

                  {/* Histórico Cronológico de Manutenções */}
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-400" /> Histórico Completo de Ordens de Serviço
                    </h4>

                    {equipmentHistoryData.history.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                        Nenhum chamado de manutenção registrado para este chassi.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {equipmentHistoryData.history.map(hist => (
                          <div
                            key={hist.id}
                            className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-white text-xs">
                                Chamado #{hist.id} • {hist.ticket_type}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {new Date(hist.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300">{hist.description}</p>

                            {hist.budget_grand_total && (
                              <div className="pt-2 border-t border-slate-900 flex justify-between text-xs">
                                <span className="text-slate-400">Custo do Serviço/Peças:</span>
                                <strong className="text-emerald-400">{formatCurrency(hist.budget_grand_total)}</strong>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
