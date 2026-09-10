import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Loader2, Filter, Eye, Check, X, FileDown, Edit, Trash2, Link2, Receipt, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight, ExternalLink, RefreshCw, Wrench, Package } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const formatBRL = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Invoice & Conta Azul Modal States
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
  const [invoiceBudgetData, setInvoiceBudgetData] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    dueDate: '',
    serviceDescription: '',
    serviceAmount: 0,
    parts: [],
    sendToContaAzul: true
  });
  const [contaAzulConnected, setContaAzulConnected] = useState(false);

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/get-budgets');
      const data = await res.json();
      if (data.budgets) {
        setBudgets(data.budgets);
      }
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkContaAzulStatus = async () => {
    try {
      const res = await fetch('/api/conta-azul/status');
      const data = await res.json();
      setContaAzulConnected(!!data.connected);
    } catch (e) {
      console.warn('Conta Azul status check error:', e);
    }
  };

  useEffect(() => {
    fetchBudgets();
    checkContaAzulStatus();
  }, []);

  const handleDeleteBudget = async (id) => {
    if (!confirm(`Tem certeza que deseja excluir o orçamento #${String(id).padStart(4, '0')}?`)) return;
    try {
      const res = await fetch('/api/delete-budget', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchBudgets();
      } else {
        alert('Erro ao excluir orçamento');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao excluir.');
    }
  };

  const filteredBudgets = budgets.filter(b => 
    b.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(b.id).includes(searchTerm)
  );

  const handleViewDetails = async (id) => {
    setIsModalOpen(true);
    setIsDetailLoading(true);
    setSelectedBudget(null);
    try {
      const res = await fetch(`/api/get-budget-details?id=${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedBudget(data);
      } else {
        alert('Erro ao carregar detalhes: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao carregar detalhes.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/update-budget-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Orçamento ${newStatus === 'Aprovado' ? 'aprovado' : 'rejeitado'} com sucesso!`);
        
        // Refresh local budgets list
        setBudgets(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
        
        // Update selected budget status in modal
        if (selectedBudget && selectedBudget.budget.id === id) {
          setSelectedBudget(prev => ({
            ...prev,
            budget: { ...prev.budget, status: newStatus }
          }));
        }
      } else {
        alert('Erro ao atualizar status: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao atualizar status.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleShareBudget = (budgetId) => {
    const url = `${window.location.origin}/proposta/${budgetId}`;
    navigator.clipboard.writeText(url);
    alert('Link público da proposta copiado para a área de transferência!');
  };

  const handleOpenInvoiceModal = async (budgetId) => {
    setIsInvoiceModalOpen(true);
    setIsInvoiceLoading(true);
    setInvoiceBudgetData(null);

    try {
      // 1. Carregar detalhes do orçamento
      const res = await fetch(`/api/get-budget-details?id=${budgetId}`);
      const data = await res.json();
      if (!data.success) {
        alert('Erro ao carregar detalhes do orçamento para faturamento: ' + (data.error || 'Erro'));
        setIsInvoiceModalOpen(false);
        return;
      }

      // 2. Tentar buscar peças do estoque para mapear NCM
      let inventoryParts = [];
      try {
        const pRes = await fetch('/api/get-parts');
        const pData = await pRes.json();
        if (pData.parts) inventoryParts = pData.parts;
      } catch (err) {
        console.warn('Não foi possível carregar peças do estoque:', err);
      }

      const b = data.budget;
      setInvoiceBudgetData(data);

      // 3. Montar descrição automática do serviço
      const serviceTypeStr = b.service_type || 'corretiva';
      const eqName = b.equipment_name || b.machine_model_name || 'Equipamento';
      const eqSerial = b.equipment_serial_number ? ` - Nº de Série: ${b.equipment_serial_number}` : '';
      const autoServiceDesc = `Serviços de manutenção ${serviceTypeStr} do equipamento ${eqName}${eqSerial}`;

      // 4. Somar mão de obra + deslocamento
      const laborVal = Number(b.total_labor || 0);
      const logisticsVal = Number(b.total_logistics || 0);
      const totalServicesVal = laborVal + logisticsVal;

      // 5. Mapear peças com NCM do estoque e CFOP padrão
      const mappedParts = (data.partsItems || []).map(item => {
        const stockMatch = inventoryParts.find(p => 
          (p.name && item.part_name && p.name.toLowerCase().trim() === item.part_name.toLowerCase().trim()) ||
          (p.sku && item.part_name && p.sku.toLowerCase().trim() === item.part_name.toLowerCase().trim())
        );
        return {
          id: item.id,
          partName: item.part_name,
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unit_price || 0),
          ncm: item.ncm || stockMatch?.ncm || '',
          cfop: '5102',
          simplesCredit: false,
          total: Number(item.quantity || 1) * Number(item.unit_price || 0)
        };
      });

      // Data de vencimento padrão: hoje + 15 dias
      const defaultDueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      setInvoiceForm({
        dueDate: defaultDueDate,
        serviceDescription: autoServiceDesc,
        serviceAmount: totalServicesVal,
        parts: mappedParts,
        sendToContaAzul: true
      });
    } catch (error) {
      console.error('Erro ao preparar faturamento:', error);
      alert('Erro ao carregar dados para faturamento.');
      setIsInvoiceModalOpen(false);
    } finally {
      setIsInvoiceLoading(false);
    }
  };

  const handleConfirmGenerateInvoice = async (e) => {
    e?.preventDefault();
    if (!invoiceForm.dueDate) {
      alert('Por favor, informe a data de vencimento.');
      return;
    }

    setIsSubmittingInvoice(true);
    try {
      const budget = invoiceBudgetData.budget;
      const partsTotal = invoiceForm.parts.reduce((acc, p) => acc + (Number(p.quantity || 1) * Number(p.unitPrice || 0)), 0);

      const payload = {
        budgetId: budget.id,
        dueDate: invoiceForm.dueDate,
        clientData: {
          id: budget.client_id,
          name: budget.client_name,
          document: budget.client_document,
          email: budget.client_email,
          phone: budget.client_phone
        },
        services: {
          description: invoiceForm.serviceDescription,
          amount: Number(invoiceForm.serviceAmount || 0)
        },
        parts: {
          items: invoiceForm.parts,
          total: partsTotal
        },
        sendToContaAzul: invoiceForm.sendToContaAzul
      };

      const res = await fetch('/api/generate-invoice-from-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        let msg = '✅ Fatura(s) gerada(s) com sucesso!';
        if (data.contaAzulSales && data.contaAzulSales.length > 0) {
          msg += `\n\n🎉 ${data.contaAzulSales.length} venda(s) criada(s) no Conta Azul com sucesso!`;
        } else if (invoiceForm.sendToContaAzul && data.contaAzulError) {
          msg += `\n\n⚠️ Aviso Conta Azul: ${data.contaAzulError}`;
        }
        alert(msg);
        setIsInvoiceModalOpen(false);
        navigate('/faturas');
      } else {
        alert('Erro ao gerar faturas: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão ao gerar fatura.');
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const handleGeneratePDF = (budgetData) => {
    const { budget, laborItems, partsItems } = budgetData;
    const companyLogo = localStorage.getItem('app_company_logo') || '';
    const companyName = localStorage.getItem('app_company_name') || 'Clean Tech Smart';
    const companySub = localStorage.getItem('app_company_subtitle') || 'Soluções Inteligentes em Higiene e Limpeza';
    const companyCnpj = localStorage.getItem('app_company_cnpj') || '00.000.000/0001-00';
    const companyAddress = localStorage.getItem('app_company_address') || 'Curitiba - PR';
    const companyPhone = localStorage.getItem('app_company_phone') || '41984042835';
    
    // Theme Colors for PDF
    const pdfColor = localStorage.getItem('app_pdf_theme_color') || '#009AC7';
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
    const pdfColorSecondary = adjustColorBrightness(pdfColor, -20);
    const pdfColorLight = adjustColorBrightness(pdfColor, 85);
    const companyEmail = localStorage.getItem('app_company_email') || 'financeiro@grupojvsserv.com.br';

    const laborRows = laborItems.length === 0
      ? `<tr><td colspan="4" class="empty">Nenhuma hora técnica cobrada.</td></tr>`
      : laborItems.map(item => `
          <tr>
            <td>${item.description}</td>
            <td class="center">${Number(item.hours)}</td>
            <td class="right">R$ ${formatBRL(item.unit_price)}</td>
            <td class="right bold">R$ ${formatBRL(Number(item.hours) * Number(item.unit_price))}</td>
          </tr>`).join('');

    const partsRows = partsItems.length === 0
      ? `<tr><td colspan="4" class="empty">Nenhuma peça incluída.</td></tr>`
      : partsItems.map(item => `
          <tr>
            <td>${item.part_name}</td>
            <td class="center">${item.quantity}</td>
            <td class="right">R$ ${formatBRL(item.unit_price)}</td>
            <td class="right bold">R$ ${formatBRL(Number(item.quantity) * Number(item.unit_price))}</td>
          </tr>`).join('');

    const dist = Math.max(0, (budget.final_km || 0) - (budget.initial_km || 0));
    const emissao = new Date(budget.created_at).toLocaleDateString('pt-BR');
    const geradoEm = new Date().toLocaleString('pt-BR');

    let machinePageHtml = '';
    if (budget.machine_model_id && budget.machine_model_name) {
      const photosList = (budget.machine_model_photos || '').split('\n').map(u => u.trim()).filter(Boolean);
      const mainPhoto = photosList.length > 0 ? photosList[0] : '';
      const thumbnails = photosList.slice(1).map(p => `
        <img src="${p}" style="width: 60px; height: 60px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 4px; padding: 2px; background: #fff;" />
      `).join('');

      machinePageHtml = `
      <div class="page" style="page-break-before: always; margin-top: 30px;">
        <div class="header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid ${pdfColor}; padding-bottom: 20px; margin-bottom: 25px;">
          ${companyLogo ? `<div style="width: 180px; display: block;"></div>` : ''}
          <div style="flex: 1; text-align: center;">
            <h1 style="font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Apresentação do Equipamento</h1>
            <div style="font-size: 11px; font-weight: bold; color: #475569; margin-top: 4px;">Proposta nº #${String(budget.id).padStart(4,'0')}</div>
          </div>
          ${companyLogo ? `
            <div style="width: 180px; display: flex; justify-content: flex-end;">
              <img src="${companyLogo}" alt="Logo" style="max-height: 80px; max-width: 180px; object-fit: contain;" />
            </div>
          ` : ''}
        </div>

        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="font-size: 18px; font-weight: 800; color: ${pdfColor}; text-transform: uppercase; margin: 0; letter-spacing: 0.5px;">${budget.machine_model_name}</h2>
          <div style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 2px;">Especificações e Ficha Técnica Comercial</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 30px; align-items: start; margin-top: 10px;">
          <!-- Coluna Foto -->
          <div style="display: flex; flex-direction: column; align-items: center;">
            ${mainPhoto ? `
              <img src="${mainPhoto}" alt="${budget.machine_model_name}" style="max-width: 100%; max-height: 280px; object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0; padding: 15px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);" />
            ` : `
              <div style="width: 100%; height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; color: #94a3b8;">
                <span>Foto não disponível</span>
              </div>
            `}
            
            ${thumbnails ? `
              <div style="display: flex; gap: 8px; justify-content: center; margin-top: 15px; flex-wrap: wrap;">
                ${thumbnails}
              </div>
            ` : ''}
          </div>

          <!-- Coluna Descrição Técnica -->
          <div style="font-size: 12px; color: #334155; line-height: 1.6; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; white-space: pre-line; font-family: 'Inter', sans-serif;">
            ${budget.machine_model_technical_description || 'Nenhuma especificação disponível.'}
          </div>
        </div>

        <div class="footer" style="margin-top: 60px;">
          <div>
            <div>${companyName} &mdash; ${companySub}</div>
            <div>Proposta comercial e técnica de locação/venda de ativos.</div>
          </div>
        </div>
      </div>
      `;
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Orçamento #${String(budget.id).padStart(4,'0')} - Clean Tech Smart</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}

body{font-family:'Inter',Arial,sans-serif;background:#f1f5f9;color:#1e293b;font-size:13px;line-height:1.6}
.print-bar{position:fixed;top:0;left:0;right:0;background:${pdfColor};color:#fff;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;z-index:999;font-size:13px}
.print-bar strong{font-weight:600}
.btn-print{background:#fff;color:${pdfColor};border:none;padding:8px 20px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer}
.btn-print:hover{background:${pdfColorLight}}
body{padding-top:50px}
.page{background:#fff;max-width:870px;margin:20px auto;padding:52px 60px;box-shadow:0 4px 24px rgba(0,0,0,.08);border-radius:12px}
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:22px;border-bottom:3px solid ${pdfColor};margin-bottom:30px}
.co-name{font-size:24px;font-weight:800;color:${pdfColor};letter-spacing:-0.5px}
.co-sub{font-size:11px;color:#64748b;margin-top:2px}
.doc-label{font-size:11px;font-weight:700;color:${pdfColor};text-transform:uppercase;letter-spacing:1px;text-align:right}
.doc-num{font-size:24px;font-weight:800;color:#0f172a;text-align:right;margin-top:2px}
.doc-date{font-size:11px;color:#64748b;text-align:right;margin-top:2px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:28px}
.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px}
.box-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${pdfColor};padding-bottom:8px;border-bottom:1px solid #e2e8f0;margin-bottom:10px}
.row{display:flex;gap:6px;font-size:12px;margin-bottom:4px}
.row b{color:#475569;font-weight:600;min-width:76px}
.badge{display:inline-block;background:${pdfColorLight};color:${pdfColor};border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600}
.sec{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${pdfColor};margin:26px 0 10px;display:flex;align-items:center;gap:8px}
.sec::after{content:'';flex:1;height:1px;background:#e2e8f0}
table{width:100%;border-collapse:collapse;margin-bottom:4px}
thead tr{background:${pdfColor};color:#fff}
thead th{padding:9px 12px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;text-align:left}
th.right,td.right{text-align:right}
th.center,td.center{text-align:center}
tbody tr{border-bottom:1px solid #f1f5f9}
tbody tr:nth-child(even){background:#f8fafc}
tbody td{padding:9px 12px;color:#334155;font-size:12px}
td.bold{font-weight:700}
td.empty{text-align:center;color:#94a3b8;font-style:italic;padding:12px}
.sumwrap{display:flex;justify-content:flex-end;margin-top:28px}
.sumbox{background:linear-gradient(135deg,${pdfColor},${pdfColorSecondary});color:#fff;border-radius:12px;padding:22px 26px;min-width:280px}
.sum-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.75;margin-bottom:14px}
.sum-row{display:flex;justify-content:space-between;font-size:13px;margin-bottom:7px;opacity:.9}
.sum-div{border:none;border-top:1px solid rgba(255,255,255,.3);margin:10px 0}
.sum-total{display:flex;justify-content:space-between;font-size:19px;font-weight:800}
.notes{background:#fefce8;border:1px solid #fde047;border-left:4px solid #eab308;border-radius:6px;padding:13px 16px;margin-top:20px;font-size:12px;color:#713f12}
.notes b{display:block;margin-bottom:3px;font-size:10px;text-transform:uppercase;letter-spacing:.5px}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;color:#94a3b8}
.sig{text-align:center}
.sig .line{width:180px;border-top:1px solid #cbd5e1;margin:0 auto 5px}
@media print{
  .print-bar,.no-print{display:none!important}
  body{background:#fff;padding-top:0}
  .page{box-shadow:none;margin:0;padding:30px 40px;border-radius:0;max-width:100%}
  @page{margin:10mm 12mm}
}
</style>
</head>
<body>
<div class="print-bar no-print">
  <strong>📄 Orçamento #${String(budget.id).padStart(4,'0')} &mdash; ${companyName}</strong>
  <button class="btn-print" onclick="window.print()">⬇️&nbsp; Salvar / Imprimir como PDF</button>
</div>
<div class="page">
  <div class="header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid ${pdfColor}; padding-bottom: 20px; margin-bottom: 25px;">
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
    <h2 style="font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0 0 4px 0; letter-spacing: 0.5px;">Proposta Comercial de Prestação de Serviços</h2>
    <div style="font-size: 11px; font-weight: bold; color: #475569;">Proposta nº #${String(budget.id).padStart(4,'0')}</div>
    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Data: ${emissao}</div>
  </div>

  <div class="box" style="margin-bottom: 20px; border-left: 4px solid ${pdfColor}; border-radius: 4px; padding: 15px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-left-width: 4px; text-align: left;">
    <div class="box-title" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${pdfColor}; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; text-align: left; letter-spacing: 0.5px;">Dados do Cliente</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 30px;">
      <div class="row"><b>Cliente:</b> ${budget.client_name || budget.client_id || 'Não informado'}</div>
      <div class="row"><b>CNPJ/CPF:</b> ${budget.client_document || '&mdash;'}</div>
      <div class="row"><b>Endereço:</b> ${budget.client_address || '&mdash;'}</div>
      <div class="row"><b>Contato:</b> ${budget.contact_name || '&mdash;'}</div>
      <div class="row"><b>Telefone:</b> ${budget.contact_info || '&mdash;'}</div>
      <div class="row"><b>Serviço:</b> <span style="text-transform:capitalize">${budget.service_type}</span></div>
    </div>
  </div>

  <div class="sec">Dados do Equipamento</div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <thead>
      <tr style="background: ${pdfColor}; color: #fff;">
        <th style="padding: 8px 12px; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; text-align: left;">Equipamento / Ativo</th>
        <th style="padding: 8px 12px; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; text-align: left;">Marca</th>
        <th style="padding: 8px 12px; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; text-align: left;">Modelo</th>
        <th style="padding: 8px 12px; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; text-align: left;">Nº de Série</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
        <td style="padding: 8px 12px; font-size: 11px; color: #334155; font-weight: 600;">${budget.equipment_name || 'Nenhum equipamento associado'}</td>
        <td style="padding: 8px 12px; font-size: 11px; color: #334155;">${budget.equipment_brand || '&mdash;'}</td>
        <td style="padding: 8px 12px; font-size: 11px; color: #334155;">${budget.equipment_model || '&mdash;'}</td>
        <td style="padding: 8px 12px; font-size: 11px; color: #334155; font-weight: 600;">${budget.equipment_serial_number || '&mdash;'}</td>
      </tr>
    </tbody>
  </table>

  <div class="sec">Mão de Obra</div>
  <table>
    <thead><tr>
      <th>Descrição do Serviço</th>
      <th class="center" style="width:80px">Horas</th>
      <th class="right" style="width:130px">Valor/Hora</th>
      <th class="right" style="width:130px">Total</th>
    </tr></thead>
    <tbody>${laborRows}</tbody>
  </table>

  <div class="sec">Peças e Insumos</div>
  <table>
    <thead><tr>
      <th>Descrição da Peça</th>
      <th class="center" style="width:80px">Qtd.</th>
      <th class="right" style="width:130px">Valor Unit.</th>
      <th class="right" style="width:130px">Total</th>
    </tr></thead>
    <tbody>${partsRows}</tbody>
  </table>

  <div class="sec">Deslocamento / Logística</div>
  <table>
    <thead><tr>
      <th class="center">KM Inicial</th>
      <th class="center">KM Final</th>
      <th class="center">Distância</th>
      <th class="right">Valor/KM</th>
      <th class="right" style="width:130px">Total</th>
    </tr></thead>
    <tbody>
      <tr>
        <td class="center">${budget.initial_km || 0}</td>
        <td class="center">${budget.final_km || 0}</td>
        <td class="center">${dist} km</td>
        <td class="right">R$ ${formatBRL(budget.price_per_km || 0)}</td>
        <td class="right bold">R$ ${formatBRL(budget.total_logistics || 0)}</td>
      </tr>
    </tbody>
  </table>

  ${budget.notes ? `<div class="notes"><b>Observações:</b>${budget.notes}</div>` : ''}

  <div class="sumwrap">
    <div class="sumbox">
      <div class="sum-title">Resumo Financeiro</div>
      <div class="sum-row"><span>Mão de Obra</span><span>R$ ${formatBRL(budget.total_labor || 0)}</span></div>
      <div class="sum-row"><span>Peças e Insumos</span><span>R$ ${formatBRL(budget.total_parts || 0)}</span></div>
      <div class="sum-row"><span>Deslocamento</span><span>R$ ${formatBRL(budget.total_logistics || 0)}</span></div>
      <hr class="sum-div">
      <div class="sum-total"><span>Total Geral</span><span>R$ ${formatBRL(budget.grand_total || 0)}</span></div>
    </div>
  </div>

  <div class="footer">
    <div>
      <div>${companyName} &mdash; ${companySub}</div>
      <div>Gerado em ${geradoEm}</div>
    </div>
    <div class="sig">
      <div class="line"></div>
      <div>Assinatura do Responsável</div>
    </div>
  </div>
  ${machinePageHtml}
</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    } else {
      alert('Por favor, permita pop-ups para este site e tente novamente.');
    }
  };

  return (
    <div className="font-sans text-gray-800 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Orçamentos</h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhe todos os orçamentos de assistência técnica</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Link to="/servicos" className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Link>
        </div>
      </header>

      {/* Stats/Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-blue-50 p-3 rounded-lg mr-4">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de Orçamentos</p>
            <p className="text-2xl font-bold text-gray-900">{budgets.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-green-50 p-3 rounded-lg mr-4">
            <DollarSignIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Valor Total (Todos)</p>
            <p className="text-2xl font-bold text-gray-900">
              R$ {formatBRL(budgets.reduce((acc, curr) => acc + Number(curr.grand_total || 0), 0))}
            </p>
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
              placeholder="Buscar por ID, Cliente ou Contato..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium rounded-lg border border-gray-200 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">ID</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Data</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Cliente / Contato</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Tipo de Serviço</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Valor Total</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                    <p>Carregando orçamentos...</p>
                  </td>
                </tr>
              ) : filteredBudgets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <p>Nenhum orçamento encontrado.</p>
                  </td>
                </tr>
              ) : (
                filteredBudgets.map((budget) => (
                  <tr key={budget.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">#{budget.id}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{budget.client_name || budget.client_id || 'Não informado'}</p>
                      <p className="text-xs text-gray-500">{budget.contact_name}</p>
                    </td>
                    <td className="px-6 py-4 capitalize">{budget.service_type}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      R$ {formatBRL(budget.grand_total)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        budget.status === 'Aprovado' ? 'bg-green-100 text-green-800' :
                        budget.status === 'Rejeitado' ? 'bg-red-100 text-red-800' :
                        budget.status === 'Rascunho' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {budget.status || 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Botão Gerar Fatura */}
                        {budget.status === 'Aprovado' ? (
                          <button 
                            onClick={() => handleOpenInvoiceModal(budget.id)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg transition-colors border border-emerald-200"
                            title="Gerar Fatura & Venda no Conta Azul"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            disabled
                            className="p-1.5 bg-gray-50 text-gray-300 rounded-lg cursor-not-allowed"
                            title="Faturamento liberado apenas para orçamentos Aprovados"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleShareBudget(budget.id)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Compartilhar Link Público"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleViewDetails(budget.id)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Visualizar Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/servicos?id=${budget.id}`)}
                          className="p-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                          title="Editar Orçamento"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteBudget(budget.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Excluir Orçamento"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal de Detalhes */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detalhes do Orçamento #{selectedBudget?.budget?.id}</h2>
                <p className="text-xs text-gray-500 mt-1">Criado em {selectedBudget?.budget && new Date(selectedBudget.budget.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-250px)] space-y-6">
              {isDetailLoading ? (
                <div className="py-20 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                  <p>Carregando informações...</p>
                </div>
              ) : selectedBudget ? (
                <>
                  {/* Grid Infos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dados do Cliente</h3>
                      <p className="font-semibold text-gray-800">{selectedBudget.budget.client_name || selectedBudget.budget.client_id || 'Não informado'}</p>
                      <p className="text-sm text-gray-600 mt-1"><strong>CNPJ/CPF:</strong> {selectedBudget.budget.client_document || '-'}</p>
                      <p className="text-sm text-gray-600 mt-1"><strong>Endereço:</strong> {selectedBudget.budget.client_address || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ativo / Equipamento</h3>
                      {selectedBudget.budget.equipment_name ? (
                        <>
                          <p className="font-semibold text-gray-800">{selectedBudget.budget.equipment_name}</p>
                          <p className="text-sm text-gray-600 mt-1"><strong>Marca/Modelo:</strong> {selectedBudget.budget.equipment_brand || '-'} {selectedBudget.budget.equipment_model ? `/ ${selectedBudget.budget.equipment_model}` : ''}</p>
                          <p className="text-sm text-gray-600 mt-1"><strong>Nº de Série:</strong> {selectedBudget.budget.equipment_serial_number || '-'}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Nenhum equipamento associado</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contato & Serviço</h3>
                      <p className="text-sm text-gray-800"><strong>Solicitante:</strong> {selectedBudget.budget.contact_name || '-'}</p>
                      <p className="text-sm text-gray-800 mt-1"><strong>Contato:</strong> {selectedBudget.budget.contact_info || '-'}</p>
                      <p className="text-sm text-gray-800 mt-1"><strong>Tipo de Serviço:</strong> <span className="capitalize">{selectedBudget.budget.service_type}</span></p>
                      <p className="text-sm text-gray-800 mt-1"><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                          selectedBudget.budget.status === 'Aprovado' ? 'bg-green-100 text-green-800' :
                          selectedBudget.budget.status === 'Rejeitado' ? 'bg-red-100 text-red-800' :
                          selectedBudget.budget.status === 'Rascunho' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedBudget.budget.status || 'Pendente'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Mão de Obra */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-1">Mão de Obra</h3>
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 font-semibold">Descrição</th>
                          <th className="px-4 py-2 font-semibold text-center w-24">Horas</th>
                          <th className="px-4 py-2 font-semibold text-right w-32">Valor Unitário</th>
                          <th className="px-4 py-2 font-semibold text-right w-32">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBudget.laborItems.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 py-4 text-center text-gray-400">Nenhuma hora técnica cobrada.</td>
                          </tr>
                        ) : (
                          selectedBudget.laborItems.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="px-4 py-2">{item.description}</td>
                              <td className="px-4 py-2 text-center">{Number(item.hours)}</td>
                              <td className="px-4 py-2 text-right">R$ {formatBRL(item.unit_price)}</td>
                              <td className="px-4 py-2 text-right font-medium text-gray-800">R$ {formatBRL(item.hours * item.unit_price)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Peças e Insumos */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-1">Peças e Insumos</h3>
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 font-semibold">Peça / Insumo</th>
                          <th className="px-4 py-2 font-semibold text-center w-24">Quantidade</th>
                          <th className="px-4 py-2 font-semibold text-right w-32">Valor Unitário</th>
                          <th className="px-4 py-2 font-semibold text-right w-32">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBudget.partsItems.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 py-4 text-center text-gray-400">Nenhuma peça cobrada.</td>
                          </tr>
                        ) : (
                          selectedBudget.partsItems.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="px-4 py-2">{item.part_name}</td>
                              <td className="px-4 py-2 text-center">{item.quantity}</td>
                              <td className="px-4 py-2 text-right">R$ {formatBRL(item.unit_price)}</td>
                              <td className="px-4 py-2 text-right font-medium text-gray-800">R$ {formatBRL(item.quantity * item.unit_price)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Deslocamento & Detalhes Finais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-1">Deslocamento / Logística</h3>
                        <div className="text-sm space-y-1.5 text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p><strong>KM Inicial / Final:</strong> {selectedBudget.budget.initial_km} / {selectedBudget.budget.final_km}</p>
                          <p><strong>Total de KM Rodados:</strong> {Math.max(0, selectedBudget.budget.final_km - selectedBudget.budget.initial_km)} km</p>
                          <p><strong>Valor por KM:</strong> R$ {formatBRL(selectedBudget.budget.price_per_km)}</p>
                          <p className="font-semibold text-blue-600 pt-1"><strong>Subtotal Logística:</strong> R$ {formatBRL(selectedBudget.budget.total_logistics)}</p>
                        </div>
                      </div>
                      {selectedBudget.budget.notes && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b pb-1">Observações Internas</h3>
                          <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-600 italic">
                            {selectedBudget.budget.notes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Resumo Financeiro */}
                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100/50 flex flex-col justify-between">
                      <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-4">Resumo Financeiro</h3>
                        <div className="space-y-2 text-sm text-gray-600 mb-6">
                          <div className="flex justify-between">
                            <span>Subtotal Mão de Obra:</span>
                            <span className="font-medium text-gray-800">R$ {formatBRL(selectedBudget.budget.total_labor)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Subtotal Peças:</span>
                            <span className="font-medium text-gray-800">R$ {formatBRL(selectedBudget.budget.total_parts)}</span>
                          </div>
                          <div className="flex justify-between pb-3 border-b border-blue-100">
                            <span>Subtotal Logística:</span>
                            <span className="font-medium text-gray-800">R$ {formatBRL(selectedBudget.budget.total_logistics)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-600 p-4 rounded-lg text-white">
                        <span className="block text-xs font-semibold uppercase tracking-wider opacity-90">Valor Total do Orçamento</span>
                        <span className="block text-3xl font-bold mt-1">R$ {formatBRL(selectedBudget.budget.grand_total)}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-gray-400">
                  <p>Orçamento não pôde ser carregado.</p>
                </div>
              )}
            </div>

            {/* Footer / Ações */}
            <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50">
              <div>
                {selectedBudget && (selectedBudget.budget.status === 'Pendente' || selectedBudget.budget.status === 'Rascunho' || !selectedBudget.budget.status) && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedBudget.budget.id, 'Aprovado')}
                      disabled={isActionLoading}
                      className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Aprovar Orçamento
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedBudget.budget.id, 'Rejeitado')}
                      disabled={isActionLoading}
                      className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rejeitar Orçamento
                    </button>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                {selectedBudget && selectedBudget.budget && selectedBudget.budget.status === 'Aprovado' && (
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      handleOpenInvoiceModal(selectedBudget.budget.id);
                    }}
                    className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Gerar Fatura
                  </button>
                )}
                {selectedBudget && (
                  <>
                    <button
                      onClick={() => handleShareBudget(selectedBudget.budget.id)}
                      className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Compartilhar Link
                    </button>
                    <button
                      onClick={() => handleGeneratePDF(selectedBudget)}
                      className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Gerar PDF
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-medium rounded-lg text-sm transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Geração de Fatura & Conta Azul */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Gerar Fatura do Orçamento #{invoiceBudgetData?.budget?.id}
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Cliente: <span className="font-semibold text-gray-800">{invoiceBudgetData?.budget?.client_name || invoiceBudgetData?.budget?.client_id}</span> &bull; 
                    Equipamento: <span className="font-semibold text-gray-800">{invoiceBudgetData?.budget?.equipment_name || invoiceBudgetData?.budget?.machine_model_name || 'Geral'}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white/60 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {isInvoiceLoading ? (
              <div className="p-12 text-center text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
                <p>Preparando dados fiscais e de faturamento...</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmGenerateInvoice} className="p-6 overflow-y-auto max-h-[calc(100vh-220px)] space-y-6">
                {/* 1. Dados Básicos e Vencimento */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Cliente</label>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {invoiceBudgetData?.budget?.client_name || 'Não informado'}
                    </p>
                    <p className="text-xs text-gray-500">{invoiceBudgetData?.budget?.client_document || 'Sem documento cadastrado'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Equipamento / Ativo</label>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {invoiceBudgetData?.budget?.equipment_name || invoiceBudgetData?.budget?.machine_model_name || 'Não informado'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Série: {invoiceBudgetData?.budget?.equipment_serial_number || 'S/N'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Data de Vencimento *</label>
                    <input
                      type="date"
                      required
                      value={invoiceForm.dueDate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 2. Venda de Serviços (NFS-e Municipal) */}
                <div className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-blue-50/80 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-blue-900 font-semibold text-sm">
                      <Wrench className="w-4 h-4 text-blue-600" />
                      <span>1. Venda de Serviços (NFS-e Municipal)</span>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                      Item Único Consolidado
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Descrição do Serviço (automática a partir do equipamento e manutenção):
                      </label>
                      <textarea
                        rows={2}
                        value={invoiceForm.serviceDescription}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, serviceDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        Total de Serviços (Mão de Obra + Deslocamento):
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-gray-700">R$</span>
                        <input 
                          type="number"
                          step="0.01"
                          value={invoiceForm.serviceAmount}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, serviceAmount: parseFloat(e.target.value) || 0 })}
                          className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-bold text-blue-900 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Venda de Peças (NF-e Estadual) */}
                <div className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-amber-50/80 px-4 py-3 border-b border-amber-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-amber-900 font-semibold text-sm">
                      <Package className="w-4 h-4 text-amber-600" />
                      <span>2. Venda de Peças (NF-e Estadual Modelo 55)</span>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                      {invoiceForm.parts.length} {invoiceForm.parts.length === 1 ? 'item' : 'itens'} (Item a Item)
                    </span>
                  </div>
                  <div className="p-4">
                    {invoiceForm.parts.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-3">Este orçamento não possui peças de reposição cadastradas.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 text-gray-500">
                              <th className="pb-2 font-semibold">Peça / Produto</th>
                              <th className="pb-2 font-semibold w-16 text-center">Qtd</th>
                              <th className="pb-2 font-semibold w-24 text-right">Unitário</th>
                              <th className="pb-2 font-semibold w-28">NCM *</th>
                              <th className="pb-2 font-semibold w-24">CFOP *</th>
                              <th className="pb-2 font-semibold w-28 text-center">Créd. Simples</th>
                              <th className="pb-2 font-semibold w-24 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {invoiceForm.parts.map((p, idx) => (
                              <tr key={idx} className="hover:bg-amber-50/30">
                                <td className="py-2.5 font-medium text-gray-800">{p.partName}</td>
                                <td className="py-2.5 text-center text-gray-600">{p.quantity}</td>
                                <td className="py-2.5 text-right font-medium">R$ {formatBRL(p.unitPrice)}</td>
                                <td className="py-2.5 pr-2">
                                  <input 
                                    type="text"
                                    placeholder="Ex: 84798999"
                                    value={p.ncm}
                                    onChange={(e) => {
                                      const updated = [...invoiceForm.parts];
                                      updated[idx].ncm = e.target.value;
                                      setInvoiceForm({ ...invoiceForm, parts: updated });
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                  />
                                </td>
                                <td className="py-2.5 pr-2">
                                  <select
                                    value={p.cfop}
                                    onChange={(e) => {
                                      const updated = [...invoiceForm.parts];
                                      updated[idx].cfop = e.target.value;
                                      setInvoiceForm({ ...invoiceForm, parts: updated });
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                  >
                                    <option value="5102">5102 (Dentro do Estado)</option>
                                    <option value="6102">6102 (Interestadual)</option>
                                    <option value="5405">5405 (Subst. Tributária)</option>
                                  </select>
                                </td>
                                <td className="py-2.5 text-center">
                                  <input 
                                    type="checkbox"
                                    checked={p.simplesCredit}
                                    onChange={(e) => {
                                      const updated = [...invoiceForm.parts];
                                      updated[idx].simplesCredit = e.target.checked;
                                      setInvoiceForm({ ...invoiceForm, parts: updated });
                                    }}
                                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2.5 text-right font-bold text-gray-900">
                                  R$ {formatBRL(p.total)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Integração com Conta Azul */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox"
                      id="contaAzulSync"
                      checked={invoiceForm.sendToContaAzul}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, sendToContaAzul: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <label htmlFor="contaAzulSync" className="text-sm font-bold text-gray-800 cursor-pointer">
                        Transmitir Vendas para o Conta Azul
                      </label>
                      <p className="text-xs text-gray-500">
                        Gera automaticamente 2 vendas separadas (Serviços e Peças) com dados fiscais para emissão de notas.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-semibold">
                    {contaAzulConnected ? (
                      <span className="flex items-center text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Conta Azul Conectado
                      </span>
                    ) : (
                      <span className="flex items-center text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" />
                        Conta Azul não conectado
                      </span>
                    )}
                  </div>
                </div>

                {/* Resumo Total Geral */}
                <div className="flex items-center justify-between p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Total Geral a Faturar</span>
                    <p className="text-xs text-emerald-700">Serviços + Peças de Reposição</p>
                  </div>
                  <div className="text-2xl font-black text-emerald-900">
                    R$ {formatBRL(
                      Number(invoiceForm.serviceAmount || 0) + 
                      invoiceForm.parts.reduce((acc, p) => acc + (Number(p.quantity || 1) * Number(p.unitPrice || 0)), 0)
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsInvoiceModalOpen(false)}
                    disabled={isSubmittingInvoice}
                    className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-medium rounded-lg text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingInvoice}
                    className="flex items-center px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
                  >
                    {isSubmittingInvoice ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando Faturas...
                      </>
                    ) : (
                      <>
                        <Receipt className="w-4 h-4 mr-2" />
                        Confirmar e Gerar Faturas
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DollarSignIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}
