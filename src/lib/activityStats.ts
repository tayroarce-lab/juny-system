// Pure aggregation helpers for the "Actividad" section (sent emails / replies
// per day, week or month). No React / Supabase imports so they can be tested
// in isolation.

export type Granularity = 'day' | 'week' | 'month';

export interface ActivityBucket {
  key: string; // 'YYYY-MM-DD' (day, or Monday of the week) or 'YYYY-MM' (month)
  label: string;
  sent: number;
  replies: number;
  partial: boolean; // bucket that contains today (still in progress)
}

export interface ActivitySummary {
  buckets: ActivityBucket[];
  avgSent: number | null;
  avgReplies: number | null;
  replyPer100: number | null; // replies per 100 sent over the shared window
  windowSent: number;
  windowReplies: number;
  completeBuckets: number; // complete buckets used for the sent average
}

// How many complete buckets are shown / averaged for each granularity.
export const WINDOW: Record<Granularity, number> = { day: 30, week: 12, month: 6 };

const MS_DAY = 86_400_000;

// ── date helpers (all on 'YYYY-MM-DD' strings, UTC arithmetic → no DST drift)
function toUtcMs(d: string): number {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, day);
}
function fromUtcMs(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function addDays(d: string, n: number): string {
  return fromUtcMs(toUtcMs(d) + n * MS_DAY);
}

// Monday-start week.
function mondayOf(d: string): string {
  const dow = new Date(toUtcMs(d)).getUTCDay(); // 0 = Sunday
  return addDays(d, -((dow + 6) % 7));
}

export function bucketKey(date: string, g: Granularity): string {
  if (g === 'day') return date;
  if (g === 'week') return mondayOf(date);
  return date.slice(0, 7);
}

function prevKey(key: string, g: Granularity): string {
  if (g === 'day') return addDays(key, -1);
  if (g === 'week') return addDays(key, -7);
  const [y, m] = key.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function labelOf(key: string, g: Granularity): string {
  if (g === 'month') {
    const [y, m] = key.split('-').map(Number);
    return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
  }
  const [, m, d] = key.split('-').map(Number);
  return g === 'week' ? `Sem ${d} ${MONTHS[m - 1]}` : `${d} ${MONTHS[m - 1]}`;
}

// Local calendar date ('YYYY-MM-DD') of an ISO timestamp, in the viewer's timezone.
export function localDate(iso: string): string | null {
  const t = new Date(iso);
  if (isNaN(t.getTime())) return null;
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

export function todayLocal(): string {
  return localDate(new Date().toISOString())!;
}

// ── main aggregation ────────────────────────────────────────────────
// sentDates / replyDates: one 'YYYY-MM-DD' entry per email sent / reply received.
export function summarize(
  sentDates: string[],
  replyDates: string[],
  g: Granularity,
  today: string = todayLocal()
): ActivitySummary {
  const sentBy = new Map<string, number>();
  for (const d of sentDates) {
    const k = bucketKey(d, g);
    sentBy.set(k, (sentBy.get(k) ?? 0) + 1);
  }
  const replyBy = new Map<string, number>();
  for (const d of replyDates) {
    const k = bucketKey(d, g);
    replyBy.set(k, (replyBy.get(k) ?? 0) + 1);
  }

  const currentKey = bucketKey(today, g);

  // Window: the last WINDOW[g] complete buckets plus the bucket in progress.
  const keys: string[] = [currentKey];
  let k = currentKey;
  for (let i = 0; i < WINDOW[g]; i++) {
    k = prevKey(k, g);
    keys.unshift(k);
  }

  const firstSent = sentDates.length ? bucketKey(sentDates.reduce((a, b) => (a < b ? a : b)), g) : null;
  const firstReply = replyDates.length ? bucketKey(replyDates.reduce((a, b) => (a < b ? a : b)), g) : null;

  const buckets: ActivityBucket[] = keys.map((key) => ({
    key,
    label: labelOf(key, g),
    sent: sentBy.get(key) ?? 0,
    replies: replyBy.get(key) ?? 0,
    partial: key === currentKey,
  }));

  // Averages use complete buckets only, and only from the first bucket that has
  // data for that series (before that we don't know, it isn't a real zero).
  const complete = buckets.filter((b) => !b.partial);
  const sentWin = complete.filter((b) => firstSent !== null && b.key >= firstSent);
  const replyWin = complete.filter((b) => firstReply !== null && b.key >= firstReply);
  const sharedWin = complete.filter(
    (b) => firstSent !== null && firstReply !== null && b.key >= firstSent && b.key >= firstReply
  );

  const sum = (arr: ActivityBucket[], f: (b: ActivityBucket) => number) => arr.reduce((a, b) => a + f(b), 0);
  const sharedSent = sum(sharedWin, (b) => b.sent);

  return {
    buckets,
    avgSent: sentWin.length ? sum(sentWin, (b) => b.sent) / sentWin.length : null,
    avgReplies: replyWin.length ? sum(replyWin, (b) => b.replies) / replyWin.length : null,
    replyPer100: sharedSent > 0 ? (sum(sharedWin, (b) => b.replies) / sharedSent) * 100 : null,
    windowSent: sum(complete, (b) => b.sent),
    windowReplies: sum(complete, (b) => b.replies),
    completeBuckets: sentWin.length,
  };
}
