-- 009: 사용자 설정 테이블 + 통화 컬럼 추가
-- 실행 전제: 001~008 마이그레이션 완료

-- ============================================================
-- 1. user_settings 테이블 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locale       TEXT        NOT NULL DEFAULT 'ko' CHECK (locale IN ('ko', 'en')),
  default_currency TEXT    NOT NULL DEFAULT 'KRW' CHECK (default_currency IN ('KRW', 'CAD', 'USD')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- RLS 활성화
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_user_settings_updated_at();

-- ============================================================
-- 2. 신규 사용자 가입 시 기본 설정 자동 생성 (기존 handle_new_user 확장)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, locale, default_currency)
  VALUES (NEW.id, 'ko', 'KRW')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거가 없으면 생성
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END;
$$;

-- ============================================================
-- 3. 금전 테이블에 currency 컬럼 추가
-- ============================================================

-- transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'KRW'
    CHECK (currency IN ('KRW', 'CAD', 'USD'));

-- budgets
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'KRW'
    CHECK (currency IN ('KRW', 'CAD', 'USD'));

-- assets
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'KRW'
    CHECK (currency IN ('KRW', 'CAD', 'USD'));

-- recurring_expenses
ALTER TABLE recurring_expenses
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'KRW'
    CHECK (currency IN ('KRW', 'CAD', 'USD'));

-- ============================================================
-- 4. 통화별 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_currency ON transactions (user_id, currency);
CREATE INDEX IF NOT EXISTS idx_assets_currency        ON assets        (user_id, currency);
CREATE INDEX IF NOT EXISTS idx_budgets_currency       ON budgets       (user_id, currency);
CREATE INDEX IF NOT EXISTS idx_recurring_currency     ON recurring_expenses (user_id, currency);

-- ============================================================
-- 5. 기존 사용자에게 기본 설정 생성 (마이그레이션 실행 시)
-- ============================================================
INSERT INTO user_settings (user_id, locale, default_currency)
SELECT id, 'ko', 'KRW'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
