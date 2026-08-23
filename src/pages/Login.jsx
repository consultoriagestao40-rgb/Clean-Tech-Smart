import { useState, useEffect } from 'react';
import { Shield, Mail, Key, Loader2, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Google OAuth Return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get('google_token');
    const googleUser = params.get('google_user');
    const authError = params.get('error');

    if (authError) {
      setErrorMessage(`Erro ao autenticar com o Google: ${authError}`);
    }

    if (googleToken && googleUser) {
      try {
        localStorage.setItem('token', googleToken);
        localStorage.setItem('user', googleUser);
        window.location.href = '/agente-ads';
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, informe o e-mail e a senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        // Save auth data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Redirect to homepage/dashboard
        window.location.href = '/';
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Credenciais inválidas. Tente novamente.');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('Erro de rede ao autenticar. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans select-none">
      
      {/* Login Card */}
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-md p-8 shadow-xl space-y-6 text-left">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          
          {/* Logo Symbol wrapper */}
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            <Shield className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-xl font-black text-white tracking-wide mt-3 uppercase">Clean Tech Smart</h2>
          <p className="text-xs text-slate-400 font-semibold">Acesse o sistema operacional corporativo</p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 font-semibold text-center leading-relaxed">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Email input */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="Ex: cristiano.godoi@hotmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Senha de Acesso</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Remember Me dummy */}
          <div className="flex items-center justify-between text-xxs font-bold text-slate-400">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" className="accent-blue-500 rounded" defaultChecked />
              <span>Manter conectado</span>
            </label>
            <span className="hover:text-blue-400 cursor-pointer transition-colors flex items-center gap-1">
              <Lock className="w-3 h-3" /> Conexão Segura SSL
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:from-blue-500 disabled:to-cyan-400 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
            {isLoading ? 'Autenticando...' : 'Acessar Sistema'}
          </button>

          {/* Divisor */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-[10px] font-bold uppercase tracking-wider">ou</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          {/* Botão de Conectar / Entrar com Google */}
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch('/api/ads/google-auth-url');
                const data = await res.json();
                if (data.authUrl) {
                  window.location.href = data.authUrl;
                }
              } catch (err) {
                console.error(err);
                setErrorMessage('Não foi possível conectar com o Google no momento.');
              }
            }}
            className="w-full h-11 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer border border-slate-300"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Entrar com a Conta Google
          </button>

        </form>

        {/* Footer info */}
        <p className="text-[9px] text-slate-500 text-center font-bold uppercase tracking-wider">
          © {new Date().getFullYear()} Clean Tech Smart • Todos os direitos reservados
        </p>

      </div>
    </div>
  );
}
