# F-10 월별 예산 DB 스키마

## 테이블: public.budgets

월별 예산 설정을 저장하는 테이블입니다.
카테고리 없는 전체 예산 또는 카테고리별 예산을 지원합니다.

### DDL

```sql
CREATE TABLE public.budgets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID        REFERENCES public.categories(id) ON DELETE SET NULL,
  amount      DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  year_month  TEXT        NOT NULL,  -- 'YYYY-MM' 형식
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_budgets_user_category_month
    UNIQUE (user_id, category_id, year_month)
);
```

### 컬럼 설명

| 컬럼명      | 타입           | NULL 허용 | 설명                                          |
| ----------- | -------------- | --------- | --------------------------------------------- |
| id          | UUID           | NOT NULL  | 예산 고유 식별자 (PK)                         |
| user_id     | UUID           | NOT NULL  | 사용자 ID (FK → users.id, CASCADE DELETE)     |
| category_id | UUID           | NULL 허용 | 카테고리 ID (FK → categories.id, SET NULL)    |
| amount      | DECIMAL(12, 2) | NOT NULL  | 예산 금액 (0보다 큰 값)                       |
| year_month  | TEXT           | NOT NULL  | 예산 월 (YYYY-MM 형식, 예: '2026-02')         |
| created_at  | TIMESTAMPTZ    | NOT NULL  | 생성 일시 (기본값: NOW())                     |
| updated_at  | TIMESTAMPTZ    | NOT NULL  | 수정 일시 (기본값: NOW())                     |

### 유니크 제약

```
UNIQUE (user_id, category_id, year_month)
```

같은 사용자가 같은 월에 같은 카테고리의 예산을 중복 생성할 수 없습니다.
`category_id`가 NULL인 경우 PostgreSQL에서 NULL != NULL이므로 별도 처리가 필요합니다.

### 인덱스 계획

```sql
-- 월별 예산 목록 조회 최적화
CREATE INDEX idx_budgets_user_month
  ON public.budgets (user_id, year_month);

-- 카테고리별 예산 조회 최적화
CREATE INDEX idx_budgets_category
  ON public.budgets (category_id)
  WHERE category_id IS NOT NULL;
```

### RLS 정책

```sql
-- 본인 데이터만 조회
CREATE POLICY "budgets_select_own"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 데이터만 삽입
CREATE POLICY "budgets_insert_own"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 데이터만 수정
CREATE POLICY "budgets_update_own"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 본인 데이터만 삭제
CREATE POLICY "budgets_delete_own"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 관련 테이블: public.transactions (참조)

예산 소진율 계산 시 transactions 테이블에서 해당 월 지출 합계를 조회합니다.

### 지출 합계 쿼리

```sql
SELECT
  category_id,
  SUM(amount) AS spent
FROM public.transactions
WHERE
  user_id = $1
  AND type = 'expense'
  AND date >= '2026-02-01'
  AND date <  '2026-03-01'
  AND category_id = ANY($2)
GROUP BY category_id;
```

---

## upsert 동작

API에서 `POST /api/budgets` 호출 시 Supabase의 `upsert` 메서드를 사용합니다.

```typescript
supabase
  .from('budgets')
  .upsert(
    { user_id, category_id, amount, year_month, updated_at },
    { onConflict: 'user_id,category_id,year_month', ignoreDuplicates: false }
  )
```

중복 키 충돌 시 `amount`와 `updated_at`이 업데이트됩니다.
