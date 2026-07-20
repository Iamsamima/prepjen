
CREATE TABLE public.gemini_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active',
  priority INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gemini_api_keys TO authenticated;
GRANT ALL ON public.gemini_api_keys TO service_role;

ALTER TABLE public.gemini_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own gemini keys"
ON public.gemini_api_keys FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_gemini_keys_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_gemini_keys_updated
BEFORE UPDATE ON public.gemini_api_keys
FOR EACH ROW EXECUTE FUNCTION public.update_gemini_keys_updated_at();

CREATE INDEX idx_gemini_keys_user_active ON public.gemini_api_keys(user_id, is_active, status, priority);
