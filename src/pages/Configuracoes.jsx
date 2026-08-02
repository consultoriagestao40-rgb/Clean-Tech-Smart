import { useState } from 'react';
import { ArrowLeft, Upload, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Configuracoes() {
  const [logo, setLogo] = useState(localStorage.getItem('app_company_logo') || '');

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
      localStorage.setItem('app_company_logo', dataUrl);
      setLogo(dataUrl);
      window.dispatchEvent(new Event('logoChanged'));
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => {
    if (confirm('Tem certeza de que deseja remover o logotipo oficial?')) {
      localStorage.removeItem('app_company_logo');
      setLogo('');
      window.dispatchEvent(new Event('logoChanged'));
    }
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
            <p className="text-sm text-gray-500 mt-1">Personalize a identidade visual e as preferências do painel</p>
          </div>
        </div>
      </header>

      {/* Settings Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Identidade Visual da Empresa</h2>
          <p className="text-sm text-gray-500">Suba o logotipo oficial para substituir o nome padrão no topo do menu lateral</p>
        </div>

        <div className="border-t border-gray-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Upload Area */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Logotipo Oficial</label>
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

          {/* Preview Area */}
          <div className="flex flex-col justify-between border border-gray-100 bg-gray-50 rounded-lg p-6 min-h-[160px]">
            <div>
              <span className="text-sm font-medium text-gray-600 block mb-3">Prévia no Menu Lateral</span>
              <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center min-h-[80px]">
                {logo ? (
                  <img src={logo} alt="Logo" className="max-h-12 max-w-full object-contain" />
                ) : (
                  <span className="text-gray-400 italic text-sm">Nenhum logotipo oficial definido (mostrando padrão "Clean Tech Smart")</span>
                )}
              </div>
            </div>
            {logo && (
              <button
                type="button"
                onClick={handleLogoRemove}
                className="mt-4 flex items-center justify-center px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium self-start"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover Logotipo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
