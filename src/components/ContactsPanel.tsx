import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2, MessageSquare, RotateCcw, Send, Users } from 'lucide-react';
import type { ContactStatusValue, InboxMessage } from '../types/supabase';
import { STATUS_OPTIONS, type Contact } from '../lib/contacts';
import type { useContactTracking } from '../hooks/useContactTracking';

type Filter = 'pending' | 'open' | 'done' | 'all';

function fmt(dateStr: string | number): string {
  return new Date(dateStr).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ value }: { value: ContactStatusValue }) {
  const o = STATUS_OPTIONS.find((s) => s.value === value) ?? STATUS_OPTIONS[0];
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${o.tone}`}>{o.label}</span>;
}

interface Props {
  contacts: Contact[];
  tracking: ReturnType<typeof useContactTracking>;
  loading: boolean;
  onSendReply: (message: InboxMessage, replyText: string) => Promise<{ ok: boolean; error?: string }>;
}

export default function ContactsPanel({ contacts, tracking, loading, onSendReply }: Props) {
  const [filter, setFilter] = useState<Filter>('pending');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<ContactStatusValue>('nuevo');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      pending: contacts.filter((c) => c.pending).length,
      returned: contacts.filter((c) => c.returned).length,
      all: contacts.length,
    }),
    [contacts]
  );

  const visible = contacts.filter((c) => {
    if (filter === 'pending') return c.pending;
    if (filter === 'open') return !c.automated && c.status !== 'cerrado' && c.status !== 'perdido';
    if (filter === 'done') return c.status === 'cerrado' || c.status === 'perdido';
    return true;
  });

  const selected: Contact | undefined = contacts.find((c) => c.email === selectedEmail);

  // Load the stored status / note when another contact is opened.
  useEffect(() => {
    setStatus(selected?.status ?? 'nuevo');
    setNote(selected?.note ?? '');
    setSaveMsg(null);
    setReplyText('');
    setSendError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmail]);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setSaveMsg(null);
    const r = await tracking.saveStatus(selected.email, status, note);
    setSaving(false);
    setSaveMsg(r.ok ? 'Guardado.' : `No se pudo guardar: ${r.error}`);
  }

  async function handleReply() {
    if (!selected || !replyText.trim() || sending) return;
    setSending(true);
    setSendError(null);
    const r = await onSendReply(selected.last, replyText.trim());
    setSending(false);
    if (r.ok) {
      setReplyText('');
      // The reply log is written by n8n a moment after sending.
      setTimeout(() => tracking.refresh(), 2500);
    } else {
      setSendError(r.error || 'No se pudo enviar la respuesta.');
    }
  }

  // Chronological thread: what they wrote + what we answered from the panel.
  const thread = selected
    ? [
        ...selected.messages.map((m) => ({
          kind: 'in' as const,
          at: m.received_at,
          text: m.body_text || m.preview || '',
          subject: m.subject,
        })),
        ...selected.replies.map((r) => ({
          kind: 'out' as const,
          at: r.sent_at,
          text: r.reply_text || '',
          subject: r.subject,
        })),
      ].sort((a, b) => a.at.localeCompare(b.at))
    : [];

  const filters: { value: Filter; label: string }[] = [
    { value: 'pending', label: `Por responder (${counts.pending})` },
    { value: 'open', label: 'Abiertos' },
    { value: 'done', label: 'Cerrados' },
    { value: 'all', label: 'Todos' },
  ];

  return (
    <div className="glass-card overflow-hidden animate-fade-in-up">
      <div className="p-6 border-b border-glass-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-violet/10 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-accent-violet" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Contactos</h3>
              <p className="text-sm text-dark-200 mt-0.5">
                {counts.all} persona{counts.all !== 1 ? 's' : ''} que han respondido
                {counts.pending > 0 && <span className="text-accent-amber font-medium"> · {counts.pending} por responder</span>}
                {counts.returned > 0 && <span className="text-accent-rose font-medium"> · {counts.returned} volvieron a escribir</span>}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1 bg-dark-700/60 border border-dark-500/50 rounded-xl p-1">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f.value ? 'bg-accent-indigo/20 text-accent-indigo' : 'text-dark-200 hover:text-white hover:bg-dark-600/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {!tracking.available && (
          <div className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-accent-amber/10 border border-accent-amber/20">
            <AlertCircle className="w-4 h-4 text-accent-amber flex-shrink-0 mt-0.5" />
            <p className="text-xs text-dark-200">
              Falta crear las tablas <code>contact_status</code> e <code>inbox_replies</code> (ejecutar{' '}
              <code>supabase/create_contact_tracking.sql</code> en Supabase). Mientras tanto "por responder" se calcula solo con
              el marcador "gestionado", y el estado y las notas no se guardan.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row min-h-[420px]">
        {/* List */}
        <div className="w-full lg:w-[360px] lg:border-r border-glass-border max-h-[600px] overflow-y-auto">
          {loading || tracking.loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-dark-300" />
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-dark-400" />
              <p className="text-dark-200 text-sm">Nada por aquí</p>
            </div>
          ) : (
            visible.map((c) => (
              <button
                key={c.email}
                onClick={() => setSelectedEmail(c.email)}
                className={`w-full text-left px-5 py-4 border-b border-dark-600/30 transition-colors ${
                  selectedEmail === c.email ? 'bg-accent-indigo/10' : 'hover:bg-dark-700/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm truncate ${c.pending ? 'text-white font-semibold' : 'text-dark-100'}`}>{c.name}</p>
                  <span className="text-[11px] text-dark-300 flex-shrink-0">{fmt(c.lastInboundAt)}</span>
                </div>
                <p className="text-xs text-dark-300 truncate mt-0.5">{c.email}</p>
                <p className="text-xs text-dark-300 truncate mt-1">{c.last.preview}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <StatusBadge value={c.status} />
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-600/60 text-dark-200">
                    {c.messages.length} mensaje{c.messages.length !== 1 ? 's' : ''}
                  </span>
                  {c.returned && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent-rose/15 text-accent-rose">
                      <RotateCcw className="w-3 h-3" /> Volvió a escribir
                    </span>
                  )}
                  {c.pending && !c.returned && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent-amber/15 text-accent-amber">
                      <Clock className="w-3 h-3" /> {c.waitingDays === 0 ? 'Hoy' : `${c.waitingDays} d sin responder`}
                    </span>
                  )}
                  {c.pending && c.returned && c.waitingDays !== null && c.waitingDays > 0 && (
                    <span className="text-[10px] text-accent-amber">{c.waitingDays} d esperando</span>
                  )}
                  {c.automated && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-600/60 text-dark-300">Automático</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="flex-1 p-6">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
              <MessageSquare className="w-10 h-10 text-dark-400" />
              <p className="text-dark-200 text-sm">Selecciona un contacto para ver la conversación</p>
            </div>
          ) : (
            <div className="animate-fade-in-up space-y-6">
              <div>
                <h4 className="text-white font-semibold text-base">{selected.name}</h4>
                <p className="text-sm text-dark-200 mt-0.5">{selected.email}</p>
              </div>

              {/* Estado + nota */}
              <div className="rounded-xl bg-dark-700/40 border border-dark-500/40 p-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setStatus(o.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        status === o.value
                          ? `${o.tone} border-current`
                          : 'border-dark-500/50 text-dark-300 hover:text-white'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Nota (ej. pasó a WhatsApp el 12 oct, espera propuesta)"
                  className="w-full rounded-xl bg-dark-700/60 border border-dark-500/50 text-sm text-white placeholder:text-dark-300 p-3 focus:outline-none focus:border-accent-indigo/50 resize-none"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || !tracking.available}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-accent-indigo/20 text-accent-indigo hover:bg-accent-indigo/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Guardar estado
                  </button>
                  {saveMsg && <span className="text-xs text-dark-200">{saveMsg}</span>}
                </div>
              </div>

              {/* Conversación */}
              <div className="space-y-3">
                {thread.map((t, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-4 border ${
                      t.kind === 'in'
                        ? 'bg-dark-700/30 border-dark-500/40 mr-8'
                        : 'bg-accent-indigo/10 border-accent-indigo/20 ml-8'
                    }`}
                  >
                    <p className="text-[11px] text-dark-300 mb-1.5">
                      {t.kind === 'in' ? 'Ellos' : 'Nosotros (panel)'} · {fmt(t.at)}
                    </p>
                    <p className="text-sm text-dark-100 whitespace-pre-wrap leading-relaxed">{t.text || '(sin contenido)'}</p>
                  </div>
                ))}
                {tracking.available && selected.replies.length === 0 && (
                  <p className="text-[11px] text-dark-400">
                    No hay respuestas registradas desde el panel para este contacto (las enviadas por otro medio, como
                    WhatsApp, no aparecen).
                  </p>
                )}
              </div>

              {/* Responder */}
              <div className="border-t border-glass-border pt-4">
                <label className="text-xs font-medium text-dark-200 mb-2 block">Responder al último mensaje</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={sending}
                  rows={4}
                  placeholder="Escribe tu respuesta..."
                  className="w-full rounded-xl bg-dark-700/60 border border-dark-500/50 text-sm text-white placeholder:text-dark-300 p-3 focus:outline-none focus:border-accent-indigo/50 disabled:opacity-50 resize-none"
                />
                <div className="flex items-center justify-end mt-2">
                  <button
                    onClick={handleReply}
                    disabled={sending || !replyText.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-accent-indigo/20 text-accent-indigo hover:bg-accent-indigo/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {sending ? 'Enviando...' : 'Enviar respuesta'}
                  </button>
                </div>
                {sendError && <p className="text-xs text-accent-rose mt-2">{sendError}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
