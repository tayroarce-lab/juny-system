import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { InboxMessage, InboxFilter } from '../types/supabase';

// ─── Demo data for when Supabase isn't configured ───────────────────
function getDemoMessages(): InboxMessage[] {
  return [
    {
      id: 'demo-1',
      channel_id: 'demo-channel-1',
      cuenta_email: 'account_3',
      from_email: 'colaboraciones@canaldemo.com',
      from_name: 'Canal Demo',
      subject: 'Re: Optimiza tu canal',
      preview: 'Gracias por contactarme, justo estaba buscando algo así...',
      body_html: '<p>Gracias por contactarme, justo estaba buscando algo así para mi canal. ¿Podemos agendar una llamada?</p>',
      body_text: 'Gracias por contactarme, justo estaba buscando algo así para mi canal. ¿Podemos agendar una llamada?',
      received_at: new Date(Date.now() - 3600_000).toISOString(),
      thread_id: 'demo-thread-1',
      leido: false,
      gestionado: false,
    },
    {
      id: 'demo-2',
      channel_id: 'demo-channel-2',
      cuenta_email: 'michael@junyyt.com',
      from_email: 'contacto@otrocanal.com',
      from_name: 'Otro Canal',
      subject: 'Una idea para tu canal',
      preview: 'No estoy interesado por ahora, gracias.',
      body_html: '<p>No estoy interesado por ahora, gracias.</p>',
      body_text: 'No estoy interesado por ahora, gracias.',
      received_at: new Date(Date.now() - 86400_000).toISOString(),
      thread_id: null,
      leido: true,
      gestionado: true,
    },
  ];
}

export function useInboxData() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [filter, setFilter] = useState<InboxFilter>('unread');

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      const demo = getDemoMessages();
      setMessages(demo);
      setDemoMode(true);
      setLoading(false);
      return;
    }

    const { data, error: fetchErr } = await supabase
      .from('inbox_messages')
      .select('*')
      .order('received_at', { ascending: false });

    if (fetchErr) {
      setError(fetchErr.message);
      setMessages([]);
    } else {
      setMessages((data ?? []) as InboxMessage[]);
      setDemoMode(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ── Mark as read (optimistic local update + best-effort DB write)
  const markAsRead = useCallback(async (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, leido: true } : m)));
    if (!isSupabaseConfigured || !supabase || id.startsWith('demo-')) return;
    await supabase.from('inbox_messages').update({ leido: true }).eq('id', id);
  }, []);

  // ── Toggle "gestionado" (handled/done)
  const toggleGestionado = useCallback(async (id: string, value: boolean) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, gestionado: value } : m)));
    if (!isSupabaseConfigured || !supabase || id.startsWith('demo-')) return;
    await supabase.from('inbox_messages').update({ gestionado: value }).eq('id', id);
  }, []);

  const filtered = messages.filter((m) => {
    if (filter === 'unread') return !m.leido;
    if (filter === 'unmanaged') return !m.gestionado;
    return true;
  });

  const unreadCount = messages.filter((m) => !m.leido).length;

  return {
    messages: filtered,
    totalMessages: messages.length,
    unreadCount,
    filter,
    setFilter,
    loading,
    error,
    demoMode,
    refresh: fetchMessages,
    markAsRead,
    toggleGestionado,
  };
}
