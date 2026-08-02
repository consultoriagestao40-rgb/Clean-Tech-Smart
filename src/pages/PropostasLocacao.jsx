import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Edit, X, Trash2, FileText, ArrowLeft, Printer, ShieldAlert, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PropostasLocacao() {
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data lists
  const [clients, setClients] = useState([]);
  const [machineModels, setMachineModels] = useState([]);
  const [rentalPrices, setRentalPrices] = useState([]);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    client_id: '',
    machine_model_id: '',
    rental_price_id: '',
    period_months: 36,
    monthly_value: '',
    contract_type: '0 - Sem cobertura.',
    hours_per_month: '100 horas/mês',
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
    localUtilizacao: '',
    startDate: '',
    periodMonths: 12,
    monthlyValue: ''
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
      console.error('Erro ao buscar propostas:', error);
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

      const pricingRes = await fetch('/api/get-rental-prices');
      const pricingData = await pricingRes.json();
      if (pricingData.rentalPrices) setRentalPrices(pricingData.rentalPrices);
    } catch (error) {
      console.error('Erro ao carregar dependências:', error);
    }
  }

  // Handle auto-pricing when pricing row, period, or markup settings change
  useEffect(() => {
    if (!formData.rental_price_id) return;
    const selectedPriceRow = rentalPrices.find(r => String(r.id) === String(formData.rental_price_id));
    if (!selectedPriceRow) return;

    let baseCost = 0;
    const period = Number(formData.period_months);
    const p12 = Number(selectedPriceRow.price_12 || 0);

    if (period === 1) baseCost = p12 > 0 ? (p12 * 2) / 22 : 0;
    else if (period === 7) baseCost = p12 > 0 ? ((p12 * 2) / 22) * 7 : 0;
    else if (period === 15) baseCost = p12 > 0 ? ((p12 * 1.75) / 22) * 15 : 0;
    else if (period === 30) baseCost = p12 * 1.5;
    else if (period === 12) baseCost = p12;
    else if (period === 24) baseCost = Number(selectedPriceRow.price_24 || 0);
    else if (period === 36) baseCost = Number(selectedPriceRow.price_36 || 0);
    else if (period === 48) baseCost = Number(selectedPriceRow.price_48 || 0);
    else if (period === 60) baseCost = Number(selectedPriceRow.price_60 || 0);

    const totalMarkup = Number(formData.insumos_percent || 0) +
                        Number(formData.manutencao_percent || 0) +
                        Number(formData.lucro_percent || 0) +
                        Number(formData.tributos_percent || 0);

    const finalValue = baseCost > 0 ? baseCost * (1 + totalMarkup / 100) : 0;

    setFormData(prev => ({
      ...prev,
      monthly_value: finalValue > 0 ? finalValue.toFixed(2) : ''
    }));
  }, [
    formData.rental_price_id, 
    formData.period_months, 
    formData.insumos_percent, 
    formData.manutencao_percent, 
    formData.lucro_percent, 
    formData.tributos_percent, 
    rentalPrices
  ]);

  const getMachineModelKeywords = (name) => {
    if (!name) return [];
    return name
      .split(/\s+/)
      .map(w => w.replace(/[(),]/g, '').trim().toLowerCase())
      .filter(w => w.length >= 3 && w !== 'tennant' && w !== 'lavadora' && w !== 'varredeira' && w !== 'piso' && w !== 'operação' && w !== 'opera');
  };

  const getFilteredPrices = () => {
    if (!formData.machine_model_id) return rentalPrices;
    
    const selectedMachine = machineModels.find(m => String(m.id) === String(formData.machine_model_id));
    if (!selectedMachine) return rentalPrices;

    const keywords = getMachineModelKeywords(selectedMachine.name);
    if (keywords.length === 0) return rentalPrices;

    return rentalPrices.filter(r => {
      const rCode = String(r.code || '').toLowerCase();
      const rDesc = String(r.description || '').toLowerCase();
      return keywords.some(kw => rCode.includes(kw) || rDesc.includes(kw));
    });
  };

  // Auto-select first matching rental price when machine model changes
  useEffect(() => {
    if (!formData.machine_model_id || rentalPrices.length === 0 || machineModels.length === 0) return;
    
    const selectedMachine = machineModels.find(m => String(m.id) === String(formData.machine_model_id));
    if (!selectedMachine) return;

    const keywords = getMachineModelKeywords(selectedMachine.name);
    if (keywords.length === 0) return;

    const matchingPrices = rentalPrices.filter(r => {
      const rCode = String(r.code || '').toLowerCase();
      const rDesc = String(r.description || '').toLowerCase();
      return keywords.some(kw => rCode.includes(kw) || rDesc.includes(kw));
    });

    if (matchingPrices.length > 0) {
      // Check if current rental_price_id is already valid
      const isValid = matchingPrices.some(r => String(r.id) === String(formData.rental_price_id));
      if (!isValid) {
        setFormData(prev => ({
          ...prev,
          rental_price_id: String(matchingPrices[0].id)
        }));
      }
    }
  }, [formData.machine_model_id, rentalPrices, machineModels]);

  const handleEdit = async (item) => {
    setFormData({
      id: item.id,
      client_id: item.client_id || '',
      machine_model_id: item.machine_model_id || '',
      rental_price_id: item.rental_price_id || '',
      period_months: item.period_months || 36,
      monthly_value: item.monthly_value || '',
      contract_type: item.contract_type || '0 - Sem cobertura.',
      hours_per_month: item.hours_per_month || '100 horas/mês',
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
      machine_model_id: '',
      rental_price_id: '',
      period_months: 36,
      monthly_value: '',
      contract_type: '0 - Sem cobertura.',
      hours_per_month: '100 horas/mês',
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

  const formatPeriod = (months) => {
    const m = Number(months);
    if (m === 1) return 'Diário (1 dia)';
    if (m === 7) return 'Semanal (7 dias)';
    if (m === 15) return 'Quinzenal (15 dias)';
    if (m === 30) return 'Mensal Avulso';
    return `${m} Meses`;
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
        clientContact: '',
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

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Minuta de Locação</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
  body {
    font-family: 'Inter', sans-serif;
    color: #1e293b;
    font-size: 13px;
    line-height: 1.6;
    margin: 40px;
    background: #fff;
  }
  .bold { font-weight: bold; color: #0f172a; }
  .uppercase { text-transform: uppercase; }
  .section-title {
    font-weight: 700;
    color: #0f172a;
    margin-top: 22px;
    margin-bottom: 6px;
    font-size: 13px;
  }
  .grid-table {
    width: 100%;
    margin-bottom: 20px;
    border-collapse: collapse;
  }
  .grid-table td {
    padding: 4px 0;
    vertical-align: top;
  }
  .label-col {
    width: 160px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.5px;
  }
  .signature-section {
    margin-top: 60px;
    display: flex;
    justify-content: space-between;
    page-break-inside: avoid;
  }
  .signature-box {
    width: 45%;
    text-align: center;
    border-top: 1.5px solid #cbd5e1;
    padding-top: 12px;
    font-size: 11px;
    color: #64748b;
  }
  @media print {
    body { margin: 20px; font-size: 12px; }
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

  <div style="border-top: 1px dashed #e2e8f0; margin: 15px 0;"></div>

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

  <div style="border-top: 2px solid #0f172a; margin: 20px 0;"></div>

  <div class="section-title">1. Objeto: <span style="font-weight: normal; color: #334155;">Locação de 01 ${minutaData.machineName}.</span></div>

  <div class="section-title">2. Local de utilização dos bens locados:</div>
  <div style="margin-left: 20px; color: #334155;">
    <p class="bold" style="margin-bottom: 4px;">Máquina 01: ${minutaData.machineName.toUpperCase()}</p>
    <p>${minutaData.localUtilizacao}</p>
  </div>

  <div class="section-title">3. Vigência: <span style="font-weight: normal; color: #334155;">${periodText}, contadas a partir da data de entrega dos bens, conforme assinatura no documento fiscal de remessa de locação. Tendo como combinado a entrega do item no dia ${startDateFormatted} à ${endDateFormatted}.</span></div>

  <div class="section-title">4. Preço mensal: <span style="font-weight: normal; color: #334155;"><u>R$ ${monthlyValueFormatted}</u> e/ou conforme anexo I, a ser pago 05 (cinco) dias após a emissão da fatura de locação.</span></div>

  <div class="section-title">5. Rescisão: <span style="font-weight: normal; color: #334155;">Multa por rompimento imotivado: 10% (dez por cento) da soma dos aluguéis vincendos.</span></div>

  <div class="section-title">5.1: <span style="font-weight: normal; color: #334155;">A <span class="bold">LOCATÁRIA</span> não será responsável por multa rescisória caso o contrato seja rescindido em razão de descumprimento contratual pela LOCADORA, especialmente quanto à manutenção e prazos de atendimento.</span></div>

  <div class="signature-section">
    <div class="signature-box">
      <span class="bold" style="font-size: 11px;">${minutaData.locadoraName.toUpperCase()}</span><br/>
      Representante Legal
    </div>
    <div class="signature-box">
      <span class="bold" style="font-size: 11px;">${minutaData.clientName.toUpperCase()}</span><br/>
      Representante Legal
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
      
      const emissao = new Date(p.created_at).toLocaleDateString('pt-BR');
      const geradoEm = new Date().toLocaleString('pt-BR');

      // Process photos
      const photosList = (p.machine_photos || '').split('\n').map(u => u.trim()).filter(Boolean);
      const mainPhoto = photosList.length > 0 ? photosList[0] : 'https://placehold.co/400x300?text=Alfa+Tennant';

      // Technical specs rendering helper
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
              <div style="display: flex; border-bottom: 1px solid #f1f5f9; padding: 5px 0; font-size: 11px;">
                <span style="font-weight: 600; color: #475569; width: 50%;">${cleanKey}</span>
                <span style="color: #0f172a; width: 50%; font-weight: 500;">${val}</span>
              </div>
            `;
          } else if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
            const cleanLine = trimmed.replace(/^[-\s*•]+/, '').trim();
            htmlContent += `
              <div style="display: flex; align-items: start; padding: 4px 0; font-size: 11px; color: #334155;">
                <span style="color: ${primaryColor}; margin-right: 6px; font-weight: bold;">•</span>
                <span>${cleanLine}</span>
              </div>
            `;
          } else if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
            htmlContent += `
              <div style="font-weight: 700; color: ${primaryColor}; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid ${primaryColor}; padding-bottom: 4px; margin-top: 15px; margin-bottom: 8px;">
                ${trimmed}
              </div>
            `;
          } else {
            htmlContent += `
              <p style="font-size: 11px; color: #475569; padding: 3px 0; line-height: 1.4;">${trimmed}</p>
            `;
          }
        }
        return htmlContent;
      };

      const introText = 'Equipamento de alta qualidade e rendimento, ideal para processos contínuos de higienização de pisos.';
      const specsHTML = parseSpecsToHTML(p.machine_specs);

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Proposta de Locação #${String(p.id).padStart(4,'0')}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
body{font-family:'Inter',sans-serif;background:#f1f5f9;color:#1e293b;font-size:12px;line-height:1.5}
.print-bar{position:fixed;top:0;left:0;right:0;background:${primaryColor};color:#fff;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;z-index:999}
.btn-print{background:#fff;color:${primaryColor};border:none;padding:8px 20px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
.btn-print:hover{background:${colorLight}}
body{padding-top:60px}
.page{background:#fff;max-width:870px;margin:20px auto;padding:52px 60px;box-shadow:0 4px 24px rgba(0,0,0,.08);border-radius:12px;position:relative}
.header{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #e2e8f0;margin-bottom:20px}
.tagline{font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:2px;text-transform:uppercase}
.logo-img{max-height:60px;object-fit:contain}
.green-title{font-family:'Outfit',sans-serif;color:${primaryColor};font-size:24px;font-weight:800;letter-spacing:-0.5px;margin-bottom:25px;text-transform:uppercase}
.main-img-box{width:100%;height:320px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:25px}
.main-img{max-height:100%;max-width:100%;object-fit:contain}
.eq-title{font-family:'Outfit',sans-serif;font-size:18px;font-weight:700;color:#0f172a;margin-bottom:12px;border-bottom:1px solid #f1f5f9;padding-bottom:8px}
.eq-title span{color:#94a3b8;font-weight:400}
.description{font-size:12px;color:#475569;line-height:1.6;margin-bottom:25px}
.spec-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:30px;align-items:start}
.box-title{font-family:'Outfit',sans-serif;font-size:14px;font-weight:800;color:${primaryColor};text-transform:uppercase;margin-bottom:15px;letter-spacing:0.5px;border-bottom:2px solid ${primaryColor};padding-bottom:6px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
.row-item{display:flex;justify-content:space-between;border-bottom:1px solid #f1f5f9;padding:6px 0;font-size:12px}
.row-item b{color:#475569}
.table-rental{width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
.table-rental td{padding:10px 14px;border:1px solid #e2e8f0}
.table-rental td.label-col{font-weight:700;color:#475569;background:#f8fafc;width:250px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
.table-rental td.value-col{font-weight:600;color:#0f172a;font-size:12px}
.legal-text{font-size:10px;color:#64748b;line-height:1.5;margin-bottom:25px;text-align:justify}
.table-comparison{width:100%;border-collapse:collapse;margin-bottom:25px;border:1px solid #e2e8f0;font-size:10px}
.table-comparison th{background:${primaryColor};color:#fff;padding:6px 10px;font-weight:600;text-align:left}
.table-comparison td{padding:6px 10px;border:1px solid #e2e8f0;color:#475569}
.footer-cols{display:grid;grid-template-columns:1.5fr 1fr;gap:40px;align-items:end;margin-top:35px;border-top:1px solid #e2e8f0;padding-top:15px}
.seller-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;font-size:11px}
.seller-box b{display:block;margin-bottom:4px;color:${primaryColor};text-transform:uppercase;font-size:9px;letter-spacing:0.5px}
.brand-footer{text-align:right}
.brand-footer img{max-height:40px;margin-bottom:6px;object-fit:contain}
.brand-footer-text{font-size:9px;color:#94a3b8;line-height:1.3}
@media print{
  .print-bar,.no-print{display:none!important}
  body{background:#fff;padding-top:0}
  .page{box-shadow:none;margin:0;padding:20px 30px;border-radius:0;max-width:100%}
  @page{margin:10mm 12mm}
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
  <div class="header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 25px;">
    ${companyLogo ? `<div style="width: 180px; display: block;"></div>` : ''}
    <div style="flex: 1; text-align: center;">
      <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">${companyName}</h1>
      <div style="font-size: 11px; font-weight: bold; color: #1e293b; margin-top: 4px;">CNPJ: ${companyCnpj}</div>
      <div style="font-size: 10px; color: #475569; margin-top: 2px;">${companyAddress}</div>
      <div style="font-size: 10px; color: #475569; margin-top: 2px;">Telefone: ${companyPhone}</div>
      ${companyEmail ? `<div style="font-size: 10px; color: #475569; margin-top: 2px;">Email: ${companyEmail}</div>` : ''}
    </div>
    ${companyLogo ? `
      <div style="width: 180px; display: flex; justify-content: flex-end;">
        <img src="${companyLogo}" alt="Logo" style="max-height: 100px; max-width: 180px; object-fit: contain;" />
      </div>
    ` : ''}
  </div>

  <div style="text-align: center; margin-bottom: 25px;">
    <h2 style="font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0 0 4px 0; letter-spacing: 0.5px;">Proposta Comercial de Locação de Equipamentos</h2>
    <div style="font-size: 11px; font-weight: bold; color: #475569;">Proposta nº #${String(p.id).padStart(4,'0')}</div>
    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Data: ${emissao}</div>
  </div>

  <div class="box" style="margin-bottom: 25px; border-left: 4px solid ${primaryColor}; border-radius: 4px; padding: 15px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-left-width: 4px; text-align: left;">
    <div class="box-title" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${primaryColor}; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; text-align: left; letter-spacing: 0.5px;">Dados do Cliente</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 30px;">
      <div class="row"><b>Cliente:</b> ${p.client_name || 'Não informado'}</div>
      <div class="row"><b>CNPJ/CPF:</b> ${p.client_document || '&mdash;'}</div>
      <div class="row"><b>Endereço:</b> ${p.client_address || '&mdash;'}</div>
      <div class="row"><b>Contato:</b> ${p.client_email ? p.client_email.split('@')[0] : '&mdash;'}</div>
      <div class="row"><b>Telefone:</b> ${p.client_phone || p.client_email || '&mdash;'}</div>
      <div class="row"><b>Serviço:</b> Locação de Equipamento</div>
    </div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 30px; margin-top: 20px; align-items: start;">
    <!-- Coluna Esquerda: Imagem e Diferenciais -->
    <div style="display: flex; flex-direction: column; gap: 15px;">
      <div style="height: 220px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 10px;">
        <img src="${mainPhoto}" alt="${p.machine_name}" style="max-height: 100%; max-width: 100%; object-fit: contain;" />
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; font-size: 11px; color: #475569; line-height: 1.5;">
        <h4 style="font-weight: 700; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; font-size: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">Diferenciais</h4>
        <p style="margin-bottom: 4px;">• Alta produtividade e eficiência em grandes áreas.</p>
        <p style="margin-bottom: 4px;">• Facilidade de operação e controles simples.</p>
        <p style="margin-bottom: 4px;">• Robustez construtiva Tennant reconhecida.</p>
        <p>• Suporte técnico e peças originais Alfa Tennant.</p>
      </div>
    </div>

    <!-- Coluna Direita: Nome e Ficha Técnica -->
    <div>
      <h3 style="font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 8px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 6px; text-transform: uppercase;">
        ${p.machine_name}
      </h3>
      <p style="font-size: 11px; color: #64748b; line-height: 1.4; margin-bottom: 12px; font-style: italic;">
        ${introText || 'Equipamento selecionado de alta performance para conservação de pisos.'}
      </p>
      <div>
        <div style="font-size: 10px; font-weight: 700; color: ${primaryColor}; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; letter-spacing: 0.5px;">Especificações Técnicas</div>
        ${specsHTML || '<p style="color: #94a3b8; font-style: italic;">Consulte a ficha técnica anexa.</p>'}
      </div>
    </div>
  </div>
</div>

<!-- PAGE 2: Financial Terms & Conditions -->
<div class="page" style="page-break-before: always; margin-top: 30px;">
  <div class="header">
    <span class="tagline">Valores e Condições de Locação</span>
    <img src="https://www.tennantco.com/content/dam/resources/images/alfa-tennant-logo-150x70.png" alt="Alfa Tennant" class="logo-img" />
  </div>

  <h3 class="box-title">Valores e Condições de Locação</h3>

  <table class="table-rental">
    <tr>
      <td class="label-col">Valor Mensal</td>
      <td class="value-col" style="font-size: 14px; color: ${primaryColor}; font-weight: 800;">R$ ${Number(p.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / mês</td>
    </tr>
    <tr>
      <td class="label-col">Tipo de Contrato*</td>
      <td class="value-col" style="font-weight: 700;">${p.contract_type}</td>
    </tr>
    <tr>
      <td class="label-col">Período de Locação</td>
      <td class="value-col">${formatPeriod(p.period_months)}</td>
    </tr>
    <tr>
      <td class="label-col">Horas/Mês</td>
      <td class="value-col">${p.hours_per_month}</td>
    </tr>
    <tr>
      <td class="label-col">Região Utilizada</td>
      <td class="value-col">${p.region_used}</td>
    </tr>
    <tr>
      <td class="label-col">Tempo de Entrega</td>
      <td class="value-col">${p.delivery_time}</td>
    </tr>
    <tr>
      <td class="label-col">Custo do Frete</td>
      <td class="value-col">${Number(p.freight_cost) > 0 ? `R$ ${Number(p.freight_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Incluso'}</td>
    </tr>
    <tr>
      <td class="label-col">Validade da proposta</td>
      <td class="value-col">${p.validity_days}</td>
    </tr>
    ${p.notes ? `
    <tr>
      <td class="label-col">OBSERVAÇÃO</td>
      <td class="value-col" style="font-weight: 400; color: #475569;">${p.notes}</td>
    </tr>` : ''}
  </table>

  <p class="legal-text">
    Todos os pedidos estão sujeitos aos nossos termos e condições gerais que se encontram registrados perante o <b>3º Oficial de Registro de Títulos e Documentos e Civil de Pessoa Jurídica da Capital &ndash; São Paulo</b>, cuja cópia digitalizada está disponível no site: <i>www.alfatennant.com.br/terms</i> e também por e-mail ou correio quando solicitada. Os valores acima definidos englobam única e exclusivamente os impostos, taxas e demais encargos fiscais e tributários, incidentes nas alíquotas vigentes no Estado de origem (São Paulo) de responsabilidade da <b>TENNANT COMPANY</b>.
  </p>

  <div style="font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 6px;">* Tabela Descritiva de Tipos de Contrato</div>
  <table class="table-comparison">
    <thead>
      <tr>
        <th style="width: 140px;">Tipo de Contrato</th>
        <th>Descrição de Cobertura</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight: bold;">0 - Sem Cobertura</td>
        <td>Incluso: Somente locação do Equipamento.</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">1 - Ouro</td>
        <td>Incluso: Manutenção, Mão de Obra, Peças, Água Destilada e Deslocamento do técnico autorizado TENNANT COMPANY. Não incluso: Combustíveis e Químicos.</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">2 - Prata</td>
        <td>Incluso: Igual ao Ouro. Não incluso: Combustíveis, Químicos, Escovas e Discos.</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">3 - Bronze</td>
        <td>Incluso: Igual ao Ouro. Não incluso: Combustíveis, Água Destilada, Químicos, Escovas, Discos e Baterias.</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">4 - MOB</td>
        <td>Incluso: Somente Manutenção, Mão de Obra, e Deslocamento do técnico autorizado TENNANT COMPANY.</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-cols">
    <div class="seller-box">
      <b>Dados do Vendedor</b>
      <div style="white-space: pre-line; color: #334155; line-height: 1.4;">${p.seller_info || 'Alfa Tennant\nAtendimento Comercial'}</div>
    </div>
    
    <div class="brand-footer">
      <img src="https://www.tennantco.com/content/dam/resources/images/alfa-tennant-logo-150x70.png" alt="Alfa Tennant" style="max-height: 40px; margin-bottom: 6px; object-fit: contain;" />
      <div class="brand-footer-text">
        Rua Barão de Campinas, 715<br>
        São Paulo, SP - 01201-902<br>
        Vendas: (11) 3320-8550
      </div>
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

      {/* Search filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, máquina..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Proposals List */}
      {isLoading ? (
        <div className="flex justify-center py-12 bg-white rounded-xl border border-gray-100">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          Nenhuma proposta comercial gerada ainda.
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
                  <th className="px-6 py-4 font-bold text-gray-700 text-right">Valor Mensal</th>
                  <th className="px-6 py-4 font-bold text-gray-700">Contrato</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{p.client_name}</td>
                    <td className="px-6 py-4 text-gray-600">{p.machine_name || 'Desconhecida'}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{formatPeriod(p.period_months)}</td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">R$ {Number(p.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{p.contract_type}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleGeneratePDF(p.id)}
                          className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" />
                          Gerar PDF
                        </button>
                        <button 
                          onClick={() => handleOpenMinutaModal(p.id)}
                          className="flex items-center px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          Gerar Minuta
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
                ))}
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
            
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                  <select 
                    required
                    value={formData.client_id} 
                    onChange={e => setFormData({...formData, client_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                  >
                    <option value="">Selecione o Cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Machine Catalog Model selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipamento (Catálogo) *</label>
                  <select 
                    required
                    value={formData.machine_model_id} 
                    onChange={e => setFormData({...formData, machine_model_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                  >
                    <option value="">Selecione o Equipamento</option>
                    {machineModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Rental Row selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Associado (Tabela de Locação) *</label>
                  <select 
                    required
                    value={formData.rental_price_id} 
                    onChange={e => setFormData({...formData, rental_price_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                  >
                    <option value="">Selecione o Código da Tabela</option>
                    {getFilteredPrices().map(r => {
                      const totalMarkup = Number(formData.insumos_percent || 0) +
                                          Number(formData.manutencao_percent || 0) +
                                          Number(formData.lucro_percent || 0) +
                                          Number(formData.tributos_percent || 0);
                      const calc = (val) => {
                        if (!val) return '—';
                        const finalVal = Number(val) * (1 + totalMarkup / 100);
                        return 'R$ ' + finalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      };
                      const p12Val = Number(r.price_12 || 0);
                      const dailyVal = p12Val > 0 ? (p12Val * 2 / 22).toFixed(2) : null;
                      const monthlyAvulsoVal = p12Val > 0 ? (p12Val * 1.5).toFixed(2) : null;
                      return (
                        <option key={r.id} value={r.id}>
                          {r.code} - {r.description} (Diário: {calc(dailyVal)} / Mensal: {calc(monthlyAvulsoVal)} / 12M: {calc(r.price_12)} / 36M: {calc(r.price_36)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Period selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Período (Meses) *</label>
                  <select 
                    required
                    value={formData.period_months} 
                    onChange={e => setFormData({...formData, period_months: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
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
              </div>

              {/* Premissas Customizadas */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Premissas de Markup Customizadas para esta Proposta
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Insumos (%)</label>
                    <input 
                      type="number" 
                      value={formData.insumos_percent} 
                      onChange={e => setFormData({...formData, insumos_percent: Number(e.target.value) || 0})}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Manutenção (%)</label>
                    <input 
                      type="number" 
                      value={formData.manutencao_percent} 
                      onChange={e => setFormData({...formData, manutencao_percent: Number(e.target.value) || 0})}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Lucro (%)</label>
                    <input 
                      type="number" 
                      value={formData.lucro_percent} 
                      onChange={e => setFormData({...formData, lucro_percent: Number(e.target.value) || 0})}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tributos (%)</label>
                    <input 
                      type="number" 
                      value={formData.tributos_percent} 
                      onChange={e => setFormData({...formData, tributos_percent: Number(e.target.value) || 0})}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Monthly Rent Override */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mensal (R$) *</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.monthly_value} 
                    onChange={e => setFormData({...formData, monthly_value: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-bold text-blue-600 bg-blue-50/20" 
                    placeholder="0.00"
                  />
                </div>

                {/* Hours/Month */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horas por Mês</label>
                  <input 
                    type="text" 
                    value={formData.hours_per_month} 
                    onChange={e => setFormData({...formData, hours_per_month: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" 
                  />
                </div>

                {/* Freight Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custo do Frete (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.freight_cost} 
                    onChange={e => setFormData({...formData, freight_cost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contract Type Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                  <select 
                    value={formData.contract_type} 
                    onChange={e => setFormData({...formData, contract_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                  >
                    <option value="0 - Sem cobertura.">0 - Sem cobertura</option>
                    <option value="1 - Ouro.">1 - Ouro (Manutenção/Peças inclusas)</option>
                    <option value="2 - Prata.">2 - Prata (Manutenção/Peças exceto consumíveis)</option>
                    <option value="3 - Bronze.">3 - Bronze (Manutenção exceto escovas/discos/baterias)</option>
                    <option value="4 - MOB.">4 - MOB (Mão de Obra e Deslocamento apenas)</option>
                  </select>
                </div>

                {/* Delivery Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tempo de Entrega</label>
                  <input 
                    type="text" 
                    value={formData.delivery_time} 
                    onChange={e => setFormData({...formData, delivery_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Region Used */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Região de Utilização</label>
                  <input 
                    type="text" 
                    value={formData.region_used} 
                    onChange={e => setFormData({...formData, region_used: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" 
                  />
                </div>

                {/* Validity Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validade da Proposta</label>
                  <input 
                    type="text" 
                    value={formData.validity_days} 
                    onChange={e => setFormData({...formData, validity_days: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Seller signature data */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dados do Vendedor (Assinatura)</label>
                  <textarea 
                    value={formData.seller_info} 
                    onChange={e => {
                      setFormData({...formData, seller_info: e.target.value});
                      localStorage.setItem('app_seller_info', e.target.value);
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-mono" 
                    placeholder="Nome do Vendedor&#10;Cargo&#10;E-mail / Telefone"
                  />
                </div>

                {/* Notes / Obs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações da Proposta</label>
                  <textarea 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs" 
                    placeholder="Instruções ou notas adicionais de cobrança."
                  />
                </div>
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

    </div>
  );
}
