-- ============================================================
-- Phase 2 마이그레이션: todos, routines, routine_logs 테이블
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================================

-- ----------------------------------------
-- 공통 트리거 함수 (없으면 생성)
-- ----------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------
-- todos 테이블
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.todos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     DATE,
  priority     TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status       TEXT CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  category     TEXT,
  sort_order   INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todos_owner_all" ON public.todos;
CREATE POLICY "todos_owner_all" ON public.todos
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_todos_user_id    ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date   ON public.todos(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_todos_status     ON public.todos(user_id, status);
CREATE INDEX IF NOT EXISTS idx_todos_sort_order ON public.todos(user_id, sort_order);

DROP TRIGGER IF EXISTS set_todos_updated_at ON public.todos;
CREATE TRIGGER set_todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------
-- routines 테이블
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.routines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  frequency     TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'custom')),
  days_of_week  INTEGER[],      -- weekly: [0=일, 1=월, ..., 6=토]
  interval_days INTEGER,        -- custom: N일 간격
  time_of_day   TIME,           -- 실행 시각 HH:MM
  streak        INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "routines_owner_all" ON public.routines;
CREATE POLICY "routines_owner_all" ON public.routines
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_routines_user_id     ON public.routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_user_active ON public.routines(user_id, is_active);

DROP TRIGGER IF EXISTS set_routines_updated_at ON public.routines;
CREATE TRIGGER set_routines_updated_at
  BEFORE UPDATE ON public.routines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------
-- routine_logs 테이블
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.routine_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id   UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_routine_logs_routine_date UNIQUE (routine_id, date)
);

ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "routine_logs_owner_all" ON public.routine_logs;
CREATE POLICY "routine_logs_owner_all" ON public.routine_logs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_routine_logs_user_date     ON public.routine_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_routine_logs_routine_date  ON public.routine_logs(routine_id, date);
