import React from 'react';
import {
  RefreshCw,
  Clock,
  Zap,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  lastSync: Date | null;
  loading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

function formatSyncTime(date: Date | null): string {
  if (!date) return 'Nunca';
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function Header({ lastSync, loading, onRefresh, onLogout }: HeaderProps) {
  return (
    <header className="relative overflow-hidden">
      {/* Subtle gradient accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-indigo via-accent-violet to-accent-cyan" />

      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-indigo to-accent-violet flex items-center justify-center shadow-lg shadow-accent-indigo/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Juny YT Agency
            </h1>
            <p className="text-sm text-dark-200 font-medium">
              Outreach Command Center
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* System status badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-emerald/10 border border-accent-emerald/20">
            <div className="pulse-dot" />
            <span className="text-xs font-semibold text-accent-emerald">
              En Línea
            </span>
          </div>

          {/* Last sync */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-700/50 border border-dark-500/40">
            <Clock className="w-3.5 h-3.5 text-dark-300" />
            <span className="text-xs text-dark-200">
              Sync: {formatSyncTime(lastSync)}
            </span>
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-indigo/15 border border-accent-indigo/25 text-accent-indigo hover:bg-accent-indigo/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {loading ? 'Actualizando...' : 'Actualizar'}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 p-2 rounded-xl bg-dark-700/50 border border-dark-500/40 text-dark-200 hover:text-accent-rose hover:bg-accent-rose/10 hover:border-accent-rose/20 transition-all ml-2"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
