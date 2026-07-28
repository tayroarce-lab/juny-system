// ─── Database Row Types ─────────────────────────────────────────────

export interface ReadyToSend {
  channel_name: string;
  email: string;
  video_title?: string;
  status: 'pending' | 'in_sequence' | 'replied';
}

export interface SequenceTracker {
  id: string;
  email: string;
  day1_sent_at: string | null;
  day4_sent_at: string | null;
  day9_sent_at: string | null;
  day14_sent_at: string | null;
  thread_id?: string | null;
  replied: boolean;
  sending_account: string;
}

export interface DashboardMetrics {
  total_leads: number;
  total_contacted: number;
  total_replied: number;
  active_in_sequence: number;
  reply_rate_percentage: number;
}

// ─── Derived / Chart Types ──────────────────────────────────────────

export interface FunnelStage {
  stage: string;
  count: number;
  fill: string;
}

export interface AccountPerformance {
  account: string;
  totalSent: number;
  replies: number;
}

// ─── Prospect (joined view) ────────────────────────────────────────

export interface Prospect {
  id: string;
  channel_name: string;
  email: string;
  status: 'pending' | 'in_sequence' | 'replied';
  sending_account: string | null;
  last_followup: string | null;
}

// ─── Filter / UI types ─────────────────────────────────────────────

export type StatusFilter = 'all' | 'in_sequence' | 'replied';
