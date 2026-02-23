# F-08 DB 스키마 확정본 — transactions

## transactions 테이블

```sql
CREATE TABLE public.transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount      DECIMAL(12, 2) NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID        REFERENCES public.categories(id),
  memo        TEXT,
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  is_favorite BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

## 인덱스

```sql
-- 사용자별 날짜 내림차순 조회 (목록 기본 정렬)
CREATE INDEX idx_transactions_user_date
  ON public.transactions(user_id, date DESC);

-- 즐겨찾기 필터
CREATE INDEX idx_transactions_user_favorite
  ON public.transactions(user_id, is_favorite)
  WHERE is_favorite = TRUE;

-- 카테고리별 집계
CREATE INDEX idx_transactions_category
  ON public.transactions(category_id);
```

## RLS 정책

```sql
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 SELECT
CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 데이터만 INSERT
CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 데이터만 UPDATE
CREATE POLICY "transactions_update_own"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

-- 본인 데이터만 DELETE
CREATE POLICY "transactions_delete_own"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);
```

## updated_at 자동 갱신 트리거

```sql
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
```

## 관계

| 컬럼 | 참조 테이블 | 참조 컬럼 | 동작 |
|---|---|---|---|
| user_id | public.users | id | ON DELETE CASCADE |
| category_id | public.categories | id | ON DELETE SET NULL (기본값) |

## 쿼리 패턴

### 월별 목록 조회 (카테고리 조인)
```sql
SELECT t.*, c.id, c.name, c.icon, c.color, c.type
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.user_id = $1
  AND t.date >= $2   -- YYYY-MM-01
  AND t.date <= $3   -- YYYY-MM-DD (월 마지막 날)
ORDER BY t.date DESC, t.created_at DESC;
```

### 즐겨찾기 목록 조회
```sql
SELECT t.*, c.id, c.name, c.icon, c.color, c.type
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.user_id = $1
  AND t.is_favorite = TRUE
ORDER BY t.date DESC, t.created_at DESC;
```
