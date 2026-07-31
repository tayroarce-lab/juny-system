-- ============================================================
-- Juny YT Agency — Supabase RLS Policies
-- ============================================================
-- Run this in your Supabase SQL Editor to allow the dashboard
-- to read data from these tables.
--
-- These policies grant SELECT-only access to the anonymous role.
-- ============================================================

-- 1. Enable RLS (skip if already enabled)
ALTER TABLE public.ready_to_send ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualified_channels ENABLE ROW LEVEL SECURITY;

-- 2. Allow anonymous reads on ready_to_send
CREATE POLICY "Allow public read access on ready_to_send"
  ON public.ready_to_send
  FOR SELECT
  USING (true);

-- 3. Allow anonymous reads on sequence_tracker
CREATE POLICY "Allow public read access on sequence_tracker"
  ON public.sequence_tracker
  FOR SELECT
  USING (true);

-- 4. Allow anonymous reads on raw_channels
--    Required for the dashboard's "Canales Descubiertos" KPI card.
--    Confirmed missing on 2026-07-31: raw_channels currently has RLS
--    enabled with no SELECT policy, so PostgREST silently returns an
--    empty result set (200 OK, 0 rows) to the anon key instead of an
--    error — the dashboard has no way to distinguish that from a
--    genuinely empty table.
CREATE POLICY "Allow public read access on raw_channels"
  ON public.raw_channels
  FOR SELECT
  USING (true);

-- 5. Allow anonymous reads on qualified_channels
--    Required for the dashboard's "Canales Calificados" KPI card.
--    Same missing-policy issue as raw_channels above.
CREATE POLICY "Allow public read access on qualified_channels"
  ON public.qualified_channels
  FOR SELECT
  USING (true);

-- ============================================================
-- NOTE ON dashboard_metrics
-- ============================================================
-- The dashboard no longer reads from the `dashboard_metrics` view.
-- That view's total_contacted/active_in_sequence/total_replied were
-- all computed from `sequence_tracker.day1_sent_at`, a column the
-- n8n workflows never populate (they write to `day1_sent` instead),
-- so those figures always evaluated to 0 regardless of real volume.
-- The dashboard now computes every KPI directly from `raw_channels`,
-- `qualified_channels`, and `ready_to_send.status` using
-- `count: 'exact', head: true` queries. The view can be dropped or
-- left in place — it is unused by the app either way.
