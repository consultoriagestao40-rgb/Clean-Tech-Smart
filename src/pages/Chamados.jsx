import { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  User,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

export default function Chamados() {
  const [tickets, setTickets] = useState([]);
  const [clients, setClients] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('tabela'); // 'tabela' | 'kanban'
  const [kanbanGroupBy, setKanbanGroupBy] = useState('status'); // 'status' | 'technician'
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [priorityFilter, setPriorityFilter] = useState('Todos');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    client_id: '',
    equipment_id: '',
    ticket_type: 'corretiva',
    status: 'Aberto',
    priority: 'Média',
    description: '',
    technician_name: '',
    technician_id: '',
    scheduled_date: '',
    internal_notes: ''
  });



  // Metric stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/get-tickets');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
        calculateStats(data.tickets);
      }
    } catch (err) {
      console.error('Erro ao buscar chamados:', err);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch('/api/get-technicians');
      const data = await res.json();
      if (data.success) {
        setTechnicians(data.technicians);
      }
    } catch (err) {
      console.error('Erro ao buscar técnicos:', err);
    }
  };

  const fetchClientsAndEquipments = async () => {
    try {
      const [clientsRes, eqRes] = await Promise.all([
        fetch('/api/get-clients'),
        fetch('/api/get-equipments')
      ]);
      const clientsData = await clientsRes.json();
      const eqData = await eqRes.json();
      
      if (clientsData.clients) setClients(clientsData.clients);
      if (eqData.equipments) setEquipments(eqData.equipments);
    } catch (err) {
      console.error('Erro ao buscar dados auxiliares:', err);
    }
  };

  const calculateStats = (items) => {
    const counts = {
      total: items.length,
      open: items.filter(x => x.status === 'Aberto').length,
      inProgress: items.filter(x => x.status === 'Em Atendimento').length,
      resolved: items.filter(x => x.status === 'Concluído').length
    };
    setStats(counts);
  };



  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchTickets(), fetchClientsAndEquipments(), fetchTechnicians()]);
      setIsLoading(false);
    };
    init();
  }, []);

  const handleOpenNew = () => {
    setFormData({
      id: null,
      client_id: '',
      equipment_id: '',
      ticket_type: 'corretiva',
      status: 'Aberto',
      priority: 'Média',
      description: '',
      technician_name: '',
      technician_id: '',
      scheduled_date: '',
      internal_notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ticket) => {
    // Format timestamp back to local datetime input string (YYYY-MM-DDThh:mm)
    let formattedDate = '';
    if (ticket.scheduled_date) {
      const d = new Date(ticket.scheduled_date);
      // Adjust timezone offset
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
      formattedDate = localISOTime;
    }

    setFormData({
      id: ticket.id,
      client_id: String(ticket.client_id || ''),
      equipment_id: String(ticket.equipment_id || ''),
      ticket_type: ticket.ticket_type,
      status: ticket.status || 'Aberto',
      priority: ticket.priority || 'Média',
      description: ticket.description || '',
      technician_name: ticket.technician_name || '',
      technician_id: String(ticket.technician_id || ''),
      scheduled_date: formattedDate,
      internal_notes: ticket.internal_notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.client_id || !formData.ticket_type) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/save-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchTickets();
      } else {
        const error = await res.json();
        alert('Erro ao salvar chamado: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao salvar chamado.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este chamado de manutenção?')) return;
    try {
      const res = await fetch('/api/delete-ticket', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchTickets();
      } else {
        alert('Erro ao excluir chamado.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao excluir chamado.');
    }
  };

  const handleQuickStatusChange = async (id, newStatus) => {
    try {
      const ticket = tickets.find(t => t.id === id);
      if (!ticket) return;

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
      }
    } catch (err) {
      console.error('Erro ao atualizar status rápido:', err);
    }
  };

  const handleDragStart = (e, ticketId) => {
    e.dataTransfer.setData('text/plain', String(ticketId));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, groupKey) => {
    e.preventDefault();
    const ticketId = Number(e.dataTransfer.getData('text/plain'));
    if (!ticketId) return;

    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    let updatedFields = {};
    if (kanbanGroupBy === 'status') {
      updatedFields = { status: groupKey };
    } else {
      updatedFields = { 
        technician_id: groupKey === 'unassigned' ? null : Number(groupKey),
        technician_name: groupKey === 'unassigned' ? null : (technicians.find(t => t.id === Number(groupKey))?.name || '')
      };
    }

    try {
      const res = await fetch('/api/save-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ticket,
          ...updatedFields
        })
      });
      if (res.ok) {
        fetchTickets();
      }
    } catch (err) {
      console.error('Erro ao mover chamado:', err);
    }
  };

  // Filtered tickets selector
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      (ticket.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.equipment_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.equipment_serial_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.technician_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(ticket.id).includes(searchTerm);

    const matchesType = typeFilter === 'Todos' || ticket.ticket_type === typeFilter;
    const matchesStatus = statusFilter === 'Todos' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'Todos' || ticket.priority === priorityFilter;

    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  const getTicketTypeLabel = (type) => {
    switch (type) {
      case 'garantia': return 'Garantia';
      case 'preventiva': return 'M. Preventiva';
      case 'corretiva': return 'M. Corretiva';
      case 'entrega_tecnica': return 'Entrega Técnica';
      case 'treinamento': return 'Treinamento';
      default: return type;
    }
  };

  const getTicketTypeClass = (type) => {
    switch (type) {
      case 'garantia': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'preventiva': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'corretiva': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'entrega_tecnica': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'treinamento': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Aberto': return 'bg-red-50 text-red-700 border-red-100';
      case 'Em Atendimento': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'Concluído': return 'bg-green-50 text-green-700 border-green-100';
      case 'Cancelado': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Alta': return 'text-red-700 font-semibold bg-red-50 border border-red-100 px-2 py-0.5 rounded';
      case 'Média': return 'text-amber-700 font-medium bg-amber-50 border border-amber-100 px-2 py-0.5 rounded';
      case 'Baixa': return 'text-green-700 font-medium bg-green-50 border border-green-100 px-2 py-0.5 rounded';
      default: return 'text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter equipments strictly owned by selected client
  const clientEquipments = equipments.filter(e => String(e.client_id) === String(formData.client_id));
  const selectedClient = clients.find(c => String(c.id) === String(formData.client_id));
  const selectedClientAddress = selectedClient?.address || '';

  const getKanbanColumns = () => {
    if (kanbanGroupBy === 'status') {
      return [
        { key: 'Aberto', title: 'Aberto', color: 'border-t-2 border-red-500 bg-red-50/20 text-red-700' },
        { key: 'Em Atendimento', title: 'Em Atendimento', color: 'border-t-2 border-amber-500 bg-amber-50/20 text-amber-700' },
        { key: 'Concluído', title: 'Concluído', color: 'border-t-2 border-green-500 bg-green-50/20 text-green-700' },
        { key: 'Cancelado', title: 'Cancelado', color: 'border-t-2 border-gray-500 bg-gray-50/20 text-gray-500' }
      ];
    } else {
      return [
        { key: 'unassigned', title: 'Não Designado', color: 'border-t-2 border-gray-400 bg-gray-50/20 text-gray-500' },
        ...technicians.map(t => ({
          key: String(t.id),
          title: t.name,
          color: 'border-t-2 border-blue-500 bg-blue-50/20 text-blue-700'
        }))
      ];
    }
  };

  const getTicketsForColumn = (columnKey) => {
    return filteredTickets.filter(ticket => {
      if (kanbanGroupBy === 'status') {
        return (ticket.status || 'Aberto') === columnKey;
      } else {
        if (columnKey === 'unassigned') {
          return !ticket.technician_id;
        }
        return String(ticket.technician_id) === columnKey;
      }
    });
  };

  return (
    <div className="font-sans text-gray-800 space-y-6">
      
      {/* Upper Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total Chamados</span>
            <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Em Aberto</span>
            <span className="text-2xl font-bold text-red-600">{stats.open}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Em Atendimento</span>
            <span className="text-2xl font-bold text-yellow-600">{stats.inProgress}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Concluídos</span>
            <span className="text-2xl font-bold text-green-600">{stats.resolved}</span>
          </div>
        </div>
      </div>

      {/* Header and Quick Add */}
      <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chamados de Manutenção</h1>
          <p className="text-xs text-gray-500 mt-1">Abra, direcione e monitore o fluxo de atendimentos e treinamentos em tempo real.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Segmented Control */}
          <div className="bg-gray-100 p-1 rounded-xl flex space-x-1 text-xs font-semibold">
            <button 
              onClick={() => setViewMode('tabela')} 
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'tabela' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Tabela
            </button>
            <button 
              onClick={() => setViewMode('kanban')} 
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Kanban
            </button>
          </div>

          <button 
            onClick={handleOpenNew}
            className="flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-sm text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Chamado
          </button>
        </div>
      </div>

      {/* Filters Box */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-gray-700 font-semibold text-sm">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <span>Filtros de Busca</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar cliente, ativo, série ou técnico..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-gray-50/50" 
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">Tipo:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm"
            >
              <option value="Todos">Todos</option>
              <option value="garantia">Garantia</option>
              <option value="preventiva">Manutenção Preventiva</option>
              <option value="corretiva">Manutenção Corretiva</option>
              <option value="entrega_tecnica">Entrega Técnica</option>
              <option value="treinamento">Treinamento</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm"
            >
              <option value="Todos">Todos</option>
              <option value="Aberto">Aberto</option>
              <option value="Em Atendimento">Em Atendimento</option>
              <option value="Concluído">Concluído</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">Prioridade:</span>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm"
            >
              <option value="Todos">Todos</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban GroupBy Selector Row */}
      {viewMode === 'kanban' && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-semibold">Agrupar Kanban por:</span>
            <div className="bg-gray-100 p-0.5 rounded-lg flex space-x-1 text-xs">
              <button 
                onClick={() => setKanbanGroupBy('status')} 
                className={`px-3 py-1 rounded-md transition-all ${kanbanGroupBy === 'status' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Status
              </button>
              <button 
                onClick={() => setKanbanGroupBy('technician')} 
                className={`px-3 py-1 rounded-md transition-all ${kanbanGroupBy === 'technician' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Técnico
              </button>
            </div>
          </div>
          <span className="text-xs text-gray-400 italic">Dica: Arraste e solte os cartões para redefinir status ou designar técnicos.</span>
        </div>
      )}

      {/* Content Area (Table or Kanban) */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span>Carregando chamados...</span>
        </div>
      ) : viewMode === 'tabela' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold w-24">Chamado</th>
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">Equipamento</th>
                  <th className="px-6 py-4 font-semibold w-40">Tipo</th>
                  <th className="px-6 py-4 font-semibold w-36">Status</th>
                  <th className="px-6 py-4 font-semibold w-28 text-center">Prioridade</th>
                  <th className="px-6 py-4 font-semibold w-40">Técnico</th>
                  <th className="px-6 py-4 font-semibold w-40">Agendamento</th>
                  <th className="px-6 py-4 font-semibold w-28 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400 italic">
                      Nenhum chamado de manutenção encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-600">
                        #{ticket.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {ticket.client_name || <span className="text-gray-300 font-sans italic">-</span>}
                        </div>
                        {ticket.client_address ? (
                          <div className="mt-1 space-y-1">
                            <p className="text-[11px] text-gray-400 max-w-[220px] truncate" title={ticket.client_address}>
                              {ticket.client_address}
                            </p>
                            <div className="flex items-center space-x-2 text-[10px] font-bold">
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.client_address)}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center hover:underline"
                              >
                                Maps ↗
                              </a>
                              <span className="text-gray-300">|</span>
                              <a 
                                href={`https://waze.com/ul?q=${encodeURIComponent(ticket.client_address)}&navigate=yes`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-cyan-500 hover:text-cyan-700 flex items-center hover:underline"
                              >
                                Waze ↗
                              </a>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 italic block">Sem endereço</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {ticket.equipment_name ? (
                          <div>
                            <p className="font-semibold text-gray-800">{ticket.equipment_name}</p>
                            <p className="text-xs text-gray-400">{ticket.equipment_brand} {ticket.equipment_model} {ticket.equipment_serial_number ? `(S/N: ${ticket.equipment_serial_number})` : ''}</p>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic">Sem Equipamento</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTicketTypeClass(ticket.ticket_type)}`}>
                          {getTicketTypeLabel(ticket.ticket_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={ticket.status || 'Aberto'}
                          onChange={e => handleQuickStatusChange(ticket.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border focus:outline-none cursor-pointer ${getStatusClass(ticket.status)}`}
                        >
                          <option value="Aberto">Aberto</option>
                          <option value="Em Atendimento">Em Atendimento</option>
                          <option value="Concluído">Concluído</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center text-xs">
                        <span className={getPriorityClass(ticket.priority)}>
                          {ticket.priority || 'Média'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {ticket.technician_name ? (
                          <div className="flex items-center text-gray-800">
                            <User className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            {ticket.technician_name}
                          </div>
                        ) : (
                          <span className="text-gray-300 italic">Não designado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                        {formatDate(ticket.scheduled_date)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-1">
                          <button 
                            onClick={() => handleOpenEdit(ticket)} 
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar Chamado"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(ticket.id)} 
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir Chamado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className={`items-start pb-4 ${kanbanGroupBy === 'status' ? 'grid grid-cols-1 md:grid-cols-4 gap-6' : 'flex space-x-6 overflow-x-auto pb-4 custom-scrollbar'}`}>
          {getKanbanColumns().map(column => {
            const columnTickets = getTicketsForColumn(column.key);
            
            return (
              <div 
                key={column.key}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.key)}
                className={`bg-gray-50/50 rounded-2xl border border-gray-200/60 p-4 space-y-4 min-h-[500px] transition-colors ${
                  kanbanGroupBy === 'technician' ? 'min-w-[290px] w-[290px] shrink-0' : ''
                }`}
              >
                {/* Column Header */}
                <div className={`p-3 rounded-xl flex justify-between items-center ${column.color}`}>
                  <span className="font-bold text-xs uppercase tracking-wider truncate mr-2">{column.title}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 shadow-sm shrink-0">
                    {columnTickets.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                  {columnTickets.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 px-4 text-center text-xs text-gray-400 italic">
                      Arraste chamados aqui
                    </div>
                  ) : (
                    columnTickets.map(ticket => (
                      <div 
                        key={ticket.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ticket.id)}
                        className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all space-y-3 border-l-4 ${
                          ticket.priority === 'Alta' ? 'border-l-red-500' :
                          ticket.priority === 'Baixa' ? 'border-l-green-500' : 'border-l-amber-500'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-xs font-bold text-blue-600">#{ticket.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getTicketTypeClass(ticket.ticket_type)}`}>
                            {getTicketTypeLabel(ticket.ticket_type)}
                          </span>
                        </div>

                        {/* Card Body */}
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-gray-900 leading-tight text-left">{ticket.client_name}</h4>
                          {ticket.client_address && (
                            <p className="text-[10px] text-gray-400 truncate text-left" title={ticket.client_address}>
                              {ticket.client_address}
                            </p>
                          )}
                          {ticket.equipment_name && (
                            <div className="text-[10px] text-gray-600 bg-gray-50 p-1.5 rounded-lg font-medium leading-tight text-left truncate">
                              {ticket.equipment_name}
                            </div>
                          )}
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-100">
                          {ticket.scheduled_date ? (
                            <div className="flex items-center text-[10px] text-gray-500">
                              <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                              <span>{formatDate(ticket.scheduled_date).split(' ')[0]}</span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-gray-300 italic">Sem data</span>
                          )}

                          {/* Quick Route Link */}
                          {ticket.client_address ? (
                            <div className="flex items-center space-x-1 font-bold text-[9px]">
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.client_address)}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                Maps
                              </a>
                              <span className="text-gray-300">|</span>
                              <a 
                                href={`https://waze.com/ul?q=${encodeURIComponent(ticket.client_address)}&navigate=yes`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-cyan-500 hover:text-cyan-700"
                              >
                                Waze
                              </a>
                            </div>
                          ) : null}

                          <div className="flex space-x-0.5">
                            <button 
                              type="button"
                              onClick={() => handleOpenEdit(ticket)} 
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Editar"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDelete(ticket.id)} 
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                              title="Excluir"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {formData.id ? `Editar Chamado #${formData.id}` : 'Abrir Novo Chamado'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Cliente *</label>
                  <select 
                    required
                    value={formData.client_id} 
                    onChange={e => setFormData({ ...formData, client_id: e.target.value, equipment_id: '' })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                  >
                    <option value="">Selecione o Cliente</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Ativo / Equipamento</label>
                  <select 
                    value={formData.equipment_id} 
                    onChange={e => setFormData({ ...formData, equipment_id: e.target.value })} 
                    disabled={!formData.client_id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white disabled:bg-gray-100"
                  >
                    <option value="">Selecione o Equipamento</option>
                    {clientEquipments.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.brand} {e.model} {e.serial_number ? `S/N: ${e.serial_number}` : ''})</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedClientAddress && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 space-y-1 text-left">
                  <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-wider">Endereço do Cliente</span>
                  <p className="text-xs text-gray-700 font-medium">{selectedClientAddress}</p>
                  <div className="flex items-center space-x-3 pt-1 text-[11px] font-bold">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedClientAddress)}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                    >
                      Google Maps ↗
                    </a>
                    <span className="text-gray-300">|</span>
                    <a 
                      href={`https://waze.com/ul?q=${encodeURIComponent(selectedClientAddress)}&navigate=yes`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-500 hover:text-cyan-700 hover:underline flex items-center"
                    >
                      Waze ↗
                    </a>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tipo de Chamado *</label>
                  <select 
                    value={formData.ticket_type} 
                    onChange={e => setFormData({ ...formData, ticket_type: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                  >
                    <option value="corretiva">M. Corretiva</option>
                    <option value="preventiva">M. Preventiva</option>
                    <option value="garantia">Garantia</option>
                    <option value="entrega_tecnica">Entrega Técnica</option>
                    <option value="treinamento">Treinamento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Prioridade</label>
                  <select 
                    value={formData.priority} 
                    onChange={e => setFormData({ ...formData, priority: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({ ...formData, status: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                  >
                    <option value="Aberto">Aberto</option>
                    <option value="Em Atendimento">Em Atendimento</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Data / Hora de Agendamento</label>
                  <input 
                    type="datetime-local" 
                    value={formData.scheduled_date} 
                    onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Técnico Responsável</label>
                  <select 
                    value={formData.technician_id} 
                    onChange={e => setFormData({ ...formData, technician_id: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                  >
                    <option value="">Selecione o Técnico</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Defeito Relatado / Solicitação</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white resize-none h-20" 
                  placeholder="Descreva o problema ou solicitação..." 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Laudo Técnico / Observações Internas</label>
                <textarea 
                  value={formData.internal_notes} 
                  onChange={e => setFormData({ ...formData, internal_notes: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white resize-none h-20" 
                  placeholder="Relato técnico de atendimento, observações, laudos de visitas..." 
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition-colors flex items-center text-sm shadow-sm"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSaving ? 'Salvando...' : 'Salvar Chamado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
