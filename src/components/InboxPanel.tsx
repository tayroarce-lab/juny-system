import React, { useState } from 'react';
import { Inbox, Mail, MailOpen, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import type { InboxMessage, InboxFilter } from '../types/supabase';

// ─── Format date ────────────────────────────────────────────────────
function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Props ──────────────────────────────────────────────────────────
interface InboxPanelProps {
  messages: InboxMessage[];
  totalMessages: number;
  unreadCount: number;
  filter: InboxFilter;
  loading: boolean;
  onFilterChange: (f: InboxFilter) => void;
  onMarkAsRead: (id: string) => void;
  onToggleGestionado: (id: string, value: boolean) => void;
}

export default function InboxPanel({
  messages,
  totalMessages,
  unreadCount,
  filter,
  loading,
  onFilterChange,
  onMarkAsRead,
  onToggleGestionado,
}: InboxPanelProps) {
  // Track the selected message object itself (not just its id) so the
  // detail view stays open even if the item drops out of the filtered
  // list — e.g. marking it as read while viewing the "No leídos" filter.
  const [selected, setSelected] = useState<InboxMessage | null>(null);

  const filterOptions: { value: InboxFilter; label: string }[] = [
    { value: 'unread', label: 'No leídos' },
    { value: 'unmanaged', label: 'Sin gestionar' },
    { value: 'all', label: 'Todos' },
  ];

  function handleSelect(msg: InboxMessage) {
    setSelected(msg.leido ? msg : { ...msg, leido: true });
    if (!msg.leido) onMarkAsRead(msg.id);
  }

  function handleToggleGestionado() {
    if (!selected) return;
    const next = !selected.gestionado;
    setSelected({ ...selected, gestionado: next });
    onToggleGestionado(selected.id, next);
  }

  return (
    <div className="glass-card overflow-hidden animate-fade-in-up">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="p-6 border-b border-glass-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
              <Inbox className="w-4.5 h-4.5 text-accent-cyan" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Bandeja de Entrada</h3>
              <p className="text-sm text-dark-200 mt-0.5">
                {totalMessages} mensaje{totalMessages !== 1 ? 's' : ''}
                {unreadCount > 0 && <span className="text-accent-indigo font-medium"> · {unreadCount} sin leer</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-dark-700/60 border border-dark-500/50 rounded-xl p-1">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onFilterChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === opt.value
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

      {/* ── Body: list + detail ───────────────────────────────── */}
      <div className="flex flex-col lg:flex-row min-h-[420px]">
        {/* List */}
        <div className="w-full lg:w-[360px] lg:border-r border-glass-border max-h-[560px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-dark-300" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
              <MailOpen className="w-8 h-8 text-dark-400" />
              <p className="text-dark-200 text-sm">Nada por aquí</p>
              <p className="text-dark-300 text-xs">No hay mensajes en este filtro</p>
            </div>
          ) : (
            messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => handleSelect(msg)}
                className={`w-full text-left px-5 py-4 border-b border-dark-600/30 transition-colors ${
                  selected?.id === msg.id ? 'bg-accent-indigo/10' : 'hover:bg-dark-700/30'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {msg.leido ? (
                    <Circle className="w-2 h-2 mt-1.5 text-dark-400 flex-shrink-0" />
                  ) : (
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-accent-indigo flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${msg.leido ? 'text-dark-100 font-normal' : 'text-white font-semibold'}`}>
                        {msg.from_name || msg.from_email || 'Desconocido'}
                      </p>
                      <span className="text-[11px] text-dark-300 flex-shrink-0">{formatDateTime(msg.received_at)}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${msg.leido ? 'text-dark-300' : 'text-dark-100'}`}>
                      {msg.subject || '(sin asunto)'}
                    </p>
                    <p className="text-xs text-dark-300 truncate mt-1">{msg.preview}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {msg.cuenta_email && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-600/60 text-dark-200">
                          {msg.cuenta_email}
                        </span>
                      )}
                      {msg.gestionado && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-emerald/15 text-accent-emerald">
                          Gestionado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="flex-1 p-6">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
              <Mail className="w-10 h-10 text-dark-400" />
              <p className="text-dark-200 text-sm">Selecciona un mensaje para leerlo</p>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-white font-semibold text-base">
                    {selected.subject || '(sin asunto)'}
                  </h4>
                  <p className="text-sm text-dark-200 mt-1">
                    De: <span className="text-dark-100">{selected.from_name ? `${selected.from_name} ` : ''}
                    &lt;{selected.from_email}&gt;</span>
                  </p>
                  <p className="text-xs text-dark-300 mt-0.5">
                    {formatDateTime(selected.received_at)}
                    {selected.cuenta_email && <> · recibido en {selected.cuenta_email}</>}
                  </p>
                </div>
                <button
                  onClick={handleToggleGestionado}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                    selected.gestionado
                      ? 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/20'
                      : 'bg-dark-700/60 border border-dark-500/50 text-dark-200 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {selected.gestionado ? 'Gestionado' : 'Marcar gestionado'}
                </button>
              </div>

              <div className="border-t border-glass-border pt-4">
                <p className="text-sm text-dark-100 whitespace-pre-wrap leading-relaxed">
                  {selected.body_text || selected.preview || '(sin contenido)'}
                </p>
              </div>

              <p className="text-[11px] text-dark-400 mt-6">
                Para responder, contesta este correo directamente desde la cuenta que lo recibió.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
