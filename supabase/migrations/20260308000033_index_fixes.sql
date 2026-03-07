-- Index fixes: 비효율적 인덱스 3건 수정
-- 1. goals_status_idx: user_id 없는 단독 status 인덱스 → 복합 인덱스
-- 2. investment_transactions_date_idx: investment_id 없는 단독 date 인덱스 → 복합 인덱스
-- 3. routine_logs: 스트릭 계산용 (user_id, routine_id, date) 복합 인덱스 추가

-- 1. goals: (status) → (user_id, status)
DROP INDEX IF EXISTS public.goals_status_idx;
CREATE INDEX goals_user_status_idx ON public.goals(user_id, status);

-- 2. investment_transactions: (date DESC) → (investment_id, date DESC)
DROP INDEX IF EXISTS public.investment_transactions_date_idx;
CREATE INDEX investment_transactions_inv_date_idx
  ON public.investment_transactions(investment_id, date DESC);

-- 3. routine_logs: 스트릭 계산 쿼리용 복합 인덱스 추가
--    WHERE user_id = ? AND routine_id = ? AND date >= ?
CREATE INDEX IF NOT EXISTS idx_routine_logs_user_routine_date
  ON public.routine_logs(user_id, routine_id, date);
