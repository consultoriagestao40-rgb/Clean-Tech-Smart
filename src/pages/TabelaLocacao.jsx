import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Edit, X, Trash2, ShieldAlert } from 'lucide-react';

export default function TabelaLocacao() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: null, code: '', type: '', description: '', 
    list_price: '', distributor_price: '', 
    price_12: '', price_24: '', price_36: '', price_48: '', price_60: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-rental-prices');
      const data = await res.json();
      if (data.rentalPrices) setItems(data.rentalPrices);
    } catch (error) {
      console.error('Erro ao buscar tabela de locação:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleEdit = (item) => {
    setFormData({
      id: item.id,
      code: item.code || '',
      type: item.type || '',
      description: item.description || '',
      list_price: item.list_price || '',
      distributor_price: item.distributor_price || '',
      price_12: item.price_12 || '',
      price_24: item.price_24 || '',
      price_36: item.price_36 || '',
      price_48: item.price_48 || '',
      price_60: item.price_60 || ''
    });
    setIsModalOpen(true);
  };

  const openNewItem = () => {
    setFormData({
      id: null, code: '', type: '', description: '', 
      list_price: '', distributor_price: '', 
      price_12: '', price_24: '', price_36: '', price_48: '', price_60: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Parse values to float or null
    const payload = {
      ...formData,
      list_price: formData.list_price ? parseFloat(formData.list_price) : null,
      distributor_price: formData.distributor_price ? parseFloat(formData.distributor_price) : null,
      price_12: formData.price_12 ? parseFloat(formData.price_12) : null,
      price_24: formData.price_24 ? parseFloat(formData.price_24) : null,
      price_36: formData.price_36 ? parseFloat(formData.price_36) : null,
      price_48: formData.price_48 ? parseFloat(formData.price_48) : null,
      price_60: formData.price_60 ? parseFloat(formData.price_60) : null
    };

    try {
      const response = await fetch('/api/save-rental-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setIsModalOpen(false);
        fetchItems();
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

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza de que deseja excluir este equipamento da tabela de locação?')) return;
    try {
      const response = await fetch('/api/delete-rental-price', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        fetchItems();
      } else {
        alert('Erro ao excluir registro.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao excluir.');
    }
  };

  // Get unique machine types for filtering
  const types = ['Todos', ...new Set(items.map(item => item.type).filter(Boolean))];

  const filtered = items.filter(item => {
    const matchesSearch = 
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'Todos' || item.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const formatBRL = (val) => {
    if (val === null || val === undefined || val === '') return '—';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="font-sans text-gray-800 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
             Tabela de Locação Tennant
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie a tabela oficial de locação, preços de lista, distribuidor e mensalidades (12 a 60 meses)</p>
        </div>
        <button 
          onClick={openNewItem}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Equipamento
        </button>
      </header>

      {/* Filter and Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por código, descrição ou tipo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <label className="text-sm font-medium text-gray-500 whitespace-nowrap">Filtrar Tipo:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm"
          >
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5 font-bold text-gray-700">Cód.</th>
                <th className="px-4 py-3.5 font-bold text-gray-700">Tipo</th>
                <th className="px-4 py-3.5 font-bold text-gray-700 min-w-[200px]">Descrição Completa</th>
                <th className="px-3 py-3.5 font-bold text-gray-700 text-right">Lista (c/ Imp)</th>
                <th className="px-3 py-3.5 font-bold text-gray-700 text-right">Distribuidor</th>
                <th className="px-3 py-3.5 font-bold text-blue-700 text-right bg-blue-50/30">12 M</th>
                <th className="px-3 py-3.5 font-bold text-blue-700 text-right bg-blue-50/30">24 M</th>
                <th className="px-3 py-3.5 font-bold text-blue-700 text-right bg-blue-50/30">36 M</th>
                <th className="px-3 py-3.5 font-bold text-blue-700 text-right bg-blue-50/30">48 M</th>
                <th className="px-3 py-3.5 font-bold text-blue-700 text-right bg-blue-50/30">60 M</th>
                <th className="px-4 py-3.5 font-bold text-gray-700 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="11" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                    <span className="text-gray-400">Carregando tabela de preços...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-12 text-center text-gray-400">
                    Nenhum registro de preço encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.code}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{item.type}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{item.description}</td>
                    <td className="px-3 py-3 text-right text-gray-600 font-medium">R$ {formatBRL(item.list_price)}</td>
                    <td className="px-3 py-3 text-right text-green-700 font-semibold">R$ {formatBRL(item.distributor_price)}</td>
                    <td className="px-3 py-3 text-right text-blue-900 font-semibold bg-blue-50/10">R$ {formatBRL(item.price_12)}</td>
                    <td className="px-3 py-3 text-right text-blue-900 font-semibold bg-blue-50/10">R$ {formatBRL(item.price_24)}</td>
                    <td className="px-3 py-3 text-right text-blue-900 font-semibold bg-blue-50/10">R$ {formatBRL(item.price_36)}</td>
                    <td className="px-3 py-3 text-right text-blue-900 font-semibold bg-blue-50/10">R$ {formatBRL(item.price_48)}</td>
                    <td className="px-3 py-3 text-right text-blue-900 font-semibold bg-blue-50/10">R$ {formatBRL(item.price_60)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end space-x-1">
                        <button onClick={() => handleEdit(item)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir">
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Save Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {formData.id ? 'Editar Preço de Locação' : 'Adicionar Novo Preço de Locação'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código do Equipamento *</label>
                  <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" placeholder="Ex: TNAT7" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Equipamento</label>
                  <input type="text" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" placeholder="Ex: Lavad Oper a Bordo" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Completa *</label>
                <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" placeholder="Ex: T7 Tennant Bateria" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Lista (R$)</label>
                  <input type="number" step="0.01" value={formData.list_price} onChange={e => setFormData({...formData, list_price: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Distribuidor (R$)</label>
                  <input type="number" step="0.01" value={formData.distributor_price} onChange={e => setFormData({...formData, distributor_price: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" placeholder="0.00" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <span className="text-sm font-bold text-blue-700 block mb-3">Tabela Mensal de Locação (R$/mês)</span>
                
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">12 Meses</label>
                    <input type="number" step="0.01" value={formData.price_12} onChange={e => setFormData({...formData, price_12: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">24 Meses</label>
                    <input type="number" step="0.01" value={formData.price_24} onChange={e => setFormData({...formData, price_24: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">36 Meses</label>
                    <input type="number" step="0.01" value={formData.price_36} onChange={e => setFormData({...formData, price_36: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">48 Meses</label>
                    <input type="number" step="0.01" value={formData.price_48} onChange={e => setFormData({...formData, price_48: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">60 Meses</label>
                    <input type="number" step="0.01" value={formData.price_60} onChange={e => setFormData({...formData, price_60: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs" />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end space-x-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition-colors flex items-center text-sm shadow-sm">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSaving ? 'Salvando...' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
