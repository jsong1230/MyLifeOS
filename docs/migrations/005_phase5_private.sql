-- ============================================================
-- Phase 5 마이그레이션: 사적 기록 테이블
--   - diaries (F-16 일기 작성)
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================================

-- ----------------------------------------
-- diaries 테이블 (F-16 일기 작성)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.diaries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  content_encrypted TEXT NOT NULL,
  emotion_tags      JSONB NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_diaries_user_date UNIQUE (user_id, date)
);

ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diaries_owner_all" ON public.diaries;
CREATE POLICY "diaries_owner_all" ON public.diaries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 날짜별 일기 조회 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_diaries_user_date ON public.diaries(user_id, date DESC);

DROP TRIGGER IF EXISTS set_diaries_updated_at ON public.diaries;
CREATE TRIGGER set_diaries_updated_at
  BEFORE UPDATE ON public.diaries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------
-- relations 테이블 (F-27 인간관계 메모)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.relations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('family', 'friend', 'colleague', 'other')),
  last_met_at       DATE,
  memo_encrypted    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.relations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "relations_owner_all" ON public.relations;
CREATE POLICY "relations_owner_all" ON public.relations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_relations_user_id ON public.relations(user_id);
DROP TRIGGER IF EXISTS set_relations_updated_at ON public.relations;
CREATE TRIGGER set_relations_updated_at
  BEFORE UPDATE ON public.relations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
