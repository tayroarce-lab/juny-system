// ─── Database Row Types ─────────────────────────────────────────────

export interface ReadyToSend {
  channel_id: string;
  channel_name: string | null;
  email: string | null;
  email_source: string | null;
  suscriptores: number | null;
  avg_views_5_videos: number | null;
  ultimo_video_titulo: string | null;
  ai_diagnosis: string | null;
  ai_subject_line: string | null;
  status: 'pending' | 'in_sequence' | 'replied' | string;
  cuenta_email_asignada: string | null;
  fecha_enriquecimiento: string | null;
}

export interface SequenceTracker {
  id: number;
  channel_id: string | null;
  email: string | null;
  cuenta_email: string | null;
  day1_sent_at: string | null;
  day4_sent_at: string | null;
  day9_sent_at: string | null;
  day14_sent_at: string | null;
  thread_id?: string | null;
  replied: boolean | null;
  sending_account: string | null;
  fecha_entrada: string | null;
}

export interface DashboardMetrics {
  total_leads: number | null;
  total_contacted: number | null;
  total_replied: number | null;
  active_in_sequence: number | null;
  reply_rate_percentage: number | null;
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
  id: string; // we will use channel_id for this
  channel_name: string;
  email: string;
  status: string;
  suscriptores: number | null;
  fecha_enriquecimiento: string | null;
  sending_account: string | null;
  last_followup: string | null;
}

// ─── Filter / UI types ─────────────────────────────────────────────

export type StatusFilter = 'all' | 'in_sequence' | 'replied';
