import { useState, useEffect } from 'react';
import { ArrowLeft, User, Calendar, FileText, Package, Wrench, Plus, Loader2, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function NovoContrato() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [clients, setClients] = useState([]);
  const [equipmentsList, setEquipmentsList] = useState([]);
  const [modalitiesList, setModalitiesList] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: id || null,
    client_id: '',
    start_date: new Date().toISOString().split('T')[0],
    observations: '',
    equipments: [], // { equipment_id, modality_id, price }
    services: [] // { description, price }
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setIsLoading(true);
    try {
      const [cliRes, eqRes, modRes] = await Promise.all([
        fetch('/api/get-clients'),
        fetch('/api/get-equipments'),
        fetch('/api/get-modalities')
      ]);
      const cliData = await cliRes.json();
      const eqData = await eqRes.json();
      const modData = await modRes.json();
      
      setClients(cliData.clients || []);
      setEquipmentsList(eqData.equipments || []);
      setModalitiesList(modData.modalities || []);
      
      // Se for edição, carregar contrato
      if (id) {
        // Implementação futura de edição:
        // const res = await fetch(\`/api/get-contract?id=\${id}\`);
        // const data = await res.json();
        // setFormData(data);
      }
      
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const addEquipment = () => {
    setFormData(prev => ({
      ...prev,
      equipments: [...prev.equipments, { equipment_id: '', modality_id: '', price: 0 }]
    }));
  };

  const updateEquipment = (index, field, value) => {
    const newEq = [...formData.equipments];
    newEq[index][field] = value;
    setFormData(prev => ({ ...prev, equipments: newEq }));
  };

  const removeEquipment = (index) => {
    setFormData(prev => ({
      ...prev,
      equipments: prev.equipments.filter((_, i) => i !== index)
    }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { description: '', price: 0 }]
    }));
  };

  const updateService = (index, field, value) => {
    const newSvc = [...formData.services];
    newSvc[index][field] = value;
    setFormData(prev => ({ ...prev, services: newSvc }));
  };

  const removeService = (index) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const total_rental_value = formData.equipments.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
    const total_services_value = formData.services.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
    return { total_rental_value, total_services_value, total_venal_value: 0 };
  };

  const handleSave = async () => {
    if (!formData.client_id) return alert('Selecione um cliente.');
    
    setIsSaving(true);
    const totals = calculateTotals();
    
    try {
      const payload = {
        ...formData,
        ...totals
      };

      const response = await fetch('/api/save-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        navigate('/contratos');
      } else {
        const errorData = await response.json();
        alert('Erro ao salvar: ' + (errorData.error || 'Desconhecido'));
      }
    } catch (error) {
      alert('Erro de rede.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  const { total_rental_value, total_services_value } = calculateTotals();
  const grandTotal = total_rental_value + total_services_value;

  return (
    <div className="font-sans text-gray-800 max-w-4xl mx-auto space-y-6 pb-20">
      
      <header className="flex items-center space-x-4 mb-6">
        <button onClick={() => navigate('/contratos')} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{id ? 'Editar Contrato' : 'Novo Contrato'}</h1>
          <p className="text-sm text-gray-500">Crie ou edite um contrato de locação</p>
        </div>
      </header>

      {/* DADOS DO CONTRATO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center space-x-2">
          <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Dados do Contrato</h2>
            <p className="text-xs text-gray-500">Preencha as informações básicas</p>
          </div>
        </div>
        
        <div className="p-6 space-y-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
            <Calendar className="w-4 h-4 mr-1" /> Informações Básicas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Data do Contrato *</label>
              <input 
                type="date" 
                value={formData.start_date}
                onChange={e => setFormData({...formData, start_date: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                <User className="w-4 h-4 mr-1" /> Cliente *
              </label>
              <select 
                value={formData.client_id}
                onChange={e => setFormData({...formData, client_id: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Selecione um cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Observações</label>
            <input 
              type="text" 
              placeholder="Notas do contrato"
              value={formData.observations}
              onChange={e => setFormData({...formData, observations: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* EQUIPAMENTOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Equipamentos</h2>
              <p className="text-xs text-gray-500">Adicione os equipamentos deste contrato</p>
            </div>
          </div>
          <button onClick={addEquipment} className="px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center">
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </button>
        </div>

        <div className="p-6">
          {formData.equipments.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-gray-200 rounded-xl bg-gray-50">
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">Nenhum equipamento adicionado</p>
              <p className="text-xs text-gray-400 mb-4">Clique no botão abaixo para adicionar equipamentos</p>
              <button onClick={addEquipment} className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 flex items-center mx-auto">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Equipamento
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.equipments.map((eq, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-3 items-start border p-4 rounded-lg relative bg-white">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Equipamento</label>
                    <select 
                      value={eq.equipment_id} 
                      onChange={e => updateEquipment(idx, 'equipment_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none text-sm bg-white"
                    >
                      <option value="">Selecione...</option>
                      {equipmentsList.map(e => <option key={e.id} value={e.id}>{e.brand} - {e.model}</option>)}
                    </select>
                  </div>
                  <div className="w-full md:w-1/3">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Modalidade</label>
                    <select 
                      value={eq.modality_id} 
                      onChange={e => updateEquipment(idx, 'modality_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none text-sm bg-white"
                    >
                      <option value="">Selecione...</option>
                      {modalitiesList.map(m => <option key={m.id} value={m.id}>{m.name} ({m.days_count} dias)</option>)}
                    </select>
                  </div>
                  <div className="w-full md:w-1/4">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Valor (R$)</label>
                    <input 
                      type="number" step="0.01" 
                      value={eq.price} 
                      onChange={e => updateEquipment(idx, 'price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none text-sm"
                    />
                  </div>
                  <button onClick={() => removeEquipment(idx)} className="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SERVIÇOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Serviços</h2>
              <p className="text-xs text-gray-500">Adicione serviços adicionais ao contrato (opcional)</p>
            </div>
          </div>
          <button onClick={addService} className="px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center">
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </button>
        </div>

        <div className="p-6">
          {formData.services.length === 0 ? (
             <div className="text-center p-8 border border-dashed border-gray-200 rounded-xl bg-gray-50">
              <Wrench className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">Nenhum serviço adicionado</p>
              <p className="text-xs text-gray-400 mb-4">Serviços são opcionais para o contrato</p>
              <button onClick={addService} className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 flex items-center mx-auto">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Serviço
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.services.map((svc, idx) => (
                <div key={idx} className="flex gap-3 items-start border p-4 rounded-lg bg-white">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Descrição</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Treinamento Operacional"
                      value={svc.description} 
                      onChange={e => updateService(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none text-sm"
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Valor (R$)</label>
                    <input 
                      type="number" step="0.01" 
                      value={svc.price} 
                      onChange={e => updateService(idx, 'price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none text-sm"
                    />
                  </div>
                  <button onClick={() => removeService(idx)} className="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg flex justify-end items-center z-10 px-8">
        <div className="mr-8 text-right hidden md:block">
          <p className="text-sm text-gray-500">Valor Total Mensal</p>
          <p className="text-xl font-bold text-blue-600">R$ {grandTotal.toFixed(2).replace('.', ',')}</p>
        </div>
        <div className="flex space-x-4">
          <button onClick={() => navigate('/contratos')} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            {isSaving ? 'Criando...' : 'Criar Contrato'}
          </button>
        </div>
      </div>

    </div>
  );
}
