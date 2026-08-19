import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Edit, X, Trash2, FileText, ArrowLeft, Printer, ShieldAlert, Check, Link2, Clock, Copy, Sparkles, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PropostasLocacao() {
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  
  // Data lists
  const [clients, setClients] = useState([]);
  const [machineModels, setMachineModels] = useState([]);
  const [rentalPrices, setRentalPrices] = useState([]);
  const [equipments, setEquipments] = useState([]);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    client_id: '',
    items: [
      {
        id: 'opt_1',
        machine_model_id: '',
        equipment_id: '',
        rental_price_id: '',
        period_months: 7, // 1 semana inicial
        quantity: 1,
        monthly_value: '',
        contract_type: '0 - Sem cobertura.',
        hours_per_month: '25 horas/semana',
        notes: ''
      }
    ],
    region_used: 'Estado de São Paulo',
    delivery_time: 'Imediato (salvo venda prévia)',
    freight_cost: '0.00',
    validity_days: '10 dias',
    notes: 'Contrato padrão de locação Alfa Tennant.',
    seller_info: 'Cristiano Magalhães\nContato Comercial\ncristiano@cleantechpro.com.br',
    insumos_percent: 20,
    manutencao_percent: 20,
    lucro_percent: 50,
    tributos_percent: 8
  });

  // Quick Machine Model Modal state
  const [isMachineModelModalOpen, setIsMachineModelModalOpen] = useState(false);
  const [isSavingMachineModel, setIsSavingMachineModel] = useState(false);
  const [newMachineModelName, setNewMachineModelName] = useState('');
  const [newMachineModelRentalPriceId, setNewMachineModelRentalPriceId] = useState('');
  const [showPriceOverride, setShowPriceOverride] = useState({});

  const toggleShowPriceOverride = (idx) => {
    setShowPriceOverride(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Share Link Expiration Modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareProposalId, setShareProposalId] = useState(null);
  const [shareValidityDays, setShareValidityDays] = useState('10 dias');
  const [isSavingShare, setIsSavingShare] = useState(false);

  const handleSaveQuickMachineModel = async (e) => {
    e.preventDefault();
    if (!newMachineModelName.trim()) {
      alert('Por favor, informe o nome do modelo.');
      return;
    }
    setIsSavingMachineModel(true);
    try {
      const res = await fetch('/api/save-machine-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newMachineModelName.trim(),
          rental_price_id: newMachineModelRentalPriceId || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIsMachineModelModalOpen(false);
        setNewMachineModelName('');
        setNewMachineModelRentalPriceId('');
        // Refresh catalog
        const machinesRes = await fetch('/api/get-machine-models');
        const machinesData = await machinesRes.json();
        if (machinesData.machineModels) {
          setMachineModels(machinesData.machineModels);
        }
        if (data.machineModel) {
          // If editing first item, set it
          handleItemChange(0, 'machine_model_id', data.machineModel.id);
        }
      } else {
        const err = await res.json();
        alert('Erro ao cadastrar modelo: ' + (err.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar modelo.');
    } finally {
      setIsSavingMachineModel(false);
    }
  };

  // Minuta de Locação Modal state
  const [isMinutaModalOpen, setIsMinutaModalOpen] = useState(false);
  const [minutaData, setMinutaData] = useState({
    locadoraName: '',
    locadoraCnpj: '',
    locadoraIe: '',
    locadoraAddress: '',
    clientName: '',
    clientCnpj: '',
    clientIe: '',
    clientAddress: '',
    clientPhone: '',
    clientContact: '',
    clientEmail: '',
    machineName: '',
    machineSerialNumber: '',
    localUtilizacao: '',
    startDate: '',
    periodMonths: 12,
    monthlyValue: '',
    observacoes: ''
  });

  useEffect(() => {
    fetchProposals();
    loadFormDependencies();
  }, []);

  async function fetchProposals() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-rental-proposals');
      const data = await res.json();
      if (data.proposals) setProposals(data.proposals);
    } catch (error) {
      console.error('Erro ao buscar propostas de locação:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFormDependencies() {
    try {
      const clientsRes = await fetch('/api/get-clients');
      const clientsData = await clientsRes.json();
      if (clientsData.clients) setClients(clientsData.clients);

      const machinesRes = await fetch('/api/get-machine-models');
      const machinesData = await machinesRes.json();
      if (machinesData.machineModels) setMachineModels(machinesData.machineModels);

      const eqRes = await fetch('/api/get-equipments');
      const eqData = await eqRes.json();
      if (eqData.equipments) setEquipments(eqData.equipments);

      const pricingRes = await fetch('/api/get-rental-prices');
      const pricingData = await pricingRes.json();
      if (pricingData.rentalPrices) setRentalPrices(pricingData.rentalPrices);
    } catch (error) {
      console.error('Erro ao carregar dependências:', error);
    }
  }

  const calculateItemPrice = (rentalPriceId, periodMonths, customMarkup = null) => {
    if (!rentalPriceId) return '';
    const selectedPriceRow = rentalPrices.find(r => String(r.id) === String(rentalPriceId));
    if (!selectedPriceRow) return '';

    let baseCost = 0;
    const period = Number(periodMonths);
    const p12 = Number(selectedPriceRow.price_12 || 0);

    if (period === 1) baseCost = p12 > 0 ? (p12 * 1.75) / 22 : 0;
    else if (period === 7) baseCost = p12 > 0 ? ((p12 * 1.5) / 22) * 7 : 0;
    else if (period === 15) baseCost = p12 > 0 ? ((p12 * 1.25) / 22) * 15 : 0;
    else if (period === 30) baseCost = p12 > 0 ? p12 * 1.15 : 0;
    else if (period === 12) baseCost = p12;
    else if (period === 24) baseCost = Number(selectedPriceRow.price_24 || 0);
    else if (period === 36) baseCost = Number(selectedPriceRow.price_36 || 0);
    else if (period === 48) baseCost = Number(selectedPriceRow.price_48 || 0);
    else if (period === 60) baseCost = Number(selectedPriceRow.price_60 || 0);
    else baseCost = p12;

    const markup = customMarkup || {
      insumos: Number(formData.insumos_percent || 0),
      manutencao: Number(formData.manutencao_percent || 0),
      lucro: Number(formData.lucro_percent || 0),
      tributos: Number(formData.tributos_percent || 0)
    };

    const totalMarkup = markup.insumos + markup.manutencao + markup.lucro + markup.tributos;
    const finalValue = baseCost > 0 ? baseCost * (1 + totalMarkup / 100) : 0;

    return finalValue > 0 ? finalValue.toFixed(2) : '';
  };

  const findBestRentalPriceForMachine = (machineModelId) => {
    if (!machineModelId) return null;
    const selectedMachine = machineModels.find(m => String(m.id) === String(machineModelId));
    if (!selectedMachine) return null;

    // 1. Direct explicit link in database
    if (selectedMachine.rental_price_id) {
      const explicit = rentalPrices.find(r => String(r.id) === String(selectedMachine.rental_price_id));
      if (explicit) return explicit;
    }

    // 2. Smart token & code matching
    const mName = String(selectedMachine.name || '').toLowerCase();
    
    // Clean tokens from machine name (e.g. "T360", "A260", "S20", "T760", "S960", "A140", "A135", "T20", "Mini", "AS5160", "5160", "Brava")
    const cleanTokens = mName
      .replace(/[(),\/\-]/g, ' ')
      .split(/\s+/)
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length >= 2 && !['de', 'da', 'do', 'com', 'para', 'em', 'operacao', 'operação', 'lavadora', 'varredeira', 'aspirador', 'piso', 'pisos', 'pe', 'pé', 'bordo', 'compacta', 'tamanho', 'medio', 'médio', 'tennant', 'alfa', 'eletrica', 'elétrica', 'cabo'].includes(w));

    for (const token of cleanTokens) {
      const found = rentalPrices.find(r => {
        const code = String(r.code || '').toLowerCase();
        const desc = String(r.description || '').toLowerCase();
        return code === token || code === `tna${token}` || code === `amat${token}` || code.includes(token) || desc.includes(token);
      });
      if (found) return found;
    }

    return rentalPrices[0] || null;
  };

  const getItemFilteredPrices = (machineModelId) => {
    if (!machineModelId) return rentalPrices;
    const best = findBestRentalPriceForMachine(machineModelId);
    if (!best) return rentalPrices;

    // Return matched price first, followed by the rest
    return [best, ...rentalPrices.filter(r => String(r.id) !== String(best.id))];
  const getDefaultHoursForPeriod = (period) => {
    const p = Number(period);
    if (p === 1) return '5 horas/dia';
    if (p === 7) return '25 horas/semana';
    if (p === 15) return '50 horas/quinzena';
    return '100 horas/mês';
  };

  const formatHoursForPeriod = (hours, period) => {
    const p = Number(period);
    if (!hours || hours === '100 horas/mês' || hours === '100 horas/mes' || hours === '100h/mês') {
      if (p === 1) return '5 horas/dia';
      if (p === 7) return '25 horas/semana';
      if (p === 15) return '50 horas/quinzena';
      return '100 horas/mês';
    }
    return hours;
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      const currentItem = { ...newItems[index], [field]: value };

      if (field === 'machine_model_id') {
        currentItem.machine_model_id = value;
        const matchedPrice = findBestRentalPriceForMachine(value);
        if (matchedPrice) {
          currentItem.rental_price_id = String(matchedPrice.id);
          const autoVal = calculateItemPrice(matchedPrice.id, currentItem.period_months);
          if (autoVal) currentItem.monthly_value = autoVal;
        }
      }

      if (field === 'period_months') {
        currentItem.period_months = Number(value);
        currentItem.hours_per_month = getDefaultHoursForPeriod(value);
        const autoVal = calculateItemPrice(currentItem.rental_price_id, value);
        if (autoVal) currentItem.monthly_value = autoVal;
      }

      if (field === 'rental_price_id') {
        const autoVal = calculateItemPrice(value, currentItem.period_months);
        if (autoVal) currentItem.monthly_value = autoVal;
      }

      newItems[index] = currentItem;
      return { ...prev, items: newItems };
    });
  };

  const handleAddItem = () => {
    const lastItem = formData.items[formData.items.length - 1];
    let nextPeriod = 7;
    if (lastItem) {
      if (Number(lastItem.period_months) === 7) nextPeriod = 15;
      else if (Number(lastItem.period_months) === 15) nextPeriod = 30;
      else if (Number(lastItem.period_months) === 30) nextPeriod = 12;
      else if (Number(lastItem.period_months) === 12) nextPeriod = 24;
      else if (Number(lastItem.period_months) === 24) nextPeriod = 36;
      else nextPeriod = 7;
    }

    const matchedPrice = lastItem?.machine_model_id ? findBestRentalPriceForMachine(lastItem.machine_model_id) : null;
    const rPriceId = lastItem?.rental_price_id || (matchedPrice ? String(matchedPrice.id) : '');

    const newItem = {
      id: 'opt_' + Date.now(),
      machine_model_id: lastItem?.machine_model_id || '',
      equipment_id: '',
      rental_price_id: rPriceId,
      period_months: nextPeriod,
      quantity: 1,
      monthly_value: '',
      contract_type: lastItem?.contract_type || '0 - Sem cobertura.',
      hours_per_month: lastItem?.hours_per_month || '100 horas/mês',
      notes: ''
    };
    if (newItem.rental_price_id && newItem.period_months) {
      newItem.monthly_value = calculateItemPrice(newItem.rental_price_id, newItem.period_months);
    }
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleDuplicateItem = (index) => {
    const itemToDup = formData.items[index];
    if (!itemToDup) return;
    
    // Automatically advance next logical period when duplicating
    let nextPeriod = Number(itemToDup.period_months);
    if (nextPeriod === 7) nextPeriod = 15;
    else if (nextPeriod === 15) nextPeriod = 30;
    else if (nextPeriod === 30) nextPeriod = 12;
    else if (nextPeriod === 12) nextPeriod = 24;
    else if (nextPeriod === 24) nextPeriod = 36;
    else nextPeriod = 7;

    const duplicated = {
      ...itemToDup,
      id: 'opt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      period_months: nextPeriod,
      hours_per_month: getDefaultHoursForPeriod(nextPeriod),
      monthly_value: calculateItemPrice(itemToDup.rental_price_id, nextPeriod) || itemToDup.monthly_value
    };
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems.splice(index + 1, 0, duplicated);
      return { ...prev, items: newItems };
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      alert('A proposta deve conter pelo menos 1 opção de locação.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleGenerateQuickOptions = (baseIndex = 0) => {
    const baseItem = formData.items[baseIndex] || formData.items[0];
    if (!baseItem || !baseItem.machine_model_id) {
      alert('Selecione primeiro o Modelo da Máquina na Opção #1 para gerar as opções rápidas.');
      return;
    }

    const matchedPrice = findBestRentalPriceForMachine(baseItem.machine_model_id);
    const rPriceId = baseItem.rental_price_id || (matchedPrice ? String(matchedPrice.id) : null);

    if (!rPriceId) {
      alert('Não foi possível identificar a tabela de preços para este modelo.');
      return;
    }

    const periodsToGen = [
      { period: 7, label: 'Opção 1 - Semanal (7 dias)' },
      { period: 15, label: 'Opção 2 - Quinzenal (15 dias)' },
      { period: 30, label: 'Opção 3 - 01 Mês (30 dias)' }
    ];

    const generated = periodsToGen.map((p, idx) => ({
      id: 'opt_' + Date.now() + '_' + idx,
      machine_model_id: baseItem.machine_model_id,
      equipment_id: baseItem.equipment_id || '',
      rental_price_id: String(rPriceId),
      period_months: p.period,
      quantity: baseItem.quantity || 1,
      monthly_value: calculateItemPrice(rPriceId, p.period) || '',
      contract_type: baseItem.contract_type || '0 - Sem cobertura.',
      hours_per_month: baseItem.hours_per_month || '100 horas/mês',
      notes: p.label
    }));

    setFormData(prev => ({
      ...prev,
      items: generated
    }));
  };

  const handleMarkupChange = (field, value) => {
    const numVal = Number(value) || 0;
    setFormData(prev => {
      const updatedFormData = { ...prev, [field]: numVal };
      const customMarkup = {
        insumos: field === 'insumos_percent' ? numVal : Number(prev.insumos_percent || 0),
        manutencao: field === 'manutencao_percent' ? numVal : Number(prev.manutencao_percent || 0),
        lucro: field === 'lucro_percent' ? numVal : Number(prev.lucro_percent || 0),
        tributos: field === 'tributos_percent' ? numVal : Number(prev.tributos_percent || 0)
      };
      const updatedItems = prev.items.map(item => {
        if (item.rental_price_id && item.period_months) {
          return {
            ...item,
            monthly_value: calculateItemPrice(item.rental_price_id, item.period_months, customMarkup)
          };
        }
        return item;
      });
      return { ...updatedFormData, items: updatedItems };
    });
  };

  const handleEdit = async (item) => {
    let itemsList = [];
    if (item.items) {
      itemsList = typeof item.items === 'string' ? JSON.parse(item.items) : item.items;
    }
    if (!itemsList || itemsList.length === 0) {
      itemsList = [{
        id: 'opt_1',
        machine_model_id: item.machine_model_id || '',
        equipment_id: item.equipment_id || '',
        rental_price_id: item.rental_price_id || '',
        period_months: item.period_months || 36,
        quantity: 1,
        monthly_value: item.monthly_value || '',
        contract_type: item.contract_type || '0 - Sem cobertura.',
        hours_per_month: item.hours_per_month || '100 horas/mês',
        notes: ''
      }];
    }

    setFormData({
      id: item.id,
      client_id: item.client_id || '',
      items: itemsList,
      region_used: item.region_used || 'Estado de São Paulo',
      delivery_time: item.delivery_time || 'Imediato',
      freight_cost: item.freight_cost || '0.00',
      validity_days: item.validity_days || '10 dias',
      notes: item.notes || '',
      seller_info: item.seller_info || '',
      insumos_percent: item.insumos_percent !== undefined ? Number(item.insumos_percent) : 20,
      manutencao_percent: item.manutencao_percent !== undefined ? Number(item.manutencao_percent) : 20,
      lucro_percent: item.lucro_percent !== undefined ? Number(item.lucro_percent) : 50,
      tributos_percent: item.tributos_percent !== undefined ? Number(item.tributos_percent) : 8
    });
    setIsModalOpen(true);
  };

  const openNewProposal = () => {
    setFormData({
      id: null,
      client_id: '',
      items: [
        {
          id: 'opt_1',
          machine_model_id: '',
          equipment_id: '',
          rental_price_id: '',
          period_months: 7, // 1 semana inicial
          quantity: 1,
          monthly_value: '',
          contract_type: '0 - Sem cobertura.',
          hours_per_month: '25 horas/semana',
          notes: ''
        }
      ],
      region_used: 'Estado de São Paulo',
      delivery_time: 'Imediato (salvo venda prévia)',
      freight_cost: '0.00',
      validity_days: '10 dias',
      notes: 'Contrato padrão de locação Alfa Tennant.',
      seller_info: localStorage.getItem('app_seller_info') || 'Cristiano Magalhães\nContato Comercial\ncristiano@cleantechpro.com.br',
      insumos_percent: Number(localStorage.getItem('rental_premise_insumos') || 20),
      manutencao_percent: Number(localStorage.getItem('rental_premise_manutencao') || 20),
      lucro_percent: Number(localStorage.getItem('rental_premise_lucro') || 50),
      tributos_percent: Number(localStorage.getItem('rental_premise_tributos') || 8)
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.client_id) {
      alert('Selecione um cliente.');
      return;
    }
    if (!formData.items || formData.items.length === 0 || !formData.items[0].machine_model_id || !formData.items[0].rental_price_id) {
      alert('Preencha pelo menos uma opção com Máquina e Tabela de Locação.');
      return;
    }
    setIsSaving(true);

    try {
      const response = await fetch('/api/save-rental-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setIsModalOpen(false);
        fetchProposals();
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
    if (!confirm('Deseja realmente excluir esta proposta de locação?')) return;
    try {
      const response = await fetch('/api/delete-rental-proposal', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        fetchProposals();
      } else {
        alert('Erro ao excluir proposta.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao excluir.');
    }
  };

  const handleDragStart = (e, proposalId) => {
    e.dataTransfer.setData('text/plain', proposalId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    const proposalId = e.dataTransfer.getData('text/plain');
    if (!proposalId) return;
    
    const prop = proposals.find(p => String(p.id) === String(proposalId));
    if (!prop) return;
    
    const updatedProposals = proposals.map(p => {
      if (String(p.id) === String(proposalId)) {
        return { ...p, status: targetStatus };
      }
      return p;
    });
    setProposals(updatedProposals);

    try {
      const payload = { ...prop, status: targetStatus };
      const response = await fetch('/api/save-rental-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Falha ao salvar status da proposta');
      }
      fetchProposals();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      fetchProposals();
    }
  };

  const handleCopyPublicLink = (proposalId) => {
    const proposal = proposals.find(p => p.id === proposalId);
    setShareProposalId(proposalId);
    setShareValidityDays(proposal?.validity_days || '10 dias');
    setIsShareModalOpen(true);
  };

  const handleConfirmShare = async (e) => {
    e.preventDefault();
    if (!shareValidityDays.trim()) {
      alert('Por favor, informe a validade.');
      return;
    }
    setIsSavingShare(true);
    try {
      const response = await fetch('/api/update-proposal-validity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shareProposalId, validity_days: shareValidityDays })
      });
      if (response.ok) {
        const url = `${window.location.origin}/visualizar-proposta/${shareProposalId}`;
        navigator.clipboard.writeText(url);
        setIsShareModalOpen(false);
        fetchProposals();
        alert(`Link público copiado!\nValidade configurada para: ${shareValidityDays}`);
      } else {
        alert('Erro ao atualizar a validade da proposta.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão ao salvar validade.');
    } finally {
      setIsSavingShare(false);
    }
  };

  const formatPeriod = (months) => {
    const m = Number(months);
    if (m === 1) return 'Diário (1 dia)';
    if (m === 7) return 'Semanal (7 dias)';
    if (m === 15) return 'Quinzenal (15 dias)';
    if (m === 30) return 'Mensal Avulso (01 mês)';
    if (m === 12) return '12 Meses';
    return `${m} Meses`;
  };

  const getRentalValueInfo = (months) => {
    const m = Number(months);
    if (m === 1) {
      return {
        label: 'VALOR DIÁRIO',
        labelTitle: 'Valor Diário (R$)',
        priceTitle: 'PREÇO DIÁRIO:',
        suffix: '/ dia',
        unit: 'dia',
        shortUnit: 'dia'
      };
    }
    if (m === 7) {
      return {
        label: 'VALOR SEMANAL',
        labelTitle: 'Valor Semanal (R$)',
        priceTitle: 'PREÇO SEMANAL:',
        suffix: '/ semana',
        unit: 'semana',
        shortUnit: 'sem'
      };
    }
    if (m === 15) {
      return {
        label: 'VALOR QUINZENAL',
        labelTitle: 'Valor Quinzenal (R$)',
        priceTitle: 'PREÇO QUINZENAL:',
        suffix: '/ quinzena',
        unit: 'quinzena',
        shortUnit: 'quinzena'
      };
    }
    return {
      label: 'VALOR MENSAL',
      labelTitle: 'Valor Mensal (R$)',
      priceTitle: 'PREÇO MENSAL:',
      suffix: '/ mês',
      unit: 'mês',
      shortUnit: 'mês'
    };
  };

  const handleOpenMinutaModal = async (proposalId) => {
    try {
      const res = await fetch(`/api/get-rental-proposal-details?id=${proposalId}`);
      const data = await res.json();
      if (!data.proposal) {
        alert('Erro ao carregar detalhes da proposta.');
        return;
      }
      
      const p = data.proposal;
      
      // Locadora fields
      const locadoraName = localStorage.getItem('app_company_name') || 'CLEAN TECH PRO';
      const locadoraCnpj = localStorage.getItem('app_company_cnpj') || '43.158.052/0001-01';
      const locadoraIe = localStorage.getItem('app_company_ie') || '91101403-36';
      const locadoraAddress = localStorage.getItem('app_company_address') || 'Avenida Maringá, 1273 – Emiliano Perneta Pinhais/PR, CEP 83325-212';
      
      setMinutaData({
        locadoraName,
        locadoraCnpj,
        locadoraIe,
        locadoraAddress,
        clientName: p.client_name || '',
        clientCnpj: p.client_document || '',
        clientIe: 'Isento',
        clientAddress: p.client_address || '',
        clientPhone: p.client_phone || '',
        clientContact: p.client_contact || '',
        clientEmail: p.client_email || '',
        machineName: p.machine_name || '',
        localUtilizacao: p.client_address || '',
        startDate: new Date().toISOString().split('T')[0],
        periodMonths: p.period_months || 12,
        monthlyValue: p.monthly_value || ''
      });
      setIsMinutaModalOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePrintMinuta = () => {
    const dtInicio = new Date(minutaData.startDate);
    const startDateFormatted = dtInicio.toLocaleDateString('pt-BR');
    
    const dtFim = new Date(dtInicio);
    const m = Number(minutaData.periodMonths);
    if (m === 1) dtFim.setDate(dtFim.getDate() + 1);
    else if (m === 7) dtFim.setDate(dtFim.getDate() + 7);
    else if (m === 15) dtFim.setDate(dtFim.getDate() + 15);
    else if (m === 30) dtFim.setMonth(dtFim.getMonth() + 1);
    else dtFim.setMonth(dtFim.getMonth() + m);
    const endDateFormatted = dtFim.toLocaleDateString('pt-BR');

    const periodText = formatPeriod(minutaData.periodMonths);
    const monthlyValueFormatted = Number(minutaData.monthlyValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Total value
    const totalValue = Number(minutaData.monthlyValue) * (m > 0 && m !== 30 && m !== 15 && m !== 7 && m !== 1 ? m : 1);
    const totalValueFormatted = totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Minuta de Contrato de Locação</title>
<style>
  body {
    font-family: Arial, sans-serif;
    color: #334155;
    font-size: 11px;
    line-height: 1.5;
    margin: 40px;
    background: #fff;
  }
  .bold { font-weight: bold; color: #000; }
  .uppercase { text-transform: uppercase; }
  .section-title {
    font-weight: bold;
    color: #000;
    margin-top: 15px;
    margin-bottom: 5px;
    text-transform: uppercase;
    font-size: 11px;
  }
  .grid-table {
    width: 100%;
    margin-bottom: 12px;
    border-collapse: collapse;
  }
  .grid-table td {
    padding: 3px 0;
    vertical-align: top;
  }
  .label-col {
    width: 150px;
    font-weight: bold;
    color: #475569;
  }
  .clause-box {
    margin-bottom: 12px;
    text-align: justify;
  }
  .clause-title {
    font-weight: bold;
    color: #000;
    margin-top: 15px;
    margin-bottom: 4px;
    text-transform: uppercase;
  }
  .signature-section {
    margin-top: 50px;
    display: flex;
    justify-content: space-between;
    page-break-inside: avoid;
  }
  .signature-box {
    width: 45%;
    text-align: center;
    border-top: 1px solid #94a3b8;
    padding-top: 10px;
    font-size: 10px;
    color: #475569;
  }
  @media print {
    body { margin: 20px; font-size: 10px; }
  }
</style>
</head>
<body>

  <table class="grid-table">
    <tr>
      <td class="label-col">LOCADORA</td>
      <td class="bold">: ${minutaData.locadoraName.toUpperCase()}, denominada neste ato LOCADORA.</td>
    </tr>
    <tr>
      <td class="label-col">CNPJ</td>
      <td>: ${minutaData.locadoraCnpj}</td>
    </tr>
    <tr>
      <td class="label-col">INSC. ESTADUAL</td>
      <td>: ${minutaData.locadoraIe}</td>
    </tr>
    <tr>
      <td class="label-col">ENDEREÇO</td>
      <td>: ${minutaData.locadoraAddress}</td>
    </tr>
  </table>

  <div style="border-top: 1px dashed #cbd5e1; margin: 10px 0;"></div>

  <table class="grid-table">
    <tr>
      <td class="label-col">LOCATÁRIA</td>
      <td class="bold">: ${minutaData.clientName.toUpperCase()} denominada neste ato LOCATÁRIA.</td>
    </tr>
    <tr>
      <td class="label-col">CNPJ</td>
      <td>: ${minutaData.clientCnpj}</td>
    </tr>
    <tr>
      <td class="label-col">INSC. ESTADUAL</td>
      <td>: ${minutaData.clientIe || 'Isento'}</td>
    </tr>
    <tr>
      <td class="label-col">ENDEREÇO</td>
      <td>: ${minutaData.clientAddress}</td>
    </tr>
    <tr>
      <td class="label-col">TELEFONE</td>
      <td>: ${minutaData.clientPhone || '—'}</td>
    </tr>
    <tr>
      <td class="label-col">CONTATO</td>
      <td>: ${minutaData.clientContact || '—'}</td>
    </tr>
    <tr>
      <td class="label-col">E-MAIL</td>
      <td>: ${minutaData.clientEmail || '—'}</td>
    </tr>
  </table>

  <div style="border-top: 1px dashed #cbd5e1; margin: 10px 0;"></div>

  <table class="grid-table">
    <tr>
      <td class="label-col">1. OBJETO</td>
      <td>: Locação de 01 lavadora de pisos marca Tennant ${minutaData.machineName}.</td>
    </tr>
    <tr>
      <td class="label-col">2. LOCAL DE USO</td>
      <td>: Máquina 01: ${minutaData.machineName.toUpperCase()}<br/>${minutaData.localUtilizacao}</td>
    </tr>
    <tr>
      <td class="label-col">3. VIGÊNCIA</td>
      <td>: ${periodText}, contadas a partir da entrega física do bem. Previsão de ${startDateFormatted} à ${endDateFormatted}.</td>
    </tr>
    <tr>
      <td class="label-col">4. PREÇO MENSAL</td>
      <td>: R$ ${monthlyValueFormatted} e/ou conforme Anexo I, pago até 05 dias após a emissão da fatura.</td>
    </tr>
    <tr>
      <td class="label-col">5. RESCISÃO</td>
      <td>: Multa por rompimento imotivado: 10% da soma dos aluguéis vincendos.</td>
    </tr>
    <tr>
      <td class="label-col">6. VALOR INDICATIVO</td>
      <td class="bold">: R$ ${totalValueFormatted} (Total estimado)</td>
    </tr>
  </table>

  <div style="border-top: 2px solid #000; margin: 15px 0;"></div>

  <p>Pelo presente instrumento particular de contrato de locação de bem(ns) móvel(is) e outros, as partes acima nomeadas e qualificadas, por seus representantes legais al final assinados, têm entre si justo e contratado o seguinte:</p>

  <div class="clause-title">CLÁUSULA I – DO(S) BEM(NS) MÓVEL(IS)</div>
  <div class="clause-box">
    1.1. A LOCADORA é legítima proprietária do(s) bem(ns) móvel(is) descritos no campo 01 do preâmbulo do presente Contrato.
  </div>

  <div class="clause-title">CLÁUSULA II - DO OBJETO</div>
  <div class="clause-box">
    2.1. Constitui objeto do presente contrato a locação do(s) bem(ns) móvel(is) descrito(s) na Cláusula I, de propriedade da LOCADORA, que serão explorados pela LOCATÁRIA para fins presentes em seu escopo de atuação. Os bens ora locados serão utilizados pela LOCATÁRIA no local/endereço identificado no campo 02 do preâmbulo deste Contrato.
  </div>

  <div class="clause-title">CLÁUSULA III - DO PRAZO</div>
  <div class="clause-box">
    3.1. O prazo de vigência do presente contrato será aquele estabelecido no campo 03 do preâmbulo deste Instrumento, comprometendo-se a LOCATÁRIA a devolver o(s) bem(s) objeto do presente Contrato ao fim da vigência deste Contrato nas mesmas condições do recebimento, salvo os desgastes decorrentes do uso natural do(s) mesmo(s).
  </div>

  <div class="clause-title">CLÁUSULA IV - DA RENOVAÇÃO</div>
  <div class="clause-box">
    4.1. Findo o prazo de vigência do presente contrato, as Partes, de comum acordo, deliberarão sobre a renovação da locação em questão.<br/>
    4.2. Caso as partes decidam pela prorrogação do prazo, sem alterações no contrato vigente (além de valores a serem praticados e prazo), tal renovação poderá ser feita automaticamente por igual período mediante manifestação das partes, podendo esta manifestação ser feita por meio de e-mail. No caso de renovação automática e por prazo indeterminado, a multa estabelecida no campo 5 passa a não mais vigorar.<br/>
    4.2.A. Caso as partes decidam pela prorrogação do prazo, porém com alteração de alguma das cláusulas vigentes (exceto as mencionadas acima), tal prorrogação será feita mediante a assinatura de um Termo Aditivo ao contrato vigente.<br/>
    4.3. Caso as Partes decidam pela não renovação do Contrato, a LOCATÁRIA deverá emitir Nota Fiscal de retorno referente à nota fiscal de remessa de locação recebida no momento da entrega do equipamento da LOCADORA. Caso não seja feita a nota fiscal de devolução e/ou solicitada a retirada do(s) bens pela LOCATÁRIA, o contrato será renovado automaticamente por prazo indeterminado, gerando a cobrança mensal do aluguel, até a emissão da nota fiscal de devolução e respectiva devolução do equipamento locado.<br/>
    4.4. Caso a LOCATÁRIA seja isenta, esta deverá emitir a nota fiscal avulsa ou declaração (de acordo com a legislação vigente em seu Estado de origem).
  </div>

  <div class="clause-title">CLÁUSULA V - DO VALOR DA LOCAÇÃO</div>
  <div class="clause-box">
    5.1. A LOCATÁRIA pagará pela locação supra o valor definido no campo 04 do preâmbulo deste Contrato, mediante depósito para crédito da LOCADORA em conta corrente por esta indicada, ou mediante o pagamento de boleto bancário emitido pela LOCADORA.<br/>
    5.2. A primeira fatura de locação será emitida juntamente com o documento fiscal de remessa de locação, com o prazo de pagamento indicado no preâmbulo 4 deste contrato, sendo as demais faturas emitidas nos meses subsequentes.<br/>
    5.3. O não pagamento do aluguel na respectiva data de vencimento implicará na incidência de multa moratória de 2% (dois por cento) sobre o valor em atraso, além de juros de mora de 1% (um por cento) ao mês. Os juros de mora serão calculados "pro rata die" pelo período entre a data de vencimento do aluguel e data do seu efetivo pagamento.<br/>
    5.4. Caso sejam criados novos tributos, extintos os atuais ou alteradas suas alíquotas, bases de cálculo ou interpretação legal durante a vigência deste contrato, o valor do aluguel poderá ser ajustado somente se houver impacto comprovado nos custos da locação.<br/>
    5.4.1. O reajuste deverá ser comprovado documentalmente pela parte interessada e limitado ao valor efetivo da variação tributária.<br/>
    5.4.2. Em caso de redução da carga tributária, as partes deverão rever o valor do aluguel para manter o equilíbrio econômico do contrato.<br/>
    5.5. Os aluguéis serão devidos pela LOCATÁRIA, independente do uso ou não dos bens, seja por motivo de manutenção, reparos ou qualquer outra razão, não podendo a LOCATÁRIA, em hipótese alguma, reter os pagamentos dos aluguéis, a que título for.<br/>
    5.5.1. Na hipótese de o equipamento permanecer inoperante por período superior a 48 horas úteis após o chamado técnico, a LOCATÁRIA ficará isenta do pagamento do aluguel proporcional aos dias de inoperância, ou fará jus à substituição imediata do equipamento por outro em perfeitas condições de uso.<br/>
    5.6. O valor a ser pago pela LOCATÁRIA a título de locação dos bens não inclui cobertura securitária de riscos relacionados com a operação dos bens, que será de exclusiva responsabilidade da LOCATÁRIA, bem como não inclui outras despesas além das que estiverem expressamente previstas neste contrato.
  </div>

  <div class="clause-title">CLÁUSULA VI - DO REAJUSTE</div>
  <div class="clause-box">
    6.1. O valor do aluguel definido no preâmbulo e no Anexo I do presente contrato será reajustado anualmente (a cada 12 meses a contar da data de recebimento dos bens locados) conforme variação do Índice IPCA do mesmo período, ou por outro índice que venha substituí-lo.
  </div>

  <div class="clause-title">CLÁUSULA VII - DA CONSERVAÇÃO</div>
  <div class="clause-box">
    7.1. A LOCATÁRIA declara haver recebido na data e nas condições declaradas no Anexo II, os bens móveis em perfeito estado de funcionalidade, cabendo-lhe trazer os bens locados em perfeito estado de funcionamento para assim restituí-los quando findo ou rescindido este contrato, livre e desembaraçado de quaisquer ônus.
  </div>

  <div class="clause-title">CLÁUSULA VIII – MANUTENÇÃO DOS BENS LOCADOS</div>
  <div class="clause-box">
    8.1. A LOCADORA efetuará a manutenção do(s) bem(ns) ora objeto do presente contrato, decorrentes do uso e desgaste natural do(s) bem(ns), de acordo com a contratação do seguinte formato de manutenção pela LOCATÁRIA, especificados no Anexo I: Incluso Mão de Obra de Manutenção Preventiva e Corretiva, e Deslocamento do Técnico Autorizado CLEAN TECH PRO.<br/>
    8.1.1. O prazo máximo para o início do atendimento técnico será de até 48 horas úteis e o prazo máximo para solução definitiva do problema será de 72 horas úteis. O descumprimento sujeitará a LOCADORA à multa de 10% do valor mensal do aluguel por ocorrência.<br/>
    8.2. Não incluso: peças desgastadas pelo uso diário, como refil de borrachas de rodo e mangueiras, Combustíveis, Água destilada, Químicos, Escovas, Discos e Baterias.<br/>
    8.3. A LOCATÁRIA arcará com quaisquer custos havidos com manutenção corretiva decorrente de mau uso ou uso inadequado dos bens, em desconformidade com as instruções de operação e de manutenção dos bens descritas no manual do operador fornecido pelo fabricante. Também caracteriza mau uso o não seguimento das manutenções diárias atribuídas ao operador (ex: limpeza do equipamento, nível da água das baterias, vazamentos).<br/>
    8.3.1. Qualquer dano ou defeito será objeto de vistoria técnica conjunta, com emissão de relatório de constatação assinado por representantes de ambas as partes. Na ausência de assinatura conjunta, não poderá a LOCADORA imputar responsabilidade à LOCATÁRIA.
  </div>

  <div class="clause-title">CLÁUSULA IX – OBRIGAÇÕES DA LOCADORA</div>
  <div class="clause-box">
    9.1. São obrigações da LOCADORA:<br/>
    a) Realizar, no início da locação, a entrega do(s) bem(ns) móvel(is);<br/>
    b) Guardar absoluto sigilo com relação a todas as informações sobre as atividades e o processo produtivo da LOCATÁRIA;<br/>
    c) Fornecer à LOCATÁRIA as instruções de operação e manutenção dos bens;<br/>
    d) Realizar a manutenção preventiva de itens pré-definidos;<br/>
    e) Realizar a manutenção corretiva solicitada pela LOCATÁRIA através do Portal Pós-Venda, obedecendo ao prazo de 48 horas para primeiro atendimento e 72 horas úteis para equipamento operativo;<br/>
    f) Em caso de falha que impeça o uso por mais de 48 horas, fornecer sem custo adicional equipamento de substituição equivalente.
  </div>

  <div class="clause-title">CLÁUSULA X – OBRIGAÇÕES DA LOCATÁRIA</div>
  <div class="clause-box">
    10.1. São obrigações da LOCATÁRIA:<br/>
    a) Vistoriar o(s) bem(ns) móvel(is) por ocasião de sua entrega pela LOCADORA;<br/>
    b) Promover e responder pela guarda e vigilância do(s) bem(ns), conservando-o em área coberta;<br/>
    c) Utilizar o bem dentro de limites adequados similares recomendados pelo fabricante;<br/>
    d) Seguir as instruções de operação e permitir acesso aos técnicos da LOCADORA;<br/>
    e) Disponibilizar local arejado, seguro e protegido para manutenções conforme segurança do trabalho;<br/>
    f) Não sublocar, ceder ou efetuar alterações que modifiquem as características técnicas do bem;<br/>
    g) Devolver o equipamento ao término da locação emitindo Nota Fiscal de retorno correspondente.
  </div>

  <div class="clause-title">CLÁUSULA XI – DA RESCISÃO OU RESILIÇÃO</div>
  <div class="clause-box">
    11.1. Na hipótese de inadimplemento de qualquer cláusula ou condição, este contrato poderá ser considerado rescindido por justa causa caso a falha não seja sanada após prazo razoável de notificação.<br/>
    11.2. O presente contrato poderá ser rompido por qualquer das Partes imotivadamente mediante aviso prévio por escrito de 30 dias, sujeitando-se a parte rescindente ao pagamento de multa de 10% da soma das mensalidades vincendas estipuladas.
  </div>

  <div class="clause-title">CLÁUSULA XII – DISPOSIÇÕES GERAIS</div>
  <div class="clause-box">
    12.1. O bem locado poderá ser utilizado por empresas do mesmo grupo econômico da LOCATÁRIA, ou prestadores de serviços no mesmo endereço.<br/>
    12.2. Caso a LOCATÁRIA perca o contrato de prestação ao qual o bem estava vinculado, poderá rescindir o presente contrato sem multa, mediante aviso de 30 dias.<br/>
    12.3. As Partes aceitam e admitem como válida a assinatura digital/eletrônica deste instrumento para todos os fins de direito.
  </div>

  <div class="clause-title">CLÁUSULA XIII - ALTERAÇÕES CONTRATUAIS</div>
  <div class="clause-box">
    13.1. Qualquer alteração deste contrato somente será válida se efetuada por escrito, assinada por ambas as partes.
  </div>

  <div class="clause-title">CLÁUSULA XIV – VALOR DO CONTRATO</div>
  <div class="clause-box">
    14.1. O valor total estimado do contrato é de R$ ${totalValueFormatted}, tendo fins puramente fiscais e indicativos.
  </div>

  <div class="clause-title">CLÁUSULA XV - DO FORO</div>
  <div class="clause-box">
    15.1. As partes elegem o foro da cidade de Pinhais/PR para dirimir quaisquer dúvidas decorrentes deste instrumento.
  </div>

  <p style="margin-top: 20px;">E, por estarem assim justas e contratadas, assinam eletronicamente o presente instrumento.</p>
  
  <p style="margin-top: 10px;" class="bold">Pinhais, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.</p>

  <div class="signature-section">
    <div class="signature-box">
      <span class="bold">${minutaData.locadoraName.toUpperCase()}</span><br/>
      Representante Legal: Jaime Horácio de Freitas Junior<br/>
      CPF: 036.361.979-83
    </div>
    <div class="signature-box">
      <span class="bold">LOCATÁRIA: ${minutaData.clientName.toUpperCase()}</span><br/>
      Representante Legal:<br/>
      CPF / CNPJ: ${minutaData.clientCnpj}
    </div>
  </div>

</body>
</html>`;

    const printWin = window.open('', '_blank');
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 500);
  };

  const handleGeneratePDF = async (proposalId) => {
    try {
      const res = await fetch(`/api/get-rental-proposal-details?id=${proposalId}`);
      const data = await res.json();
      if (!data.proposal) {
        alert('Erro ao carregar detalhes da proposta.');
        return;
      }
      
      const p = data.proposal;
      
      // Load Clean Tech details
      const companyLogo = localStorage.getItem('app_company_logo') || '';
      const companyName = localStorage.getItem('app_company_name') || 'Clean Tech Smart';
      const companySub = localStorage.getItem('app_company_subtitle') || 'Soluções Inteligentes em Higiene e Limpeza';
      const companyCnpj = localStorage.getItem('app_company_cnpj') || '00.000.000/0001-00';
      const companyAddress = localStorage.getItem('app_company_address') || 'Curitiba - PR';
      const companyPhone = localStorage.getItem('app_company_phone') || '41984042835';
      const companyEmail = localStorage.getItem('app_company_email') || 'financeiro@grupojvsserv.com.br';
      
      // Load colors from localstorage or use default
      const primaryColor = localStorage.getItem('app_pdf_theme_color') || '#009AC7';
      const adjustColorBrightness = (hex, percent) => {
        let R = parseInt(hex.substring(1, 3), 16);
        let G = parseInt(hex.substring(3, 5), 16);
        let B = parseInt(hex.substring(5, 7), 16);

        R = parseInt((R * (100 + percent)) / 100);
        G = parseInt((G * (100 + percent)) / 100);
        B = parseInt((B * (100 + percent)) / 100);

        R = R < 255 ? R : 255;
        G = G < 255 ? G : 255;
        B = B < 255 ? B : 255;

        R = R > 0 ? R : 0;
        G = G > 0 ? G : 0;
        B = B > 0 ? B : 0;

        const rHex = R.toString(16).padStart(2, '0');
        const gHex = G.toString(16).padStart(2, '0');
        const bHex = B.toString(16).padStart(2, '0');

        return `#${rHex}${gHex}${bHex}`;
      };
      const secondaryColor = adjustColorBrightness(primaryColor, -20);
      const colorLight = adjustColorBrightness(primaryColor, 85);
      
      const parseSpecsToHTML = (text) => {
        if (!text) return '';
        let htmlContent = '';
        const lines = text.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          if (trimmed.includes(':')) {
            const [key, ...valParts] = trimmed.split(':');
            const val = valParts.join(':').trim();
            const cleanKey = key.replace(/^[-\s*•]+/, '').trim();
            htmlContent += `
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding:2px 0; font-size:9px; line-height:1.25;">
                <span style="font-weight:600; color:#475569; width:52%;">${cleanKey}</span>
                <span style="color:#0f172a; width:48%; text-align:right; font-weight:600;">${val}</span>
              </div>
            `;
          } else if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
            const cleanLine = trimmed.replace(/^[-\s*•]+/, '').trim();
            htmlContent += `
              <div style="display:flex; align-items:start; padding:1.5px 0; font-size:9px; color:#334155; line-height:1.25;">
                <span style="color:${primaryColor}; margin-right:4px; font-weight:bold;">•</span>
                <span>${cleanLine}</span>
              </div>
            `;
          } else if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
            htmlContent += `
              <div style="font-weight:800; color:${primaryColor}; font-size:9px; text-transform:uppercase; border-bottom:1px solid ${primaryColor}; padding-bottom:2px; margin-top:5px; margin-bottom:3px; letter-spacing:0.5px;">
                ${trimmed}
              </div>
            `;
          } else {
            htmlContent += `
              <p style="font-size:9px; color:#475569; padding:1.5px 0; line-height:1.25;">${trimmed}</p>
            `;
          }
        }
        return htmlContent;
      };

      const valInfo = getRentalValueInfo(p.period_months);
      const introText = 'Equipamento de alta qualidade e rendimento, ideal para processos contínuos de higienização de pisos.';
      const specsHTML = parseSpecsToHTML(p.machine_specs);

      const isMultiOption = p.items && Array.isArray(p.items) && p.items.length > 1;

      const financialSectionHTML = isMultiOption ? `
        <div style="margin-bottom: 10px;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
            <div style="width:3px; height:12px; background:${primaryColor}; border-radius:2px;"></div>
            <span style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#0f172a;">
              Quadro Comparativo de Opções e Prazos de Locação
            </span>
          </div>
          <div style="border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; background:#fff;">
            <table style="width:100%; border-collapse:collapse; font-size:9.5px; text-align:left;">
              <thead>
                <tr style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color:#fff; font-size:8.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
                  <th style="padding:6px 8px; text-align:center; width:70px; border-right:1px solid rgba(255,255,255,0.15);">Opção</th>
                  <th style="padding:6px 10px; border-right:1px solid rgba(255,255,255,0.15);">Equipamento / Modelo</th>
                  <th style="padding:6px 10px; border-right:1px solid rgba(255,255,255,0.15);">Prazo / Período</th>
                  <th style="padding:6px 10px; border-right:1px solid rgba(255,255,255,0.15);">Tipo Contrato & Horas</th>
                  <th style="padding:6px 6px; text-align:center; width:40px; border-right:1px solid rgba(255,255,255,0.15);">Qtd</th>
                  <th style="padding:6px 10px; text-align:right; width:135px;">Valor da Locação</th>
                </tr>
              </thead>
              <tbody>
                ${p.items.map((item, idx) => {
                  const itemValInfo = getRentalValueInfo(item.period_months);
                  return `
                    <tr style="font-size:9.5px; ${idx % 2 === 1 ? 'background:#f8fafc;' : 'background:#ffffff;'} border-bottom:1px solid #e2e8f0;">
                      <td style="padding:6px 8px; text-align:center; border-right:1px solid #e2e8f0;">
                        <span style="display:inline-block; padding:2px 6px; background:#e0f2fe; color:#0284c7; font-weight:800; border-radius:4px; font-size:9px;">Opção #${idx + 1}</span>
                      </td>
                      <td style="padding:6px 10px; font-weight:700; color:#0f172a; border-right:1px solid #e2e8f0;">
                        ${item.machine_name || p.machine_name || 'Equipamento'}
                      </td>
                      <td style="padding:6px 10px; font-weight:600; color:#1e293b; border-right:1px solid #e2e8f0;">
                        ${formatPeriod(item.period_months)}
                      </td>
                      <td style="padding:6px 10px; color:#334155; font-size:9px; border-right:1px solid #e2e8f0; line-height:1.25;">
                        <span style="font-weight:700; color:#0f172a;">${item.contract_type || '0 - Sem cobertura'}</span><br/>
                        <span style="color:#64748b; font-weight:500; font-size:8.5px;">${formatHoursForPeriod(item.hours_per_month, item.period_months)}</span>
                      </td>
                      <td style="padding:6px 6px; text-align:center; font-weight:700; color:#0f172a; border-right:1px solid #e2e8f0;">
                        ${item.quantity || 1}
                      </td>
                      <td style="padding:6px 10px; text-align:right; font-weight:800; color:${primaryColor}; font-size:11px; white-space:nowrap;">
                        R$ ${Number(item.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span style="font-size:8.5px; font-weight:600; color:#64748b;">${itemValInfo.suffix}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div style="margin-bottom: 10px;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
            <div style="width:3px; height:12px; background:${primaryColor}; border-radius:2px;"></div>
            <span style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#0f172a;">
              Condições Gerais de Fornecimento
            </span>
          </div>
          <div style="border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; background:#fff;">
            <table style="width:100%; border-collapse:collapse; font-size:9px;">
              <tr>
                <td style="padding:5px 8px; background:#f8fafc; font-weight:700; color:#475569; width:120px; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0; text-transform:uppercase; font-size:8.5px;">Região Utilizada</td>
                <td style="padding:5px 8px; font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0;">${p.region_used || 'Curitiba e Região'}</td>
                <td style="padding:5px 8px; background:#f8fafc; font-weight:700; color:#475569; width:120px; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0; text-transform:uppercase; font-size:8.5px;">Tempo de Entrega</td>
                <td style="padding:5px 8px; font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0;">${p.delivery_time || 'Imediato'}</td>
              </tr>
              <tr>
                <td style="padding:5px 8px; background:#f8fafc; font-weight:700; color:#475569; border-right:1px solid #e2e8f0; text-transform:uppercase; font-size:8.5px; ${p.notes ? 'border-bottom:1px solid #e2e8f0;' : ''}">Custo do Frete</td>
                <td style="padding:5px 8px; font-weight:700; color:#0f172a; border-right:1px solid #e2e8f0; ${p.notes ? 'border-bottom:1px solid #e2e8f0;' : ''}">${Number(p.freight_cost) > 0 ? `R$ ${Number(p.freight_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Incluso'}</td>
                <td style="padding:5px 8px; background:#f8fafc; font-weight:700; color:#475569; border-right:1px solid #e2e8f0; text-transform:uppercase; font-size:8.5px; ${p.notes ? 'border-bottom:1px solid #e2e8f0;' : ''}">Validade Proposta</td>
                <td style="padding:5px 8px; font-weight:700; color:#0f172a; ${p.notes ? 'border-bottom:1px solid #e2e8f0;' : ''}">${p.validity_days || '10 dias'}</td>
              </tr>
              ${p.notes ? `
              <tr>
                <td style="padding:5px 8px; background:#f8fafc; font-weight:700; color:#475569; border-right:1px solid #e2e8f0; text-transform:uppercase; font-size:8.5px;">Observações</td>
                <td colspan="3" style="padding:5px 8px; color:#334155; font-size:9px; font-style:italic;">${p.notes}</td>
              </tr>` : ''}
            </table>
          </div>
        </div>
      ` : `
        <div style="margin-bottom: 12px;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
            <div style="width:3px; height:12px; background:${primaryColor}; border-radius:2px;"></div>
            <span style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#0f172a;">
              Valores e Condições de Locação
            </span>
          </div>
          <div style="border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; background:#fff;">
            <table style="width:100%; border-collapse:collapse; font-size:9.5px;">
              <tr>
                <td style="padding:6px 10px; background:#f8fafc; font-weight:700; color:#475569; font-size:9px; text-transform:uppercase; width:160px; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0;">${valInfo.label}</td>
                <td style="padding:6px 10px; font-size:12px; color:${primaryColor}; font-weight:800; border-bottom:1px solid #e2e8f0;">R$ ${Number(p.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span style="font-size:9px; font-weight:600; color:#64748b;">${valInfo.suffix}</span></td>
              </tr>
              <tr>
                <td style="padding:5px 10px; background:#f8fafc; font-weight:700; color:#475569; font-size:8.5px; text-transform:uppercase; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0;">Tipo de Contrato</td>
                <td style="padding:5px 10px; font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0;">${p.contract_type || '0 - Sem cobertura'}</td>
              </tr>
              <tr>
                <td style="padding:5px 10px; background:#f8fafc; font-weight:700; color:#475569; font-size:8.5px; text-transform:uppercase; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0;">Período / Franquia</td>
                <td style="padding:5px 10px; font-weight:600; color:#0f172a; border-bottom:1px solid #e2e8f0;">${formatPeriod(p.period_months)} • ${formatHoursForPeriod(p.hours_per_month, p.period_months)}</td>
              </tr>
              <tr>
                <td style="padding:5px 10px; background:#f8fafc; font-weight:700; color:#475569; font-size:8.5px; text-transform:uppercase; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0;">Região / Entrega</td>
                <td style="padding:5px 10px; font-weight:600; color:#0f172a; border-bottom:1px solid #e2e8f0;">${p.region_used || 'Curitiba e Região'} • Entrega: ${p.delivery_time || 'Imediato'}</td>
              </tr>
              <tr>
                <td style="padding:5px 10px; background:#f8fafc; font-weight:700; color:#475569; font-size:8.5px; text-transform:uppercase; border-right:1px solid #e2e8f0; ${p.notes ? 'border-bottom:1px solid #e2e8f0;' : ''}">Frete / Validade</td>
                <td style="padding:5px 10px; font-weight:600; color:#0f172a; ${p.notes ? 'border-bottom:1px solid #e2e8f0;' : ''}">${Number(p.freight_cost) > 0 ? `R$ ${Number(p.freight_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Incluso'} • Validade: ${p.validity_days || '10 dias'}</td>
              </tr>
              ${p.notes ? `
              <tr>
                <td style="padding:5px 10px; background:#f8fafc; font-weight:700; color:#475569; font-size:8.5px; text-transform:uppercase; border-right:1px solid #e2e8f0;">Observações</td>
                <td style="padding:5px 10px; color:#475569; font-size:9px;">${p.notes}</td>
              </tr>` : ''}
            </table>
          </div>
        </div>
      `;

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Proposta de Locação #${String(p.id).padStart(4,'0')}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}
body {
  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 10px;
  line-height: 1.35;
  padding-top: 50px;
}
.print-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #0f172a;
  color: #fff;
  padding: 10px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 999;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
}
.btn-print {
  background: ${primaryColor};
  color: #fff;
  border: none;
  padding: 8px 22px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.btn-print:hover {
  filter: brightness(1.1);
}
.page {
  background: #fff;
  width: 210mm;
  height: 296mm;
  max-height: 296mm;
  margin: 15px auto;
  padding: 11mm 15mm;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}
@media print {
  .print-bar, .no-print { display: none !important; }
  body { background: #fff !important; padding-top: 0 !important; }
  .page {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 10mm 12mm !important;
    border-radius: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    max-height: 297mm !important;
    page-break-after: always !important;
    page-break-inside: avoid !important;
    break-after: page !important;
    break-inside: avoid !important;
  }
  .page:last-child {
    page-break-after: auto !important;
    break-after: auto !important;
  }
  @page {
    size: A4 portrait;
    margin: 0;
  }
}
</style>
</head>
<body>
<div class="print-bar no-print">
  <strong>📄 Proposta de Locação #${String(p.id).padStart(4,'0')} &mdash; ${p.client_name}</strong>
  <button class="btn-print" onclick="window.print()">🖨️&nbsp; Salvar / Imprimir PDF</button>
</div>

<!-- PAGE 1: Presentation & Technical Specs -->
<div class="page">
  <div>
    <!-- Header -->
    <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid ${primaryColor}; padding-bottom:8px; margin-bottom:10px;">
      <div style="flex:1; text-align:left;">
        <h1 style="font-size:15px; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:0.5px; margin:0;">${companyName}</h1>
        <div style="font-size:9.5px; font-weight:700; color:#1e293b; margin-top:2px;">CNPJ: ${companyCnpj}</div>
        <div style="font-size:8.5px; color:#64748b; margin-top:1px;">${companyAddress} • Tel: ${companyPhone} ${companyEmail ? `• ${companyEmail}` : ''}</div>
      </div>
      ${companyLogo ? `
        <div style="max-width:140px; display:flex; justify-content:flex-end;">
          <img src="${companyLogo}" alt="Logo" style="max-height:50px; max-width:140px; object-fit:contain;" />
        </div>
      ` : ''}
    </div>

    <!-- Title -->
    <div style="text-align:center; margin-bottom:10px;">
      <h2 style="font-size:13px; font-weight:800; color:#0f172a; text-transform:uppercase; margin:0 0 2px 0; letter-spacing:0.5px;">Proposta Comercial de Locação de Equipamentos</h2>
      <div style="font-size:9.5px; font-weight:700; color:#475569;">Proposta nº #${String(p.id).padStart(4,'0')} • Data: ${emissao}</div>
    </div>

    <!-- Client Box -->
    <div style="margin-bottom:10px; border-left:4px solid ${primaryColor}; border-radius:6px; padding:7px 12px; background:#f8fafc; border:1px solid #cbd5e1; border-left-width:4px;">
      <div style="font-size:9.5px; font-weight:800; text-transform:uppercase; color:${primaryColor}; margin-bottom:4px; letter-spacing:0.5px;">Dados do Cliente</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px 20px; font-size:9px;">
        <div><b>Cliente:</b> ${p.client_razao_social || p.client_name || 'Não informado'}</div>
        <div><b>CNPJ/CPF:</b> ${p.client_document || '&mdash;'}</div>
        <div><b>Endereço:</b> ${p.client_address || '&mdash;'}</div>
        <div><b>Contato:</b> ${p.client_contact || (p.client_email ? p.client_email.split('@')[0] : '&mdash;')}</div>
        <div><b>Telefone:</b> ${p.client_phone || p.client_email || '&mdash;'}</div>
        <div><b>Serviço:</b> Locação de Equipamento</div>
      </div>
    </div>

    <!-- 2-Column Grid for Image + Specs -->
    <div style="display:grid; grid-template-columns:1fr 1.2fr; gap:16px; align-items:start;">
      <!-- Coluna Esquerda: Imagem e Diferenciais -->
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="height:140px; background:#fff; border:1px solid #e2e8f0; border-radius:6px; display:flex; align-items:center; justify-content:center; padding:6px;">
          <img src="${mainPhoto}" alt="${p.machine_name}" style="max-height:100%; max-width:100%; object-fit:contain; mix-blend-multiply;" />
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 10px; font-size:8.5px; color:#475569; line-height:1.35;">
          <h4 style="font-weight:800; color:#0f172a; margin-bottom:4px; text-transform:uppercase; font-size:8.5px; border-bottom:1px solid #cbd5e1; padding-bottom:2px;">Diferenciais Operacionais</h4>
          <p style="margin-bottom:2px;">• Alta produtividade e rendimento em grandes áreas.</p>
          <p style="margin-bottom:2px;">• Facilidade de operação com controles intuitivos.</p>
          <p style="margin-bottom:2px;">• Robustez construtiva Tennant líder mundial.</p>
          <p>• Suporte técnico especializado e peças originais.</p>
        </div>
      </div>

      <!-- Coluna Direita: Nome e Ficha Técnica -->
      <div>
        <h3 style="font-size:12px; font-weight:800; color:#0f172a; margin-bottom:3px; border-bottom:2px solid ${primaryColor}; padding-bottom:3px; text-transform:uppercase;">
          ${p.machine_name}
        </h3>
        <p style="font-size:8.5px; color:#64748b; line-height:1.25; margin-bottom:6px; font-style:italic;">
          ${introText}
        </p>
        <div>
          <div style="font-size:8.5px; font-weight:800; color:${primaryColor}; text-transform:uppercase; border-bottom:1px solid #cbd5e1; padding-bottom:2px; margin-bottom:4px; letter-spacing:0.5px;">Especificações Técnicas</div>
          ${specsHTML || '<p style="color:#94a3b8; font-style:italic; font-size:8.5px;">Consulte a ficha técnica anexa.</p>'}
        </div>
      </div>
    </div>
  </div>

  <!-- Page 1 Footer Note -->
  <div style="border-top:1px solid #e2e8f0; padding-top:4px; text-align:right; font-size:8px; color:#94a3b8;">
    Página 1 de 2 • Proposta Comercial #${String(p.id).padStart(4,'0')}
  </div>
</div>

<!-- PAGE 2: Financial Terms & Conditions -->
<div class="page" style="page-break-before:always;">
  <div>
    <!-- Page 2 Header -->
    <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:6px; margin-bottom:10px;">
      <span style="font-size:9.5px; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:1px;">Valores e Condições de Locação</span>
      <img src="https://www.tennantco.com/content/dam/resources/images/alfa-tennant-logo-150x70.png" alt="Alfa Tennant" style="max-height:24px; object-fit:contain;" />
    </div>

    <!-- Financial & Conditions Tables -->
    ${financialSectionHTML}

    <!-- Legal text -->
    <p style="font-size:7.5px; color:#64748b; line-height:1.3; margin-bottom:8px; text-align:justify;">
      Todos os pedidos estão sujeitos aos nossos termos e condições gerais que se encontram registrados perante o <b>3º Oficial de Registro de Títulos e Documentos e Civil de Pessoa Jurídica da Capital &ndash; São Paulo</b>, cuja cópia digitalizada está disponível no site: <i>www.alfatennant.com.br/terms</i> e também por e-mail ou correio quando solicitada. Os valores acima definidos englobam única e exclusivamente os impostos, taxas e demais encargos fiscais e tributários incidentes nas alíquotas vigentes no Estado de origem (São Paulo) de responsabilidade da <b>TENNANT COMPANY</b>.
    </p>

    <!-- Contract Types Table -->
    <div style="margin-bottom:8px;">
      <div style="font-size:8px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:3px; letter-spacing:0.5px;">* Tabela Descritiva de Tipos de Contrato</div>
      <table style="width:100%; border-collapse:collapse; border:1px solid #cbd5e1; border-radius:4px; overflow:hidden; font-size:7.5px;">
        <thead>
          <tr style="background:${primaryColor}; color:#fff; font-size:7.5px; font-weight:700;">
            <th style="width:110px; padding:3px 6px; text-align:left; border-right:1px solid rgba(255,255,255,0.2);">Tipo de Contrato</th>
            <th style="padding:3px 6px; text-align:left;">Descrição de Cobertura</th>
          </tr>
        </thead>
        <tbody>
          <tr ${p.contract_type?.startsWith('0') ? 'style="background-color:#fef9c3; font-weight:bold; color:#854d0e;"' : 'style="background:#fff;"'}>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; font-weight:700;">${p.contract_type?.startsWith('0') ? '★ ' : ''}0 - Sem Cobertura</td>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0;">Incluso: Somente locação do Equipamento. ${p.contract_type?.startsWith('0') ? '(PLANO SELECIONADO)' : ''}</td>
          </tr>
          <tr ${p.contract_type?.startsWith('1') ? 'style="background-color:#fef9c3; font-weight:bold; color:#854d0e;"' : 'style="background:#f8fafc;"'}>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; font-weight:700;">${p.contract_type?.startsWith('1') ? '★ ' : ''}1 - Ouro</td>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0;">Incluso: Manutenção, Mão de Obra, Peças, Água Destilada e Deslocamento do técnico autorizado TENNANT COMPANY. Não incluso: Combustíveis e Químicos. ${p.contract_type?.startsWith('1') ? '(PLANO SELECIONADO)' : ''}</td>
          </tr>
          <tr ${p.contract_type?.startsWith('2') ? 'style="background-color:#fef9c3; font-weight:bold; color:#854d0e;"' : 'style="background:#fff;"'}>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; font-weight:700;">${p.contract_type?.startsWith('2') ? '★ ' : ''}2 - Prata</td>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0;">Incluso: Igual ao Ouro. Não incluso: Combustíveis, Químicos, Escovas e Discos. ${p.contract_type?.startsWith('2') ? '(PLANO SELECIONADO)' : ''}</td>
          </tr>
          <tr ${p.contract_type?.startsWith('3') ? 'style="background-color:#fef9c3; font-weight:bold; color:#854d0e;"' : 'style="background:#f8fafc;"'}>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; font-weight:700;">${p.contract_type?.startsWith('3') ? '★ ' : ''}3 - Bronze</td>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0;">Incluso: Igual ao Ouro. Não incluso: Combustíveis, Água Destilada, Químicos, Escovas, Discos e Baterias. ${p.contract_type?.startsWith('3') ? '(PLANO SELECIONADO)' : ''}</td>
          </tr>
          <tr ${p.contract_type?.startsWith('4') ? 'style="background-color:#fef9c3; font-weight:bold; color:#854d0e;"' : 'style="background:#fff;"'}>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; font-weight:700;">${p.contract_type?.startsWith('4') ? '★ ' : ''}4 - MOB</td>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0;">Incluso: Somente Manutenção, Mão de Obra, e Deslocamento do técnico autorizado TENNANT COMPANY. ${p.contract_type?.startsWith('4') ? '(PLANO SELECIONADO)' : ''}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Page 2 Footer -->
  <div>
    <div style="display:grid; grid-template-columns:1.4fr 1fr; gap:20px; align-items:end; border-top:1px solid #cbd5e1; padding-top:8px;">
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:6px 10px; font-size:8.5px;">
        <span style="display:block; margin-bottom:2px; color:${primaryColor}; font-weight:800; text-transform:uppercase; font-size:8px; letter-spacing:0.5px;">Dados do Vendedor</span>
        <div style="white-space:pre-line; color:#334155; line-height:1.3;">${p.seller_info || 'Alfa Tennant\nAtendimento Comercial'}</div>
      </div>
      
      <div style="text-align:right;">
        <img src="https://www.tennantco.com/content/dam/resources/images/alfa-tennant-logo-150x70.png" alt="Alfa Tennant" style="max-height:28px; margin-bottom:3px; object-fit:contain;" />
        <div style="font-size:7.5px; color:#94a3b8; line-height:1.2;">
          Rua Barão de Campinas, 715 • São Paulo, SP<br>
          Vendas: (11) 3320-8550
        </div>
      </div>
    </div>

    <div style="border-top:1px solid #f1f5f9; margin-top:6px; padding-top:3px; text-align:right; font-size:8px; color:#94a3b8;">
      Página 2 de 2 • Proposta Comercial #${String(p.id).padStart(4,'0')}
    </div>
  </div>
</div>

</body>
</html>`;

      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      } else {
        alert('O bloqueador de pop-ups impediu a abertura do PDF. Por favor, permita pop-ups para este site.');
      }

    } catch (err) {
      console.error(err);
      alert('Erro ao gerar proposta comercial em PDF.');
    }
  };

  const filtered = proposals.filter(p => 
    p.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.machine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contract_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="font-sans text-gray-800 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-blue-600" />
            Propostas de Locação (Alfa Tennant)
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gere propostas de locação completas com fotos do catálogo, planos mensais e termos legais oficiais</p>
        </div>
        
        <button 
          onClick={openNewProposal}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm mt-4 md:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Proposta
        </button>
      </header>

      {/* Status Totalizer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {['Rascunho', 'Enviada', 'Negociação', 'Fechada', 'Contrato'].map(status => {
          const matching = filtered.filter(p => (p.status || 'Rascunho') === status);
          const totalValue = matching.reduce((sum, p) => sum + Number(p.monthly_value || 0), 0);
          
          const statusConfigs = {
            'Rascunho': { label: 'Rascunho', border: 'border-t-4 border-t-gray-400', text: 'text-gray-700', bg: 'bg-gray-50/50' },
            'Enviada': { label: 'Enviada', border: 'border-t-4 border-t-blue-500', text: 'text-blue-700', bg: 'bg-blue-50/20' },
            'Negociação': { label: 'Negociação', border: 'border-t-4 border-t-orange-500', text: 'text-orange-700', bg: 'bg-orange-50/20' },
            'Fechada': { label: 'Fechada', border: 'border-t-4 border-t-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50/20' },
            'Contrato': { label: 'Contrato', border: 'border-t-4 border-t-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50/20' }
          };
          const config = statusConfigs[status] || statusConfigs['Rascunho'];

          return (
            <div key={status} className={`bg-white rounded-xl shadow-xs border border-gray-150 ${config.border} p-4 flex flex-col justify-between hover:shadow-sm transition-shadow`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xxs font-extrabold uppercase tracking-widest text-gray-400">{config.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xxs font-black bg-white border border-gray-200 text-gray-700 shadow-xxs`}>
                  {matching.length}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400">Total Mensal</p>
                <p className={`text-sm font-black ${config.text} mt-0.5`}>
                  R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, máquina..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>
        
        {/* Toggle Switch */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200">
          <button 
            type="button"
            onClick={() => setViewMode('kanban')} 
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Quadro Kanban
          </button>
          <button 
            type="button"
            onClick={() => setViewMode('list')} 
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Lista Completa
          </button>
        </div>
      </div>

      {/* Proposals list or Kanban view */}
      {isLoading ? (
        <div className="flex justify-center py-12 bg-white rounded-xl border border-gray-100">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          Nenhuma proposta comercial encontrada.
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {['Rascunho', 'Enviada', 'Negociação', 'Fechada', 'Contrato'].map(colStatus => {
            const colProposals = filtered.filter(p => (p.status || 'Rascunho') === colStatus);
            
            const colThemes = {
              'Rascunho': { bg: 'bg-gray-50/70 border-gray-200/60', text: 'text-gray-700', badge: 'bg-gray-200/65 text-gray-800' },
              'Enviada': { bg: 'bg-blue-50/40 border-blue-100', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
              'Negociação': { bg: 'bg-orange-50/40 border-orange-100', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-850' },
              'Fechada': { bg: 'bg-emerald-50/40 border-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
              'Contrato': { bg: 'bg-indigo-50/40 border-indigo-100', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' }
            };
            const theme = colThemes[colStatus] || colThemes['Rascunho'];

            return (
              <div 
                key={colStatus} 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, colStatus)}
                className={`flex flex-col border rounded-xl p-3 min-h-[500px] transition-colors ${theme.bg}`}
              >
                {/* Header da coluna */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/50">
                  <h3 className={`text-sm font-bold ${theme.text}`}>{colStatus}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xxs font-black ${theme.badge}`}>
                    {colProposals.length}
                  </span>
                </div>
                
                {/* Cards da coluna */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] scrollbar-thin">
                  {colProposals.length === 0 ? (
                    <div className="border border-dashed border-gray-200/50 rounded-lg p-6 text-center text-xs text-gray-400 bg-white/40">
                      Arraste itens aqui
                    </div>
                  ) : (
                    colProposals.map(p => {
                      const stripeColor = {
                        'Rascunho': 'border-l-gray-400',
                        'Enviada': 'border-l-blue-500',
                        'Negociação': 'border-l-orange-500',
                        'Fechada': 'border-l-emerald-500',
                        'Contrato': 'border-l-indigo-500'
                      }[colStatus] || 'border-l-gray-400';

                      let parsedItems = [];
                      if (p.items) {
                        parsedItems = typeof p.items === 'string' ? JSON.parse(p.items) : p.items;
                      }
                      const hasMultipleOptions = parsedItems && parsedItems.length > 1;

                      let displayPeriod = formatPeriod(p.period_months);
                      let displayValue = `R$ ${Number(p.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${getRentalValueInfo(p.period_months).suffix}`;
                      let displayMachine = p.machine_name || 'Equipamento não especificado';

                      if (hasMultipleOptions) {
                        const periodsList = parsedItems.map(i => formatPeriod(i.period_months)).join(', ');
                        displayPeriod = `${parsedItems.length} Opções (${periodsList})`;
                        const values = parsedItems.map(i => Number(i.monthly_value || 0)).filter(v => v > 0);
                        if (values.length > 0) {
                          const minVal = Math.min(...values);
                          const maxVal = Math.max(...values);
                          displayValue = minVal === maxVal 
                            ? `R$ ${minVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                            : `R$ ${minVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ~ R$ ${maxVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                        }
                      }

                      return (
                        <div 
                          key={p.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, p.id)}
                          className={`bg-white border border-gray-150 ${stripeColor} border-l-4 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing select-none flex flex-col justify-between min-h-[185px]`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h4 className="font-extrabold text-gray-900 text-xs truncate uppercase flex-1" title={p.client_name}>
                                {p.client_name}
                              </h4>
                              {hasMultipleOptions && (
                                <span className="bg-blue-100 text-blue-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded-full shrink-0">
                                  {parsedItems.length} OPÇÕES
                                </span>
                              )}
                            </div>
                            <p className="text-xxs text-gray-500 mt-1 truncate font-medium" title={displayMachine}>
                              ⚙️ {displayMachine}
                            </p>
                          </div>

                          {/* Horizontal row for basic info at the same height */}
                          <div className="flex justify-between items-center my-2 text-xxs font-bold bg-gray-50/70 p-2 rounded-lg border border-gray-100/70">
                            <span className="text-gray-500 uppercase text-[10px] truncate max-w-[120px]">{displayPeriod}</span>
                            <span className="text-blue-600 font-extrabold text-[11px] shrink-0">
                              {displayValue}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 w-full justify-between">
                              <div className="flex items-center gap-1">
                                <button 
                                  type="button"
                                  onClick={() => handleCopyPublicLink(p.id)}
                                  className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
                                  title="Copiar Link Público"
                                >
                                  <Link2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleGeneratePDF(p.id)}
                                  className="p-1.5 bg-blue-50 text-blue-650 hover:bg-blue-100 rounded-md transition-colors"
                                  title="Gerar PDF"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleEdit(p)}
                                  className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-150 rounded-md transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button 
                                type="button"
                                onClick={() => handleDelete(p.id)}
                                className="p-1.5 bg-red-50 text-red-650 hover:bg-red-100 rounded-md transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-700">Cliente</th>
                  <th className="px-6 py-4 font-bold text-gray-700">Máquina</th>
                  <th className="px-6 py-4 font-bold text-gray-700">Período</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-right">Valor da Locação</th>
                  <th className="px-6 py-4 font-bold text-gray-700">Contrato</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => {
                  let parsedItems = [];
                  if (p.items) {
                    parsedItems = typeof p.items === 'string' ? JSON.parse(p.items) : p.items;
                  }
                  const hasMultipleOptions = parsedItems && parsedItems.length > 1;

                  let displayPeriod = formatPeriod(p.period_months);
                  let displayValue = `R$ ${Number(p.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${getRentalValueInfo(p.period_months).suffix}`;

                  if (hasMultipleOptions) {
                    const periodsList = parsedItems.map(i => formatPeriod(i.period_months)).join(', ');
                    displayPeriod = `${parsedItems.length} Opções (${periodsList})`;
                    const values = parsedItems.map(i => Number(i.monthly_value || 0)).filter(v => v > 0);
                    if (values.length > 0) {
                      const minVal = Math.min(...values);
                      const maxVal = Math.max(...values);
                      displayValue = minVal === maxVal 
                        ? `R$ ${minVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : `R$ ${minVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ~ R$ ${maxVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                    }
                  }

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{p.client_name}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          <span>{p.machine_name || 'Desconhecida'}</span>
                          {hasMultipleOptions && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-extrabold">
                              {parsedItems.length} Opções
                            </span>
                          )}
                        </div>
                        {p.equipment_name && (
                          <div className="text-[11px] text-blue-600 font-bold flex items-center gap-1 mt-0.5">
                            <span>Ativo: {p.equipment_name}</span>
                            {p.equipment_serial && <span className="text-gray-400 font-medium">(S/N: {p.equipment_serial})</span>}
                            {p.equipment_ownership === 'sublocado' && <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded text-[9px] font-bold">SUBLOCADO</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{displayPeriod}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600">{displayValue}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{p.contract_type}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleCopyPublicLink(p.id)}
                            className="flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Link2 className="w-3.5 h-3.5 mr-1" />
                            Copiar Link
                          </button>
                          <button 
                            onClick={() => handleGeneratePDF(p.id)}
                            className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" />
                            Gerar PDF
                          </button>
                          <button 
                            onClick={() => handleEdit(p)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proposal modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                {formData.id ? 'Editar Proposta de Locação' : 'Criar Nova Proposta de Locação'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Client selection */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-800 mb-1">Cliente da Proposta *</label>
                <select 
                  required
                  value={formData.client_id} 
                  onChange={e => setFormData({...formData, client_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white font-medium"
                >
                  <option value="">Selecione o Cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.document ? `(${c.document})` : ''}</option>)}
                </select>
              </div>

              {/* Premissas Customizadas (Acima de todos os equipamentos) */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Premissas de Markup Aplicadas a Todas as Opções
                  </h4>
                  <span className="text-[11px] text-gray-500 font-semibold">
                    Markup Total: {Number(formData.insumos_percent || 0) + Number(formData.manutencao_percent || 0) + Number(formData.lucro_percent || 0) + Number(formData.tributos_percent || 0)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Insumos (%)</label>
                    <input 
                      type="number" 
                      value={formData.insumos_percent} 
                      onChange={e => handleMarkupChange('insumos_percent', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Manutenção (%)</label>
                    <input 
                      type="number" 
                      value={formData.manutencao_percent} 
                      onChange={e => handleMarkupChange('manutencao_percent', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Lucro (%)</label>
                    <input 
                      type="number" 
                      value={formData.lucro_percent} 
                      onChange={e => handleMarkupChange('lucro_percent', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tributos (%)</label>
                    <input 
                      type="number" 
                      value={formData.tributos_percent} 
                      onChange={e => handleMarkupChange('tributos_percent', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Option / Equipment Cards Section */}
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <span>Opções e Equipamentos da Proposta ({formData.items.length} {formData.items.length === 1 ? 'Opção' : 'Opções'})</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Utilize o botão <strong>Duplicar</strong> em cada opção para adicionar mais opções/prazos à proposta.
                  </p>
                </div>

                {/* Option Cards */}
                <div className="space-y-4">
                  {formData.items.map((item, idx) => {
                    const filteredPrices = getItemFilteredPrices(item.machine_model_id);
                    const valInfo = getRentalValueInfo(item.period_months);
                    const selectedPriceRow = rentalPrices.find(r => String(r.id) === String(item.rental_price_id));

                    return (
                      <div 
                        key={item.id || idx} 
                        className="bg-white border-2 border-slate-200 hover:border-blue-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-all relative group"
                      >
                        {/* Option Card Header */}
                        <div className="flex items-center justify-between border-b border-gray-150 pb-2.5">
                          <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                            Opção #{idx + 1}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDuplicateItem(idx)}
                              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs border border-blue-200"
                              title="Duplicar esta opção"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Duplicar</span>
                            </button>

                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Remover esta opção"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Machine & Physical Equipment */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-7">
                            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                              <span>Equipamento / Modelo da Máquina *</span>
                              <span className="text-[10px] text-blue-600 font-semibold">Sincroniza automaticamente com a Tabela de Preços</span>
                            </label>
                            <div className="flex items-center space-x-2">
                              <select 
                                required
                                value={item.machine_model_id} 
                                onChange={e => handleItemChange(idx, 'machine_model_id', e.target.value)}
                                className="flex-1 min-w-0 w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-white font-bold text-gray-900 shadow-xs"
                              >
                                <option value="">Selecione o Modelo da Máquina...</option>
                                {machineModels.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => setIsMachineModelModalOpen(true)}
                                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg transition-colors flex items-center justify-center shadow-xs shrink-0"
                                title="Cadastrar Novo Modelo no Catálogo de Máquinas"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="md:col-span-5">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Ativo Físico do Park de Máquinas (Opcional)
                            </label>
                            <select 
                              value={item.equipment_id || ''} 
                              onChange={e => handleItemChange(idx, 'equipment_id', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-white font-medium text-gray-700"
                            >
                              <option value="">Vincular Ativo Físico (Opcional)...</option>
                              {equipments.map(eq => {
                                const isLocado = eq.status === 'Locado' || eq.status === 'Alocado';
                                const ownershipBadge = eq.ownership_type === 'sublocado' ? `SUBLOCADO${eq.supplier_name ? ' (' + eq.supplier_name + ')' : ''}` : 'PRÓPRIO';
                                const statusText = isLocado ? `[LOCADO${eq.client_name ? ' p/ ' + eq.client_name : ''}]` : `[${eq.status || 'Disponível'}]`;
                                return (
                                  <option key={eq.id} value={eq.id}>
                                    {eq.name} (Série: {eq.serial_number || 'S/N'}) — {ownershipBadge} — {statusText}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                        {/* Auto-Linked Pricing Table Status Badge */}
                        {selectedPriceRow ? (
                          <div className="p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
                            <div className="flex items-center space-x-2 text-emerald-900">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-xs">
                                ✓ Tabela Vinculada
                              </span>
                              <span className="font-extrabold text-emerald-950 text-xs">
                                {selectedPriceRow.code}
                              </span>
                              <span className="text-emerald-700 text-xs">
                                &mdash; {selectedPriceRow.description}
                              </span>
                              <span className="text-emerald-800 font-semibold hidden md:inline text-xs">
                                (Base 12M: R$ {Number(selectedPriceRow.price_12 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleShowPriceOverride(idx)}
                              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer ml-auto"
                            >
                              {showPriceOverride[idx] ? '▲ Ocultar Seleção Manual' : '⚙️ Alterar Tabela de Preço'}
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center justify-between">
                            <span>💡 Selecione o modelo acima para puxar o preço da tabela de locação automaticamente.</span>
                            <button
                              type="button"
                              onClick={() => toggleShowPriceOverride(idx)}
                              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                            >
                              Selecionar Tabela Manualmente
                            </button>
                          </div>
                        )}

                        {/* Manual Price Table Selector (Shown only if toggled or if not auto-linked) */}
                        {(showPriceOverride[idx] || !item.rental_price_id) && (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1 animate-in fade-in duration-150">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Preço Associado Manual (Tabela de Locação)
                            </label>
                            <select 
                              value={item.rental_price_id} 
                              onChange={e => handleItemChange(idx, 'rental_price_id', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-white"
                            >
                              <option value="">Selecione o Código da Tabela</option>
                              {rentalPrices.map(r => (
                                <option key={r.id} value={r.id}>
                                  {r.code} - {r.description} (12M: R$ {Number(r.price_12 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Period, Quantity, Hours & Contract */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-4">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Período / Prazo *</label>
                            <select 
                              required
                              value={item.period_months} 
                              onChange={e => handleItemChange(idx, 'period_months', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-white font-bold text-gray-800"
                            >
                              <optgroup label="Locação Spot / Curto Prazo">
                                <option value={1}>Diário (1 dia)</option>
                                <option value={7}>Semanal (7 dias)</option>
                                <option value={15}>Quinzenal (15 dias)</option>
                                <option value={30}>Mensal Avulso (01 mês)</option>
                              </optgroup>
                              <optgroup label="Contratos de Longo Prazo">
                                <option value={12}>Contrato 12 Meses</option>
                                <option value={24}>Contrato 24 Meses</option>
                                <option value={36}>Contrato 36 Meses</option>
                                <option value={48}>Contrato 48 Meses</option>
                                <option value={60}>Contrato 60 Meses</option>
                              </optgroup>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Qtd</label>
                            <input 
                              type="number"
                              min="1"
                              value={item.quantity || 1}
                              onChange={e => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs text-center font-bold"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Contrato</label>
                            <select 
                              value={item.contract_type} 
                              onChange={e => handleItemChange(idx, 'contract_type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-white"
                            >
                              <option value="0 - Sem cobertura.">0 - Sem cobertura</option>
                              <option value="1 - Ouro.">1 - Ouro (Manutenção/Peças inclusas)</option>
                              <option value="2 - Prata.">2 - Prata (Manutenção/Peças exceto consumíveis)</option>
                              <option value="3 - Bronze.">3 - Bronze (Manutenção exceto escovas/discos/baterias)</option>
                              <option value="4 - MOB.">4 - MOB (Mão de Obra e Deslocamento apenas)</option>
                            </select>
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Franquia de Horas</label>
                            <input 
                              type="text" 
                              value={item.hours_per_month} 
                              onChange={e => handleItemChange(idx, 'hours_per_month', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs" 
                            />
                          </div>
                        </div>

                        {/* Final Calculated Value Banner */}
                        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                          <div>
                            <span className="text-[11px] font-extrabold text-gray-800 uppercase tracking-wide block">
                              {valInfo.labelTitle} Calculado para esta opção:
                            </span>
                            <span className="text-[10px] text-gray-500">
                              Base Tabela {selectedPriceRow ? `[${selectedPriceRow.code}]` : ''} + Markup ({Number(formData.insumos_percent || 0) + Number(formData.manutencao_percent || 0) + Number(formData.lucro_percent || 0) + Number(formData.tributos_percent || 0)}%)
                            </span>
                          </div>

                          <div className="w-48">
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-blue-600">
                                R$
                              </span>
                              <input 
                                required
                                type="number" 
                                step="0.01"
                                value={item.monthly_value} 
                                onChange={e => handleItemChange(idx, 'monthly_value', e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-extrabold text-blue-700 bg-white shadow-xs" 
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Commercial Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Custo do Frete (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.freight_cost} 
                    onChange={e => setFormData({...formData, freight_cost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tempo de Entrega</label>
                  <input 
                    type="text" 
                    value={formData.delivery_time} 
                    onChange={e => setFormData({...formData, delivery_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Validade da Proposta</label>
                  <input 
                    type="text" 
                    value={formData.validity_days} 
                    onChange={e => setFormData({...formData, validity_days: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Região de Utilização</label>
                  <input 
                    type="text" 
                    value={formData.region_used} 
                    onChange={e => setFormData({...formData, region_used: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Dados do Vendedor (Assinatura)</label>
                  <textarea 
                    value={formData.seller_info} 
                    onChange={e => {
                      setFormData({...formData, seller_info: e.target.value});
                      localStorage.setItem('app_seller_info', e.target.value);
                    }}
                    rows={2}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-mono" 
                    placeholder="Nome do Vendedor&#10;Cargo / Contato"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Observações da Proposta</label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs" 
                  placeholder="Instruções ou notas adicionais da proposta."
                />
              </div>

              <div className="pt-6 flex justify-end space-x-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition-colors flex items-center text-sm shadow-sm">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSaving ? 'Salvando...' : 'Salvar Proposta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Minuta de Locação Modal */}
      {isMinutaModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-orange-600" />
                Gerar Minuta Padrão de Locação
              </h2>
              <button onClick={() => setIsMinutaModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* LOCADORA (Clean Tech) Info */}
              <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50 space-y-3">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Dados da Locadora (Clean Tech)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Razão Social / Nome</label>
                    <input 
                      type="text" 
                      value={minutaData.locadoraName} 
                      onChange={e => setMinutaData({...minutaData, locadoraName: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">CNPJ</label>
                    <input 
                      type="text" 
                      value={minutaData.locadoraCnpj} 
                      onChange={e => setMinutaData({...minutaData, locadoraCnpj: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Inscrição Estadual</label>
                    <input 
                      type="text" 
                      value={minutaData.locadoraIe} 
                      onChange={e => setMinutaData({...minutaData, locadoraIe: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Endereço Completo</label>
                    <input 
                      type="text" 
                      value={minutaData.locadoraAddress} 
                      onChange={e => setMinutaData({...minutaData, locadoraAddress: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* LOCATÁRIA (Cliente) Info */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Dados da Locatária (Cliente)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nome do Cliente</label>
                    <input 
                      type="text" 
                      value={minutaData.clientName} 
                      onChange={e => setMinutaData({...minutaData, clientName: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">CNPJ / CPF</label>
                    <input 
                      type="text" 
                      value={minutaData.clientCnpj} 
                      onChange={e => setMinutaData({...minutaData, clientCnpj: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Inscrição Estadual</label>
                    <input 
                      type="text" 
                      value={minutaData.clientIe} 
                      onChange={e => setMinutaData({...minutaData, clientIe: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      placeholder="Isento"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Endereço do Cliente</label>
                    <input 
                      type="text" 
                      value={minutaData.clientAddress} 
                      onChange={e => setMinutaData({...minutaData, clientAddress: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Telefone</label>
                    <input 
                      type="text" 
                      value={minutaData.clientPhone} 
                      onChange={e => setMinutaData({...minutaData, clientPhone: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Representante de Contato</label>
                    <input 
                      type="text" 
                      value={minutaData.clientContact} 
                      onChange={e => setMinutaData({...minutaData, clientContact: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      placeholder="Nome do contato comercial"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">E-mail</label>
                    <input 
                      type="text" 
                      value={minutaData.clientEmail} 
                      onChange={e => setMinutaData({...minutaData, clientEmail: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Objeto e Condições */}
              <div className="bg-orange-50/20 p-4 rounded-xl border border-orange-100/50 space-y-3">
                <h3 className="text-xs font-bold text-orange-900 uppercase tracking-wider">Objeto, Vigência e Local de Uso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Equipamento (Objeto)</label>
                    <input 
                      type="text" 
                      value={minutaData.machineName} 
                      onChange={e => setMinutaData({...minutaData, machineName: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Data de Início da Vigência</label>
                    <input 
                      type="date" 
                      value={minutaData.startDate} 
                      onChange={e => setMinutaData({...minutaData, startDate: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Período (Meses / Dias)</label>
                    <select 
                      value={minutaData.periodMonths} 
                      onChange={e => setMinutaData({...minutaData, periodMonths: Number(e.target.value)})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    >
                      <option value={1}>Diário (1 dia)</option>
                      <option value={7}>Semanal (7 dias)</option>
                      <option value={15}>Quinzenal (15 dias)</option>
                      <option value={30}>Mensal Avulso</option>
                      <option value={12}>12 Meses</option>
                      <option value={24}>24 Meses</option>
                      <option value={36}>36 Meses</option>
                      <option value={48}>48 Meses</option>
                      <option value={60}>60 Meses</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Valor Mensal (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={minutaData.monthlyValue} 
                      onChange={e => setMinutaData({...minutaData, monthlyValue: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-blue-600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Local de Utilização dos Bens Locados</label>
                    <textarea 
                      value={minutaData.localUtilizacao} 
                      onChange={e => setMinutaData({...minutaData, localUtilizacao: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                      placeholder="Endereço onde a máquina operará"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 flex justify-end space-x-3 border-t border-gray-100 bg-gray-50">
              <button type="button" onClick={() => setIsMinutaModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm">
                Cancelar
              </button>
              <button 
                onClick={handlePrintMinuta}
                className="px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 rounded-lg font-medium transition-colors flex items-center text-sm shadow-sm"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Minuta
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Share Validity Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Definir Validade & Compartilhar Link
              </h2>
              <button 
                type="button"
                onClick={() => setIsShareModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleConfirmShare}>
              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Defina o prazo de validade/expiração do link público antes de compartilhá-lo com seu cliente.
                </p>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Prazo de Validade</label>
                  <select 
                    value={shareValidityDays} 
                    onChange={e => setShareValidityDays(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="5 dias">5 dias</option>
                    <option value="10 dias">10 dias</option>
                    <option value="15 dias">15 dias</option>
                    <option value="20 dias">20 dias</option>
                    <option value="30 dias">30 dias</option>
                    <option value="45 dias">45 dias</option>
                    <option value="60 dias">60 dias</option>
                  </select>
                </div>

                <div className="text-[10px] text-gray-400 font-semibold italic bg-blue-50/50 p-3 rounded-lg border border-blue-100/30">
                  * Ao confirmar, a validade da proposta comercial será atualizada no banco de dados e o link público será copiado automaticamente para sua área de transferência.
                </div>
              </div>

              <div className="p-5 flex justify-end gap-2.5 border-t border-gray-100 bg-gray-50">
                <button 
                  type="button" 
                  onClick={() => setIsShareModalOpen(false)} 
                  className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingShare}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {isSavingShare ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {isSavingShare ? 'Salvando...' : 'Confirmar & Copiar Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL QUICK CREATE MACHINE MODEL ---------------- */}
      {isMachineModelModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Cadastrar Novo Modelo no Catálogo
              </h2>
              <button 
                type="button" 
                onClick={() => setIsMachineModelModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickMachineModel} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nome do Modelo / Equipamento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lavadora de Piso Tennant T300 / Brava"
                  value={newMachineModelName}
                  onChange={e => setNewMachineModelName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Código da Tabela de Locação Vinculado (Opcional)
                </label>
                <select
                  value={newMachineModelRentalPriceId}
                  onChange={e => setNewMachineModelRentalPriceId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-white"
                >
                  <option value="">Vincular Automaticamente / Selecionar Código...</option>
                  {rentalPrices.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.code} - {r.description} (12M: R$ {Number(r.price_12 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-[11px] text-blue-800 leading-relaxed">
                ℹ️ Este novo modelo ficará gravado no seu <strong>Catálogo de Máquinas</strong> (`/modelos-maquinas`) e estará disponível em todas as propostas.
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsMachineModelModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingMachineModel}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isSavingMachineModel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Salvar Modelo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
