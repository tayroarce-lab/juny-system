import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  DashboardMetrics,
  SequenceTracker,
  Prospect,
  FunnelStage,
  StatusFilter,
} from '../types/supabase';

// ─── Funnel colors ──────────────────────────────────────────────────
const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];

// ─── Helper: derive last followup date ──────────────────────────────
function lastFollowup(s: SequenceTracker): string | null {
  return (s.day14_sent_at || s.day14_sent) ?? (s.day9_sent_at || s.day9_sent) ?? (s.day4_sent_at || s.day4_sent) ?? (s.day1_sent_at || s.day1_sent) ?? null;
}

// ─── Demo data for when Supabase isn't configured ───────────────────
function getDemoData() {
  const metrics: DashboardMetrics = {
    total_discovered: 8420,
    total_qualified: 3180,
    total_leads: 1247,
    total_contacted: 843,
    total_replied: 127,
    active_in_sequence: 312,
    reply_rate_percentage: 15.1,
  };

  const funnel: FunnelStage[] = [
    { stage: 'Day 1', count: 843, fill: FUNNEL_COLORS[0] },
    { stage: 'Day 4', count: 621, fill: FUNNEL_COLORS[1] },
    { stage: 'Day 9', count: 418, fill: FUNNEL_COLORS[2] },
    { stage: 'Day 14', count: 289, fill: FUNNEL_COLORS[3] },
  ];

  const prospects: Prospect[] = [
    { id: '1', channel_name: 'TechReview Pro', email: 'contact@techreviewpro.com', status: 'replied', last_followup: '2026-07-25T14:30:00Z', suscriptores: 154000, fecha_enriquecimiento: '2026-07-20T10:00:00Z' },
    { id: '2', channel_name: 'Gaming Universe', email: 'hello@gaminguniverse.gg', status: 'in_sequence', last_followup: '2026-07-27T10:15:00Z', suscriptores: 85000, fecha_enriquecimiento: '2026-07-21T11:00:00Z' },
    { id: '3', channel_name: 'Cocina Creativa MX', email: 'cocina@creativamx.com', status: 'in_sequence', last_followup: '2026-07-26T16:45:00Z', suscriptores: 230000, fecha_enriquecimiento: '2026-07-22T09:30:00Z' },
    { id: '4', channel_name: 'FitLife Academy', email: 'partnerships@fitlifeacademy.com', status: 'replied', last_followup: '2026-07-24T09:00:00Z', suscriptores: 45000, fecha_enriquecimiento: '2026-07-19T14:20:00Z' },
    { id: '5', channel_name: 'Digital Nomad Diaries', email: 'collab@nomaddiaries.io', status: 'pending', last_followup: null, suscriptores: 12000, fecha_enriquecimiento: '2026-07-28T08:00:00Z' },
    { id: '6', channel_name: 'ScienceExplained', email: 'team@sciexplained.com', status: 'in_sequence', last_followup: '2026-07-27T08:30:00Z', suscriptores: 310000, fecha_enriquecimiento: '2026-07-23T15:45:00Z' },
    { id: '7', channel_name: 'MusicMasters ESP', email: 'info@musicmasters.es', status: 'replied', last_followup: '2026-07-23T12:00:00Z', suscriptores: 92000, fecha_enriquecimiento: '2026-07-18T16:00:00Z' },
    { id: '8', channel_name: 'AutoTech Reviews', email: 'autotech@reviews.com', status: 'in_sequence', last_followup: '2026-07-26T11:00:00Z', suscriptores: 56000, fecha_enriquecimiento: '2026-07-24T10:15:00Z' },
    { id: '9', channel_name: 'Travel Vlog MX', email: 'hola@travelvlogmx.com', status: 'pending', last_followup: null, suscriptores: 18000, fecha_enriquecimiento: '2026-07-28T09:30:00Z' },
    { id: '10', channel_name: 'CodeCraft Academy', email: 'edu@codecraft.dev', status: 'in_sequence', last_followup: '2026-07-27T14:20:00Z', suscriptores: 110000, fecha_enriquecimiento: '2026-07-25T11:20:00Z' },
    { id: '11', channel_name: 'Crypto Insights', email: 'contact@cryptoinsights.io', status: 'replied', last_followup: '2026-07-22T17:00:00Z', suscriptores: 78000, fecha_enriquecimiento: '2026-07-17T13:45:00Z' },
    { id: '12', channel_name: 'DIY Home Projects', email: 'projects@diyhome.com', status: 'in_sequence', last_followup: '2026-07-25T09:45:00Z', suscriptores: 135000, fecha_enriquecimiento: '2026-07-22T08:00:00Z' },
  ];

  return { metrics, funnel, prospects };
}

// ─── Hook ───────────────────────────────────────────────────────────
export function useDashboardData() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  // ── filters / pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    // ── Demo mode when Supabase is not configured
    if (!isSupabaseConfigured || !supabase) {
      await new Promise((r) => setTimeout(r, 800));
      const demo = getDemoData();
      setMetrics(demo.metrics);
      setFunnel(demo.funnel);
      setProspects(demo.prospects);
      setLastSync(new Date());
      setDemoMode(true);
      setLoading(false);
      return;
    }

    try {
      // 1. KPI counts — computed here from the source tables rather than the
      //    `dashboard_metrics` DB view. The view filtered on
      //    sequence_tracker.day1_sent_at, a column n8n never writes to (it
      //    writes day1_sent instead), so total_contacted/active_in_sequence/
      //    total_replied always came back 0 regardless of real volume.
      //    `count: 'exact', head: true` also avoids truncation at Supabase's
      //    default row cap, unlike counting a fetched array's .length.
      const countExact = async (
        table: string,
        filter?: (q: any) => any
      ): Promise<number | null> => {
        let q = supabase!.from(table).select('*', { count: 'exact', head: true });
        if (filter) q = filter(q);
        const { count, error } = await q;
        if (error) {
          console.warn(`${table} count failed (possibly RLS):`, error.message);
          return null;
        }
        return count;
      };

      const [totalDiscovered, totalQualified, totalLeads, inSequenceCount, repliedCount] =
        await Promise.all([
          countExact('raw_channels'),
          countExact('qualified_channels'),
          countExact('ready_to_send'),
          countExact('ready_to_send', (q) => q.eq('status', 'in_sequence')),
          countExact('ready_to_send', (q) => q.eq('status', 'replied')),
        ]);

      const totalContacted =
        inSequenceCount != null && repliedCount != null
          ? inSequenceCount + repliedCount
          : null;

      // Supabase returns 200 OK with count: 0 (not an error) when RLS
      // silently blocks a table for the anon role — indistinguishable from
      // a genuinely empty table by response shape alone. But the funnel is
      // monotonic (discovered >= qualified >= ready_to_send), so a count
      // that falls below a known downstream total is proof of a blocked
      // table, not a real business number. Treat it as unavailable rather
      // than display a misleading (too-low) figure.
      const floor = totalLeads ?? 0;
      const qualifiedReliable = totalQualified != null && totalQualified >= floor;
      const discoveredReliable = totalDiscovered != null && totalDiscovered >= floor;

      setMetrics({
        total_discovered: discoveredReliable ? totalDiscovered : null,
        total_qualified: qualifiedReliable ? totalQualified : null,
        total_leads: totalLeads,
        total_contacted: totalContacted,
        active_in_sequence: inSequenceCount,
        total_replied: repliedCount,
        reply_rate_percentage:
          totalContacted && repliedCount != null
            ? (repliedCount / totalContacted) * 100
            : totalContacted === 0
              ? 0
              : null,
      });

      // 2. Sequence tracker (for funnel + prospect enrichment)
      const { data: sequences, error: seqErr } = await supabase
        .from('sequence_tracker')
        .select('*');

      if (seqErr) {
        console.warn('sequence_tracker query failed (possibly RLS):', seqErr.message);
      }

      const seqs = (sequences ?? []) as SequenceTracker[];

      // ── Funnel stages
      const day1 = seqs.filter((s) => s.day1_sent_at || s.day1_sent).length;
      const day4 = seqs.filter((s) => s.day4_sent_at || s.day4_sent).length;
      const day9 = seqs.filter((s) => s.day9_sent_at || s.day9_sent).length;
      const day14 = seqs.filter((s) => s.day14_sent_at || s.day14_sent).length;

      setFunnel([
        { stage: 'Day 1', count: day1, fill: FUNNEL_COLORS[0] },
        { stage: 'Day 4', count: day4, fill: FUNNEL_COLORS[1] },
        { stage: 'Day 9', count: day9, fill: FUNNEL_COLORS[2] },
        { stage: 'Day 14', count: day14, fill: FUNNEL_COLORS[3] },
      ]);

      // 3. Prospects from ready_to_send
      const { data: leads, error: leadsErr } = await supabase
        .from('ready_to_send')
        .select('*')
        .order('fecha_enriquecimiento', { ascending: false, nullsFirst: false });

      if (leadsErr) {
        console.warn('ready_to_send query failed (possibly RLS):', leadsErr.message);
      }

      // Build a lookup from sequence_tracker by email
      const seqByEmail = new Map<string, SequenceTracker>();
      for (const s of seqs) {
        if (s.email) seqByEmail.set(s.email, s);
      }

      const mapped: Prospect[] = ((leads ?? []) as any[]).map((l, index) => {
        const seq = l.email ? seqByEmail.get(l.email) : undefined;
        return {
          id: l.channel_id ?? `lead-${index}`,
          channel_name: l.channel_name ?? '—',
          email: l.email ?? '—',
          status: l.status ?? 'pending',
          suscriptores: l.suscriptores ?? null,
          fecha_enriquecimiento: l.fecha_enriquecimiento ?? null,
          last_followup: seq ? lastFollowup(seq) : null,
        };
      });

      setProspects(mapped);
      setDemoMode(false);
      setLastSync(new Date());
    } catch (err: any) {
      setError(err.message ?? 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Filtered & paginated prospects
  const filtered = prospects.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.channel_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedProspects = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  return {
    metrics,
    funnel,
    prospects: paginatedProspects,
    totalProspects: filtered.length,
    page,
    totalPages,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    loading,
    lastSync,
    error,
    demoMode,
    refresh: fetchAll,
  };
}
