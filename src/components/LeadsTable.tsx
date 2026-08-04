import React from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  CirclePlay,
  Filter,
  Users,
} from 'lucide-react';
import type { Prospect, StatusFilter } from '../types/supabase';

// ─── Status Badge ───────────────────────────────────────────────────
function StatusBadge({ status }: { status: Prospect['status'] }) {
  const config = {
    replied: { label: 'Respondido', className: 'badge-replied' },
    in_sequence: { label: 'En Secuencia', className: 'badge-in-sequence' },
    pending: { label: 'Pendiente', className: 'badge-pending' },
  };

  const configKey = status as keyof typeof config;
  const { label, className } = config[configKey] ?? config.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

// ─── Format Date ────────────────────────────────────────────────────
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Skeleton Rows ──────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-dark-600/50">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="skeleton h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

// ─── Props ──────────────────────────────────────────────────────────
interface LeadsTableProps {
  prospects: Prospect[];
  totalProspects: number;
  page: number;
  totalPages: number;
  search: string;
  statusFilter: StatusFilter;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: StatusFilter) => void;
}

export default function LeadsTable({
  prospects,
  totalProspects,
  page,
  totalPages,
  search,
  statusFilter,
  loading = false,
  onPageChange,
  onSearchChange,
  onFilterChange,
}: LeadsTableProps) {
  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'in_sequence', label: 'En Secuencia' },
    { value: 'replied', label: 'Respondieron' },
  ];

  return (
    <div
      className="glass-card overflow-hidden animate-fade-in-up"
      style={{ animationDelay: '500ms' }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="p-6 border-b border-glass-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Prospect Tracker</h3>
            <p className="text-sm text-dark-200 mt-1">
              {totalProspects} prospecto{totalProspects !== 1 ? 's' : ''} encontrado{totalProspects !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
              <input
                type="text"
                placeholder="Buscar canal o email..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-dark-700/60 border border-dark-500/50 rounded-xl text-sm text-white placeholder-dark-300 focus:outline-none focus:border-accent-indigo/50 focus:ring-1 focus:ring-accent-indigo/20 transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1 bg-dark-700/60 border border-dark-500/50 rounded-xl p-1">
              <Filter className="w-4 h-4 text-dark-300 ml-2 mr-1" />
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onFilterChange(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === opt.value
                      ? 'bg-accent-indigo/20 text-accent-indigo'
                      : 'text-dark-200 hover:text-white hover:bg-dark-600/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-600/50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-200 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <CirclePlay className="w-3.5 h-3.5" />
                  Canal
                </div>
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-200 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </div>
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-200 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-200 uppercase tracking-wider">
                Último Seguimiento
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-dark-200 uppercase tracking-wider">
                Enriquecido
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            ) : prospects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Search className="w-8 h-8 text-dark-400" />
                    <p className="text-dark-200 text-sm">No se encontraron prospectos</p>
                    <p className="text-dark-300 text-xs">Intenta ajustar los filtros de búsqueda</p>
                  </div>
                </td>
              </tr>
            ) : (
              prospects.map((prospect) => (
                <tr
                  key={prospect.id}
                  className="border-b border-dark-600/30 hover:bg-dark-700/30 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-rose/10 flex items-center justify-center flex-shrink-0">
                        <CirclePlay className="w-4 h-4 text-accent-rose" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">
                          {prospect.channel_name}
                        </p>
                        {prospect.suscriptores != null && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-dark-300">
                            <Users className="w-3 h-3" />
                            {new Intl.NumberFormat('es-MX').format(prospect.suscriptores)} subs
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-dark-100 truncate block max-w-[220px]">
                      {prospect.email}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={prospect.status} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-dark-200">
                      {formatDate(prospect.last_followup)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-dark-300">
                      {formatDate(prospect.fecha_enriquecimiento)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-dark-600/50">
          <p className="text-sm text-dark-300">
            Página <span className="text-white font-medium">{page}</span> de{' '}
            <span className="text-white font-medium">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-dark-700/60 border border-dark-500/50 text-dark-200 hover:text-white hover:border-dark-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-dark-700/60 border border-dark-500/50 text-dark-200 hover:text-white hover:border-dark-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
