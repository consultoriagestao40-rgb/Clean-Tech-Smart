import { useState, useEffect } from 'react';
import { 
  Globe, 
  Save, 
  ExternalLink, 
  Image as ImageIcon, 
  Video, 
  Star, 
  Phone, 
  Mail, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  Layout
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ConfigurarLpTennantA260() {
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Default values
  const DEFAULT_PHOTOS = [
    "https://www.tennantco.com/content/dam/alfa/Products/Machines/scrubber-walk-behinds/a260/images/a260-main.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg",
    "https://www.tennantco.com/content/dam/alfa/Products/Machines/scrubber-walk-behinds/a260/images/a260-solution-tank.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg",
    "https://www.tennantco.com/content/dam/alfa/Products/Machines/scrubber-walk-behinds/a260/images/a260-handle.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg",
    "https://www.tennantco.com/content/dam/alfa/Products/Machines/scrubber-walk-behinds/a260/images/a260-in-use.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg"
  ];

  const DEFAULT_VIDEOS = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  ];

  const DEFAULT_TESTIMONIALS = [
    "https://www.tennantco.com/content/dam/alfa/Products/Machines/scrubber-walk-behinds/a260/images/a260-in-use.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg"
  ];

  // States
  const [photoUrls, setPhotoUrls] = useState(localStorage.getItem('lp_a260_photo_urls') || DEFAULT_PHOTOS.join('\n'));
  const [videoUrls, setVideoUrls] = useState(localStorage.getItem('lp_a260_video_urls') || DEFAULT_VIDEOS.join('\n'));
  const [testimonialUrls, setTestimonialUrls] = useState(localStorage.getItem('lp_a260_testimonials_urls') || DEFAULT_TESTIMONIALS.join('\n'));
  const [whatsappNumber, setWhatsappNumber] = useState(localStorage.getItem('lp_a260_whatsapp') || "5541985083658");
  const [whatsappDisplay, setWhatsappDisplay] = useState(localStorage.getItem('lp_a260_whatsapp_display') || "(41) 98508-3658");
  const [contactEmail, setContactEmail] = useState(localStorage.getItem('lp_a260_email') || "vendas@cleantechpro.com.br");
  const [rentalPrice, setRentalPrice] = useState(localStorage.getItem('lp_a260_rental_price') || "3.890,00");

  // Salva no localStorage
  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);

    localStorage.setItem('lp_a260_photo_urls', photoUrls);
    localStorage.setItem('lp_a260_video_urls', videoUrls);
    localStorage.setItem('lp_a260_testimonials_urls', testimonialUrls);
    localStorage.setItem('lp_a260_whatsapp', whatsappNumber);
    localStorage.setItem('lp_a260_whatsapp_display', whatsappDisplay);
    localStorage.setItem('lp_a260_email', contactEmail);
    localStorage.setItem('lp_a260_rental_price', rentalPrice);

    setTimeout(() => {
      setIsSaving(false);
      setSuccessMsg('Configurações da Landing Page salvas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 400);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      
      {/* Header com link para ver a LP pública */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#007481] uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#eb6420]" />
            Gerenciador de Marketing & Conversão
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1">Configurações da Landing Page (Tennant A260)</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Gerencie fotos, vídeos do YouTube, prints de depoimentos e contatos que aparecem para os clientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/lp/tennant-a260"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#007481] hover:bg-[#005f6b] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Ver Landing Page Pública
          </a>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-lg text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Formulário de Configurações Administrativas */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Bloco 1: Fotos da Máquina */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
              <ImageIcon className="w-5 h-5 text-[#007481]" />
              Fotos da Máquina no Carrossel (Links JPG/PNG)
            </div>
            <Link 
              to="/modelos-maquinas"
              className="text-xs text-[#007481] hover:underline font-semibold flex items-center gap-1"
            >
              <Layout className="w-3.5 h-3.5" /> Acessar Catálogo de Máquinas
            </Link>
          </div>
          <p className="text-xs text-gray-500">
            Cole as URLs das fotos oficiais da A260, <strong>uma por linha</strong>. Elas aparecerão no carrossel da primeira página com miniaturas.
          </p>
          <textarea
            rows={5}
            value={photoUrls}
            onChange={(e) => setPhotoUrls(e.target.value)}
            placeholder="https://.../foto1.jpg&#10;https://.../foto2.jpg"
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-800 focus:outline-none focus:border-[#007481]"
          />
        </div>

        {/* Bloco 2: Vídeos do Google Drive / YouTube */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
            <Video className="w-5 h-5 text-[#eb6420]" />
            Vídeos Demonstrativos (Links do Google Drive ou YouTube)
          </div>
          <p className="text-xs text-gray-500">
            Cole os <strong>links de compartilhamento do Google Drive</strong> (ex: <code>https://drive.google.com/file/d/SEU_CODIGO/view?usp=sharing</code>) ou links do YouTube/MP4, <strong>um por linha</strong>. O sistema converte e roda o vídeo automaticamente na página!
          </p>
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded text-[11px]">
            💡 <strong>Dica Google Drive:</strong> Certifique-se de que o vídeo no Google Drive esteja com o acesso configurado como <em>"Qualquer pessoa com o link pode ver"</em>.
          </div>
          <textarea
            rows={4}
            value={videoUrls}
            onChange={(e) => setVideoUrls(e.target.value)}
            placeholder="https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view?usp=sharing&#10;https://www.youtube.com/watch?v=CODIGO_YOUTUBE"
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-800 focus:outline-none focus:border-[#007481]"
          />
        </div>

        {/* Bloco 3: Prints de Depoimentos de Clientes */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            Prints de Depoimentos & Entregas de Clientes (Links de Imagens)
          </div>
          <p className="text-xs text-gray-500">
            Cole as URLs diretas das imagens dos prints de conversas no WhatsApp ou fotos de entregas técnicas em clientes, <strong>uma por linha</strong>. Os clientes poderão clicar para ampliar.
          </p>
          <textarea
            rows={4}
            value={testimonialUrls}
            onChange={(e) => setTestimonialUrls(e.target.value)}
            placeholder="https://exemplo.com/print-whatsapp-1.jpg&#10;https://exemplo.com/print-avaliacao-2.jpg"
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-800 focus:outline-none focus:border-[#007481]"
          />
        </div>

        {/* Bloco 4: Contatos & Preço Âncora */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="font-bold text-gray-900 text-sm">Contatos de Destino & Preço Âncora</div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp (Número Completo)</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="5541985083658"
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-800"
              />
              <span className="text-[10px] text-gray-400">Ex: 5541985083658</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp (Exibição Formatada)</label>
              <input
                type="text"
                value={whatsappDisplay}
                onChange={(e) => setWhatsappDisplay(e.target.value)}
                placeholder="(41) 98508-3658"
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-800"
              />
              <span className="text-[10px] text-gray-400">Ex: (41) 98508-3658</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">E-mail Comercial</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="vendas@cleantechpro.com.br"
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-800"
              />
              <span className="text-[10px] text-gray-400">Ex: vendas@cleantechpro.com.br</span>
            </div>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-[#eb6420] hover:bg-[#d65715] text-white text-sm font-bold px-6 py-3 rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando Configurações...' : 'Salvar Todas as Configurações'}
          </button>
        </div>

      </form>

    </div>
  );
}
