-- ============================================================
-- Juny YT Agency — Supabase RLS Policies
-- ============================================================
-- Run this in your Supabase SQL Editor to allow the dashboard
-- to read data from ready_to_send and sequence_tracker tables.
--
-- These policies grant SELECT-only access to the anonymous role.
-- ============================================================

-- 1. Enable RLS (skip if already enabled)
ALTER TABLE public.ready_to_send ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_tracker ENABLE ROW LEVEL SECURITY;

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

-- ============================================================
-- OPTIONAL: If you want to also ensure the dashboard_metrics
-- view works without issues, it should already work as
-- SECURITY DEFINER. If not, you can recreate it:
-- ============================================================
-- CREATE OR REPLACE VIEW public.dashboard_metrics
-- WITH (security_invoker = false)
-- AS
-- SELECT
--   (SELECT COUNT(*) FROM public.ready_to_send) AS total_leads,
--   (SELECT COUNT(*) FROM public.sequence_tracker WHERE day1_sent_at IS NOT NULL) AS total_contacted,
--   (SELECT COUNT(*) FROM public.sequence_tracker WHERE replied = true) AS total_replied,
--   (SELECT COUNT(*) FROM public.sequence_tracker
--    WHERE replied = false
--      AND day1_sent_at IS NOT NULL) AS active_in_sequence,
--   CASE
--     WHEN (SELECT COUNT(*) FROM public.sequence_tracker WHERE day1_sent_at IS NOT NULL) = 0 THEN 0
--     ELSE ROUND(
--       (SELECT COUNT(*) FROM public.sequence_tracker WHERE replied = true)::numeric /
--       (SELECT COUNT(*) FROM public.sequence_tracker WHERE day1_sent_at IS NOT NULL)::numeric * 100,
--       1
--     )
--   END AS reply_rate_percentage;
