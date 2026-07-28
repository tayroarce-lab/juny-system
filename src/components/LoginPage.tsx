import React, { useState } from 'react';
import { Zap, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  onClearError: () => void;
}

export default function LoginPage({
  onLogin,
  loading,
  error,
  onClearError,
}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    await onLogin(email.trim(), password.trim());
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* ── Ambient glow ──────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[-15%] w-[65%] h-[65%] rounded-full bg-accent-indigo/[0.04] blur-[140px]" />
        <div className="absolute bottom-[-25%] right-[-15%] w-[55%] h-[55%] rounded-full bg-accent-violet/[0.04] blur-[140px]" />
      </div>

      {/* ── Login Card ────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Top accent line */}
        <div className="h-[2px] bg-gradient-to-r from-accent-indigo via-accent-violet to-accent-cyan rounded-t-2xl" />

        <div className="glass-card rounded-t-none p-8">
          {/* Logo & Title */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-indigo to-accent-violet flex items-center justify-center shadow-lg shadow-accent-indigo/25 mb-5">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Juny YT Agency
            </h1>
            <p className="text-sm text-dark-200 mt-1.5 font-medium">
              Outreach Command Center
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-accent-rose/10 border border-accent-rose/20 mb-6 animate-fade-in-up">
              <AlertCircle className="w-4.5 h-4.5 text-accent-rose flex-shrink-0" />
              <p className="text-sm text-accent-rose flex-1">{error}</p>
              <button
                onClick={onClearError}
                className="text-accent-rose/60 hover:text-accent-rose text-xs font-medium"
              >
                ✕
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-dark-200 uppercase tracking-wider mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@junyagency.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 bg-dark-700/60 border border-dark-500/50 rounded-xl text-sm text-white placeholder-dark-300 focus:outline-none focus:border-accent-indigo/50 focus:ring-1 focus:ring-accent-indigo/20 disabled:opacity-50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-dark-200 uppercase tracking-wider mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full pl-11 pr-12 py-3 bg-dark-700/60 border border-dark-500/50 rounded-xl text-sm text-white placeholder-dark-300 focus:outline-none focus:border-accent-indigo/50 focus:ring-1 focus:ring-accent-indigo/20 disabled:opacity-50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-300 hover:text-dark-100 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-violet text-white font-semibold text-sm hover:shadow-lg hover:shadow-accent-indigo/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-dark-300 mt-6">
            Acceso restringido — Solo personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}
