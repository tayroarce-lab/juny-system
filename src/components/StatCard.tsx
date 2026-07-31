import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number | null;
  icon: LucideIcon;
  color: 'indigo' | 'violet' | 'cyan' | 'emerald' | 'amber';
  suffix?: string;
  subtitle?: string;
  loading?: boolean;
  delay?: number;
}

const colorMap = {
  indigo: {
    iconBg: 'bg-accent-indigo/10',
    iconColor: 'text-accent-indigo',
    glow: 'stat-glow-indigo',
    badgeBg: 'bg-accent-indigo/15',
    badgeText: 'text-accent-indigo',
  },
  violet: {
    iconBg: 'bg-accent-violet/10',
    iconColor: 'text-accent-violet',
    glow: 'stat-glow-violet',
    badgeBg: 'bg-accent-violet/15',
    badgeText: 'text-accent-violet',
  },
  cyan: {
    iconBg: 'bg-accent-cyan/10',
    iconColor: 'text-accent-cyan',
    glow: 'stat-glow-cyan',
    badgeBg: 'bg-accent-cyan/15',
    badgeText: 'text-accent-cyan',
  },
  emerald: {
    iconBg: 'bg-accent-emerald/10',
    iconColor: 'text-accent-emerald',
    glow: 'stat-glow-emerald',
    badgeBg: 'bg-accent-emerald/15',
    badgeText: 'text-accent-emerald',
  },
  amber: {
    iconBg: 'bg-accent-amber/10',
    iconColor: 'text-accent-amber',
    glow: 'stat-glow-amber',
    badgeBg: 'bg-accent-amber/15',
    badgeText: 'text-accent-amber',
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  suffix,
  subtitle,
  loading = false,
  delay = 0,
}: StatCardProps) {
  const c = colorMap[color];
  const isUnavailable = value === null;

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-10 w-10 rounded-xl" />
        </div>
        <div className="skeleton h-8 w-20 mb-2" />
        <div className="skeleton h-3 w-16" />
      </div>
    );
  }

  return (
    <div
      className={`glass-card ${c.glow} p-6 animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-dark-200 tracking-wide uppercase">
          {title}
        </span>
        <div className={`${c.iconBg} p-2.5 rounded-xl`}>
          <Icon className={`w-5 h-5 ${c.iconColor}`} />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white tracking-tight">
          {isUnavailable ? '—' : typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {!isUnavailable && suffix && (
          <span
            className={`text-sm font-semibold px-2 py-0.5 rounded-full ${c.badgeBg} ${c.badgeText}`}
          >
            {suffix}
          </span>
        )}
      </div>
      {subtitle && !isUnavailable && (
        <p className="text-xs text-dark-300 mt-2">{subtitle}</p>
      )}
      {isUnavailable && (
        <p className="text-xs text-accent-amber mt-2">Sin acceso (falta política RLS)</p>
      )}
    </div>
  );
}
