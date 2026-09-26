-- ============================================================
-- Juny YT Agency — Bandeja de entrada (inbox_messages)
-- ============================================================
-- Guarda el contenido de los correos entrantes que WF-05 detecta como
-- respuesta real (no rebotes, no autorespuestas, no correos propios),
-- para que el dashboard los muestre sin depender de Gmail/Poste.io.
--
-- A diferencia de las tablas de solo lectura pública (ready_to_send,
-- sequence_tracker, raw_channels, qualified_channels), el contenido de
-- un correo es más sensible que un contador agregado — por eso el RLS
-- aquí se restringe al rol `authenticated` (usuario logueado en el
-- panel), no al rol `anon`. Los inserts los hace n8n con la service
-- role key, que ignora RLS.
--
-- Correr esto una sola vez en el SQL Editor de Supabase.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.inbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text,
  cuenta_email text,
  from_email text,
  from_name text,
  subject text,
  preview text,
  body_html text,
  body_text text,
  received_at timestamptz NOT NULL DEFAULT now(),
  thread_id text,
  leido boolean NOT NULL DEFAULT false,
  gestionado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inbox_messages_received_at_idx ON public.inbox_messages (received_at DESC);
CREATE INDEX IF NOT EXISTS inbox_messages_channel_id_idx ON public.inbox_messages (channel_id);

ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

-- Solo usuarios logueados en el dashboard pueden leer los mensajes.
CREATE POLICY "Allow authenticated read access on inbox_messages"
  ON public.inbox_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Solo usuarios logueados pueden marcar leído/gestionado.
CREATE POLICY "Allow authenticated update on inbox_messages"
  ON public.inbox_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
