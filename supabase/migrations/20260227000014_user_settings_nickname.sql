-- user_settings 테이블에 nickname 컬럼 추가
-- user_metadata.full_name은 Google OAuth 재로그인 시 덮어씌워지므로
-- 사용자 설정 닉네임은 user_settings에 별도로 저장
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS nickname TEXT DEFAULT NULL;
