-- ============================================================
-- Phase 6 마이그레이션: recurring_expenses 테이블 (F-30 정기 지출 관리)
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================================

-- ----------------------------------------
-- recurring_expenses 테이블
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  amount      DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  billing_day INTEGER NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
  cycle       TEXT NOT NULL DEFAULT 'monthly' CHECK (cycle IN ('monthly', 'yearly')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recurring_expenses_owner_all" ON public.recurring_expenses;
CREATE POLICY "recurring_expenses_owner_all" ON public.recurring_expenses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user_id ON public.recurring_expenses(user_id);

DROP TRIGGER IF EXISTS set_recurring_expenses_updated_at ON public.recurring_expenses;
CREATE TRIGGER set_recurring_expenses_updated_at
  BEFORE UPDATE ON public.recurring_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------
-- time_blocks 테이블 (F-29 시간 블록 타임박싱)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.time_blocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TEXT NOT NULL,  -- HH:MM
  end_time   TEXT NOT NULL,  -- HH:MM
  color      TEXT,
  todo_id    UUID REFERENCES public.todos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "time_blocks_owner_all" ON public.time_blocks;
CREATE POLICY "time_blocks_owner_all" ON public.time_blocks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON public.time_blocks(user_id, date);

DROP TRIGGER IF EXISTS set_time_blocks_updated_at ON public.time_blocks;
CREATE TRIGGER set_time_blocks_updated_at
  BEFORE UPDATE ON public.time_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------
-- diet_goals 테이블 (F-31 식단 목표)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.diet_goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  calorie_goal   INTEGER NOT NULL CHECK (calorie_goal > 0),
  protein_goal   DECIMAL(8,2),
  carbs_goal     DECIMAL(8,2),
  fat_goal       DECIMAL(8,2),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.diet_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diet_goals_owner_all" ON public.diet_goals;
CREATE POLICY "diet_goals_owner_all" ON public.diet_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_diet_goals_updated_at ON public.diet_goals;
CREATE TRIGGER set_diet_goals_updated_at
  BEFORE UPDATE ON public.diet_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
