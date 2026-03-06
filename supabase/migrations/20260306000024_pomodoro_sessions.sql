-- F-39 포모도로 세션 테이블
CREATE TABLE pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_minutes INTEGER NOT NULL DEFAULT 25,
  break_minutes INTEGER NOT NULL DEFAULT 5,
  completed BOOLEAN NOT NULL DEFAULT false,
  date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 사용자 + 날짜 복합 인덱스
CREATE INDEX idx_pomodoro_user_date ON pomodoro_sessions(user_id, date);

-- RLS 활성화
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- 사용자 격리 정책
CREATE POLICY "pomodoro: user isolation" ON pomodoro_sessions FOR ALL USING (auth.uid() = user_id);
