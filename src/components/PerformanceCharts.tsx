import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import type { FunnelStage, AccountPerformance } from '../types/supabase';

// ─── Custom Tooltip ─────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-700 border border-dark-500 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-sm font-semibold text-white mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Funnel Chart ───────────────────────────────────────────────────
interface FunnelChartProps {
  data: FunnelStage[];
  loading?: boolean;
}

export function FunnelChart({ data, loading }: FunnelChartProps) {
  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="skeleton h-5 w-48 mb-6" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Rendimiento por Etapa</h3>
          <p className="text-sm text-dark-200 mt-1">Correos enviados por día de secuencia</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barCategoryGap="25%">
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="stage"
            tick={{ fill: '#a8a8c8', fontSize: 13 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#a8a8c8', fontSize: 13 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="count" name="Correos" radius={[8, 8, 0, 0]} maxBarSize={60}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Account Performance Chart ──────────────────────────────────────
interface AccountChartProps {
  data: AccountPerformance[];
  loading?: boolean;
}

export function AccountChart({ data, loading }: AccountChartProps) {
  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="skeleton h-5 w-52 mb-6" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    );
  }

  // Shorten email labels for display
  const chartData = data.map((d) => ({
    ...d,
    shortAccount: d.account.split('@')[0],
  }));

  return (
    <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Rendimiento por Cuenta</h3>
          <p className="text-sm text-dark-200 mt-1">Comparativa de envíos y respuestas</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barCategoryGap="20%">
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="shortAccount"
            tick={{ fill: '#a8a8c8', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#a8a8c8', fontSize: 13 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend
            wrapperStyle={{ paddingTop: 12, fontSize: 13 }}
            formatter={(value) => (
              <span className="text-dark-100">{value}</span>
            )}
          />
          <Bar
            dataKey="totalSent"
            name="Enviados"
            fill="#6366f1"
            radius={[6, 6, 0, 0]}
            maxBarSize={45}
          />
          <Bar
            dataKey="replies"
            name="Respuestas"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
            maxBarSize={45}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
