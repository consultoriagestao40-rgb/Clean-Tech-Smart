import { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Plus, Trash2, Printer, Ban, Package, Wrench, History, Loader2, Calendar } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function NovoContrato() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [contract, setContract] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isSvcModalOpen, setIsSvcModalOpen] = useState(false);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Dados dos catálogos
  const [dbEquipments, setDbEquipments] = useState([]);
  const [dbModalities, setDbModalities] = useState([]);
  const [dbServices, setDbServices] = useState([]);
  const [dbClients, setDbClients] = useState([]);

  // Estados dos modais (Formulários)
  const [eqForm, setEqForm] = useState({ equipment_id: '', modality_id: '', prev_entrega: '', prev_retirada: '', horimetro_saida: 0, horimetro_retorno: 0, price: '' });
  const [svcForm, setSvcForm] = useState({ service_id: '', price: '', description: '' });

  useEffect(() => {
    fetchCatalogs();
    if (id) fetchDetails();
    else {
      setIsLoading(false);
    }
  }, [id]);

  async function fetchCatalogs() {
    try {
      const [eqRes, modRes, svcRes, cliRes] = await Promise.all([
        fetch('/api/get-equipments'),
        fetch('/api/get-modalities'),
        fetch('/api/get-services'),
        fetch('/api/get-clients')
      ]);
      const eqData = await eqRes.json();
      const modData = await modRes.json();
      const svcData = await svcRes.json();
      const cliData = await cliRes.json();
      
      if (eqData.equipments) setDbEquipments(eqData.equipments);
      if (modData.modalities) setDbModalities(modData.modalities);
      if (svcData.services) setDbServices(svcData.services);
      if (cliData.clients) setDbClients(cliData.clients);
    } catch (error) {
      console.error('Erro ao buscar catálogos:', error);
    }
  }

  async function fetchDetails() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/get-contract-details?id=${id}`);
      const data = await res.json();
      if (data.contract) {
        setContract(data.contract);
        setInvoices(data.invoices || []);
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '-';
  const formatDateTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleString('pt-BR') : '-';

  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [generalForm, setGeneralForm] = useState({ start_date: '', client_name: '', client_id: '' });

  const handleEmitContract = async () => {
    setIsGeneratingPDF(true);
    try {
      // 1. Buscar o template padrão
      const res = await fetch('/api/get-templates');
      const data = await res.json();
      let defaultTemplate = data.templates?.find(t => t.is_default);
      
      // Fallback: se não tiver um marcado como padrão, pega o primeiro que achar
      if (!defaultTemplate && data.templates?.length > 0) {
        defaultTemplate = data.templates[0];
      }

      if (!defaultTemplate) {
        alert('Nenhum Template cadastrado. Vá em Templates e crie um novo.');
        setIsGeneratingPDF(false);
        return;
      }

      // Cliente completo
      const client = dbClients.find(c => String(c.id) === String(displayContract.client_id)) || {};

      // 2. Construir o HTML
      // Mesclar cláusulas
      const clauses = typeof defaultTemplate.clauses === 'string' ? JSON.parse(defaultTemplate.clauses) : defaultTemplate.clauses;
      
      const clausesHtml = clauses.map(clause => {
        let content = clause.content || '';
        // Motor de substituição (Mail Merge)
        content = content.replace(/{{CLIENT_NAME}}/g, displayContract.client_name);
        content = content.replace(/{{CONTRACT_CODE}}/g, displayContract.code);
        content = content.replace(/{{START_DATE}}/g, formatDate(displayContract.start_date));
        content = content.replace(/{{TOTAL_VALUE}}/g, formatCurrency(parseFloat(displayContract.total_rental_value) + parseFloat(displayContract.total_services_value)));
        
        return `
          <p style="font-weight: bold; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase;">${clause.title}:</p>
          <p style="margin-top: 0; margin-bottom: 10px;">${content.replace(/\n/g, '<br/>')}</p>
        `;
      }).join('');

      const equipmentsHtml = displayContract.equipments.map(eq => {
         const eqData = dbEquipments.find(e => String(e.id) === String(eq.equipment_id)) || {};
         const modData = dbModalities.find(m => String(m.id) === String(eq.modality_id)) || {};
         return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 5px;">${eqData.name || 'Desconhecido'}</td>
            <td style="padding: 8px 5px; text-align: right;">R$ 0,00</td>
            <td style="padding: 8px 5px;">${eqData.serial_number || '-'}</td>
            <td style="padding: 8px 5px;">${modData.name || '-'}</td>
            <td style="padding: 8px 5px; text-align: right;">1,00</td>
            <td style="padding: 8px 5px; text-align: right;">${formatCurrency(eq.price)}</td>
            <td style="padding: 8px 5px;">${formatDate(eq.prev_retirada)}</td>
          </tr>
         `;
      }).join('');

      const servicesHtml = displayContract.services.length === 0 ? `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td colspan="2" style="padding: 8px 5px; text-align: center; color: #6b7280;">Nenhum serviço adicionado</td>
        </tr>
      ` : displayContract.services.map(svc => {
        return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 5px;">${svc.description || 'Serviço'}</td>
          <td style="padding: 8px 5px; text-align: right;">${formatCurrency(svc.price)}</td>
        </tr>
        `;
      }).join('');

      const totalContractValue = parseFloat(displayContract.total_rental_value || 0) + parseFloat(displayContract.total_services_value || 0);

      let htmlContent = `
        <div style="font-family: Arial, sans-serif; font-size: 12px; color: #000; background: #fff; padding: 10px;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 22px; font-weight: bold; margin: 0;">Clean Tech Pro</h1>
            <p style="margin: 2px 0; font-size: 11px;">CNPJ: 00.000.000/0001-00</p>
            <p style="margin: 2px 0; font-size: 11px;">Curitiba - PR</p>
            <p style="margin: 2px 0; font-size: 11px;">Telefone: 41984042835</p>
          </div>
          
          <hr style="border: 0; border-top: 2px solid #000; margin-bottom: 20px;" />
          
          <!-- Título Contrato -->
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase;">CONTRATO DE BENS MÓVEIS - SEM OPERADOR</h2>
            <p style="margin: 8px 0; font-weight: bold;">Contrato nº ${displayContract.code}</p>
            <p style="margin: 8px 0;">Data: ${formatDate(displayContract.start_date)}</p>
          </div>
          
          <!-- Dados do Cliente -->
          <div style="background-color: #f3f4f6; padding: 15px; margin-bottom: 25px;">
            <h3 style="font-size: 13px; font-weight: bold; margin-top: 0; margin-bottom: 10px; text-transform: uppercase;">DADOS DO CLIENTE</h3>
            <p style="margin: 4px 0;"><strong>Cliente:</strong> ${client.name || displayContract.client_name || '-'}</p>
            <p style="margin: 4px 0;"><strong>Código:</strong> ${client.id ? 'CLI-' + String(client.id).padStart(4, '0') : '-'}</p>
            <p style="margin: 4px 0;"><strong>CNPJ/CPF:</strong> ${client.document || '-'}</p>
            <p style="margin: 4px 0;"><strong>Endereço:</strong> ${client.address || '-'}</p>
            <p style="margin: 4px 0;"><strong>Cidade:</strong> ${client.city || '-'}</p>
            <p style="margin: 4px 0;"><strong>Telefone:</strong> ${client.phone || '-'}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${client.email || '-'}</p>
            <p style="margin: 4px 0;"><strong>Contato:</strong> ${client.contact || '-'}</p>
          </div>
          
          <!-- Equipamentos -->
          <h3 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">EQUIPAMENTOS</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px;">
            <thead>
              <tr style="background-color: #1f2937; color: #fff;">
                <th style="padding: 8px 5px; text-align: left;">Equipamento</th>
                <th style="padding: 8px 5px; text-align: right;">Vlr Venda</th>
                <th style="padding: 8px 5px; text-align: left;">Num. Série</th>
                <th style="padding: 8px 5px; text-align: left;">Tp Aluguel</th>
                <th style="padding: 8px 5px; text-align: right;">Qtde</th>
                <th style="padding: 8px 5px; text-align: right;">Vlr Previsto</th>
                <th style="padding: 8px 5px; text-align: left;">Prev. Devolução</th>
              </tr>
            </thead>
            <tbody>
              ${equipmentsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #f3f4f6; font-weight: bold;">
                <td colspan="5" style="padding: 8px 5px; text-align: right;">Total dos Equipamentos:</td>
                <td style="padding: 8px 5px; text-align: right;">${formatCurrency(displayContract.total_rental_value)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          
          <!-- Serviços -->
          <h3 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">SERVIÇOS</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px;">
            <thead>
              <tr style="background-color: #1f2937; color: #fff;">
                <th style="padding: 8px 5px; text-align: left;">Descrição</th>
                <th style="padding: 8px 5px; text-align: right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${servicesHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #f3f4f6; font-weight: bold;">
                <td style="padding: 8px 5px; text-align: right;">Total dos Serviços:</td>
                <td style="padding: 8px 5px; text-align: right;">${formatCurrency(displayContract.total_services_value)}</td>
              </tr>
            </tfoot>
          </table>
          
          <!-- Total Geral -->
          <div style="background-color: #dcfce7; border: 1px solid #22c55e; padding: 12px; text-align: center; font-weight: bold; font-size: 15px; margin-bottom: 30px;">
            VALOR TOTAL DO CONTRATO: ${formatCurrency(totalContractValue)}
          </div>
          
          <!-- Cláusulas -->
          <div style="text-align: center; margin-bottom: 10px;">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase;">CLÁUSULAS</h2>
          </div>
          <hr style="border: 0; border-top: 1px solid #000; margin-bottom: 20px;" />
          
          <div style="font-size: 11px; text-align: justify; line-height: 1.6;">
            ${clausesHtml}
          </div>

          <div style="margin-top: 80px; display: flex; justify-content: space-between; page-break-inside: avoid;">
             <div style="border-top: 1px solid #333; width: 45%; text-align: center; padding-top: 10px;">Assinatura Contratante</div>
             <div style="border-top: 1px solid #333; width: 45%; text-align: center; padding-top: 10px;">Assinatura Contratada</div>
          </div>
        </div>
      `;

      // 3. Importar dinamicamente e gerar PDF
      const html2pdf = (await import('html2pdf.js')).default;
      
      const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `Contrato_${displayContract.code}.pdf`,
        image:        { type: 'jpeg', quality: 1 }, // Qualidade máxima do JPEG
        html2canvas:  { scale: 4, useCORS: true, logging: false }, // Scale 4 para altíssima resolução de texto
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Criar elemento virtual
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      
      await html2pdf().from(element).set(opt).save();

    } catch (error) {
      console.error(error);
      alert('Erro ao gerar PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  // Mock dados caso seja novo (para não quebrar a tela)
  const displayContract = contract || {
    id: null, code: 'Novo', start_date: new Date(), client_id: '', client_name: 'Selecione um cliente...', total_rental_value: 0, total_services_value: 0, total_venal_value: 0, status: 'Reserva',
    equipments: [], services: []
  };

  const handleSaveContract = async (updatedContract) => {
    try {
      const payload = {
        id: updatedContract.id,
        client_id: updatedContract.client_id,
        client_name: updatedContract.client_name, // Passar o nome atualizado para salvar
        start_date: updatedContract.start_date,
        status: updatedContract.status,
        equipments: updatedContract.equipments,
        services: updatedContract.services,
        total_rental_value: updatedContract.total_rental_value,
        total_services_value: updatedContract.total_services_value,
        total_venal_value: updatedContract.total_venal_value
      };
      
      const res = await fetch('/api/save-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        setContract({...updatedContract, ...data.contract});
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const saveGeneralInfo = () => {
    const updatedContract = {
      ...displayContract,
      start_date: generalForm.start_date || displayContract.start_date,
      client_name: generalForm.client_name || displayContract.client_name,
      client_id: generalForm.client_id || displayContract.client_id
    };
    setContract(updatedContract);
    handleSaveContract(updatedContract);
    setIsGeneralModalOpen(false);
  };

  const addEquipment = () => {
    if (!eqForm.equipment_id) {
      alert("Selecione um equipamento.");
      return;
    }
    const price = parseFloat(eqForm.price || 0);
    const newEq = { ...eqForm, price };
    const newEquipments = [...displayContract.equipments, newEq];
    
    const newTotalRental = newEquipments.reduce((acc, eq) => acc + (parseFloat(eq.price) || 0), 0);
    
    const updatedContract = {
      ...displayContract,
      equipments: newEquipments,
      total_rental_value: newTotalRental
    };
    
    setContract(updatedContract);
    handleSaveContract(updatedContract);
    setIsEqModalOpen(false);
    setEqForm({ equipment_id: '', modality_id: '', prev_entrega: '', prev_retirada: '', horimetro_saida: 0, horimetro_retorno: 0, price: '' });
  };

  const addService = () => {
    if (!svcForm.service_id) {
      alert("Selecione um serviço.");
      return;
    }
    const price = parseFloat(svcForm.price || 0);
    const newSvc = { ...svcForm, price };
    const newServices = [...displayContract.services, newSvc];
    
    const newTotalServices = newServices.reduce((acc, svc) => acc + (parseFloat(svc.price) || 0), 0);
    
    const updatedContract = {
      ...displayContract,
      services: newServices,
      total_services_value: newTotalServices
    };
    
    setContract(updatedContract);
    handleSaveContract(updatedContract);
    setIsSvcModalOpen(false);
    setSvcForm({ service_id: '', price: '', description: '' });
  };

  return (
    <div className="font-sans text-gray-800 max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* HEADER DE AÇÕES */}
      <header className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/contratos')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{displayContract.code !== 'Novo' ? displayContract.code : 'Novo Contrato'}</h1>
            <p className="text-sm text-gray-500">Detalhes do contrato</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full hidden md:inline-block">
            {displayContract.status}
          </span>
          <button onClick={() => {
            setGeneralForm({ 
              start_date: displayContract.start_date ? new Date(displayContract.start_date).toISOString().split('T')[0] : '', 
              client_name: displayContract.client_name,
              client_id: displayContract.client_id
            });
            setIsGeneralModalOpen(true);
          }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center transition-colors">
            <Edit className="w-4 h-4 mr-2" /> Editar
          </button>
          <button onClick={handleEmitContract} disabled={isGeneratingPDF} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center transition-colors disabled:opacity-50">
            {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
            {isGeneratingPDF ? 'Gerando...' : 'Emitir Contrato'}
          </button>
          <button onClick={() => { if(confirm('Tem certeza que deseja cancelar este contrato?')) alert('Contrato cancelado com sucesso.') }} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 flex items-center transition-colors">
            <Ban className="w-4 h-4 mr-2" /> Cancelar Contrato
          </button>
        </div>
      </header>

      {/* INFORMAÇÕES GERAIS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Informações Gerais</h2>
        <p className="text-sm text-gray-500 mb-6">Dados principais do contrato</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center"><Calendar className="w-4 h-4 mr-1"/> Data do Contrato</p>
            <p className="text-sm text-gray-900 font-medium">{formatDate(displayContract.start_date)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Cliente</p>
            <p className="text-sm text-gray-900 font-medium">{displayContract.client_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Valor Total Locação</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(displayContract.total_rental_value)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Valor Total Serviços</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(displayContract.total_services_value)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Valor Total Venal</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(displayContract.total_venal_value)}</p>
          </div>
          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <p className="text-xs font-bold text-blue-800 mb-1">TOTAL MENSAL</p>
            <p className="text-2xl font-black text-blue-700">{formatCurrency(parseFloat(displayContract.total_rental_value || 0) + parseFloat(displayContract.total_services_value || 0))}</p>
          </div>
        </div>
      </div>

      {/* EQUIPAMENTOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center"><Package className="w-5 h-5 mr-2 text-indigo-600"/> Equipamentos</h2>
            <p className="text-sm text-gray-500 mt-1">Lista de equipamentos deste contrato</p>
          </div>
          <button onClick={() => setIsEqModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center transition-colors">
            <Plus className="w-4 h-4 mr-2" /> Adicionar Equipamento
          </button>
        </div>
        <div className="p-6 overflow-x-auto">
          {displayContract.equipments.length === 0 ? (
            <p className="text-center text-gray-400 text-sm">Nenhum equipamento adicionado ainda.</p>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Equipamento</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Modalidade</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Prev. Entrega</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Valor Locação</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {displayContract.equipments.map((eq, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 font-medium text-gray-900">Eq ID: {eq.equipment_id}</td>
                    <td className="py-4 text-blue-600 font-medium">Mod: {eq.modality_id}</td>
                    <td className="py-4">{formatDate(displayContract.start_date)}</td>
                    <td className="py-4 font-bold">{formatCurrency(eq.price)}</td>
                    <td className="py-4 text-right">
                      <button onClick={() => setIsEqModalOpen(true)} className="text-gray-400 hover:text-blue-500 mr-3"><Edit className="w-4 h-4 inline" /></button>
                      <button className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SERVIÇOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center"><Wrench className="w-5 h-5 mr-2 text-green-600"/> Serviços</h2>
            <p className="text-sm text-gray-500 mt-1">Serviços adicionais do contrato</p>
          </div>
          <button onClick={() => setIsSvcModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center transition-colors">
            <Plus className="w-4 h-4 mr-2" /> Adicionar Serviço
          </button>
        </div>
        <div className="p-6">
           {displayContract.services.length === 0 ? (
            <p className="text-center text-gray-400 text-sm">Nenhum serviço adicionado ainda.</p>
          ) : (
            <ul className="space-y-4">
              {displayContract.services.map((svc, i) => (
                <li key={i} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{svc.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-bold text-gray-900">{formatCurrency(svc.price)}</span>
                    <button className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* HISTÓRICOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100">
           <h2 className="text-lg font-bold text-gray-900">Histórico de Cobranças</h2>
           <p className="text-sm text-gray-500">Períodos faturados e valores recebidos</p>
        </div>
        <div className="p-6 text-center text-sm text-gray-500">
          {invoices.length === 0 ? "Nenhuma fatura emitida ainda." : (
            <ul className="text-left space-y-2">
              {invoices.map(inv => (
                <li key={inv.id} className="flex justify-between border-b pb-2">
                  <span>{formatDate(inv.due_date)} - {inv.description}</span>
                  <span className="font-bold">{formatCurrency(inv.amount)} - {inv.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <h2 className="text-lg font-bold text-gray-900 flex items-center"><History className="w-5 h-5 mr-2 text-gray-600" /> Histórico de Atividades</h2>
        </div>
        <div className="p-6">
          {history.length === 0 ? (
            <p className="text-center text-sm text-gray-500">Sem atividades recentes.</p>
          ) : (
             <table className="w-full text-left text-sm text-gray-600">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Data/Hora</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Ação</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Status</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Usuário</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} className="border-b border-gray-50">
                    <td className="py-4">{formatDateTime(h.created_at)}</td>
                    <td className="py-4 font-medium text-gray-900">{h.action}</td>
                    <td className="py-4"><span className="px-2 py-1 bg-gray-100 text-xs rounded-full">{h.status}</span></td>
                    <td className="py-4">{h.user_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL EQUIPAMENTO */}
      {isEqModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-1">Adicionar Equipamento</h2>
            <p className="text-sm text-gray-500 mb-6">Selecione o equipamento e defina os detalhes</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Equipamento *</label>
                <select 
                  value={eqForm.equipment_id} 
                  onChange={e => setEqForm({...eqForm, equipment_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selecione um equipamento...</option>
                  {dbEquipments.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} (Série: {eq.serial_number}) - Disp: {eq.status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Modalidade *</label>
                <select 
                  value={eqForm.modality_id} 
                  onChange={e => setEqForm({...eqForm, modality_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selecione a modalidade...</option>
                  {dbModalities.map(mod => (
                    <option key={mod.id} value={mod.id}>{mod.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Previsão Entrega</label>
                  <input type="date" value={eqForm.prev_entrega} onChange={e => setEqForm({...eqForm, prev_entrega: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Previsão Retirada</label>
                  <input type="date" value={eqForm.prev_retirada} onChange={e => setEqForm({...eqForm, prev_retirada: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Horímetro Saída</label>
                  <input type="number" value={eqForm.horimetro_saida} onChange={e => setEqForm({...eqForm, horimetro_saida: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Horímetro Retorno</label>
                  <input type="number" value={eqForm.horimetro_retorno} onChange={e => setEqForm({...eqForm, horimetro_retorno: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Valor Locação (R$)</label>
                <input type="number" step="0.01" value={eqForm.price} onChange={e => setEqForm({...eqForm, price: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: 1500.00" />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsEqModalOpen(false)} className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={addEquipment} className="px-4 py-2 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SERVIÇO */}
      {isSvcModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-1">Adicionar Serviço</h2>
            <p className="text-sm text-gray-500 mb-6">Selecione um serviço do catálogo e configure os detalhes</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Serviço *</label>
                <select 
                  value={svcForm.service_id} 
                  onChange={e => {
                    const sel = dbServices.find(s => String(s.id) === String(e.target.value));
                    setSvcForm({...svcForm, service_id: e.target.value, price: sel ? sel.default_price : ''});
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selecione um serviço...</option>
                  {dbServices.map(svc => (
                    <option key={svc.id} value={svc.id}>{svc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Valor (R$) *</label>
                <input 
                  type="number" step="0.01" 
                  value={svcForm.price} 
                  onChange={e => setSvcForm({...svcForm, price: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Descrição Adicional</label>
                <input 
                  type="text" 
                  value={svcForm.description} 
                  onChange={e => setSvcForm({...svcForm, description: e.target.value})} 
                  placeholder="Detalhes adicionais..." 
                  className="w-full px-3 py-2 border rounded-lg" 
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsSvcModalOpen(false)} className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={addService} className="px-4 py-2 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIÇÃO GERAL */}
      {isGeneralModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-1">Editar Informações Gerais</h2>
            <p className="text-sm text-gray-500 mb-6">Atualize os dados básicos do contrato</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Data do Contrato</label>
                <input 
                  type="date" 
                  value={generalForm.start_date} 
                  onChange={e => setGeneralForm({...generalForm, start_date: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Cliente</label>
                <div className="flex space-x-2">
                  <select 
                    value={generalForm.client_id || ''} 
                    onChange={e => {
                      const sel = dbClients.find(c => String(c.id) === String(e.target.value));
                      setGeneralForm({...generalForm, client_id: e.target.value, client_name: sel ? sel.name : ''});
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Selecione um cliente...</option>
                    {dbClients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button onClick={() => navigate('/clientes')} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium whitespace-nowrap transition-colors">
                    + Novo
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsGeneralModalOpen(false)} className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={saveGeneralInfo} className="px-4 py-2 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700">Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
