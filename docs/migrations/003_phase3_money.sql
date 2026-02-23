-- ============================================================
-- Phase 3 마이그레이션: categories, transactions 테이블
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================================

-- ----------------------------------------
-- categories 테이블
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  -- NULL이면 시스템 기본 카테고리
  name       TEXT NOT NULL,
  icon       TEXT,           -- 이모지 또는 아이콘 코드
  color      TEXT,           -- HEX 색상 (#RRGGBB)
  type       TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  is_system  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 시스템 카테고리는 전체 조회, 사용자 카테고리는 본인만
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (is_system = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
CREATE POLICY "categories_insert_own" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
CREATE POLICY "categories_update_own" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id AND is_system = FALSE);

DROP POLICY IF EXISTS "categories_delete_own" ON public.categories;
CREATE POLICY "categories_delete_own" ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_categories_user_id   ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type       ON public.categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_is_system  ON public.categories(is_system);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

-- ----------------------------------------
-- transactions 테이블 (F-08 수입/지출 입력용, 미리 생성)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount      NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  memo        TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_owner_all" ON public.transactions;
CREATE POLICY "transactions_owner_all" ON public.transactions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id    ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date       ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category   ON public.transactions(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type       ON public.transactions(user_id, type);

DROP TRIGGER IF EXISTS set_transactions_updated_at ON public.transactions;
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------
-- budgets 테이블 (F-10 월별 예산 설정)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount      DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  year_month  TEXT NOT NULL,  -- 'YYYY-MM'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_budgets_user_category_month UNIQUE (user_id, category_id, year_month)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budgets_select_own" ON public.budgets;
CREATE POLICY "budgets_select_own" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_insert_own" ON public.budgets;
CREATE POLICY "budgets_insert_own" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_update_own" ON public.budgets;
CREATE POLICY "budgets_update_own" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_delete_own" ON public.budgets;
CREATE POLICY "budgets_delete_own" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, year_month);
CREATE INDEX IF NOT EXISTS idx_budgets_category   ON public.budgets(category_id) WHERE category_id IS NOT NULL;

DROP TRIGGER IF EXISTS set_budgets_updated_at ON public.budgets;
CREATE TRIGGER set_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 시스템 기본 카테고리 시드 데이터
-- ============================================================

-- 지출 카테고리
INSERT INTO public.categories (name, icon, color, type, is_system, sort_order) VALUES
  ('식비',   '🍚', '#FF6B6B', 'expense', TRUE, 10),
  ('교통',   '🚌', '#4ECDC4', 'expense', TRUE, 20),
  ('여가',   '🎮', '#45B7D1', 'expense', TRUE, 30),
  ('쇼핑',   '🛍️', '#96CEB4', 'expense', TRUE, 40),
  ('의료',   '🏥', '#FFEAA7', 'expense', TRUE, 50),
  ('교육',   '📚', '#DDA0DD', 'expense', TRUE, 60),
  ('주거',   '🏠', '#98D8C8', 'expense', TRUE, 70),
  ('기타',   '📦', '#B0B0B0', 'expense', TRUE, 80)
ON CONFLICT DO NOTHING;

-- 수입 카테고리
INSERT INTO public.categories (name, icon, color, type, is_system, sort_order) VALUES
  ('급여',   '💰', '#2ECC71', 'income', TRUE, 10),
  ('용돈',   '💵', '#27AE60', 'income', TRUE, 20),
  ('부수입', '💸', '#F39C12', 'income', TRUE, 30),
  ('기타',   '📦', '#B0B0B0', 'income', TRUE, 40)
ON CONFLICT DO NOTHING;
