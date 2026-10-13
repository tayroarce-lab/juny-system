-- ============================================================
-- Juny YT Agency — Seguimiento de contactos
-- ============================================================
-- Dos tablas para la pestaña "Contactos" del dashboard:
--
--  1. contact_status : estado de cierre de cada contacto (en conversación,
--     pasó a WhatsApp, llamada agendada, cerrado, perdido) y una nota. Lo
--     escribe el usuario logueado desde el panel.
--  2. inbox_replies  : cada respuesta enviada desde el panel (WF-08). Lo
--     escribe n8n con la service role key (ignora RLS); el panel solo la
--     lee. Con esto se sabe si un contacto fue realmente respondido, y no
--     solo marcado como "gestionado".
--
-- Como inbox_messages, el RLS se limita al rol `authenticated`.
-- Correr una sola vez en el SQL Editor de Supabase.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contact_status (
  email text PRIMARY KEY,
  status text NOT NULL DEFAULT 'nuevo'
    CHECK (status IN ('nuevo', 'en_conversacion', 'whatsapp', 'llamada', 'cerrado', 'perdido')),
  note text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on contact_status"
  ON public.contact_status FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on contact_status"
  ON public.contact_status FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on contact_status"
  ON public.contact_status FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.inbox_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid,            -- inbox_messages.id al que se respondió
  to_email text NOT NULL,
  cuenta_email text,          -- buzón desde el que salió la respuesta
  subject text,
  reply_text text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inbox_replies_to_email_idx ON public.inbox_replies (to_email);
CREATE INDEX IF NOT EXISTS inbox_replies_sent_at_idx ON public.inbox_replies (sent_at DESC);

ALTER TABLE public.inbox_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on inbox_replies"
  ON public.inbox_replies FOR SELECT TO authenticated USING (true);
