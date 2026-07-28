import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  DashboardMetrics,
  SequenceTracker,
  Prospect,
  FunnelStage,
  AccountPerformance,
  StatusFilter,
} from '../types/supabase';

// ─── Funnel colors ──────────────────────────────────────────────────
const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];

// ─── Helper: derive last followup date ──────────────────────────────
function lastFollowup(s: SequenceTracker): string | null {
  return s.day14_sent_at ?? s.day9_sent_at ?? s.day4_sent_at ?? s.day1_sent_at ?? null;
}

// ─── Demo data for when Supabase isn't configured ───────────────────
function getDemoData() {
  const metrics: DashboardMetrics = {
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

  const accountPerf: AccountPerformance[] = [
    { account: 'agencyjuny0@gmail.com', totalSent: 892, replies: 54 },
    { account: 'agencyjuny1@gmail.com', totalSent: 756, replies: 41 },
    { account: 'agencyjuny2@gmail.com', totalSent: 523, replies: 32 },
  ];

  const prospects: Prospect[] = [
    { id: '1', channel_name: 'TechReview Pro', email: 'contact@techreviewpro.com', status: 'replied', sending_account: 'agencyjuny0@gmail.com', last_followup: '2026-07-25T14:30:00Z' },
    { id: '2', channel_name: 'Gaming Universe', email: 'hello@gaminguniverse.gg', status: 'in_sequence', sending_account: 'agencyjuny1@gmail.com', last_followup: '2026-07-27T10:15:00Z' },
    { id: '3', channel_name: 'Cocina Creativa MX', email: 'cocina@creativamx.com', status: 'in_sequence', sending_account: 'agencyjuny0@gmail.com', last_followup: '2026-07-26T16:45:00Z' },
    { id: '4', channel_name: 'FitLife Academy', email: 'partnerships@fitlifeacademy.com', status: 'replied', sending_account: 'agencyjuny2@gmail.com', last_followup: '2026-07-24T09:00:00Z' },
    { id: '5', channel_name: 'Digital Nomad Diaries', email: 'collab@nomaddiaries.io', status: 'pending', sending_account: null, last_followup: null },
    { id: '6', channel_name: 'ScienceExplained', email: 'team@sciexplained.com', status: 'in_sequence', sending_account: 'agencyjuny1@gmail.com', last_followup: '2026-07-27T08:30:00Z' },
    { id: '7', channel_name: 'MusicMasters ESP', email: 'info@musicmasters.es', status: 'replied', sending_account: 'agencyjuny0@gmail.com', last_followup: '2026-07-23T12:00:00Z' },
    { id: '8', channel_name: 'AutoTech Reviews', email: 'autotech@reviews.com', status: 'in_sequence', sending_account: 'agencyjuny2@gmail.com', last_followup: '2026-07-26T11:00:00Z' },
    { id: '9', channel_name: 'Travel Vlog MX', email: 'hola@travelvlogmx.com', status: 'pending', sending_account: null, last_followup: null },
    { id: '10', channel_name: 'CodeCraft Academy', email: 'edu@codecraft.dev', status: 'in_sequence', sending_account: 'agencyjuny1@gmail.com', last_followup: '2026-07-27T14:20:00Z' },
    { id: '11', channel_name: 'Crypto Insights', email: 'contact@cryptoinsights.io', status: 'replied', sending_account: 'agencyjuny0@gmail.com', last_followup: '2026-07-22T17:00:00Z' },
    { id: '12', channel_name: 'DIY Home Projects', email: 'projects@diyhome.com', status: 'in_sequence', sending_account: 'agencyjuny2@gmail.com', last_followup: '2026-07-25T09:45:00Z' },
  ];

  return { metrics, funnel, accountPerf, prospects };
}

// ─── Hook ───────────────────────────────────────────────────────────
export function useDashboardData() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [accountPerf, setAccountPerf] = useState<AccountPerformance[]>([]);
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
      setAccountPerf(demo.accountPerf);
      setProspects(demo.prospects);
      setLastSync(new Date());
      setDemoMode(true);
      setLoading(false);
      return;
    }

    try {
      // 1. KPI metrics from the SQL view
      const { data: metricsData, error: metricsErr } = await supabase
        .from('dashboard_metrics')
        .select('*')
        .single();

      if (metricsErr) throw metricsErr;
      setMetrics(metricsData as DashboardMetrics);

      // 2. Sequence tracker (for funnel + account perf + prospect enrichment)
      const { data: sequences, error: seqErr } = await supabase
        .from('sequence_tracker')
        .select('*');

      if (seqErr) {
        console.warn('sequence_tracker query failed (possibly RLS):', seqErr.message);
      }

      const seqs = (sequences ?? []) as SequenceTracker[];

      // ── Funnel stages
      const day1 = seqs.filter((s) => s.day1_sent_at).length;
      const day4 = seqs.filter((s) => s.day4_sent_at).length;
      const day9 = seqs.filter((s) => s.day9_sent_at).length;
      const day14 = seqs.filter((s) => s.day14_sent_at).length;

      setFunnel([
        { stage: 'Day 1', count: day1, fill: FUNNEL_COLORS[0] },
        { stage: 'Day 4', count: day4, fill: FUNNEL_COLORS[1] },
        { stage: 'Day 9', count: day9, fill: FUNNEL_COLORS[2] },
        { stage: 'Day 14', count: day14, fill: FUNNEL_COLORS[3] },
      ]);

      // ── Account performance
      const acctMap = new Map<string, { totalSent: number; replies: number }>();
      for (const s of seqs) {
        const acct = s.sending_account ?? 'Unknown';
        if (!acctMap.has(acct)) acctMap.set(acct, { totalSent: 0, replies: 0 });
        const entry = acctMap.get(acct)!;
        const sent =
          (s.day1_sent_at ? 1 : 0) +
          (s.day4_sent_at ? 1 : 0) +
          (s.day9_sent_at ? 1 : 0) +
          (s.day14_sent_at ? 1 : 0);
        entry.totalSent += sent;
        if (s.replied) entry.replies += 1;
      }

      setAccountPerf(
        Array.from(acctMap.entries()).map(([account, v]) => ({
          account,
          totalSent: v.totalSent,
          replies: v.replies,
        }))
      );

      // 3. Prospects from ready_to_send
      const { data: leads, error: leadsErr } = await supabase
        .from('ready_to_send')
        .select('*');

      if (leadsErr) {
        console.warn('ready_to_send query failed (possibly RLS):', leadsErr.message);
      }

      // Build a lookup from sequence_tracker by email
      const seqByEmail = new Map<string, SequenceTracker>();
      for (const s of seqs) {
        seqByEmail.set(s.email, s);
      }

      const mapped: Prospect[] = ((leads ?? []) as any[]).map((l, index) => {
        const seq = seqByEmail.get(l.email);
        return {
          id: l.id ?? `lead-${index}`,
          channel_name: l.channel_name ?? '—',
          email: l.email ?? '—',
          status: l.status ?? 'pending',
          sending_account: seq?.sending_account ?? null,
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
    accountPerf,
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
