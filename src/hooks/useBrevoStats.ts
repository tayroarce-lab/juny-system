import { useCallback, useEffect, useState } from 'react';

export interface BrevoStats {
  days: number;
  sent: number;
  delivered_pct: number;
  hard_bounces: number;
  hard_bounce_pct: number;
  blocked: number;
}

// Brevo aggregated stats come through the WF-09 n8n webhook (the Brevo API key
// never reaches the browser). The URL is derived from the reply webhook so no
// extra env var is needed.
function statsUrl(): string | null {
  const reply = import.meta.env.VITE_N8N_REPLY_WEBHOOK_URL as string | undefined;
  if (!reply) return null;
  return reply.replace(/\/webhook\/[^/]+$/, '/webhook/brevo-stats');
}

export function useBrevoStats() {
  const [days, setDays] = useState<7 | 30>(7);
  const [stats, setStats] = useState<BrevoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const url = statsUrl();
    const secret = import.meta.env.VITE_N8N_REPLY_SECRET as string | undefined;
    if (!url || !secret) {
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Panel-Secret': secret },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `Error ${res.status}`);
      setStats(data as BrevoStats);
    } catch (e) {
      setStats(null);
      setError(e instanceof Error ? e.message : 'No se pudo cargar Brevo');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, days, setDays, loading, error, refresh: load };
}
