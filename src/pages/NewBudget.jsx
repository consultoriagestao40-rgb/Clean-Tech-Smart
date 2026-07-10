import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Save, Send, Loader2, ArrowLeft, X } from 'lucide-react';

export default function NewBudget() {
  const navigate = useNavigate();
  const formatBRL = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  const [clients, setClients] = useState([]);
  const [allEquipments, setAllEquipments] = useState([]);
  
  const [clientData, setClientData] = useState({
    client: '',
    contact: '',
    contactInfo: '',
    serviceType: 'corretiva',
    equipmentId: ''
  });

  // Modal Equipamento states
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isSavingEq, setIsSavingEq] = useState(false);
  const [eqFormData, setEqFormData] = useState({
    name: '',
    brand: '',
    model: '',
    serial_number: '',
    ownership_type: 'cliente',
    supplier_name: '',
    client_id: '',
    status: 'Disponível',
    category_id: ''
  });

  // Category states
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });

  const fetchEquipments = async () => {
    try {
      const res = await fetch('/api/get-equipments');
      const data = await res.json();
      if (data.equipments) {
        setAllEquipments(data.equipments);
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/get-categories');
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  useEffect(() => {
    async function initData() {
      try {
        const clientsRes = await fetch('/api/get-clients');
        const clientsData = await clientsRes.json();
        if (clientsData.clients) {
          setClients(clientsData.clients);
        }
        await fetchEquipments();
        await fetchCategories();
      } catch (error) {
        console.error('Erro ao inicializar dados:', error);
      }
    }
    initData();
  }, []);
  const [isSaving, setIsSaving] = useState(false);
  const [laborItems, setLaborItems] = useState([
    { id: 1, description: 'Técnico de Campo', hours: 2, unitPrice: 150 },
    { id: 2, description: 'Auxiliar Técnico', hours: 2, unitPrice: 80 },
    { id: 3, description: 'Visita Técnica', hours: 1, unitPrice: 100 },
  ]);

  const [partsItems, setPartsItems] = useState([
    { id: 1, partName: 'Placa de Controle Principal', quantity: 1, unitPrice: 450 },
  ]);

  const [logistics, setLogistics] = useState({
    initialKm: 12000,
    finalKm: 12050,
    pricePerKm: 1.5,
  });

  const [notes, setNotes] = useState('');

  const filteredEquipments = allEquipments.filter(e => {
    if (!clientData.client) return false;
    return String(e.client_id) === String(clientData.client);
  });

  const handleSaveEquipment = async (e) => {
    e.preventDefault();
    if (!eqFormData.name) {
      alert('Por favor, insira o nome do equipamento.');
      return;
    }
    setIsSavingEq(true);
    try {
      const payload = {
        ...eqFormData,
        client_id: Number(clientData.client)
      };
      
      const response = await fetch('/api/save-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        setEqFormData({
          name: '',
          brand: '',
          model: '',
          serial_number: '',
          ownership_type: 'cliente',
          supplier_name: '',
          client_id: '',
          status: 'Disponível',
          category_id: ''
        });
        setIsEqModalOpen(false);
        await fetchEquipments();
        setClientData(prev => ({
          ...prev,
          equipmentId: String(data.equipment.id)
        }));
      } else {
        const errorData = await response.json();
        alert('Erro ao salvar equipamento: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao salvar equipamento.');
    } finally {
      setIsSavingEq(false);
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
        setIsCategoryModalOpen(false);
        setCategoryFormData({ name: '' });
        await fetchCategories();
        setEqFormData(prev => ({ ...prev, category_id: data.category.id }));
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

  // Calculations
  const totalLabor = laborItems.reduce((acc, item) => acc + item.hours * item.unitPrice, 0);
  const totalParts = partsItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const totalKm = Math.max(0, logistics.finalKm - logistics.initialKm);
  const totalLogistics = totalKm * logistics.pricePerKm;
  const grandTotal = totalLabor + totalParts + totalLogistics;

  const handleSubmit = async (status) => {
    if (!clientData.client) {
      alert('Por favor, selecione um cliente.');
      return;
    }
    if (!clientData.equipmentId) {
      alert('Por favor, selecione o Ativo / Equipamento do cliente.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...clientData,
        laborItems,
        partsItems,
        logistics,
        notes,
        totalLabor,
        totalParts,
        totalLogistics,
        grandTotal,
        status
      };

      const response = await fetch('/api/save-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(status === 'Rascunho' ? 'Rascunho salvo com sucesso!' : 'Orçamento enviado para aprovação com sucesso!');
        navigate('/');
      } else {
        const errorData = await response.json();
        alert('Erro ao salvar: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao salvar orçamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const addLaborItem = () => {
    setLaborItems([...laborItems, { id: Date.now(), description: '', hours: 1, unitPrice: 0 }]);
  };

  const removeLaborItem = (id) => {
    setLaborItems(laborItems.filter((item) => item.id !== id));
  };

  const updateLaborItem = (id, field, value) => {
    setLaborItems(laborItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addPartItem = () => {
    setPartsItems([...partsItems, { id: Date.now(), partName: '', quantity: 1, unitPrice: 0 }]);
  };

  const removePartItem = (id) => {
    setPartsItems(partsItems.filter((item) => item.id !== id));
  };

  const updatePartItem = (id, field, value) => {
    setPartsItems(partsItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  return (
    <div className="font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 1. Cabeçalho de Ações */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Orçamento de Assistência</h1>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados e os custos para a proposta técnica</p>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <Link 
              to="/" 
              className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
            <button 
              onClick={() => handleSubmit('Rascunho')}
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Rascunho
            </button>
            <button 
              onClick={() => handleSubmit('Pendente')} 
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {isSaving ? 'Salvando...' : 'Enviar para Aprovação'}
            </button>
          </div>
        </header>

        {/* 2. Bloco 1: Dados do Cliente e Metadados */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Dados do Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Cliente *</label>
              <select 
                value={clientData.client} 
                onChange={(e) => setClientData({...clientData, client: e.target.value, equipmentId: ''})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-white"
              >
                <option value="">Selecione o Cliente</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col lg:col-span-2">
              <label className="text-sm font-medium text-gray-600 mb-1">Ativo / Equipamento *</label>
              <div className="flex space-x-2">
                <select 
                  value={clientData.equipmentId}
                  disabled={!clientData.client}
                  onChange={(e) => setClientData({...clientData, equipmentId: e.target.value})}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!clientData.client ? 'Selecione o Cliente' : 'Selecione o Ativo'}
                  </option>
                  {filteredEquipments.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} {e.brand ? `(${e.brand})` : ''} {e.serial_number ? `- N/S: ${e.serial_number}` : ''}
                    </option>
                  ))}
                </select>
                <button 
                  type="button"
                  disabled={!clientData.client}
                  onClick={() => setIsEqModalOpen(true)}
                  className="p-2 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-50 text-blue-600 disabled:text-gray-400 border border-blue-200 disabled:border-gray-200 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                  title="Cadastrar Novo Equipamento"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Contato</label>
              <input 
                type="text" 
                value={clientData.contact}
                onChange={(e) => setClientData({...clientData, contact: e.target.value})}
                placeholder="Nome do solicitante" 
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Celular / E-mail</label>
              <input 
                type="text" 
                value={clientData.contactInfo}
                onChange={(e) => setClientData({...clientData, contactInfo: e.target.value})}
                placeholder="(11) 99999-9999 / email@empresa.com" 
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Tipo de Serviço</label>
              <select 
                value={clientData.serviceType}
                onChange={(e) => setClientData({...clientData, serviceType: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-white"
              >
                <option value="corretiva">Manutenção Corretiva</option>
                <option value="preventiva">Manutenção Preventiva</option>
                <option value="instalacao">Instalação</option>
              </select>
            </div>
          </div>
        </section>

        {/* 3. Bloco 2: Mão de Obra (MO) */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Mão de Obra</h2>
            <button onClick={addLaborItem} className="text-sm flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Hora Técnica
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700 rounded-tl-lg">Descrição do Serviço</th>
                  <th className="px-4 py-3 font-medium text-gray-700 w-24">Qtd. Horas</th>
                  <th className="px-4 py-3 font-medium text-gray-700 w-32">Valor Unitário</th>
                  <th className="px-4 py-3 font-medium text-gray-700 w-32">Total</th>
                  <th className="px-4 py-3 font-medium text-gray-700 w-16 text-center rounded-tr-lg">Ações</th>
                </tr>
              </thead>
              <tbody>
                {laborItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">
                      <input type="text" value={item.description} onChange={(e) => updateLaborItem(item.id, 'description', e.target.value)} className="w-full bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1" placeholder="Ex: Técnico de Campo" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" min="0" value={item.hours} onChange={(e) => updateLaborItem(item.id, 'hours', Number(e.target.value))} className="w-full bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1" />
                    </td>
                    <td className="px-4 py-2 flex items-center">
                      <span className="text-gray-500 mr-1">R$</span>
                      <input type="number" min="0" value={item.unitPrice} onChange={(e) => updateLaborItem(item.id, 'unitPrice', Number(e.target.value))} className="w-full bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1" />
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-800">
                      R$ {formatBRL(item.hours * item.unitPrice)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => removeLaborItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Remover item">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
            <div className="text-right">
              <span className="text-sm text-gray-500">Subtotal Mão de Obra</span>
              <p className="text-lg font-semibold text-gray-800">R$ {formatBRL(totalLabor)}</p>
            </div>
          </div>
        </section>

        {/* 4. Bloco 3: Deslocamento / Logística */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Deslocamento / Logística</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">KM Inicial / Retirada</label>
              <input type="number" value={logistics.initialKm} onChange={(e) => setLogistics({...logistics, initialKm: Number(e.target.value)})} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">KM Final / Devolução</label>
              <input type="number" value={logistics.finalKm} onChange={(e) => setLogistics({...logistics, finalKm: Number(e.target.value)})} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Valor por KM Rodado (R$)</label>
              <input type="number" step="0.1" value={logistics.pricePerKm} onChange={(e) => setLogistics({...logistics, pricePerKm: Number(e.target.value)})} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center">
              <div>
                <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Total de KM</span>
                <span className="block text-lg font-semibold text-gray-800">{totalKm} km</span>
              </div>
              <div className="text-right">
                <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Total Deslocamento</span>
                <span className="block text-lg font-semibold text-blue-600">R$ {formatBRL(totalLogistics)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Bloco 4: Peças e Insumos */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Peças e Insumos</h2>
            <button onClick={addPartItem} className="text-sm flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Peça do Estoque
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700 rounded-tl-lg">Selecionar Peça (SKU + Nome)</th>
                  <th className="px-4 py-3 font-medium text-gray-700 w-24">Qtd.</th>
                  <th className="px-4 py-3 font-medium text-gray-700 w-32">Valor Unitário</th>
                  <th className="px-4 py-3 font-medium text-gray-700 w-32">Total</th>
                  <th className="px-4 py-3 font-medium text-gray-700 w-16 text-center rounded-tr-lg">Ações</th>
                </tr>
              </thead>
              <tbody>
                {partsItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">
                      <input type="text" value={item.partName} onChange={(e) => updatePartItem(item.id, 'partName', e.target.value)} className="w-full bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1" placeholder="Buscar peça..." />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updatePartItem(item.id, 'quantity', Number(e.target.value))} className="w-full bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1" />
                    </td>
                    <td className="px-4 py-2 flex items-center">
                      <span className="text-gray-500 mr-1">R$</span>
                      <input type="number" min="0" value={item.unitPrice} onChange={(e) => updatePartItem(item.id, 'unitPrice', Number(e.target.value))} className="w-full bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1" />
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-800">
                      R$ {formatBRL(item.quantity * item.unitPrice)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => removePartItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Remover peça">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
            <div className="text-right">
              <span className="text-sm text-gray-500">Subtotal Peças</span>
              <p className="text-lg font-semibold text-gray-800">R$ {formatBRL(totalParts)}</p>
            </div>
          </div>
        </section>

        {/* 6. Bloco 5: Resumo Financeiro e Observações */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Observações Internas / Laudo</h2>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="flex-grow w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[150px]" 
              placeholder="Descreva o laudo técnico preliminar, condições do equipamento ou outras notas relevantes para a aprovação..."
            ></textarea>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            {/* Elemento decorativo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
            
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Resumo Financeiro</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal Mão de Obra</span>
                <span className="font-medium text-gray-800">R$ {formatBRL(totalLabor)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal Logística</span>
                <span className="font-medium text-gray-800">R$ {formatBRL(totalLogistics)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal Peças</span>
                <span className="font-medium text-gray-800">R$ {formatBRL(totalParts)}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <span className="block text-sm text-blue-600 font-semibold mb-1 uppercase tracking-wide">Valor Total do Orçamento</span>
                <span className="block text-4xl font-bold text-blue-900">R$ {formatBRL(grandTotal)}</span>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Modal Cadastro de Equipamento */}
      {isEqModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Novo Equipamento para o Cliente</h2>
                <p className="text-xs text-gray-500 mt-1">Este equipamento será associado ao cliente selecionado.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsEqModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEquipment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Descrição *</label>
                <input 
                  required 
                  type="text" 
                  value={eqFormData.name} 
                  onChange={e => setEqFormData({...eqFormData, name: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" 
                  placeholder="Ex: Lavadora Hidropneumática 3000" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input 
                    type="text" 
                    value={eqFormData.brand} 
                    onChange={e => setEqFormData({...eqFormData, brand: e.target.value})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" 
                    placeholder="Ex: Kärcher"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                  <input 
                    type="text" 
                    value={eqFormData.model} 
                    onChange={e => setEqFormData({...eqFormData, model: e.target.value})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" 
                    placeholder="Ex: HD 585"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Série</label>
                  <input 
                    type="text" 
                    value={eqFormData.serial_number} 
                    onChange={e => setEqFormData({...eqFormData, serial_number: e.target.value})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" 
                    placeholder="Ex: NS-998877"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <div className="flex space-x-2">
                    <select 
                      value={eqFormData.category_id || ''} 
                      onChange={e => setEqFormData({...eqFormData, category_id: e.target.value})} 
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-800 text-sm"
                    >
                      <option value="">Selecione</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center font-bold shadow-sm"
                      title="Adicionar Nova Categoria"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Propriedade do Equipamento *</label>
                  <select 
                    value={eqFormData.ownership_type} 
                    onChange={e => setEqFormData({...eqFormData, ownership_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="cliente">Do Cliente (Assistência Técnica)</option>
                    <option value="proprio">Ativo Próprio (Locado ao Cliente)</option>
                    <option value="sublocado">Sublocado (Dono Original de Terceiros)</option>
                  </select>
                </div>

                {eqFormData.ownership_type === 'sublocado' && (
                  <div className="animate-in fade-in duration-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dono / Fornecedor Original *</label>
                    <input 
                      required 
                      type="text" 
                      value={eqFormData.supplier_name} 
                      onChange={e => setEqFormData({...eqFormData, supplier_name: e.target.value})} 
                      placeholder="Ex: Alfa Tennant" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" 
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsEqModalOpen(false)} 
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingEq} 
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition-colors flex items-center shadow-sm"
                >
                  {isSavingEq && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSavingEq ? 'Salvando...' : 'Cadastrar e Selecionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rápido de Nova Categoria */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nova Categoria</h2>
              <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Categoria *</label>
                <input 
                  required 
                  type="text" 
                  value={categoryFormData.name} 
                  onChange={e => setCategoryFormData({ name: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  placeholder="Ex: Varredeiras" 
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSavingCategory} className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition-colors flex items-center">
                  {isSavingCategory ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSavingCategory ? 'Salvando...' : 'Salvar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
