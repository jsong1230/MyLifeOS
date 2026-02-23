-- ============================================================
-- Phase P1 마이그레이션: assets 테이블 (F-21 자산 현황)
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================================

-- ----------------------------------------
-- assets 테이블
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  asset_type  TEXT NOT NULL CHECK (asset_type IN ('cash', 'deposit', 'investment', 'other')),
  amount      DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  note        TEXT,
  month       TEXT NOT NULL CHECK (month ~ '^[0-9]{4}-[0-9]{2}$'),  -- YYYY-MM
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assets_owner_all" ON public.assets;
CREATE POLICY "assets_owner_all" ON public.assets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_assets_user_month ON public.assets(user_id, month);

DROP TRIGGER IF EXISTS set_assets_updated_at ON public.assets;
CREATE TRIGGER set_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
