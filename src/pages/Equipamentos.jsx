import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Edit, X, Package } from 'lucide-react';

export default function Equipamentos() {
  const [equipments, setEquipments] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', brand: '', model: '', serial_number: '', 
    ownership_type: 'proprio', supplier_name: '', client_id: '', status: 'Disponível'
  });

  // Client Modal state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    name: '', document: '', email: '', phone: '', status: 'Ativo'
  });

  useEffect(() => {
    fetchEquipments();
    fetchClients();
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
        setFormData({ name: '', brand: '', model: '', serial_number: '', ownership_type: 'proprio', supplier_name: '', client_id: '', status: 'Disponível' });
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
        setClientFormData({ name: '', document: '', email: '', phone: '', status: 'Ativo' });
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Equipamento
          </button>
        </div>
      </header>

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
                      <p className="font-medium text-gray-900">{eq.name}</p>
                      <p className="text-xs text-gray-500">{eq.brand} {eq.model}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{eq.serial_number || '-'}</td>
                    <td className="px-6 py-4">{getOwnershipBadge(eq.ownership_type)}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {eq.ownership_type === 'proprio' && '-'}
                      {eq.ownership_type === 'sublocado' && (eq.supplier_name || 'Fornecedor não info.')}
                      {eq.ownership_type === 'cliente' && (eq.client_name || 'Cliente deletado')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                        {eq.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
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
                <input type="text" value={formData.serial_number} onChange={e => setFormData({...formData, serial_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Razão Social *</label>
                <input required type="text" value={clientFormData.name} onChange={e => setClientFormData({...clientFormData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento (CPF/CNPJ)</label>
                <input type="text" value={clientFormData.document} onChange={e => setClientFormData({...clientFormData, document: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
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

    </div>
  );
}
