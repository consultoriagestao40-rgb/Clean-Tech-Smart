import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, DollarSign, Loader2, Plus, Edit, ExternalLink, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function Faturas() {
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [periodoFilter, setPeriodoFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Conta Azul State
  const [contaAzulConnected, setContaAzulConnected] = useState(false);
  const [isConnectingContaAzul, setIsConnectingContaAzul] = useState(false);

  // Modal para fins de teste/inserção rápida
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({ client_id: '', description: '', amount: '', due_date: '', status: 'Pendente' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    checkContaAzul();

    // Checar retorno de autorização do Conta Azul
    const caStatus = searchParams.get('conta_azul');
    if (caStatus === 'sucesso') {
      alert('🎉 Conta Azul conectado com sucesso!');
    } else if (caStatus === 'erro') {
      const msg = searchParams.get('msg') || 'Erro desconhecido';
      alert('⚠️ Erro ao conectar com o Conta Azul: ' + msg);
    }
  }, []);

  async function checkContaAzul() {
    try {
      const res = await fetch('/api/conta-azul/status');
      const data = await res.json();
      setContaAzulConnected(!!data.connected);
    } catch (e) {
      console.warn('Erro ao checar status do Conta Azul:', e);
    }
  }

  async function handleConnectContaAzul() {
    setIsConnectingContaAzul(true);
    try {
      const res = await fetch('/api/conta-azul/auth-url');
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert('Erro ao obter link de conexão com Conta Azul');
      }
    } catch (e) {
      alert('Erro de conexão ao iniciar login no Conta Azul');
    } finally {
      setIsConnectingContaAzul(false);
    }
  }

  async function fetchInvoices() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-invoices');
      const data = await res.json();
      if (data.invoices) {
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchClients() {
    try {
      const res = await fetch('/api/get-clients');
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch (error) {}
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter !== 'Todos' && inv.status !== statusFilter) return false;
    // Lógica simples de período omitida para o MVP
    return true;
  });

  const summary = {
    total: filteredInvoices.length,
    pendentes: filteredInvoices.filter(i => i.status === 'Pendente').length,
    pagas: filteredInvoices.filter(i => i.status === 'Paga').length,
    vencidas: filteredInvoices.filter(i => i.status === 'Vencida').length,
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        client_id: parseInt(formData.client_id),
        description: formData.description,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        status: formData.status
      };
      const res = await fetch('/api/save-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchInvoices();
      }
    } catch (error) {
      alert('Erro ao salvar fatura');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAsPaid = async (inv) => {
    if (!confirm('Marcar como Paga?')) return;
    try {
      const payload = { ...inv, status: 'Paga', payment_date: new Date().toISOString().split('T')[0] };
      const res = await fetch('/api/save-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) fetchInvoices();
    } catch (error) {}
  };

  return (
    <div className="font-sans text-gray-800 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Faturas</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          {/* Status Conta Azul */}
          {contaAzulConnected ? (
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Conta Azul Conectado</span>
              <button 
                onClick={handleConnectContaAzul}
                disabled={isConnectingContaAzul}
                title="Reconectar ou trocar conta do Conta Azul"
                className="ml-1 text-emerald-600 hover:text-emerald-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleConnectContaAzul}
              disabled={isConnectingContaAzul}
              className="flex items-center px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              {isConnectingContaAzul ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-1.5" />
              )}
              Conectar Conta Azul
            </button>
          )}

          <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-xs">
            <Plus className="w-4 h-4 mr-2" />
            Nova Fatura Manual
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filtros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Período</label>
            <select 
              value={periodoFilter} onChange={e => setPeriodoFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos</option>
              <option value="Este Mês">Este Mês</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
            <select 
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Paga">Paga</option>
              <option value="Vencida">Vencida</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cartões de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500">Total de Faturas</span>
            <FileText className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{summary.total}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500">Pendentes</span>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{summary.pendentes}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500">Pagas</span>
            <CheckCircle2 className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{summary.pagas}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500">Vencidas</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-2xl font-bold text-red-500">{summary.vencidas}</span>
        </div>
      </div>

      {/* Tabela de Faturas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Todas as Faturas</h2>
        </div>
        
        <div className="overflow-x-auto p-6 pt-0 mt-4">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center p-12 text-gray-400">
              Nenhuma fatura encontrada com os filtros aplicados
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Cliente</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Descrição</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Valor</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Vencimento</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-4 font-medium text-gray-800">{inv.client_name}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-gray-800">{inv.description}</span>
                        {inv.contract_code && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-mono">
                            {inv.contract_code}
                          </span>
                        )}
                        {inv.budget_id && (
                          <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                            Orç. #{inv.budget_id}
                          </span>
                        )}
                        {inv.conta_azul_sale_id && (
                          <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Conta Azul
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-right font-bold text-gray-900">{formatCurrency(inv.amount)}</td>
                    <td className="py-4">{formatDate(inv.due_date)}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        inv.status === 'Paga' ? 'bg-green-100 text-green-700' :
                        inv.status === 'Vencida' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      {inv.status !== 'Paga' && (
                        <button onClick={() => handleMarkAsPaid(inv)} className="text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                          Marcar Paga
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Fatura Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Nova Fatura Manual</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Cliente</label>
                <select required value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Selecione...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Descrição</label>
                <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: Mensalidade" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Valor (R$)</label>
                  <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Vencimento</label>
                  <input required type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Cancelar</button>
              <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-blue-600 rounded-lg">Salvar Fatura</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
