import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { addDays, localDate, todayLocal } from '../lib/activityStats';

// One entry per email sent / reply received, as 'YYYY-MM-DD'.
export interface ActivityData {
  sentDates: string[];
  replyDates: string[];
}

const PAGE = 1000; // Supabase's default row cap per request

// Pages through a table so the 1000-row cap doesn't silently truncate the data.
async function fetchAll(table: string, columns: string): Promise<any[]> {
  const rows: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase!
      .from(table)
      .select(columns)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

// n8n writes dayN_sent (a date); dayN_sent_at is the legacy timestamp column.
function sentDate(a: string | null | undefined, b: string | null | undefined): string | null {
  const v = a || b;
  return v ? String(v).slice(0, 10) : null;
}

function demoData(): ActivityData {
  const today = todayLocal();
  const sentDates: string[] = [];
  const replyDates: string[] = [];
  for (let i = 1; i <= 120; i++) {
    const d = addDays(today, -i);
    const n = Math.round(30 + (120 - i) * 0.9 + ((i * 7) % 13));
    for (let j = 0; j < n; j++) sentDates.push(d);
    const r = Math.round(n * 0.03) + (i % 3 === 0 ? 1 : 0);
    for (let j = 0; j < r; j++) replyDates.push(d);
  }
  return { sentDates, replyDates };
}

export function useActivityData() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      setData(demoData());
      setDemoMode(true);
      setLoading(false);
      return;
    }

    try {
      const [trackers, inbox] = await Promise.all([
        fetchAll(
          'sequence_tracker',
          'id,day1_sent,day4_sent,day9_sent,day14_sent,day1_sent_at,day4_sent_at,day9_sent_at,day14_sent_at'
        ),
        fetchAll('inbox_messages', 'id,from_email,received_at'),
      ]);

      // Every dayN date is one email sent (day 1 + the three follow-ups).
      const sentDates: string[] = [];
      for (const t of trackers) {
        for (const n of [1, 4, 9, 14]) {
          const d = sentDate(t[`day${n}_sent`], t[`day${n}_sent_at`]);
          if (d) sentDates.push(d);
        }
      }

      // Replies = messages that reached the inbox panel. Internal tests sent
      // from our own @junyyt.com mailboxes are not replies from prospects.
      const replyDates: string[] = [];
      for (const m of inbox) {
        if (String(m.from_email ?? '').toLowerCase().endsWith('@junyyt.com')) continue;
        const d = m.received_at ? localDate(m.received_at) : null;
        if (d) replyDates.push(d);
      }

      setData({ sentDates, replyDates });
      setDemoMode(false);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar la actividad');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, demoMode, refresh: load };
}
