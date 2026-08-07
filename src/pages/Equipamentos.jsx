import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Edit, X, Package, Trash2, History, ShieldCheck, Layers, CheckCircle2, FileText, Wrench } from 'lucide-react';

export default function Equipamentos() {
  const [equipments, setEquipments] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [selectedEqForHistory, setSelectedEqForHistory] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: null, name: '', brand: '', model: '', serial_number: '', 
    ownership_type: 'proprio', supplier_name: '', client_id: '', status: 'Disponível', category_id: ''
  });

  // Client Modal state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    name: '', razao_social: '', document: '', email: '', phone: '', status: 'Ativo', contact_person: '', address: ''
  });

  // Category Modal state
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ id: null, name: '' });

  useEffect(() => {
    fetchEquipments();
    fetchClients();
    fetchCategories();
  }, []);

  async function fetchEquipments() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-equipments');
      const data = await res.json();
      if (data.equipments) setEquipments(data.equipments);
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchClients() {
    try {
      const res = await fetch('/api/get-clients');
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch('/api/get-categories');
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  }

  const handleOpenHistory = async (eq) => {
    setSelectedEqForHistory(eq);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setHistoryData(null);
    try {
      const res = await fetch(`/api/get-equipment-history?id=${eq.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data);
      } else {
        alert('Erro ao carregar histórico.');
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEdit = (eq) => {
    setFormData({
      id: eq.id,
      name: eq.name || '',
      brand: eq.brand || '',
      model: eq.model || '',
      serial_number: eq.serial_number || '',
      ownership_type: eq.ownership_type || 'proprio',
      supplier_name: eq.supplier_name || '',
      client_id: eq.client_id || '',
      status: eq.status || 'Disponível',
      category_id: eq.category_id || ''
    });
    setIsModalOpen(true);
  };

  const openNewEquipment = () => {
    setFormData({
      id: null, name: '', brand: '', model: '', serial_number: '', 
      ownership_type: 'proprio', supplier_name: '', client_id: '', status: 'Disponível', category_id: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/save-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setIsModalOpen(false);
        setFormData({ id: null, name: '', brand: '', model: '', serial_number: '', ownership_type: 'proprio', supplier_name: '', client_id: '', status: 'Disponível', category_id: '' });
        fetchEquipments();
      } else {
        const errorData = await response.json();
        alert('Erro ao salvar: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name) return;
    setIsSavingCategory(true);
    try {
      const res = await fetch('/api/save-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryFormData)
      });
      if (res.ok) {
        const data = await res.json();
        // Reset local category state
        setCategoryFormData({ id: null, name: '' });
        await fetchCategories();
        // If it was a newly created category, auto-select it in the equipment form
        if (!categoryFormData.id) {
          setFormData(prev => ({ ...prev, category_id: data.category.id }));
        }
      } else {
        const errorData = await res.json();
        alert('Erro ao salvar categoria: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao salvar categoria.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Os equipamentos associados a ela ficarão sem categoria.')) return;
    try {
      const res = await fetch('/api/delete-category', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: catId })
      });
      if (res.ok) {
        await fetchCategories();
        if (String(formData.category_id) === String(catId)) {
          setFormData(prev => ({ ...prev, category_id: '' }));
        }
      } else {
        alert('Erro ao excluir categoria');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao excluir categoria.');
    }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    setIsSavingClient(true);
    try {
      const response = await fetch('/api/save-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientFormData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsClientModalOpen(false);
        setClientFormData({ name: '', razao_social: '', document: '', email: '', phone: '', status: 'Ativo', contact_person: '', address: '' });
        await fetchClients();
        // Auto-select the newly created client
        setFormData(prev => ({ ...prev, client_id: data.client.id }));
      } else {
        const errorData = await response.json();
        alert('Erro ao salvar cliente: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao salvar cliente.');
    } finally {
      setIsSavingClient(false);
    }
  };

  const filtered = equipments.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOwnershipBadge = (type) => {
    switch (type) {
      case 'proprio': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">Próprio</span>;
      case 'sublocado': return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">Sublocado</span>;
      case 'cliente': return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">Do Cliente</span>;
      default: return null;
    }
  };

  return (
    <div className="font-sans text-gray-800 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="mr-3 text-blue-600" /> Equipamentos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie seu inventário próprio, sublocações e ativos de clientes</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button 
            onClick={openNewEquipment}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Equipamento
          </button>
        </div>
      </header>

      {/* Cards de Indicadores / Resumo do Park & Inventário */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Total de Ativos Atendidos */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Total Ativos Atendidos</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">
              {equipments.length}
            </span>
            <span className="text-[11px] text-gray-400 font-medium mt-0.5 block">Próprios, Sublocados e Clientes</span>
          </div>
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total de Ativos Próprios */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Ativos Próprios</span>
            <span className="text-2xl font-black text-green-700 mt-1 block">
              {equipments.filter(e => e.ownership_type === 'proprio').length}
            </span>
            <span className="text-[11px] text-gray-400 font-medium mt-0.5 block">Patrimônio Clean Tech</span>
          </div>
          <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Sub-locados (Tennant) */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Sub-locados (Tennant)</span>
            <span className="text-2xl font-black text-purple-700 mt-1 block">
              {equipments.filter(e => e.ownership_type === 'sublocado').length}
            </span>
            <span className="text-[11px] text-gray-400 font-medium mt-0.5 block">Ativos em Sublocação</span>
          </div>
          <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Disponíveis no Park */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Disponíveis no Park</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {equipments.filter(e => (e.ownership_type === 'proprio' || e.ownership_type === 'sublocado') && (e.status === 'Disponível' || !e.status)).length}
            </span>
            <span className="text-[11px] text-gray-400 font-medium mt-0.5 block">
              De {equipments.filter(e => e.ownership_type === 'proprio' || e.ownership_type === 'sublocado').length} no Park (Próprios + Sublocados)
            </span>
          </div>
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou N/S..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">Equipamento</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Nº de Série</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Propriedade</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Detalhe Posse</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    Nenhum equipamento encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((eq) => (
                  <tr key={eq.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 flex items-center">
                        {eq.name}
                        {eq.category_name && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded border border-blue-100 uppercase tracking-wide">
                            {eq.category_name}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{eq.brand} {eq.model}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{eq.serial_number || '-'}</td>
                    <td className="px-6 py-4">{getOwnershipBadge(eq.ownership_type)}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {eq.ownership_type === 'sublocado' && (
                        <span className="text-xs text-purple-700 font-medium block">
                          Fornecedor: {eq.supplier_name || 'Não informado'}
                        </span>
                      )}
                      {eq.client_name ? (
                        <span className="text-xs text-blue-700 font-bold block">
                          Cliente: {eq.client_name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-normal">Nenhum cliente vinculado</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                        eq.status === 'Locado' || eq.status === 'Alocado'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : eq.status === 'Em Manutenção'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {eq.status || 'Disponível'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center space-x-1.5">
                        <button 
                          onClick={() => handleOpenHistory(eq)} 
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 border border-indigo-100" 
                          title="Ver Histórico Completo do Ativo"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Histórico</span>
                        </button>
                        <button onClick={() => handleEdit(eq)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                          <Edit className="w-4 h-4" />
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

      {/* Modal Novo Equipamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Novo Equipamento</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Descrição *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ex: Lavadora Alfa 2000" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                  <input type="text" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Série</label>
                <input type="text" value={formData.serial_number} onChange={e => setFormData({...formData, serial_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" placeholder="Ex: NS-998877" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <div className="flex space-x-2">
                  <select 
                    value={formData.category_id || ''} 
                    onChange={e => setFormData({...formData, category_id: e.target.value})} 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-800"
                  >
                    <option value="">Selecione a categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => {
                      setCategoryFormData({ id: null, name: '' });
                      setIsCategoryModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center shadow-sm text-lg transition-colors"
                    title="Gerenciar Categorias"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Propriedade do Equipamento *</label>
                  <select 
                    value={formData.ownership_type} 
                    onChange={e => setFormData({...formData, ownership_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="proprio">Ativo Próprio (Da Empresa)</option>
                    <option value="sublocado">Sublocado (De Terceiros)</option>
                    <option value="cliente">Do Cliente (Ex: Assistência Técnica)</option>
                  </select>
                </div>

                {formData.ownership_type === 'sublocado' && (
                  <div className="animate-in fade-in slide-in-from-top-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor / Dono Original *</label>
                    <input required type="text" value={formData.supplier_name} onChange={e => setFormData({...formData, supplier_name: e.target.value})} placeholder="Ex: Alfa Tennant" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                )}

                {formData.ownership_type === 'cliente' && (
                  <div className="animate-in fade-in slide-in-from-top-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qual o cliente dono? *</label>
                    <div className="flex space-x-2">
                      <select required value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                        <option value="">Selecione o Cliente</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => setIsClientModalOpen(true)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg transition-colors flex items-center justify-center"
                        title="Cadastrar Novo Cliente"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition-colors flex items-center">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSaving ? 'Salvando...' : 'Salvar Equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rápido de Novo Cliente */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Cadastro Rápido de Cliente</h2>
              <button onClick={() => setIsClientModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia / Nome *</label>
                  <input required type="text" value={clientFormData.name} onChange={e => setClientFormData({...clientFormData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ex: Clean Tech Pro" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                  <input type="text" value={clientFormData.razao_social} onChange={e => setClientFormData({...clientFormData, razao_social: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ex: Clean Tech Ltda" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento (CPF/CNPJ)</label>
                <input type="text" value={clientFormData.document} onChange={e => setClientFormData({...clientFormData, document: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa de Contato</label>
                <input type="text" value={clientFormData.contact_person} onChange={e => setClientFormData({...clientFormData, contact_person: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Nome de quem atende" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input type="email" value={clientFormData.email} onChange={e => setClientFormData({...clientFormData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input type="text" value={clientFormData.phone} onChange={e => setClientFormData({...clientFormData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                <textarea value={clientFormData.address} onChange={e => setClientFormData({...clientFormData, address: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-20" placeholder="Endereço para cálculo de KM"></textarea>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSavingClient} className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition-colors flex items-center">
                  {isSavingClient ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSavingClient ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Rápido de Nova Categoria */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Gerenciar Categorias</h2>
              <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Formulário de Adicionar / Editar */}
            <form onSubmit={handleSaveCategory} className="p-6 border-b border-gray-100 bg-gray-50 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {categoryFormData.id ? 'Editar Nome da Categoria' : 'Nova Categoria'}
                </label>
                <div className="flex space-x-2">
                  <input 
                    required 
                    type="text" 
                    value={categoryFormData.name} 
                    onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })} 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm" 
                    placeholder="Ex: Varredeiras" 
                  />
                  <button 
                    type="submit" 
                    disabled={isSavingCategory} 
                    className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition-colors flex items-center text-sm shadow-sm"
                  >
                    {isSavingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : (categoryFormData.id ? 'Atualizar' : 'Salvar')}
                  </button>
                  {categoryFormData.id && (
                    <button 
                      type="button" 
                      onClick={() => setCategoryFormData({ id: null, name: '' })}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* Listagem de Categorias Existentes */}
            <div className="p-6 max-h-60 overflow-y-auto space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categorias Cadastradas</h3>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nenhuma categoria cadastrada.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center py-2 text-sm">
                      <span className="font-medium text-gray-800">{cat.name}</span>
                      <div className="flex space-x-1">
                        <button 
                          type="button"
                          onClick={() => setCategoryFormData({ id: cat.id, name: cat.name })}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar Categoria"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Excluir Categoria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                type="button" 
                onClick={() => setIsCategoryModalOpen(false)} 
                className="px-4 py-2 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors shadow-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL DE HISTÓRICO DO EQUIPAMENTO ---------------- */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>{selectedEqForHistory?.name}</span>
                    <span className="text-xs font-mono font-bold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded">
                      S/N: {selectedEqForHistory?.serial_number || 'Sem Série'}
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Histórico completo de locações, alocações e chamados de assistência técnica
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            {historyLoading ? (
              <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
                <p className="text-sm font-medium">Carregando histórico do equipamento...</p>
              </div>
            ) : historyData ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Header Summary Card */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tipo de Propriedade</span>
                    <div className="mt-1 font-bold">
                      {getOwnershipBadge(historyData.equipment.ownership_type)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status no Sistema</span>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                      historyData.equipment.status === 'Locado' || historyData.equipment.status === 'Alocado'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : historyData.equipment.status === 'Em Manutenção'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {historyData.equipment.status || 'Disponível'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cliente Vinculado Atual</span>
                    <span className="font-bold text-slate-800 mt-1 block">
                      {historyData.equipment.client_name || 'Nenhum cliente vinculado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Fornecedor / Origem</span>
                    <span className="font-bold text-slate-800 mt-1 block">
                      {historyData.equipment.supplier_name || 'Patrimônio Próprio'}
                    </span>
                  </div>
                </div>

                {/* Section 1: Histórico de Locações & Contratos */}
                {(historyData.equipment.ownership_type === 'proprio' || historyData.equipment.ownership_type === 'sublocado' || (historyData.contracts && historyData.contracts.length > 0) || (historyData.proposals && historyData.proposals.length > 0)) && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Histórico de Locações &amp; Contratos
                    </h3>

                    {(!historyData.contracts || historyData.contracts.length === 0) && (!historyData.proposals || historyData.proposals.length === 0) ? (
                      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-400">
                        Nenhum registro de contrato ou proposta de locação cadastrado para este ativo.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Contratos ativos e antigos */}
                        {historyData.contracts && historyData.contracts.map(c => (
                          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-2 hover:border-blue-300 transition-colors shadow-xxs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                                  {c.code || `CTR-#${c.id}`}
                                </span>
                                <span className="font-extrabold text-gray-900">{c.client_name || 'Cliente'}</span>
                              </div>
                              <p className="text-gray-500 text-[11px] mt-1">
                                Início: {c.start_date ? new Date(c.start_date).toLocaleDateString('pt-BR') : 'N/I'} • Vencimento: {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('pt-BR') : 'N/I'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-blue-600 block">
                                R$ {Number(c.total_rental_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                              </span>
                              <span className="text-[10px] font-bold uppercase text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                {c.status || 'Ativo'}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Propostas de locação */}
                        {historyData.proposals && historyData.proposals.map(p => (
                          <div key={p.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-2 shadow-xxs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                                  Proposta #LOC-{String(p.id).padStart(4, '0')}
                                </span>
                                <span className="font-bold text-gray-800">{p.client_name || 'Cliente'}</span>
                              </div>
                              <p className="text-gray-500 text-[11px] mt-1">
                                Criado em: {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'N/I'} • Período: {p.period_months || 36} meses
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-800 block">
                                R$ {Number(p.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                              </span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                p.status === 'Fechada' || p.status === 'Aprovada' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                              }`}>
                                {p.status || 'Rascunho'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Section 2: Histórico de Chamados & Manutenções */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    Histórico de Chamados &amp; Serviços Realizados
                  </h3>

                  {!historyData.tickets || historyData.tickets.length === 0 ? (
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-400">
                      Nenhum chamado de manutenção registrado para este equipamento.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {historyData.tickets.map(t => (
                        <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 text-xs space-y-2 shadow-xxs">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                                  OS #{t.id} • {t.ticket_type}
                                </span>
                                <span className="font-extrabold text-gray-900">{t.client_name || 'Cliente'}</span>
                              </div>
                              <span className="text-gray-400 text-[10px] block mt-0.5">
                                Agendado: {t.scheduled_date ? new Date(t.scheduled_date).toLocaleString('pt-BR') : 'Não agendado'} • Técnico: <strong>{t.technician_name || 'Não informado'}</strong>
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                              t.status === 'Concluído' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {t.status}
                            </span>
                          </div>

                          <div className="p-2.5 bg-slate-50 rounded-lg text-gray-700 leading-relaxed italic">
                            “{t.description || 'Sem descrição'}”
                          </div>

                          {t.resolution_notes && (
                            <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg text-emerald-900 space-y-1">
                              <span className="font-bold text-[10px] uppercase text-emerald-700 block">Laudo Técnico / Solução Executada:</span>
                              <p>{t.resolution_notes}</p>
                              {t.signed_by_name && (
                                <p className="text-[10px] text-emerald-700 font-medium pt-1">
                                  ✍️ Assinado por: <strong>{t.signed_by_name}</strong> {t.signed_by_document ? `(${t.signed_by_document})` : ''}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : null}

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
