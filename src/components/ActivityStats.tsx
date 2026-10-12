import React, { useMemo, useState } from 'react';
import { AlertCircle, Info, MessageSquareReply, Percent, Send } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import StatCard from './StatCard';
import { useActivityData } from '../hooks/useActivityData';
import { summarize, WINDOW, type Granularity } from '../lib/activityStats';

const OPTIONS: { value: Granularity; label: string; unit: string; windowText: string }[] = [
  { value: 'day', label: 'Día', unit: 'día', windowText: `últimos ${WINDOW.day} días completos` },
  { value: 'week', label: 'Semana', unit: 'semana', windowText: `últimas ${WINDOW.week} semanas completas` },
  { value: 'month', label: 'Mes', unit: 'mes', windowText: `últimos ${WINDOW.month} meses completos` },
];

function fmt(n: number | null): string | null {
  if (n === null) return null;
  return n.toLocaleString('es', { maximumFractionDigits: n >= 100 ? 0 : 1 });
}

function ActivityTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const partial = payload[0]?.payload?.partial;
  return (
    <div className="bg-dark-700 border border-dark-500 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-sm font-semibold text-white mb-1">
        {label}
        {partial && <span className="ml-2 text-xs font-normal text-accent-amber">en curso</span>}
      </p>
      {payload.map((e: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: e.color }}>
          {e.name}: <span className="font-bold">{Number(e.value).toLocaleString('es')}</span>
        </p>
      ))}
    </div>
  );
}

export default function ActivityStats() {
  const { data, loading, error, demoMode } = useActivityData();
  const [g, setG] = useState<Granularity>('week');
  const opt = OPTIONS.find((o) => o.value === g)!;

  const summary = useMemo(
    () => (data ? summarize(data.sentDates, data.replyDates, g) : null),
    [data, g]
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-medium text-dark-200 tracking-wide uppercase">Actividad y promedios</h2>
          <p className="text-xs text-dark-300 mt-1">
            Correos enviados (día 1 + seguimientos) y respuestas recibidas · {opt.windowText}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-dark-700/60 border border-dark-500/50 rounded-lg p-0.5">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setG(o.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                g === o.value ? 'bg-accent-indigo/20 text-accent-indigo' : 'text-dark-200 hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20">
          <AlertCircle className="w-5 h-5 text-accent-rose flex-shrink-0" />
          <p className="text-xs text-dark-200">No se pudo cargar la actividad: {error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title={`Enviados por ${opt.unit}`}
              value={fmt(summary?.avgSent ?? null)}
              icon={Send}
              color="indigo"
              subtitle={`Promedio · ${summary ? summary.windowSent.toLocaleString('es') : 0} en total`}
              loading={loading}
              delay={0}
            />
            <StatCard
              title={`Respuestas por ${opt.unit}`}
              value={fmt(summary?.avgReplies ?? null)}
              icon={MessageSquareReply}
              color="emerald"
              subtitle={`Promedio · ${summary ? summary.windowReplies.toLocaleString('es') : 0} en total`}
              loading={loading}
              delay={50}
            />
            <StatCard
              title="Respuestas por 100 enviados"
              value={fmt(summary?.replyPer100 ?? null)}
              icon={Percent}
              color="violet"
              subtitle="Respuestas ÷ enviados del mismo periodo"
              loading={loading}
              delay={100}
            />
          </div>

          <div className="glass-card p-6">
            {loading || !summary ? (
              <div className="skeleton h-64 w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={summary.buckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#a8a8c8', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={14}
                  />
                  <YAxis
                    yAxisId="sent"
                    tick={{ fill: '#a8a8c8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId="replies"
                    orientation="right"
                    tick={{ fill: '#10b981', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ActivityTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#a8a8c8' }} />
                  <Bar yAxisId="sent" dataKey="sent" name="Enviados" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {summary.buckets.map((b) => (
                      <Cell key={b.key} fill="#6366f1" fillOpacity={b.partial ? 0.35 : 1} />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="replies"
                    type="monotone"
                    dataKey="replies"
                    name="Respuestas"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
            <p className="flex items-start gap-2 text-xs text-dark-300 mt-4">
              <Info className="w-4 h-4 flex-shrink-0 mt-px" />
              <span>
                Los promedios usan solo periodos completos (el actual, en tono claro, no cuenta) y empiezan en el
                primer periodo con datos. Las respuestas son los mensajes de la Bandeja de Entrada, así que incluyen
                respuestas automáticas y negativas, no solo interesados.
                {demoMode && ' Datos de demostración.'}
              </span>
            </p>
          </div>
        </>
      )}
    </section>
  );
}
