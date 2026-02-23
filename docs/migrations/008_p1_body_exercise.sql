-- ============================================================
-- Phase P1 마이그레이션: body_logs, exercise_logs 테이블
-- (F-23 체중/체성분 기록, F-24 운동 기록)
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================================

-- ----------------------------------------
-- body_logs 테이블 (F-23)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.body_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  weight       DECIMAL(6, 2),          -- 체중(kg)
  body_fat     DECIMAL(5, 2),          -- 체지방률(%)
  muscle_mass  DECIMAL(6, 2),          -- 근육량(kg)
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.body_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "body_logs_owner_all" ON public.body_logs;
CREATE POLICY "body_logs_owner_all" ON public.body_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_body_logs_user_date ON public.body_logs(user_id, date DESC);

DROP TRIGGER IF EXISTS set_body_logs_updated_at ON public.body_logs;
CREATE TRIGGER set_body_logs_updated_at
  BEFORE UPDATE ON public.body_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------
-- exercise_logs 테이블 (F-24)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exercise_type    TEXT NOT NULL,
  duration_min     INTEGER NOT NULL CHECK (duration_min > 0),
  intensity        TEXT NOT NULL CHECK (intensity IN ('light', 'moderate', 'intense')) DEFAULT 'moderate',
  calories_burned  INTEGER,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  note             TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exercise_logs_owner_all" ON public.exercise_logs;
CREATE POLICY "exercise_logs_owner_all" ON public.exercise_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_date ON public.exercise_logs(user_id, date DESC);

DROP TRIGGER IF EXISTS set_exercise_logs_updated_at ON public.exercise_logs;
CREATE TRIGGER set_exercise_logs_updated_at
  BEFORE UPDATE ON public.exercise_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
