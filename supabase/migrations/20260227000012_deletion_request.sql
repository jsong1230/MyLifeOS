-- 회원 탈퇴 요청 컬럼 추가
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.users.deletion_requested_at IS '회원 탈퇴 요청 시각 (관리자가 처리)';
