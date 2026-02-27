CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  insights JSONB NOT NULL DEFAULT '[]',
  summary TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL DEFAULT 'ko',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_insights_own" ON public.ai_insights FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX ai_insights_user_id_idx ON public.ai_insights(user_id);
