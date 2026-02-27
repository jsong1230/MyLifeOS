-- updated_at 자동 갱신 함수 (없을 경우 생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 보유 종목 테이블
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'etf', 'crypto', 'other')),
  shares NUMERIC(18,8) NOT NULL DEFAULT 0,
  avg_cost NUMERIC(18,4) NOT NULL DEFAULT 0,
  current_price NUMERIC(18,4),
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 매수/매도 거래 내역 테이블
CREATE TABLE public.investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  price NUMERIC(18,4) NOT NULL,
  shares NUMERIC(18,8) NOT NULL,
  fee NUMERIC(18,4) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investments_own" ON public.investments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "investment_transactions_own" ON public.investment_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at 트리거
CREATE TRIGGER investments_updated_at BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스
CREATE INDEX investments_user_id_idx ON public.investments(user_id);
CREATE INDEX investment_transactions_investment_id_idx ON public.investment_transactions(investment_id);
CREATE INDEX investment_transactions_date_idx ON public.investment_transactions(date DESC);
