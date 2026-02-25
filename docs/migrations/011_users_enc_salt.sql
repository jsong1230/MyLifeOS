-- ============================================================
-- Migration 011: users 테이블에 enc_salt 컬럼 추가
-- 일기/관계 메모 암호화 키 파생에 사용되는 salt를 서버에 저장
-- 기기 변경 / 탭 변경 시에도 동일한 암호화 키 유지
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS enc_salt TEXT;
