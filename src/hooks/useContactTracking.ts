import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ContactStatus, ContactStatusValue, InboxReply } from '../types/supabase';

// Loads contact_status + inbox_replies (created by supabase/create_contact_tracking.sql).
// If those tables don't exist yet the panel still works from inbox_messages
// alone, and `available` tells the UI to show a setup hint.

function demo(): { statuses: ContactStatus[]; replies: InboxReply[] } {
  return {
    statuses: [
      { email: 'colaboraciones@canaldemo.com', status: 'whatsapp', note: 'Pasó a WhatsApp, esperando propuesta', updated_at: new Date().toISOString() },
    ],
    replies: [
      {
        id: 'demo-r1',
        message_id: 'demo-1',
        to_email: 'colaboraciones@canaldemo.com',
        cuenta_email: 'account_3',
        subject: 'Re: Optimiza tu canal',
        reply_text: 'Escríbenos por WhatsApp y te contamos las opciones.',
        sent_at: new Date(Date.now() - 1800_000).toISOString(),
      },
    ],
  };
}

export function useContactTracking() {
  const [statuses, setStatuses] = useState<ContactStatus[]>([]);
  const [replies, setReplies] = useState<InboxReply[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      const d = demo();
      setStatuses(d.statuses);
      setReplies(d.replies);
      setAvailable(true);
      setLoading(false);
      return;
    }
    const [st, rp] = await Promise.all([
      supabase.from('contact_status').select('*'),
      supabase.from('inbox_replies').select('*').order('sent_at', { ascending: true }),
    ]);
    // A missing table comes back as an error (not an empty list).
    if (st.error || rp.error) {
      console.warn('contact tracking unavailable:', st.error?.message ?? rp.error?.message);
      setAvailable(false);
      setStatuses([]);
      setReplies([]);
    } else {
      setAvailable(true);
      setStatuses((st.data ?? []) as ContactStatus[]);
      setReplies((rp.data ?? []) as InboxReply[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveStatus = useCallback(
    async (email: string, status: ContactStatusValue, note: string): Promise<{ ok: boolean; error?: string }> => {
      const key = email.toLowerCase();
      const row: ContactStatus = { email: key, status, note: note.trim() || null, updated_at: new Date().toISOString() };
      const prev = statuses;
      // optimistic
      setStatuses((p) => [...p.filter((s) => s.email.toLowerCase() !== key), row]);
      if (!isSupabaseConfigured || !supabase) return { ok: true };
      const { error } = await supabase.from('contact_status').upsert(row, { onConflict: 'email' });
      if (error) {
        setStatuses(prev);
        return { ok: false, error: error.message };
      }
      return { ok: true };
    },
    [statuses]
  );

  return { statuses, replies, available, loading, saveStatus, refresh: load };
}
