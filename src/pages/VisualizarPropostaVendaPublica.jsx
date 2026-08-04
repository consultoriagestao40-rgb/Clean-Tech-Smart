import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';

export default function VisualizarPropostaVendaPublica() {
  const { id } = useParams();
  const [proposal, setProposal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  useEffect(() => {
    fetchProposalDetails();
  }, [id]);

  async function fetchProposalDetails() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/get-sales-proposal-details?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setProposal(data.proposal);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Proposta não encontrada.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão ao carregar a proposta.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApproveProposal() {
    if (!confirm('Deseja realmente aprovar e assinar digitalmente esta Proposta de Venda?')) return;
    setIsApproving(true);
    try {
      const res = await fetch('/api/approve-sales-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          feedback: 'Proposta de Venda aprovada e assinada digitalmente pelo cliente através do portal.'
        })
      });
      if (res.ok) {
        setApprovalSuccess(true);
        fetchProposalDetails();
      } else {
        alert('Erro ao aprovar proposta.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao aprovar a proposta.');
    } finally {
      setIsApproving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mx-auto" />
          <p className="text-sm font-medium">Carregando Proposta de Venda...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-md text-center text-white space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold">Acesso à Proposta Indisponível</h2>
          <p className="text-xs text-slate-400">{error || 'A proposta solicitada não existe ou expirou.'}</p>
        </div>
      </div>
    );
  }

  const p = proposal;
  const companyLogo = localStorage.getItem('app_company_logo') || '';
  const companyName = localStorage.getItem('app_company_name') || 'CLEAN TECH SMART';
  const companyCnpj = localStorage.getItem('app_company_cnpj') || '00.000.000/0001-00';
  const companyAddress = localStorage.getItem('app_company_address') || 'Rua Barão de Campinas, 715 - São Paulo, SP';
  const companyPhone = localStorage.getItem('app_company_phone') || '(11) 3320-8550';
  const companyEmail = localStorage.getItem('app_company_email') || 'info.brasil@tennantco.com';
  const primaryColor = localStorage.getItem('app_pdf_color') || '#7CB342';
  const emissao = new Date(p.created_at || new Date()).toLocaleDateString('pt-BR');

  const parseSpecsToHTML = (rawSpecs) => {
    if (!rawSpecs) return '<p>Sem especificações cadastradas.</p>';
    let htmlContent = rawSpecs;
    if (rawSpecs.includes('{') && rawSpecs.includes('}')) {
      try {
        const parsed = JSON.parse(rawSpecs);
        if (Array.isArray(parsed)) {
          return `<ul style="list-style: none; padding: 0;">${parsed.map(item => `<li style="padding: 4px 0; border-bottom: 1px solid #f1f5f9;"><strong>${item.label || item.key}:</strong> ${item.value}</li>`).join('')}</ul>`;
        }
      } catch (e) {}
    }
    return htmlContent.replace(/\n/g, '<br/>');
  };

  const specsHTML = parseSpecsToHTML(p.machine_specs);

  return (
    <div className="min-h-screen bg-slate-900 font-sans pb-12">
      {/* Public Top Bar */}
      <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Proposta de Venda nº #{String(p.id).padStart(4, '0')}</h1>
            <p className="text-xs text-slate-400">{p.client_name}</p>
          </div>
        </div>

        {p.status === 'Aprovada' ? (
          <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Proposta Aprovada</span>
          </div>
        ) : (
          <button
            onClick={handleApproveProposal}
            disabled={isApproving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{isApproving ? 'Aprovando...' : 'Aprovar Proposta de Venda'}</span>
          </button>
        )}
      </div>

      {approvalSuccess && (
        <div className="bg-emerald-500 text-white px-6 py-3 text-center text-xs font-bold shadow-md animate-fadeIn">
          🎉 Proposta de Venda aprovada e assinada digitalmente com sucesso! Obrigado pela preferência.
        </div>
      )}

      {/* Main Content Sheet */}
      <div className="pt-8 px-4">
        <div className="max-w-[870px] mx-auto bg-white p-8 md:p-12 shadow-2xl rounded-2xl border border-gray-200 text-slate-800 text-xs leading-relaxed space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b-2" style={{ borderColor: primaryColor }}>
            <div className="flex-1 text-left">
              <h1 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">{companyName}</h1>
              <p className="text-[11px] font-bold text-slate-700 mt-0.5">CNPJ: {companyCnpj}</p>
              <p className="text-[10px] text-slate-500">{companyAddress}</p>
              <p className="text-[10px] text-slate-500">Telefone: {companyPhone} {companyEmail ? `· Email: ${companyEmail}` : ''}</p>
            </div>
            {companyLogo && (
              <div className="w-44 flex justify-end">
                <img src={companyLogo} alt="Logo" className="max-h-20 max-w-[170px] object-contain" />
              </div>
            )}
          </div>

          {/* Title & Client Box */}
          <div className="text-center space-y-1 py-1">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900">
              PROPOSTA COMERCIAL DE VENDA DE EQUIPAMENTOS
            </h2>
            <p className="text-xs font-bold text-slate-600">Proposta nº #{String(p.id).padStart(4, '0')}</p>
            <p className="text-[11px] text-slate-400">Data de Emissão: {emissao}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2" style={{ borderLeft: `4px solid ${primaryColor}` }}>
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: primaryColor }}>
              Dados do Cliente
            </span>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              <div><span className="font-bold text-slate-700">Cliente:</span> {p.client_name || 'Não informado'}</div>
              <div><span className="font-bold text-slate-700">CNPJ/CPF:</span> {p.client_cnpj || '—'}</div>
              <div><span className="font-bold text-slate-700">Endereço:</span> {p.client_address || '—'}</div>
              <div><span className="font-bold text-slate-700">Contato:</span> {p.client_contact || '—'}</div>
              <div><span className="font-bold text-slate-700">Telefone:</span> {p.client_phone || '—'}</div>
              <div><span className="font-bold text-slate-700">Tipo:</span> Venda de Equipamento</div>
            </div>
          </div>

          {/* Equipment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start py-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b pb-1 mb-2">
                {p.machine_name || 'Equipamento'}
              </h3>
              <p className="text-xs text-slate-600 mb-3">{p.machine_description || 'Equipamento industrial de alta performance.'}</p>
              
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: primaryColor }}>
                Especificações Técnicas
              </span>
              <div className="text-xs text-slate-700 leading-snug space-y-1" dangerouslySetInnerHTML={{ __html: specsHTML }} />
            </div>

            {p.machine_image && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-center h-56">
                <img src={p.machine_image} alt={p.machine_name} className="max-h-full max-w-full object-contain" />
              </div>
            )}
          </div>

          {/* Commercial Table (Exact match to screenshot!) */}
          <div className="pt-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider mb-3 font-serif" style={{ color: primaryColor }}>
              VALORES E CONDIÇÕES DE VENDA
            </h3>

            <table className="w-full border-collapse border border-slate-300 text-xs">
              <tbody>
                <tr>
                  <td className="w-48 p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Preço FOB</td>
                  <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.fob_price || 'A consultar'}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Preço CIF</td>
                  <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.cif_price || 'A consultar'}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Impostos</td>
                  <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.taxes_info || 'Conforme texto abaixo'}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Valor da Proposta</td>
                  <td className="p-2.5 font-extrabold text-slate-900 border border-slate-300 bg-[#EEF2FF]">{p.proposal_value || ''}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Forma de Pagamento</td>
                  <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.payment_terms || ''}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Prazo de entrega</td>
                  <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.delivery_time || ''}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Garantia</td>
                  <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.warranty || '12 Meses'}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Validade da proposta</td>
                  <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.validity_days || '10 Dias'}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-[#EEF2FF]"></td>
                  <td className="p-3 text-slate-800 border border-slate-300 bg-[#EEF2FF] align-top whitespace-pre-wrap min-h-[70px]">
                    {p.notes || '(Insira aqui o texto)'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legal Terms Text */}
          <div className="text-[10px] text-slate-700 leading-relaxed text-justify space-y-2 italic">
            <p>
              Todos os pedidos estão sujeitos aos nossos termos e condições gerais que se encontram registrados perante o <strong className="font-bold text-slate-900">9º Oficial de Registro de Títulos e Documentos e Civil de Pessoa Jurídica da Capital – São Paulo</strong>, cuja cópia digitalizada está disponível no site: <u>www.alfatennant.com.br/terms</u> e também por e-mail ou correio quando solicitada. Os valores acima definidos englobam <strong className="font-bold text-slate-900">única e exclusivamente os impostos, taxas e demais encargos fiscais e tributários</strong>, incidentes nas alíquotas vigentes no Estado de origem (São Paulo) <strong className="font-bold text-slate-900">de responsabilidade da TENNANT COMPANY</strong>. Os demais tributos, inclusive os diferenciais de alíquota, que a lei atribuir como <strong className="font-bold text-slate-900">responsabilidade do comprador</strong>, quer por sua localização, quer por sua classificação (consumidor final, regime do simples, revenda, não contribuinte, dentre outros) não acarretarão quaisquer descontos nos valores acima definidos, nem mesmo serão atribuídas quaisquer responsabilidades pelo seu pagamento à <strong className="font-bold text-slate-900">TENNANT COMPANY</strong>.
            </p>
            <p className="pt-2 not-italic text-xs text-slate-800">
              Agradecemos mais uma vez a oportunidade e nos colocamos à disposição para maiores esclarecimentos.
            </p>
          </div>

          {/* Seller / Signature */}
          <div className="pt-3 border-t border-slate-200">
            <p className="font-semibold text-xs text-slate-800 mb-2">Atenciosamente,</p>
            <div className="bg-[#EEF2FF] border border-slate-300 p-3.5 rounded-lg max-w-xs text-xs text-slate-800 whitespace-pre-wrap font-medium">
              {p.seller_info || '(Insira os dados do vendedor aqui)'}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
