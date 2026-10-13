import type { ContactStatus, ContactStatusValue, InboxMessage, InboxReply } from '../types/supabase';

// Pure grouping of inbox messages by contact. Kept free of React / Supabase so
// the "pending" rules can be tested on their own.

export const STATUS_OPTIONS: { value: ContactStatusValue; label: string; tone: string }[] = [
  { value: 'nuevo', label: 'Nuevo', tone: 'bg-dark-600/60 text-dark-100' },
  { value: 'en_conversacion', label: 'En conversación', tone: 'bg-accent-indigo/15 text-accent-indigo' },
  { value: 'whatsapp', label: 'Pasó a WhatsApp', tone: 'bg-accent-emerald/15 text-accent-emerald' },
  { value: 'llamada', label: 'Llamada agendada', tone: 'bg-accent-cyan/15 text-accent-cyan' },
  { value: 'cerrado', label: 'Cerrado (cliente)', tone: 'bg-accent-emerald/25 text-accent-emerald' },
  { value: 'perdido', label: 'Perdido', tone: 'bg-accent-rose/15 text-accent-rose' },
];

// A contact in one of these states no longer needs an answer from us.
const DONE: ReadonlySet<ContactStatusValue> = new Set(['cerrado', 'perdido']);

// Senders that never expect a human answer (system notices, ticket bots).
const AUTOMATED_RE = /(^|[._-])(no-?reply|donotreply|mailer-daemon|postmaster|notifications?)([._-]|@)/i;

export function isAutomated(email: string, subject: string | null): boolean {
  return AUTOMATED_RE.test(email) || /^\[#[\w-]+\]/.test(subject ?? '');
}

export interface Contact {
  email: string;
  name: string;
  messages: InboxMessage[]; // inbound, oldest first
  replies: InboxReply[]; // sent from the panel, oldest first
  last: InboxMessage;
  lastInboundAt: number;
  lastReplyAt: number | null;
  status: ContactStatusValue;
  note: string;
  automated: boolean;
  pending: boolean; // still needs an answer
  returned: boolean; // wrote again after being handled / answered
  waitingDays: number | null; // age of the unanswered message
}

const DAY = 86_400_000;

export function buildContacts(
  messages: InboxMessage[],
  replies: InboxReply[],
  statuses: ContactStatus[],
  now: number = Date.now()
): Contact[] {
  const statusBy = new Map(statuses.map((s) => [s.email.toLowerCase(), s]));
  const repliesBy = new Map<string, InboxReply[]>();
  for (const r of replies) {
    const k = r.to_email.toLowerCase();
    (repliesBy.get(k) ?? repliesBy.set(k, []).get(k)!).push(r);
  }

  const groups = new Map<string, InboxMessage[]>();
  for (const m of messages) {
    const email = (m.from_email ?? '').toLowerCase();
    if (!email || email.endsWith('@junyyt.com')) continue; // internal tests
    (groups.get(email) ?? groups.set(email, []).get(email)!).push(m);
  }

  const contacts: Contact[] = [];
  for (const [email, msgs] of groups) {
    msgs.sort((a, b) => a.received_at.localeCompare(b.received_at));
    const reps = (repliesBy.get(email) ?? []).sort((a, b) => a.sent_at.localeCompare(b.sent_at));
    const last = msgs[msgs.length - 1];
    const lastInboundAt = new Date(last.received_at).getTime();
    const lastReplyAt = reps.length ? new Date(reps[reps.length - 1].sent_at).getTime() : null;
    const st = statusBy.get(email);
    const status: ContactStatusValue = st?.status ?? 'nuevo';
    const automated = isAutomated(email, last.subject);

    // With a logged reply, "pending" means they wrote after our last answer.
    // Without one (older replies were not logged) fall back to the manual flag.
    const unanswered = lastReplyAt !== null ? lastInboundAt > lastReplyAt : !last.gestionado;
    const pending = !automated && !DONE.has(status) && unanswered;
    const returned =
      pending && msgs.length > 1 && (lastReplyAt !== null || msgs.slice(0, -1).some((m) => m.gestionado));

    contacts.push({
      email,
      name: msgs.map((m) => m.from_name).filter(Boolean).pop() || email,
      messages: msgs,
      replies: reps,
      last,
      lastInboundAt,
      lastReplyAt,
      status,
      note: st?.note ?? '',
      automated,
      pending,
      returned,
      waitingDays: pending ? Math.max(0, Math.floor((now - lastInboundAt) / DAY)) : null,
    });
  }

  // Needs attention first (returned, then longest waiting), then most recent.
  contacts.sort((a, b) => {
    if (a.pending !== b.pending) return a.pending ? -1 : 1;
    if (a.pending && b.pending) {
      if (a.returned !== b.returned) return a.returned ? -1 : 1;
      return a.lastInboundAt - b.lastInboundAt;
    }
    return b.lastInboundAt - a.lastInboundAt;
  });
  return contacts;
}
