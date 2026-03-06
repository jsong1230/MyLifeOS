-- 복약 스케줄 테이블
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,          -- 용량 (예: "500mg", "1정")
  frequency TEXT NOT NULL DEFAULT 'daily',  -- 'daily' | 'weekly' | 'as_needed'
  times TEXT[] NOT NULL DEFAULT ARRAY['08:00'],  -- 복용 시각 목록
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 복용 체크인 기록 테이블
CREATE TABLE medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_medication_logs_unique ON medication_logs(medication_id, date);
CREATE INDEX idx_medications_user ON medications(user_id);
CREATE INDEX idx_medication_logs_user_date ON medication_logs(user_id, date);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medications: user isolation" ON medications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "medication_logs: user isolation" ON medication_logs FOR ALL USING (auth.uid() = user_id);
