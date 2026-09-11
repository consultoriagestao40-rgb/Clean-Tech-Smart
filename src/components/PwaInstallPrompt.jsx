import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('pwa_prompt_dismissed') === 'true';
  });

  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  });

  useEffect(() => {
    if (isInstalled) return;

    const handleBeforeInstallPrompt = (e) => {
      // Impede o mini-infobar padrão do Chrome no Android
      e.preventDefault();
      // Armazena o evento para acionar no clique do botão
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('PWA: Evento beforeinstallprompt capturado com sucesso!');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA: Aplicativo instalado com sucesso no dispositivo!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback informativo se o navegador não disparou o prompt nativo
      alert('Para instalar no seu celular:\n1. Toque nos 3 pontinhos (⋮) do Chrome\n2. Selecione "Instalar aplicativo"');
      return;
    }

    // Dispara o prompt nativo do Android
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: Escolha do usuário: ${outcome}`);

    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  // Não exibe se já estiver instalado, se não for instalável ou se foi dispensado
  if (isInstalled || !isInstallable || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gradient-to-r from-cyan-900 via-sky-900 to-indigo-950 text-white p-4 rounded-2xl shadow-2xl border border-cyan-500/30 backdrop-blur-md flex items-center space-x-3.5">
        <div className="w-12 h-12 rounded-xl bg-white/10 p-1.5 border border-white/20 shrink-0 flex items-center justify-center overflow-hidden">
          <img 
            src="/icons/icon-192x192.png" 
            alt="Clean Tech Smart" 
            className="w-full h-full object-contain drop-shadow-md"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-sm text-white truncate">Clean Tech Smart</span>
            <span className="bg-cyan-400/20 text-cyan-200 text-[10px] font-bold px-1.5 py-0.2 rounded border border-cyan-400/30 uppercase">App</span>
          </div>
          <p className="text-[11px] text-cyan-100/80 leading-tight mt-0.5">
            Instale como aplicativo oficial no celular com tela cheia e acesso rápido.
          </p>

          <div className="flex items-center space-x-2 mt-2.5">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center active:scale-95"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Instalar App
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-white/60 hover:text-white transition-colors px-2 py-1"
            >
              Agora não
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-white/40 hover:text-white transition-colors p-1 -mt-7 -mr-1"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
