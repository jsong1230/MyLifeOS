-- user_settings 테이블에 캘린더 구독 전용 토큰 컬럼 추가
-- Google Calendar 등 외부 클라이언트는 세션 쿠키 없이 이 토큰으로 인증
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS calendar_token TEXT DEFAULT NULL;

-- 토큰 → user 역조회용 부분 인덱스 (NULL 제외, O(1) 조회)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_calendar_token
  ON public.user_settings(calendar_token)
  WHERE calendar_token IS NOT NULL;
