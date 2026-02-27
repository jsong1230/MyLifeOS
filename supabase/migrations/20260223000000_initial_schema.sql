-- ============================================================
-- MyLifeOS — 초기 스키마 마이그레이션
-- 기존 app/api/ route.ts + types/ 역추론 기반 생성
-- 기존 마이그레이션 012~014 컬럼 포함
-- ============================================================

-- ─── 0. Extensions ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. users (커스텀 프로필 테이블) ───────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL DEFAULT '',
  name          TEXT NOT NULL DEFAULT '',
  pin_hash      TEXT,
  pin_salt      TEXT,
  pin_failed_count INT NOT NULL DEFAULT 0,
  pin_locked_until TIMESTAMPTZ,
  enc_salt      TEXT,
  deletion_requested_at TIMESTAMPTZ,              -- migration 012
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.users.pin_hash IS 'bcrypt 해시된 PIN';
COMMENT ON COLUMN public.users.enc_salt IS 'AES-256 키 파생용 salt (클라이언트 생성)';
COMMENT ON COLUMN public.users.deletion_requested_at IS '회원 탈퇴 요청 시각 (관리자가 처리)';

-- ─── 2. user_settings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  locale           TEXT NOT NULL DEFAULT 'ko',
  default_currency TEXT NOT NULL DEFAULT 'KRW',
  nickname         TEXT,                                         -- migration 014
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.user_settings.nickname IS '사용자 설정 표시 이름 (OAuth 재로그인에 영향 없음)';

-- ─── 3. categories ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = 시스템 기본
  name        TEXT NOT NULL,
  name_key    TEXT,                     -- i18n 키 (시스템 카테고리)
  icon        TEXT,
  color       TEXT,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  is_system   BOOLEAN NOT NULL DEFAULT false,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 4. todos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.todos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     DATE,
  priority     TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  category     TEXT,
  sort_order   INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 5. routines ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.routines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  frequency     TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'custom')),
  days_of_week  INT[],               -- weekly: 0=일, 1=월 … 6=토
  interval_days INT,                  -- custom: N일 간격
  time_of_day   TIME,                 -- HH:MM
  streak        INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 6. routine_logs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.routine_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id   UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  completed    BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (routine_id, date)           -- upsert conflict target
);

-- ─── 7. transactions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount       NUMERIC NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id  UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  memo         TEXT,
  date         DATE NOT NULL,
  is_favorite  BOOLEAN NOT NULL DEFAULT false,
  currency     TEXT NOT NULL DEFAULT 'KRW',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 8. budgets ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.budgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount       NUMERIC NOT NULL,
  year_month   TEXT NOT NULL,           -- 'YYYY-MM'
  currency     TEXT NOT NULL DEFAULT 'KRW',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, category_id, year_month)  -- upsert conflict target
);

-- budgets UNIQUE 제약은 category_id가 NULL일 때도 한 행만 허용해야 함
-- PostgreSQL UNIQUE는 NULL 을 고유값으로 취급하지 않으므로 부분 인덱스 추가
CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_null_cat_month_uniq
  ON public.budgets (user_id, year_month)
  WHERE category_id IS NULL;

-- ─── 9. assets ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type  TEXT NOT NULL CHECK (asset_type IN ('cash', 'deposit', 'investment', 'other')),
  amount      NUMERIC NOT NULL DEFAULT 0,
  note        TEXT,
  month       TEXT NOT NULL,            -- 'YYYY-MM'
  currency    TEXT NOT NULL DEFAULT 'KRW',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 10. recurring_expenses ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  amount             NUMERIC NOT NULL,
  billing_day        INT NOT NULL CHECK (billing_day >= 1 AND billing_day <= 31),
  cycle              TEXT NOT NULL CHECK (cycle IN ('monthly', 'yearly')),
  category_id        UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active          BOOLEAN NOT NULL DEFAULT true,
  currency           TEXT NOT NULL DEFAULT 'KRW',
  last_recorded_date DATE,                                      -- migration 013
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.recurring_expenses.last_recorded_date IS '마지막으로 거래내역에 기록된 날짜';

-- ─── 11. time_blocks ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.time_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  date        DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  color       TEXT,
  todo_id     UUID REFERENCES public.todos(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 12. diaries ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.diaries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  content_encrypted TEXT NOT NULL,
  emotion_tags      TEXT[] NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, date)              -- 하루 한 편
);

-- ─── 13. relations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.relations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('family', 'friend', 'colleague', 'other')),
  last_met_at       DATE,
  memo_encrypted    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 14. body_logs ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.body_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight      NUMERIC,
  body_fat    NUMERIC,
  muscle_mass NUMERIC,
  date        DATE NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 15. exercise_logs ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_type   TEXT NOT NULL,
  duration_min    INT NOT NULL,
  intensity       TEXT NOT NULL CHECK (intensity IN ('light', 'moderate', 'intense')),
  calories_burned NUMERIC,
  date            DATE NOT NULL,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 16. drink_logs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.drink_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drink_type  TEXT NOT NULL CHECK (drink_type IN ('beer', 'soju', 'wine', 'whiskey', 'other')),
  alcohol_pct NUMERIC,
  amount_ml   NUMERIC NOT NULL,
  drink_count NUMERIC,
  date        DATE NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 17. health_logs (범용 — 현재 sleep 전용) ─────────────
CREATE TABLE IF NOT EXISTS public.health_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_type    TEXT NOT NULL,             -- 'sleep', 확장 가능
  value       NUMERIC NOT NULL,          -- 수면: 시간(h)
  value2      NUMERIC,                   -- 수면: 질(1-5)
  unit        TEXT,                       -- 'hours' 등
  date        DATE NOT NULL,
  time_start  TIME,                       -- 취침 시각
  time_end    TIME,                       -- 기상 시각
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 18. meal_logs ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type   TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name   TEXT NOT NULL,
  calories    NUMERIC,
  protein     NUMERIC,
  carbs       NUMERIC,
  fat         NUMERIC,
  date        DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 19. diet_goals ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.diet_goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  calorie_goal  INT NOT NULL,
  protein_goal  NUMERIC,
  carbs_goal    NUMERIC,
  fat_goal      NUMERIC,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 인덱스
-- ============================================================

-- 공통 패턴: user_id 단독 (목록 조회)
CREATE INDEX IF NOT EXISTS idx_todos_user          ON public.todos (user_id);
CREATE INDEX IF NOT EXISTS idx_routines_user       ON public.routines (user_id);
CREATE INDEX IF NOT EXISTS idx_routine_logs_user   ON public.routine_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user   ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user        ON public.budgets (user_id);
CREATE INDEX IF NOT EXISTS idx_assets_user         ON public.assets (user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user      ON public.recurring_expenses (user_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user    ON public.time_blocks (user_id);
CREATE INDEX IF NOT EXISTS idx_diaries_user        ON public.diaries (user_id);
CREATE INDEX IF NOT EXISTS idx_relations_user      ON public.relations (user_id);
CREATE INDEX IF NOT EXISTS idx_body_logs_user      ON public.body_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user  ON public.exercise_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_drink_logs_user     ON public.drink_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_health_logs_user    ON public.health_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user      ON public.meal_logs (user_id);

-- 복합 인덱스: user_id + date (날짜 필터)
CREATE INDEX IF NOT EXISTS idx_todos_user_due       ON public.todos (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_dt ON public.transactions (user_id, date);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_dt  ON public.time_blocks (user_id, date);
CREATE INDEX IF NOT EXISTS idx_diaries_user_date    ON public.diaries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_body_logs_user_dt    ON public.body_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_dt ON public.exercise_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_drink_logs_user_dt   ON public.drink_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_health_logs_user_dt  ON public.health_logs (user_id, log_type, date);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_dt    ON public.meal_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_routine_logs_user_dt ON public.routine_logs (user_id, date);

-- 복합 인덱스: user_id + status (상태 필터)
CREATE INDEX IF NOT EXISTS idx_todos_user_status    ON public.todos (user_id, status);

-- 복합 인덱스: user_id + month (월별 조회)
CREATE INDEX IF NOT EXISTS idx_assets_user_month    ON public.assets (user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month   ON public.budgets (user_id, year_month);

-- categories: 시스템/사용자 혼합 조회
CREATE INDEX IF NOT EXISTS idx_categories_user      ON public.categories (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_system    ON public.categories (is_system);

-- transactions: category_id FK 조회 (예산 집계)
CREATE INDEX IF NOT EXISTS idx_transactions_cat     ON public.transactions (category_id);


-- ============================================================
-- handle_new_user() 트리거 — auth.users 가입 시 자동 실행
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email, ''),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id, locale, default_currency, created_at, updated_at)
  VALUES (NEW.id, 'ko', 'KRW', now(), now())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 트리거 (이미 존재하면 교체)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================

-- 공통 헬퍼: 현재 인증 사용자 ID
-- auth.uid()는 Supabase가 제공하는 함수

-- ─── users ──────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ─── user_settings ─────────────────────────────────────────
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_select_own" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_settings_insert_own" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_update_own" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── categories ─────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 시스템 카테고리는 모든 인증 사용자가 조회 가능
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "categories_insert_own" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "categories_update_own" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id AND is_system = false);

CREATE POLICY "categories_delete_own" ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- ─── 매크로: user_id 기반 CRUD RLS 생성 ────────────────────
-- 아래 테이블들은 모두 동일 패턴: auth.uid() = user_id

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'todos', 'routines', 'routine_logs',
      'transactions', 'budgets', 'assets', 'recurring_expenses',
      'time_blocks', 'diaries', 'relations',
      'body_logs', 'exercise_logs', 'drink_logs', 'health_logs',
      'meal_logs', 'diet_goals'
    ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.uid() = user_id)',
      tbl || '_select_own', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)',
      tbl || '_insert_own', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING (auth.uid() = user_id)',
      tbl || '_update_own', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING (auth.uid() = user_id)',
      tbl || '_delete_own', tbl
    );
  END LOOP;
END;
$$;


-- ============================================================
-- 시스템 기본 카테고리 (시드 데이터)
-- ============================================================

INSERT INTO public.categories (name, name_key, icon, color, type, is_system, sort_order)
VALUES
  ('식비',     'food',           '🍽️', '#EF4444', 'expense', true, 10),
  ('교통',     'transport',      '🚗', '#F59E0B', 'expense', true, 20),
  ('주거',     'housing',        '🏠', '#10B981', 'expense', true, 30),
  ('통신',     'telecom',        '📱', '#3B82F6', 'expense', true, 40),
  ('의료',     'medical',        '🏥', '#EC4899', 'expense', true, 50),
  ('교육',     'education',      '📚', '#8B5CF6', 'expense', true, 60),
  ('문화생활', 'entertainment',  '🎬', '#F97316', 'expense', true, 70),
  ('쇼핑',     'shopping',       '🛒', '#14B8A6', 'expense', true, 80),
  ('기타지출', 'other_expense',  '💸', '#6B7280', 'expense', true, 90),
  ('급여',     'salary',         '💰', '#22C55E', 'income',  true, 10),
  ('부수입',   'side_income',    '💵', '#84CC16', 'income',  true, 20),
  ('기타수입', 'other_income',   '📈', '#6B7280', 'income',  true, 30)
ON CONFLICT DO NOTHING;
