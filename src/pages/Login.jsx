import { useState } from 'react';
import { Shield, Mail, Key, Loader2, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:from-blue-500 disabled:to-cyan-400 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
            {isLoading ? 'Autenticando...' : 'Acessar Sistema'}
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
