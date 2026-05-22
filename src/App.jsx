import { useState } from 'react';
import { Plus, Trash2, Save, Send, Loader2 } from 'lucide-react';

function App() {
  const [clientData, setClientData] = useState({
    client: '',
    contact: '',
    contactInfo: '',
    serviceType: 'corretiva'
  });
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

  // Calculations
  const totalLabor = laborItems.reduce((acc, item) => acc + item.hours * item.unitPrice, 0);
  const totalParts = partsItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const totalKm = Math.max(0, logistics.finalKm - logistics.initialKm);
  const totalLogistics = totalKm * logistics.pricePerKm;
  const grandTotal = totalLabor + totalParts + totalLogistics;

  const handleSubmit = async () => {
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
        grandTotal
      };

      const response = await fetch('/api/save-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Orçamento salvo com sucesso!');
        // Opcional: limpar o formulário
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
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 1. Cabeçalho de Ações */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Orçamento de Assistência</h1>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados e os custos para a proposta técnica</p>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <button className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors">
              <Save className="w-4 h-4 mr-2" />
              Salvar Rascunho
            </button>
            <button 
              onClick={handleSubmit} 
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Cliente</label>
              <select 
                value={clientData.client} 
                onChange={(e) => setClientData({...clientData, client: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              >
                <option value="">Selecione o Cliente</option>
                <option value="1">Industria Alpha S.A. - 12.345.678/0001-99</option>
                <option value="2">Beta Tech Ltda - 98.765.432/0001-11</option>
              </select>
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
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
                      R$ {(item.hours * item.unitPrice).toFixed(2)}
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
              <p className="text-lg font-semibold text-gray-800">R$ {totalLabor.toFixed(2)}</p>
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
                <span className="block text-lg font-semibold text-blue-600">R$ {totalLogistics.toFixed(2)}</span>
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
                      R$ {(item.quantity * item.unitPrice).toFixed(2)}
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
              <p className="text-lg font-semibold text-gray-800">R$ {totalParts.toFixed(2)}</p>
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
                <span className="font-medium text-gray-800">R$ {totalLabor.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal Logística</span>
                <span className="font-medium text-gray-800">R$ {totalLogistics.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal Peças</span>
                <span className="font-medium text-gray-800">R$ {totalParts.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <span className="block text-sm text-blue-600 font-semibold mb-1 uppercase tracking-wide">Valor Total do Orçamento</span>
                <span className="block text-4xl font-bold text-blue-900">R$ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default App;
