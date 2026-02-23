-- ============================================================
-- Phase 4 마이그레이션: 건강 트래킹 테이블
--   - meal_logs   (F-12 식사 기록)
--   - drink_logs  (F-13 음주 기록)
--   - health_logs (F-14 수면 기록, log_type='sleep')
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================================

-- ----------------------------------------
-- meal_logs 테이블 (F-12 식사 기록)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  meal_type  TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name  TEXT NOT NULL,
  calories   DECIMAL(8, 2),   -- 칼로리(kcal)
  protein    DECIMAL(8, 2),   -- 단백질(g)
  carbs      DECIMAL(8, 2),   -- 탄수화물(g)
  fat        DECIMAL(8, 2),   -- 지방(g)
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meal_logs_owner_all" ON public.meal_logs;
CREATE POLICY "meal_logs_owner_all" ON public.meal_logs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date
  ON public.meal_logs(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_id
  ON public.meal_logs(user_id);

DROP TRIGGER IF EXISTS set_meal_logs_updated_at ON public.meal_logs;
CREATE TRIGGER set_meal_logs_updated_at
  BEFORE UPDATE ON public.meal_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------
-- drink_logs 테이블 (F-13 음주 기록)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.drink_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  drink_type  TEXT NOT NULL CHECK (drink_type IN ('beer', 'soju', 'wine', 'whiskey', 'other')),
  alcohol_pct DECIMAL(4, 1),          -- 도수(%)
  amount_ml   DECIMAL(8, 1) NOT NULL, -- 양(ml)
  drink_count DECIMAL(4, 1),          -- 잔 수
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.drink_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drink_logs_owner_all" ON public.drink_logs;
CREATE POLICY "drink_logs_owner_all" ON public.drink_logs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_drink_logs_user_date
  ON public.drink_logs(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_drink_logs_user_id
  ON public.drink_logs(user_id);

DROP TRIGGER IF EXISTS set_drink_logs_updated_at ON public.drink_logs;
CREATE TRIGGER set_drink_logs_updated_at
  BEFORE UPDATE ON public.drink_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------
-- health_logs 테이블 (F-14 수면 기록)
-- log_type = 'sleep' 으로 수면 데이터 저장
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.health_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_type   TEXT NOT NULL,            -- 'sleep' 등
  value      DECIMAL(6, 2) NOT NULL,   -- 수면 시간(h)
  value2     DECIMAL(6, 2),            -- 수면 질(1-5)
  unit       TEXT,                     -- 'hours'
  time_start TEXT,                     -- 취침 시각 HH:MM
  time_end   TEXT,                     -- 기상 시각 HH:MM
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "health_logs_owner_all" ON public.health_logs;
CREATE POLICY "health_logs_owner_all" ON public.health_logs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 날짜별 수면 기록 조회 최적화
CREATE INDEX IF NOT EXISTS idx_health_logs_user_type_date
  ON public.health_logs(user_id, log_type, date DESC);

CREATE INDEX IF NOT EXISTS idx_health_logs_user_id
  ON public.health_logs(user_id);

DROP TRIGGER IF EXISTS set_health_logs_updated_at ON public.health_logs;
CREATE TRIGGER set_health_logs_updated_at
  BEFORE UPDATE ON public.health_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
