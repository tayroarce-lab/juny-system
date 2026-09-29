import React from 'react';
import { AlertCircle, Info, MailCheck, MailX, Send, ShieldAlert } from 'lucide-react';
import StatCard from './StatCard';
import { useBrevoStats } from '../hooks/useBrevoStats';

// Standalone tab: every number here is read live from Brevo (via the WF-09 n8n
// webhook), NOT from our own Supabase tables.
export default function BrevoPanel() {
  const { stats, days, setDays, loading, error } = useBrevoStats();

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 animate-fade-in-up">
        <Info className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-accent-cyan">Datos de Brevo</p>
          <p className="text-xs text-dark-200 mt-0.5">
            Relay de envío de los buzones @junyyt.com. Estas cifras vienen de Brevo, no de nuestra base de
            datos; no incluyen las cuentas Gmail.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-dark-200 tracking-wide uppercase">Entregabilidad</h2>
        <div className="flex items-center gap-1 bg-dark-700/60 border border-dark-500/50 rounded-lg p-0.5">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                days === d ? 'bg-accent-indigo/20 text-accent-indigo' : 'text-dark-200 hover:text-white'
              }`}
            >
              {d} días
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20">
          <AlertCircle className="w-5 h-5 text-accent-rose flex-shrink-0" />
          <p className="text-xs text-dark-200">No se pudieron cargar las métricas de Brevo: {error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Enviados"
            value={stats?.sent ?? 0}
            icon={Send}
            color="cyan"
            subtitle={`Últimos ${days} días`}
            loading={loading}
            delay={0}
          />
          <StatCard
            title="Entregado"
            value={stats?.delivered_pct.toFixed(1) ?? '0.0'}
            icon={MailCheck}
            color="emerald"
            suffix="%"
            loading={loading}
            delay={50}
          />
          <StatCard
            title="Hard Bounce"
            value={stats?.hard_bounce_pct.toFixed(1) ?? '0.0'}
            icon={MailX}
            color="amber"
            suffix="%"
            subtitle={`${stats?.hard_bounces ?? 0} correos`}
            loading={loading}
            delay={100}
          />
          <StatCard
            title="Bloqueados"
            value={stats?.blocked ?? 0}
            icon={ShieldAlert}
            color="violet"
            loading={loading}
            delay={150}
          />
        </div>
      )}
    </section>
  );
}
