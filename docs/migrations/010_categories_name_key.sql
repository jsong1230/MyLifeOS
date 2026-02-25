-- ============================================================
-- Migration 010: categories 테이블에 name_key 컬럼 추가
-- 시스템 카테고리 i18n 지원을 위해 name_key 컬럼 추가
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================================

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_key TEXT;

-- 기존 시스템 카테고리에 name_key 설정 (expense)
UPDATE public.categories SET name_key = 'food'         WHERE name = '식비'   AND is_system = TRUE;
UPDATE public.categories SET name_key = 'transport'    WHERE name = '교통'   AND is_system = TRUE;
UPDATE public.categories SET name_key = 'leisure'      WHERE name = '여가'   AND is_system = TRUE;
UPDATE public.categories SET name_key = 'shopping'     WHERE name = '쇼핑'   AND is_system = TRUE;
UPDATE public.categories SET name_key = 'medical'      WHERE name = '의료'   AND is_system = TRUE;
UPDATE public.categories SET name_key = 'education'    WHERE name = '교육'   AND is_system = TRUE;
UPDATE public.categories SET name_key = 'housing'      WHERE name = '주거'   AND is_system = TRUE;
UPDATE public.categories SET name_key = 'other'        WHERE name = '기타'   AND is_system = TRUE;

-- 기존 시스템 카테고리에 name_key 설정 (income)
UPDATE public.categories SET name_key = 'salary'       WHERE name = '급여'   AND is_system = TRUE;
UPDATE public.categories SET name_key = 'allowance'    WHERE name = '용돈'   AND is_system = TRUE;
UPDATE public.categories SET name_key = 'extra_income' WHERE name = '부수입' AND is_system = TRUE;
