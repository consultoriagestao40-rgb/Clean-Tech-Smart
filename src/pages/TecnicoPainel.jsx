import { useState, useEffect, useRef } from 'react';
import { 
  Wrench, MapPin, Navigation, Camera, Edit2, CheckCircle2, 
  Trash2, X, Eye, ArrowLeft, Loader2, Award, ShieldCheck,
  FileText, Plus, DollarSign, Clock, Check, LogOut, User, RefreshCw, AlertCircle
} from 'lucide-react';
import TecnicoOrcamentoModal from '../components/TecnicoOrcamentoModal';

export default function TecnicoPainel() {
  // 1. Verificação de Autenticação Obrigatória
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const loggedInUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!token || !loggedInUser) {
      window.location.href = '/login?redirect=/tecnico';
    }
  }, [token, loggedInUser]);

  const roleLower = (loggedInUser?.role || '').toLowerCase();
  const isTech = roleLower.includes('téc') || roleLower.includes('tec');
  const isAdmin = roleLower.includes('admin') || roleLower.includes('super');

  // Navigation Tabs: 'chamados' | 'orcamentos'
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialTab = searchParams.get('tab') === 'orcamentos' ? 'orcamentos' : 'chamados';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Lists & State
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBudgetsLoading, setIsBudgetsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isApprovingId, setIsApprovingId] = useState(null);

  // Filter states
  const [ticketFilter, setTicketFilter] = useState('vigentes'); // 'todos' | 'vigentes' | 'concluidos'
  const [budgetFilter, setBudgetFilter] = useState('todos'); // 'todos' | 'pendentes' | 'aprovados'

  // Modal State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetTicket, setBudgetTicket] = useState(null);

  // Active ticket view state (OS execution)
  const [activeTicket, setActiveTicket] = useState(null);
  
  // Fields for closure
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverDocument, setReceiverDocument] = useState('');
  const [evidencePhotos, setEvidencePhotos] = useState([]);

  // Canvas ref for signature pad
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    if (token) {
      fetchTechnicians();
      fetchTickets();
      fetchBudgets();
    }
  }, [token]);

  const fetchTechnicians = async () => {
    try {
      const res = await fetch('/api/get-technicians');
      if (res.ok) {
        const data = await res.json();
        const techList = data.technicians || [];
        setTechnicians(techList);

        // Auto-detect technician from session (e.g., Jaime Freitas)
        if (loggedInUser) {
          const myTech = techList.find(t => 
            (loggedInUser.email && t.email && t.email.toLowerCase() === loggedInUser.email.toLowerCase()) ||
            (loggedInUser.name && t.name && (
              t.name.toLowerCase().includes(loggedInUser.name.toLowerCase()) ||
              loggedInUser.name.toLowerCase().includes(t.name.toLowerCase())
            ))
          );

          if (myTech) {
            setSelectedTechId(String(myTech.id));
            return;
          }
        }

        // Se for admin, padrão é 'todos'
        if (techList.length > 0 && !selectedTechId) {
          setSelectedTechId('todos');
        }
      }
    } catch (e) {
      console.error('Erro ao buscar técnicos:', e);
    }
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error('Erro ao buscar chamados:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBudgets = async () => {
    setIsBudgetsLoading(true);
    try {
      const res = await fetch('/api/get-budgets');
      if (res.ok) {
        const data = await res.json();
        setBudgets(data.budgets || []);
      }
    } catch (e) {
      console.error('Erro ao buscar orçamentos:', e);
    } finally {
      setIsBudgetsLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (ticket, newStatus) => {
    try {
      const res = await fetch('/api/save-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ticket,
          status: newStatus
        })
      });
      if (res.ok) {
        fetchTickets();
      } else {
        alert('Erro ao atualizar status do chamado.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    }
  };

  const handleApproveBudget = async (budgetId) => {
    if (!confirm(`Deseja aprovar este orçamento #${budgetId} e disponibilizá-lo para o cliente?`)) {
      return;
    }
    setIsApprovingId(budgetId);
    try {
      const res = await fetch('/api/save-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: budgetId,
          status: 'Aprovado'
        })
      });
      if (res.ok) {
        alert('Orçamento aprovado com sucesso! Agora está visível para o cliente no Portal.');
        fetchBudgets();
        fetchTickets();
      } else {
        alert('Erro ao aprovar orçamento.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao aprovar orçamento.');
    } finally {
      setIsApprovingId(null);
    }
  };

  const handleLogout = () => {
    if (confirm('Deseja realmente sair da sua conta?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const formatBRL = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 2. Filtragem de Chamados por Papel
  const activeTickets = tickets.filter(t => {
    // Se técnico, somente chamados atribuídos a ele
    if (isTech) {
      if (!selectedTechId || selectedTechId === 'todos') {
        const myTech = technicians.find(tec => 
          (loggedInUser?.email && tec.email && tec.email.toLowerCase() === loggedInUser.email.toLowerCase()) ||
          (loggedInUser?.name && tec.name && tec.name.toLowerCase().includes(loggedInUser.name.toLowerCase()))
        );
        if (myTech) return String(t.technician_id) === String(myTech.id);
        return false;
      }
      return String(t.technician_id) === String(selectedTechId);
    }

    // Se admin
    if (!selectedTechId || selectedTechId === 'todos') return true;
    return String(t.technician_id) === String(selectedTechId);
  });

  const displayedTickets = activeTickets.filter(t => {
    if (ticketFilter === 'vigentes') return t.status !== 'Concluído';
    if (ticketFilter === 'concluidos') return t.status === 'Concluído';
    return true; // 'todos'
  });

  const pendingTicketsCount = activeTickets.filter(t => t.status !== 'Concluído').length;
  const completedTicketsCount = activeTickets.filter(t => t.status === 'Concluído').length;

  // 3. Filtragem de Orçamentos por Papel
  const filteredBudgets = budgets.filter(b => {
    // Se técnico, somente os orçamentos criados por ele ou do seu técnico
    if (isTech) {
      const myTechId = selectedTechId && selectedTechId !== 'todos' ? Number(selectedTechId) : null;
      const isMyTech = myTechId && Number(b.technician_id) === myTechId;
      const isMyUser = loggedInUser?.id && Number(b.created_by_user_id) === Number(loggedInUser.id);
      if (!isMyTech && !isMyUser) return false;
    } else {
      // Se admin filtrou por técnico específico
      if (selectedTechId && selectedTechId !== 'todos') {
        if (Number(b.technician_id) !== Number(selectedTechId)) return false;
      }
    }

    if (budgetFilter === 'pendentes') {
      return (b.status || '').toLowerCase().includes('pendente');
    }
    if (budgetFilter === 'aprovados') {
      return (b.status || '').toLowerCase().includes('aprovado');
    }
    return true;
  });

  // Handle opening ticket details and initializing drawing parameters
  const handleOpenTicket = (ticket) => {
    setActiveTicket(ticket);
    setResolutionNotes(ticket.resolution_notes || '');
    setReceiverName(ticket.signed_by_name || '');
    setReceiverDocument(ticket.signed_by_document || '');
    
    if (ticket.evidence_photos) {
      setEvidencePhotos(ticket.evidence_photos.split('\n').filter(Boolean));
    } else {
      setEvidencePhotos([]);
    }

    setTimeout(() => {
      initSignatureCanvas();
    }, 150);
  };

  // Canvas drawing logic
  const initSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      isDrawingRef.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDraw = () => {
      isDrawingRef.current = false;
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handlePhotoCapture = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setEvidencePhotos(prev => [...prev, compressedBase64]);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index) => {
    setEvidencePhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleFinishOS = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      alert('Por favor, informe as notas de resolução do serviço.');
      return;
    }
    if (!receiverName.trim()) {
      alert('Por favor, informe o nome do cliente que está recebendo o serviço.');
      return;
    }

    const canvas = canvasRef.current;
    let signatureBase64 = null;
    if (canvas) {
      signatureBase64 = canvas.toDataURL();
    }

    setIsActionLoading(true);
    try {
      const res = await fetch('/api/close-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeTicket.id,
          evidence_photos: evidencePhotos.join('\n'),
          client_signature: signatureBase64,
          signed_by_name: receiverName,
          signed_by_document: receiverDocument,
          resolution_notes: resolutionNotes
        })
      });

      if (res.ok) {
        alert('Chamado finalizado e OS validada com sucesso!');
        await fetchTickets();
        setActiveTicket(null);
      } else {
        alert('Erro ao finalizar chamado no servidor.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar OS.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20 text-slate-800">
      
      {/* 🔝 HEADER MOBILE PREMIUM COM INFORMAÇÃO DO USUÁRIO LOGADO */}
      <header className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-40 shadow-md border-b border-slate-800">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <img 
              src="/cleantechpro-official-logo.png" 
              alt="Clean Tech Pro" 
              className="h-7 w-auto object-contain shrink-0"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs uppercase tracking-wider text-white truncate">
                  Clean Tech Smart
                </span>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold border border-blue-400/30">
                  {isTech ? 'Técnico' : 'Gestor'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {loggedInUser?.name || 'Usuário Autenticado'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => { fetchTickets(); fetchBudgets(); }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl transition-all border border-rose-500/20"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Screen Container */}
      <div className="max-w-md mx-auto p-4 space-y-4">

        {/* 1. SELETOR DE ABAS PRINCIPAIS: CHAMADOS VS ORÇAMENTOS */}
        {!activeTicket && (
          <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1 rounded-2xl shadow-inner">
            <button
              onClick={() => setActiveTab('chamados')}
              className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === 'chamados'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Chamados ({pendingTicketsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('orcamentos')}
              className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === 'orcamentos'
                  ? 'bg-[#eb6420] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Orçamentos ({filteredBudgets.length})</span>
            </button>
          </div>
        )}

        {/* 2. VISÃO DO TÉCNICO VS GESTOR (SELETOR OU TRAVA) */}
        {!activeTicket && (
          <div>
            {isAdmin ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xxs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-600" /> Visão Geral do Gestor
                  </label>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Acesso Completo
                  </span>
                </div>
                <select 
                  value={selectedTechId}
                  onChange={e => setSelectedTechId(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800"
                >
                  <option value="todos">📋 Ver Todos os Chamados e Orçamentos</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-blue-200 font-bold block">Técnico em Campo</span>
                    <h4 className="text-xs font-black text-white">{loggedInUser?.name || 'Técnico Responsável'}</h4>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-1 rounded-lg">
                  Atribuído a Você
                </span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 🛠️ ABA 1: CHAMADOS TÉCNICOS                                              */}
        {/* ========================================================================= */}
        {activeTab === 'chamados' && !activeTicket && (
          <div className="space-y-3">
            
            {/* Filtros rápidos de Chamados */}
            <div className="flex items-center justify-between gap-1.5 bg-white p-1.5 rounded-xl border border-gray-200 shadow-xs">
              <button
                onClick={() => setTicketFilter('vigentes')}
                className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all ${
                  ticketFilter === 'vigentes'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Vigentes ({pendingTicketsCount})
              </button>
              <button
                onClick={() => setTicketFilter('concluidos')}
                className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all ${
                  ticketFilter === 'concluidos'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Encerrados ({completedTicketsCount})
              </button>
              <button
                onClick={() => setTicketFilter('todos')}
                className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all ${
                  ticketFilter === 'todos'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Todos ({activeTickets.length})
              </button>
            </div>

            {/* Listagem de Chamados */}
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
              </div>
            ) : displayedTickets.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-2 shadow-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-extrabold text-sm text-slate-800">Nenhum chamado encontrado</h4>
                <p className="text-xs text-slate-500">
                  Não há chamados com os filtros atuais selecionados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedTickets.map(t => {
                  const hasBudget = Boolean(t.budget_id);
                  const isDone = t.status === 'Concluído';

                  return (
                    <div 
                      key={t.id} 
                      className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                        isDone ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-200'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex justify-between items-start border-b border-gray-100 pb-2.5 mb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase text-blue-600">
                              #{String(t.id).padStart(4, '0')} • {t.ticket_type}
                            </span>
                            {hasBudget && (
                              <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                                <DollarSign className="w-2.5 h-2.5" /> Orçamento Gerado
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-sm text-gray-900 mt-0.5">{t.client_name}</h4>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isDone ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          t.priority === 'Alta' ? 'bg-red-50 text-red-500 border border-red-100' :
                          t.priority === 'Crítica' ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse' :
                          'bg-blue-50 text-blue-500 border border-blue-100'
                        }`}>
                          {t.status}
                        </span>
                      </div>

                      {/* Equipment Info */}
                      {(t.equipment_model || t.equipment_name) && (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 mb-2 text-xs flex items-center justify-between text-slate-700">
                          <span className="font-bold">🚜 {t.equipment_model || t.equipment_name}</span>
                          <span className="text-[10px] text-slate-500">Série: {t.equipment_serial_number || '—'}</span>
                        </div>
                      )}

                      {/* Description & Address */}
                      <div className="text-xs text-slate-600 font-semibold space-y-2 mb-3 leading-relaxed">
                        <p className="line-clamp-2 italic">“{t.description}”</p>
                        {t.client_address && (
                          <div className="flex items-start gap-1.5 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{t.client_address}</span>
                          </div>
                        )}
                      </div>

                      {/* Botão de Destaque: FAZER ORÇAMENTO NO CELULAR */}
                      <button
                        type="button"
                        onClick={() => {
                          setBudgetTicket(t);
                          setIsBudgetModalOpen(true);
                        }}
                        className="w-full h-10 mb-2.5 bg-gradient-to-r from-[#eb6420] to-[#f97316] hover:from-[#d9531e] hover:to-[#ea580c] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 active:scale-98"
                      >
                        <FileText className="w-4 h-4" />
                        <span>{hasBudget ? '📋 Revisar / Novo Orçamento' : '📋 Elaborar Orçamento deste Chamado'}</span>
                      </button>

                      {/* Navigation & Status Actions */}
                      {!isDone && (
                        <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2.5">
                          <button
                            type="button"
                            onClick={() => handleQuickStatusUpdate(t, 'Em Rota')}
                            disabled={t.status === 'Em Rota'}
                            className={`h-9 border rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                              t.status === 'Em Rota'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                            }`}
                          >
                            <Navigation className="w-3.5 h-3.5" /> {t.status === 'Em Rota' ? '🚗 Em Rota' : '🚗 Iniciar Rota'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickStatusUpdate(t, 'Em Atendimento')}
                            disabled={t.status === 'Em Atendimento'}
                            className={`h-9 border rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                              t.status === 'Em Atendimento'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                            }`}
                          >
                            <Wrench className="w-3.5 h-3.5" /> {t.status === 'Em Atendimento' ? '🛠️ Atendendo' : '🛠️ Cheguei'}
                          </button>

                          {t.client_address && (
                            <>
                              <a 
                                href={`https://waze.com/ul?q=${encodeURIComponent(t.client_address)}&navigate=yes`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="h-9 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl text-[10px] font-black uppercase text-teal-700 tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <Navigation className="w-3.5 h-3.5" /> Waze
                              </a>
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.client_address)}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="h-9 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-[10px] font-black uppercase text-blue-700 tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <MapPin className="w-3.5 h-3.5" /> Maps
                              </a>
                            </>
                          )}
                          
                          <button 
                            onClick={() => handleOpenTicket(t)}
                            className="col-span-2 h-10 mt-1 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-98"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Finalizar Chamado / Assinar OS
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 📋 ABA 2: MÓDULO DE ORÇAMENTOS MOBILE                                      */}
        {/* ========================================================================= */}
        {activeTab === 'orcamentos' && !activeTicket && (
          <div className="space-y-3">
            
            {/* Botão de Criação de Orçamento Avulso no Celular */}
            <button
              onClick={() => {
                setBudgetTicket(null);
                setIsBudgetModalOpen(true);
              }}
              className="w-full h-12 bg-gradient-to-r from-[#eb6420] via-orange-500 to-[#f97316] hover:brightness-105 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-98 transition-all"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Novo Orçamento no Celular</span>
            </button>

            {/* Filtros rápidos de Orçamentos */}
            <div className="flex items-center justify-between gap-1.5 bg-white p-1.5 rounded-xl border border-gray-200 shadow-xs">
              <button
                onClick={() => setBudgetFilter('todos')}
                className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all ${
                  budgetFilter === 'todos'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Todos ({filteredBudgets.length})
              </button>
              <button
                onClick={() => setBudgetFilter('pendentes')}
                className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all ${
                  budgetFilter === 'pendentes'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setBudgetFilter('aprovados')}
                className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all ${
                  budgetFilter === 'aprovados'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Aprovados
              </button>
            </div>

            {/* Lista de Orçamentos */}
            {isBudgetsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-[#eb6420] animate-spin" />
              </div>
            ) : filteredBudgets.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-3 shadow-xs">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Nenhum orçamento encontrado</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {isTech 
                      ? 'Você ainda não elaborou orçamentos com os filtros atuais.' 
                      : 'Nenhum orçamento cadastrado com os critérios selecionados.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setBudgetTicket(null);
                    setIsBudgetModalOpen(true);
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Criar Orçamento Agora
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBudgets.map(b => {
                  const isPending = (b.status || '').toLowerCase().includes('pendente');
                  const isApproved = (b.status || '').toLowerCase().includes('aprovado');
                  const grandTotal = Number(b.grand_total || b.total_amount || 0);

                  return (
                    <div 
                      key={b.id}
                      className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                    >
                      {/* Top info */}
                      <div className="flex items-start justify-between border-b border-gray-100 pb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase text-[#eb6420]">
                              #ORC-{String(b.id).padStart(4, '0')}
                            </span>
                            {b.service_type && (
                              <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                {b.service_type}
                              </span>
                            )}
                          </div>
                          <h4 className="font-black text-sm text-slate-900 mt-0.5">
                            {b.client_name || b.contact_name || 'Cliente'}
                          </h4>
                        </div>

                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isApproved 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : isPending 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {b.status || 'Pendente'}
                        </span>
                      </div>

                      {/* Equipment and Technician metadata */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-400 block">Equipamento</span>
                          <span className="font-bold text-slate-800 truncate block">
                            {b.equipment_model || b.equipment_name || 'Geral'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-400 block">Técnico</span>
                          <span className="font-bold text-slate-800 truncate block">
                            {b.technician_name || 'Clean Tech Pro'}
                          </span>
                        </div>
                      </div>

                      {/* Values breakdown */}
                      <div className="grid grid-cols-3 gap-1.5 text-center py-1 border-y border-dashed border-gray-200">
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Mão Obra</span>
                          <span className="text-[11px] font-black text-slate-700">R$ {formatBRL(b.total_labor)}</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">KM Desloc.</span>
                          <span className="text-[11px] font-black text-slate-700">R$ {formatBRL(b.total_logistics)}</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Peças</span>
                          <span className="text-[11px] font-black text-slate-700">R$ {formatBRL(b.total_parts)}</span>
                        </div>
                      </div>

                      {/* Grand Total Bar */}
                      <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white px-3.5 py-2.5 rounded-xl shadow-xs">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Valor Total</span>
                        <span className="text-base font-black text-emerald-400">
                          R$ {formatBRL(grandTotal)}
                        </span>
                      </div>

                      {/* Notes if available */}
                      {b.notes && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-2 px-1">
                          “{b.notes}”
                        </p>
                      )}

                      {/* AÇÃO DO GESTOR: BOTÃO DE APROVAÇÃO RÁPIDA (1 TOQUE) */}
                      {isAdmin && isPending && (
                        <button
                          type="button"
                          disabled={isApprovingId === b.id}
                          onClick={() => handleApproveBudget(b.id)}
                          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-98"
                        >
                          {isApprovingId === b.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                          <span>{isApprovingId === b.id ? 'Aprovando...' : '✅ Aprovar Orçamento para o Cliente'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 📝 TELA DE EXECUÇÃO E ASSINATURA DA ORDEM DE SERVIÇO (CHAMADO ATIVO)       */}
        {/* ========================================================================= */}
        {activeTicket && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden flex flex-col text-left">
            
            {/* Header detail */}
            <div className="bg-slate-50 border-b border-gray-100 p-4 flex items-center gap-3 sticky top-[53px] z-30">
              <button 
                onClick={() => setActiveTicket(null)} 
                className="p-1.5 hover:bg-gray-200 rounded-lg text-slate-500 transition-colors"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 block">Ordem de Serviço (OS)</span>
                <h4 className="font-extrabold text-sm text-gray-900 leading-none mt-0.5">#{String(activeTicket.id).padStart(4, '0')} • {activeTicket.client_name}</h4>
              </div>
            </div>

            <form onSubmit={handleFinishOS} className="p-4 space-y-5">
              
              {/* Equipment Info */}
              <div className="bg-blue-50/30 border border-blue-100/50 rounded-xl p-3 text-xs leading-relaxed space-y-1.5">
                <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block border-b border-blue-100/60 pb-1 mb-1">
                  Equipamento do Cliente
                </span>
                <div><b>Equipamento:</b> {activeTicket.equipment_name || 'Não cadastrado'}</div>
                <div><b>Modelo/Marca:</b> {activeTicket.equipment_model || '—'} ({activeTicket.equipment_brand || '—'})</div>
                <div><b>Nº Série:</b> {activeTicket.equipment_serial_number || '—'}</div>
                <div><b>Defeito Relatado:</b> <span className="italic">“{activeTicket.description}”</span></div>
              </div>

              {/* Botão de Elaborar Orçamento dentro da OS */}
              <button
                type="button"
                onClick={() => {
                  setBudgetTicket(activeTicket);
                  setIsBudgetModalOpen(true);
                }}
                className="w-full h-11 bg-gradient-to-r from-[#eb6420] to-[#f97316] hover:from-[#d9531e] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 active:scale-98 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Elaborar Orçamento Deste Equipamento</span>
              </button>

              {/* Resolution Notes Input */}
              <div className="space-y-1.5">
                <label className="block text-xxs font-black text-slate-500 uppercase tracking-wider">Notas de Resolução do Técnico</label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="Relatório técnico detalhado sobre as ações tomadas e o status do equipamento..."
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Evidências Fotográficas (Snap Photos) */}
              <div className="space-y-2">
                <label className="block text-xxs font-black text-slate-500 uppercase tracking-wider">Evidências Fotográficas</label>
                
                {evidencePhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 py-1">
                    {evidencePhotos.map((url, idx) => (
                      <div key={idx} className="relative aspect-square border rounded-lg overflow-hidden bg-slate-50 shadow-xxs">
                        <img src={url} alt="Snap OS" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-650 text-white rounded-full transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center">
                  <label className="w-full h-11 bg-slate-50 hover:bg-slate-100 border border-dashed border-gray-300 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs font-bold text-slate-600 transition-colors shadow-xxs">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Tirar Foto / Anexar</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      onChange={handlePhotoCapture} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Digital Signature Pad */}
              <div className="space-y-2 border-t border-gray-150 pt-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xxs font-black text-slate-500 uppercase tracking-wider">Assinatura do Cliente</label>
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded"
                  >
                    Limpar
                  </button>
                </div>

                <div className="relative border border-gray-250 rounded-xl overflow-hidden shadow-inner">
                  <canvas 
                    ref={canvasRef} 
                    width={400} 
                    height={160} 
                    className="w-full h-40 bg-slate-50/70 cursor-crosshair touch-none" 
                  />
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 pointer-events-none text-slate-400 text-[8px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> OS Validada Digitalmente
                  </div>
                </div>

                {/* Receiver Info */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nome do Recebedor</label>
                    <input 
                      type="text" 
                      required
                      value={receiverName}
                      onChange={e => setReceiverName(e.target.value)}
                      placeholder="Nome do cliente"
                      className="w-full h-9 px-3 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Documento (CPF / RG)</label>
                    <input 
                      type="text" 
                      value={receiverDocument}
                      onChange={e => setReceiverDocument(e.target.value)}
                      placeholder="Identificação do cliente"
                      className="w-full h-9 px-3 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit OS Buttons */}
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="w-1/3 h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="w-2/3 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5"
                >
                  {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {isActionLoading ? 'Salvando...' : 'Finalizar OS & Assinar'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 📱 MODAL DE ORÇAMENTO MOBILE ULTRA-RESPONSIVO                              */}
      {/* ========================================================================= */}
      <TecnicoOrcamentoModal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setBudgetTicket(null);
        }}
        ticket={budgetTicket}
        currentUser={loggedInUser}
        onSuccess={() => {
          fetchBudgets();
          fetchTickets();
          setActiveTab('orcamentos');
        }}
      />

    </div>
  );
}
