-- admin_chat_state: bloqueo y eliminación de chats admin (igual que yacht_work_chat_state para empleos)
CREATE TABLE IF NOT EXISTS public.admin_chat_state (
  thread_id uuid NOT NULL REFERENCES public.admin_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  PRIMARY KEY (thread_id, user_id)
);

ALTER TABLE public.admin_chat_state ENABLE ROW LEVEL SECURITY;

-- Solo el usuario puede ver/modificar su propio estado
CREATE POLICY "Users can manage own admin chat state"
  ON public.admin_chat_state
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_admin_chat_state_user_id ON public.admin_chat_state(user_id);
