-- foods 테이블 aliases 컬럼 jsonb 인덱스 추가 (검색 성능 개선)
CREATE INDEX IF NOT EXISTS foods_aliases_idx ON public.foods USING gin(aliases jsonb_path_ops);
ANALYZE public.foods;
