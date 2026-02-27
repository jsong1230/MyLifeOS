-- 정기지출 마지막 기록 날짜 컬럼 추가
ALTER TABLE public.recurring_expenses
  ADD COLUMN IF NOT EXISTS last_recorded_date DATE DEFAULT NULL;

COMMENT ON COLUMN public.recurring_expenses.last_recorded_date IS '마지막으로 거래내역에 기록된 날짜';
