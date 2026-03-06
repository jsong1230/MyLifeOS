-- F-38 수분 섭취 트래킹: water_logs 테이블
CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 사용자 + 날짜 복합 인덱스 (날짜별 조회 최적화)
CREATE INDEX idx_water_logs_user_date ON water_logs(user_id, date);

-- RLS 활성화
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

-- 사용자 격리 정책: 본인 데이터만 접근 가능
CREATE POLICY "water_logs: user isolation" ON water_logs
  FOR ALL
  USING (auth.uid() = user_id);
