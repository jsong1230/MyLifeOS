-- 015: foods 테이블 — 내장 한식 DB를 Supabase로 이전
CREATE TABLE IF NOT EXISTS public.foods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  aliases JSONB DEFAULT '[]',
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  serving_size TEXT NOT NULL,
  serving_size_g NUMERIC NOT NULL,
  source TEXT NOT NULL DEFAULT 'kr_internal'
);

CREATE INDEX IF NOT EXISTS foods_name_idx ON public.foods USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS foods_source_idx ON public.foods(source);

-- RLS: 인증된 사용자 읽기 허용
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "foods_read" ON public.foods FOR SELECT TO authenticated USING (true);
