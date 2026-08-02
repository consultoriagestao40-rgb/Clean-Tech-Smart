import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Trash2, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Configuracoes() {
  const [logo, setLogo] = useState(localStorage.getItem('app_company_logo') || '');
  const [originalLogo, setOriginalLogo] = useState(localStorage.getItem('app_company_logo_original') || '');
  const [removeBg, setRemoveBg] = useState(localStorage.getItem('app_company_logo_remove_bg') === 'true');
  const [tolerance, setTolerance] = useState(parseInt(localStorage.getItem('app_company_logo_tolerance') || '30', 10));
  const [zoom, setZoom] = useState(parseInt(localStorage.getItem('app_company_logo_zoom') || '100', 10));

  // PDF Document Color Theme State
  const [pdfThemeColor, setPdfThemeColor] = useState(localStorage.getItem('app_pdf_theme_color') || '#009AC7');

  // Company Details State
  const [companyName, setCompanyName] = useState(localStorage.getItem('app_company_name') || 'Clean Tech Smart');
  const [companySub, setCompanySub] = useState(localStorage.getItem('app_company_subtitle') || 'Soluções Inteligentes em Higiene e Limpeza');
  const [companyCnpj, setCompanyCnpj] = useState(localStorage.getItem('app_company_cnpj') || '00.000.000/0001-00');
  const [companyAddress, setCompanyAddress] = useState(localStorage.getItem('app_company_address') || 'Curitiba - PR');
  const [companyPhone, setCompanyPhone] = useState(localStorage.getItem('app_company_phone') || '41984042835');
  const [companyEmail, setCompanyEmail] = useState(localStorage.getItem('app_company_email') || 'financeiro@grupojvsserv.com.br');
  const [companyIe, setCompanyIe] = useState(localStorage.getItem('app_company_ie') || '91101403-36');

  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (originalLogo) {
      applyFilters(originalLogo, removeBg, tolerance);
    }
  }, [removeBg, tolerance, originalLogo]);

  const applyFilters = (originalUrl, shouldRemove, tolValue) => {
    if (!shouldRemove) {
      localStorage.setItem('app_company_logo', originalUrl);
      setLogo(originalUrl);
      window.dispatchEvent(new Event('logoChanged'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const threshold = 255 - tolValue;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // If pixel is close to white based on tolerance, make it transparent
        if (r >= threshold && g >= threshold && b >= threshold) {
          data[i + 3] = 0; // Alpha
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const processedUrl = canvas.toDataURL('image/png');
      localStorage.setItem('app_company_logo', processedUrl);
      setLogo(processedUrl);
      window.dispatchEvent(new Event('logoChanged'));
    };
    img.src = originalUrl;
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('❌ A imagem de logotipo deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      localStorage.setItem('app_company_logo_original', dataUrl);
      setOriginalLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => {
    if (confirm('Tem certeza de que deseja remover o logotipo oficial?')) {
      localStorage.removeItem('app_company_logo');
      localStorage.removeItem('app_company_logo_original');
      localStorage.removeItem('app_company_logo_remove_bg');
      localStorage.removeItem('app_company_logo_tolerance');
      localStorage.removeItem('app_company_logo_zoom');
      localStorage.removeItem('app_pdf_theme_color');
      setLogo('');
      setOriginalLogo('');
      setRemoveBg(false);
      setTolerance(30);
      setZoom(100);
      setPdfThemeColor('#009AC7');
      window.dispatchEvent(new Event('logoChanged'));
    }
  };

  const toggleRemoveBg = () => {
    const nextVal = !removeBg;
    setRemoveBg(nextVal);
    localStorage.setItem('app_company_logo_remove_bg', String(nextVal));
  };

  const handleToleranceChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setTolerance(val);
    localStorage.setItem('app_company_logo_tolerance', String(val));
  };

  const handleZoomChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setZoom(val);
    localStorage.setItem('app_company_logo_zoom', String(val));
    window.dispatchEvent(new Event('logoChanged'));
  };

  const handleSaveDetails = (e) => {
    e.preventDefault();
    localStorage.setItem('app_company_name', companyName);
    localStorage.setItem('app_company_subtitle', companySub);
    localStorage.setItem('app_company_cnpj', companyCnpj);
    localStorage.setItem('app_company_ie', companyIe);
    localStorage.setItem('app_company_address', companyAddress);
    localStorage.setItem('app_company_phone', companyPhone);
    localStorage.setItem('app_company_email', companyEmail);
    localStorage.setItem('app_pdf_theme_color', pdfThemeColor);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="font-sans text-gray-800 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
            <p className="text-sm text-gray-500 mt-1">Personalize a identidade visual e os dados corporativos da plataforma</p>
          </div>
        </div>
      </header>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Visual Identity Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Identidade Visual da Empresa</h2>
            <p className="text-sm text-gray-500">Suba o logotipo oficial para substituir o nome padrão no topo do menu lateral</p>
          </div>

          <div className="border-t border-gray-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Upload & Controls Area */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Subir Novo Logotipo</label>
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors cursor-pointer relative">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <span className="relative rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        Enviar um arquivo
                      </span>
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG ou GIF até 2MB</p>
                  </div>
                </div>
              </div>

              {/* Background Remover Controls */}
              {originalLogo && (
                <div className="space-y-4">
                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-4">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={toggleRemoveBg}
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                          removeBg ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            removeBg ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <div>
                        <span className="text-sm font-semibold text-gray-900 block">Remover Fundo Branco</span>
                        <span className="text-xs text-gray-500 block">Torna o fundo branco da imagem transparente</span>
                      </div>
                    </div>

                    {removeBg && (
                      <div className="space-y-2 pt-2 border-t border-blue-100/50">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Tolerância do Fundo</span>
                          <span>{tolerance}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="80"
                          value={tolerance}
                          onChange={handleToleranceChange}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-[10px] text-gray-400 block">Ajuste para remover bordas e sombras brancas do logo</span>
                      </div>
                    )}
                  </div>

                  {/* Logo Zoom controls */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-gray-200 space-y-4">
                    <div>
                      <span className="text-sm font-semibold text-gray-900 block">Zoom do Logotipo</span>
                      <span className="text-xs text-gray-500 block">Ajuste o tamanho do logotipo no menu</span>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Aproximar / Afastar</span>
                        <span>{zoom}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={zoom}
                        onChange={handleZoomChange}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Area */}
            <div className="flex flex-col justify-between border border-gray-100 bg-gray-50 rounded-lg p-6 min-h-[220px]">
              <div>
                <span className="text-sm font-medium text-gray-600 block mb-3">Prévia no Menu Lateral (Fundo Escuro/Claro)</span>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Light background preview */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px] overflow-hidden">
                    <span className="text-[10px] text-gray-400 mb-2">Fundo Claro</span>
                    {logo ? (
                      <img src={logo} alt="Logo Preview" className="max-h-16 w-auto max-w-full object-contain" style={{ transform: `scale(${zoom / 100})`, transition: 'transform 0.1s' }} />
                    ) : (
                      <span className="text-gray-400 italic text-[11px] text-center">Clean Tech Smart</span>
                    )}
                  </div>

                  {/* Dark background preview */}
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px] overflow-hidden">
                    <span className="text-[10px] text-slate-500 mb-2">Fundo Escuro (Menu)</span>
                    {logo ? (
                      <img src={logo} alt="Logo Preview" className="max-h-16 w-auto max-w-full object-contain" style={{ transform: `scale(${zoom / 100})`, transition: 'transform 0.1s' }} />
                    ) : (
                      <span className="text-slate-400 font-bold text-xs tracking-tight text-center">Clean Tech <span className="text-slate-500">Smart</span></span>
                    )}
                  </div>
                </div>
              </div>

              {originalLogo && (
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  className="mt-6 flex items-center justify-center px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium self-start"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover Logotipo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Company Details & PDF Colors Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Dados da Empresa e Cor das Propostas/Orçamentos (PDF)</h2>
            <p className="text-sm text-gray-500">Configure os dados institucionais e a paleta de cores principal dos documentos PDF</p>
          </div>

          <form onSubmit={handleSaveDetails} className="border-t border-gray-100 pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Nome / Razão Social</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: Clean Tech Smart"
                  required
                />
              </div>

              {/* Slogan */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Slogan / Subtítulo</label>
                <input
                  type="text"
                  value={companySub}
                  onChange={(e) => setCompanySub(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: Soluções Inteligentes em Higiene e Limpeza"
                  required
                />
              </div>

              {/* CNPJ */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                <input
                  type="text"
                  value={companyCnpj}
                  onChange={(e) => setCompanyCnpj(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: 00.000.000/0001-00"
                  required
                />
              </div>

              {/* Inscrição Estadual */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Inscrição Estadual</label>
                <input
                  type="text"
                  value={companyIe}
                  onChange={(e) => setCompanyIe(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: 91101403-36"
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Endereço / Cidade</label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: Curitiba - PR"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Telefone para Contato</label>
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: (41) 98404-2835"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Email Corporativo</label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: financeiro@empresa.com.br"
                  required
                />
              </div>
            </div>

            {/* PDF Color Palette Section */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <div>
                <span className="text-sm font-semibold text-gray-900 block">Cor Principal dos Documentos (Orçamentos/PDF)</span>
                <span className="text-xs text-gray-500 block">Altere o tom azul do PDF dos orçamentos para as cores originais da sua empresa</span>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={pdfThemeColor}
                  onChange={(e) => {
                    setPdfThemeColor(e.target.value);
                  }}
                  className="w-12 h-12 rounded-lg cursor-pointer border border-gray-300 p-1"
                />
                <div>
                  <span className="text-sm font-mono font-semibold text-gray-700 block uppercase">{pdfThemeColor}</span>
                  <span className="text-[11px] text-gray-400 block">💡 Use o conta-gotas do seletor para clicar na foto do seu logo ao lado e capturar a cor exata do seu logotipo!</span>
                </div>
              </div>
            </div>

            {/* Submit Block */}
            <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </button>
              {saveSuccess && (
                <span className="text-sm text-green-600 font-semibold animate-pulse">
                  ✓ Configurações salvas com sucesso!
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
