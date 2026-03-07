-- F-46: 신규 사용자 온보딩 완료 여부 컬럼 추가
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
