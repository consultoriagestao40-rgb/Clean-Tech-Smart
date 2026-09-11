import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Wrench, Navigation, Package, DollarSign, Plus, Trash2, 
  Search, CheckCircle2, Clock, Loader2, Send, ShieldCheck, ChevronRight
} from 'lucide-react';

export default function TecnicoOrcamentoModal({ 
  isOpen, 
  onClose, 
  ticket = null, 
  onSuccess,
  currentUser = null
}) {
  const [clients, setClients] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [allParts, setAllParts] = useState([]);
  const [partsSearchResults, setPartsSearchResults] = useState([]);
  const [isSearchingParts, setIsSearchingParts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [serviceType, setServiceType] = useState('Corretiva');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [notes, setNotes] = useState('');

  // 1. Mão de Obra
  const [laborItems, setLaborItems] = useState([
    { id: 1, description: 'Diagnóstico e Revisão Técnica Geral', hours: 2, unitPrice: 180 }
  ]);

  // 2. Deslocamento / KM
  const [initialKm, setInitialKm] = useState(0);
  const [finalKm, setFinalKm] = useState(0);
  const [pricePerKm, setPricePerKm] = useState(1.50);

  // 3. Peças e Insumos
  const [partsItems, setPartsItems] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Quick suggestions for labor
  const laborSuggestions = [
    'Diagnóstico e Teste Eletrônico',
    'Manutenção Corretiva em Campo',
    'Troca de Escovas e Palhetas',
    'Revisão do Motor de Aspiração',
    'Higienização Técnica e Regulagem',
    'Entrega Técnica e Treinamento'
  ];

  const formatBRL = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Pre-fill data when ticket is provided or modal opens
  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchEquipments();
      fetchParts();

      if (ticket) {
        setSelectedClientId(String(ticket.client_id || ''));
        setSelectedEquipmentId(String(ticket.equipment_id || ''));
        setContactName(ticket.contact_name || ticket.signed_by_name || '');
        setContactInfo(ticket.contact_info || ticket.client_phone || '');
        setServiceType(ticket.ticket_type || 'Corretiva');
        setNotes(`Orçamento referente ao Chamado #${ticket.id}: ${ticket.description || ''}`);
      } else {
        setSelectedClientId('');
        setSelectedEquipmentId('');
        setContactName('');
        setContactInfo('');
        setServiceType('Corretiva');
        setNotes('');
      }

      setLaborItems([
        { id: Date.now(), description: 'Mão de Obra Técnica Especializada', hours: 2, unitPrice: 180 }
      ]);
      setInitialKm(0);
      setFinalKm(30);
      setPricePerKm(1.50);
      setPartsItems([]);
    }
  }, [isOpen, ticket]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/get-clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEquipments = async () => {
    try {
      const res = await fetch('/api/get-equipments');
      if (res.ok) {
        const data = await res.json();
        setEquipments(data.equipments || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchParts = async () => {
    try {
      const res = await fetch('/api/get-parts');
      if (res.ok) {
        const data = await res.json();
        setAllParts(data.parts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Search parts filter
  const handleSearchParts = async (query, index) => {
    setSearchTerm(query);
    setActiveSearchIndex(index);
    if (!query || query.trim().length < 1) {
      setPartsSearchResults([]);
      return;
    }

    const q = query.toLowerCase();
    const filtered = allParts.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    ).slice(0, 10);

    setPartsSearchResults(filtered);
  };

  const selectPart = (part, index) => {
    const updated = [...partsItems];
    const cost = Number(part.cost_price || part.price || 0);
    // 28% markup default
    const sellingPrice = cost > 0 ? cost * 1.28 : Number(part.price || 0);

    updated[index] = {
      ...updated[index],
      partName: `${part.name} ${part.sku ? `(Cód: ${part.sku})` : ''}`,
      costPrice: cost,
      unitPrice: Math.round(sellingPrice * 100) / 100,
      quantity: updated[index].quantity || 1
    };
    setPartsItems(updated);
    setActiveSearchIndex(null);
    setSearchTerm('');
  };

  // Labor helpers
  const addLaborItem = () => {
    setLaborItems([...laborItems, { id: Date.now(), description: '', hours: 1, unitPrice: 180 }]);
  };

  const removeLaborItem = (id) => {
    if (laborItems.length <= 1) return;
    setLaborItems(laborItems.filter(item => item.id !== id));
  };

  const updateLaborItem = (id, field, value) => {
    setLaborItems(laborItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Parts helpers
  const addPartItem = () => {
    setPartsItems([...partsItems, { id: Date.now(), partName: '', quantity: 1, unitPrice: 0, costPrice: 0 }]);
  };

  const removePartItem = (index) => {
    setPartsItems(partsItems.filter((_, idx) => idx !== index));
  };

  const updatePartItem = (index, field, value) => {
    const updated = [...partsItems];
    updated[index] = { ...updated[index], [field]: value };
    setPartsItems(updated);
  };

  // Calculations
  const totalLabor = useMemo(() => {
    return laborItems.reduce((acc, item) => acc + (Number(item.hours || 0) * Number(item.unitPrice || 0)), 0);
  }, [laborItems]);

  const totalKm = useMemo(() => {
    return Math.max(0, Number(finalKm || 0) - Number(initialKm || 0));
  }, [initialKm, finalKm]);

  const totalLogistics = useMemo(() => {
    return totalKm * Number(pricePerKm || 0);
  }, [totalKm, pricePerKm]);

  const totalParts = useMemo(() => {
    return partsItems.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  }, [partsItems]);

  const grandTotal = useMemo(() => {
    return totalLabor + totalLogistics + totalParts;
  }, [totalLabor, totalLogistics, totalParts]);

  // Submit Budget
  const handleSubmit = async (e, directApproval = false) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert('Por favor, selecione o cliente do orçamento.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = user.role === 'Super Admin' || user.role === 'Administrador' || user.role === 'admin';
      
      // Technician submits for approval; Admin can approve immediately if requested
      const statusToSave = directApproval && isAdmin ? 'Aprovado' : 'Pendente de Aprovação';

      const payload = {
        client: selectedClientId,
        contact: contactName,
        contactInfo: contactInfo,
        serviceType: serviceType,
        equipmentId: selectedEquipmentId || null,
        ticketId: ticket?.id || null,
        technicianId: ticket?.technician_id || user.id || null,
        createdByUserId: user.id || null,
        logistics: {
          initialKm: Number(initialKm || 0),
          finalKm: Number(finalKm || 0),
          pricePerKm: Number(pricePerKm || 0)
        },
        laborItems: laborItems.map(l => ({
          description: l.description,
          hours: Number(l.hours || 0),
          unitPrice: Number(l.unitPrice || 0)
        })),
        partsItems: partsItems.filter(p => p.partName && p.partName.trim()).map(p => ({
          partName: p.partName,
          quantity: Number(p.quantity || 1),
          unitPrice: Number(p.unitPrice || 0),
          costPrice: Number(p.costPrice || 0)
        })),
        totalLabor,
        totalLogistics,
        totalParts,
        grandTotal,
        notes,
        status: statusToSave
      };

      const res = await fetch('/api/save-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar orçamento.');

      const successMsg = statusToSave === 'Aprovado' 
        ? `Orçamento #${data.budgetId} aprovado com sucesso! Já está disponível no Portal do Cliente.`
        : `Orçamento #${data.budgetId} submetido com sucesso! O gestor foi notificado para aprovação.`;

      alert(successMsg);

      if (onSuccess) onSuccess(data.budgetId);
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const user = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Super Admin' || user.role === 'Administrador' || user.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      
      {/* Modal Container: Fullscreen on mobile, rounded card on desktop */}
      <div className="bg-slate-900 text-slate-100 border border-slate-800 w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Superior */}
        <div className="bg-[#007481] text-white px-4 py-3.5 flex items-center justify-between shadow-md flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 p-1.5 rounded-xl">
              <DollarSign className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base leading-tight">
                Novo Orçamento Mobile
              </h2>
              <p className="text-[11px] text-teal-100/90 truncate">
                {ticket ? `Vinculado ao Chamado #${ticket.id} (${ticket.client_name || 'Cliente'})` : 'Orçamento Rápido em Campo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll Touch-Friendly */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar text-xs">

          {/* 1. DADOS DO CLIENTE & EQUIPAMENTO */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
              <span className="font-black text-[10px] text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> 1. Cliente & Atendimento
              </span>
              <span className="text-[10px] bg-teal-950/60 text-teal-300 px-2 py-0.5 rounded border border-teal-800/50 font-bold">
                {serviceType}
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cliente *</label>
              <select
                required
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">Selecione o Cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Equipamento</label>
                <select
                  value={selectedEquipmentId}
                  onChange={e => setSelectedEquipmentId(e.target.value)}
                  className="w-full h-10 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-[11px] font-bold text-white focus:ring-2 focus:ring-teal-500 focus:outline-none truncate"
                >
                  <option value="">Selecione a Máquina...</option>
                  {equipments.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name} {eq.model ? `(${eq.model})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Serviço</label>
                <select
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                  className="w-full h-10 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-[11px] font-bold text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Corretiva">Corretiva</option>
                  <option value="Preventiva">Preventiva</option>
                  <option value="Entrega Técnica">Entrega Técnica</option>
                  <option value="Reforma">Reforma</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. MÃO DE OBRA / HORAS TÉCNICO */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
              <span className="font-black text-[10px] text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" /> 2. Horas do Técnico (Mão de Obra)
              </span>
              <span className="text-xs font-black text-amber-400">
                R$ {formatBRL(totalLabor)}
              </span>
            </div>

            {/* Lista de Itens de Mão de Obra */}
            <div className="space-y-2.5">
              {laborItems.map((item) => (
                <div key={item.id} className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Descrição do serviço executado..."
                      value={item.description}
                      onChange={e => updateLaborItem(item.id, 'description', e.target.value)}
                      className="flex-1 h-9 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-medium focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeLaborItem(item.id)}
                      className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Horas e Preço por Hora */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold">Horas:</span>
                      <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                        <button
                          type="button"
                          onClick={() => updateLaborItem(item.id, 'hours', Math.max(0.5, Number(item.hours) - 0.5))}
                          className="px-2.5 py-1 text-slate-300 hover:bg-slate-700 font-black text-xs"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-white min-w-[28px] text-center">
                          {item.hours}h
                        </span>
                        <button
                          type="button"
                          onClick={() => updateLaborItem(item.id, 'hours', Number(item.hours) + 0.5)}
                          className="px-2.5 py-1 text-slate-300 hover:bg-slate-700 font-black text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold">R$/Hora:</span>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={e => updateLaborItem(item.id, 'unitPrice', Number(e.target.value))}
                        className="w-20 h-8 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white text-right"
                      />
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-black text-amber-300">
                        R$ {formatBRL(item.hours * item.unitPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sugestões Rápidas de Serviço */}
            <div className="pt-1">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1.5">
                Sugestões Rápidas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {laborSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setLaborItems([...laborItems, { id: Date.now(), description: sug, hours: 2, unitPrice: 180 }]);
                    }}
                    className="text-[10px] bg-slate-900/80 hover:bg-teal-950/60 border border-slate-700/80 hover:border-teal-700/60 text-slate-300 hover:text-teal-200 px-2 py-1 rounded-lg transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={addLaborItem}
              className="w-full py-2 border border-dashed border-amber-500/40 text-amber-400 hover:bg-amber-500/10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Outro Serviço
            </button>
          </div>

          {/* 3. DESLOCAMENTO (QUILOMETRAGEM KM) */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
              <span className="font-black text-[10px] text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" /> 3. Deslocamento (Quilometragem)
              </span>
              <span className="text-xs font-black text-blue-400">
                R$ {formatBRL(totalLogistics)} ({totalKm} km)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">KM Inicial</label>
                <input
                  type="number"
                  value={initialKm}
                  onChange={e => setInitialKm(Number(e.target.value))}
                  className="w-full h-10 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white text-center"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">KM Final</label>
                <input
                  type="number"
                  value={finalKm}
                  onChange={e => setFinalKm(Number(e.target.value))}
                  className="w-full h-10 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white text-center"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">R$ / KM</label>
                <input
                  type="number"
                  step="0.1"
                  value={pricePerKm}
                  onChange={e => setPricePerKm(Number(e.target.value))}
                  className="w-full h-10 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white text-center"
                />
              </div>
            </div>

            <div className="bg-blue-950/40 border border-blue-900/40 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
              <span className="text-blue-200">
                Total Percorrido: <strong>{totalKm} km</strong> x R$ {pricePerKm.toFixed(2)}
              </span>
              <span className="font-extrabold text-blue-300">
                = R$ {formatBRL(totalLogistics)}
              </span>
            </div>
          </div>

          {/* 4. PEÇAS DO BANCO DE DADOS (ESTOQUE) */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
              <span className="font-black text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> 4. Peças e Insumos (Banco de Dados)
              </span>
              <span className="text-xs font-black text-emerald-400">
                R$ {formatBRL(totalParts)}
              </span>
            </div>

            {/* Lista de Peças Adicionadas */}
            {partsItems.length === 0 ? (
              <p className="text-center py-3 text-slate-500 text-[11px] italic">
                Nenhuma peça incluída. Toque no botão abaixo para buscar peças no estoque.
              </p>
            ) : (
              <div className="space-y-3">
                {partsItems.map((part, index) => (
                  <div key={part.id || index} className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 space-y-2">
                    
                    {/* Campo de Busca / Nome da Peça */}
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Buscar peça por nome ou código..."
                          value={activeSearchIndex === index ? searchTerm : part.partName}
                          onFocus={() => {
                            setActiveSearchIndex(index);
                            setSearchTerm(part.partName);
                          }}
                          onChange={e => handleSearchParts(e.target.value, index)}
                          className="w-full h-9 pl-8 pr-8 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-semibold focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => removePartItem(index)}
                          className="absolute right-1.5 top-1.5 p-1 text-slate-500 hover:text-red-400 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Dropdown de Resultados da Busca de Peças */}
                      {activeSearchIndex === index && partsSearchResults.length > 0 && (
                        <div className="absolute top-10 left-0 right-0 z-30 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-700">
                          {partsSearchResults.map(p => {
                            const cost = Number(p.cost_price || p.price || 0);
                            const sell = cost > 0 ? cost * 1.28 : Number(p.price || 0);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => selectPart(p, index)}
                                className="w-full text-left p-2.5 hover:bg-emerald-950/40 transition-colors flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="font-bold text-white text-xs truncate">{p.name}</div>
                                  <div className="text-[10px] text-slate-400">SKU: {p.sku || 'N/A'} • Estoque: {p.stock_quantity ?? 'Disp.'}</div>
                                </div>
                                <span className="text-xs font-black text-emerald-400 whitespace-nowrap">
                                  R$ {formatBRL(sell)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Quantidade e Valor Unitário */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold">Qtd:</span>
                        <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                          <button
                            type="button"
                            onClick={() => updatePartItem(index, 'quantity', Math.max(1, Number(part.quantity) - 1))}
                            className="px-2.5 py-1 text-slate-300 hover:bg-slate-700 font-black text-xs"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-bold text-white min-w-[24px] text-center">
                            {part.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updatePartItem(index, 'quantity', Number(part.quantity) + 1)}
                            className="px-2.5 py-1 text-slate-300 hover:bg-slate-700 font-black text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold">R$/Un:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={part.unitPrice}
                          onChange={e => updatePartItem(index, 'unitPrice', Number(e.target.value))}
                          className="w-20 h-8 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white text-right"
                        />
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-black text-emerald-400">
                          R$ {formatBRL(part.quantity * part.unitPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addPartItem}
              className="w-full py-2 border border-dashed border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> + Adicionar Peça do Estoque
            </button>
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">Observações do Orçamento</label>
            <textarea
              rows={2}
              placeholder="Descreva detalhes técnicos ou justificativas para o gestor e cliente..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* 5. RESUMO DE VALORES TOTALIZADORES */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-2xl p-4 shadow-xl space-y-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Resumo Geral do Orçamento
            </div>
            
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Mão de Obra ({laborItems.length} serviços):</span>
              <span className="font-bold">R$ {formatBRL(totalLabor)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Deslocamento ({totalKm} km):</span>
              <span className="font-bold">R$ {formatBRL(totalLogistics)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Peças e Insumos ({partsItems.length} itens):</span>
              <span className="font-bold">R$ {formatBRL(totalParts)}</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                  Valor Total do Orçamento
                </span>
                <span className="text-[10px] text-slate-400">
                  {isAdmin ? 'Aguardando sua validação ou envio direto' : 'Sujeito à aprovação da gestão Clean Tech'}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                R$ {formatBRL(grandTotal)}
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 space-y-2">
            {isAdmin ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#007481] hover:bg-[#005d68] text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-1.5 text-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Salvar Pendente
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-1.5 text-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Aprovar Direto
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-[#eb6420] to-[#f58220] hover:from-[#d65516] hover:to-[#eb6420] text-white font-black rounded-xl shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 text-sm transition-all transform active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando Orçamento...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 text-white" />
                    <span>Submeter à Aprovação do Gestor</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
