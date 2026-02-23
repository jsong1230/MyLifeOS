# F-09 카테고리 관리 DB 스키마

## 마이그레이션 파일

`docs/migrations/003_phase3_money.sql`

---

## categories 테이블

카테고리 정보를 저장하는 테이블. `user_id = NULL`이면 시스템 기본 카테고리.

```sql
CREATE TABLE public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT,
  color      TEXT,
  type       TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  is_system  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 컬럼 설명

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| user_id | UUID | NULL 허용 | - | FK → users.id. NULL이면 시스템 카테고리 |
| name | TEXT | NOT NULL | - | 카테고리 이름 (최대 50자 권장) |
| icon | TEXT | NULL 허용 | NULL | 이모지 아이콘 |
| color | TEXT | NULL 허용 | NULL | HEX 색상 코드 (#RRGGBB) |
| type | TEXT | NOT NULL | - | 카테고리 타입: income / expense / both |
| is_system | BOOLEAN | NOT NULL | FALSE | 시스템 기본 카테고리 여부 |
| sort_order | INTEGER | NOT NULL | 0 | 정렬 순서 (오름차순) |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | 생성 일시 |

### 제약 조건

- `type` 컬럼: `income`, `expense`, `both` 중 하나
- `user_id = NULL AND is_system = TRUE`: 시스템 카테고리
- `user_id IS NOT NULL AND is_system = FALSE`: 사용자 커스텀 카테고리

---

## transactions 테이블 (F-08용, 사전 생성)

```sql
CREATE TABLE public.transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount      NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  memo        TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 컬럼 설명

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | UUID | NOT NULL | gen_random_uuid() | PK |
| user_id | UUID | NOT NULL | - | FK → users.id |
| category_id | UUID | NULL 허용 | NULL | FK → categories.id (삭제 시 SET NULL) |
| type | TEXT | NOT NULL | - | income 또는 expense |
| amount | NUMERIC(15,2) | NOT NULL | - | 금액 (양수) |
| memo | TEXT | NULL 허용 | NULL | 메모 |
| date | DATE | NOT NULL | CURRENT_DATE | 거래 날짜 |
| is_favorite | BOOLEAN | NOT NULL | FALSE | 즐겨찾기 여부 |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | 생성 일시 |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | 수정 일시 |

---

## Row Level Security (RLS)

### categories 테이블

```sql
-- 조회: 시스템 카테고리는 모두, 사용자 카테고리는 본인만
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (is_system = TRUE OR auth.uid() = user_id);

-- 추가: 본인 소유 커스텀 카테고리만 생성 가능
CREATE POLICY "categories_insert_own" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

-- 수정: 본인 소유 커스텀 카테고리만 수정 가능
CREATE POLICY "categories_update_own" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id AND is_system = FALSE);

-- 삭제: 본인 소유 커스텀 카테고리만 삭제 가능
CREATE POLICY "categories_delete_own" ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);
```

### transactions 테이블

```sql
-- 본인 소유 거래만 CRUD 가능
CREATE POLICY "transactions_owner_all" ON public.transactions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 인덱스

### categories

| 인덱스명 | 컬럼 | 목적 |
|----------|------|------|
| idx_categories_user_id | user_id | 사용자별 카테고리 조회 |
| idx_categories_type | type | 타입 필터 조회 |
| idx_categories_is_system | is_system | 시스템/사용자 구분 조회 |
| idx_categories_sort_order | sort_order | 정렬 순서 조회 |

### transactions

| 인덱스명 | 컬럼 | 목적 |
|----------|------|------|
| idx_transactions_user_id | user_id | 사용자별 거래 조회 |
| idx_transactions_date | (user_id, date) | 날짜 필터 조회 |
| idx_transactions_category | (user_id, category_id) | 카테고리별 거래 조회 |
| idx_transactions_type | (user_id, type) | 수입/지출 타입 필터 |

---

## 시드 데이터

시스템 기본 카테고리는 `003_phase3_money.sql`의 INSERT 구문으로 삽입됩니다.

### 지출 카테고리 (type = 'expense')

| name | icon | color | sort_order |
|------|------|-------|------------|
| 식비 | 🍚 | #FF6B6B | 10 |
| 교통 | 🚌 | #4ECDC4 | 20 |
| 여가 | 🎮 | #45B7D1 | 30 |
| 쇼핑 | 🛍️ | #96CEB4 | 40 |
| 의료 | 🏥 | #FFEAA7 | 50 |
| 교육 | 📚 | #DDA0DD | 60 |
| 주거 | 🏠 | #98D8C8 | 70 |
| 기타 | 📦 | #B0B0B0 | 80 |

### 수입 카테고리 (type = 'income')

| name | icon | color | sort_order |
|------|------|-------|------------|
| 급여 | 💰 | #2ECC71 | 10 |
| 용돈 | 💵 | #27AE60 | 20 |
| 부수입 | 💸 | #F39C12 | 30 |
| 기타 | 📦 | #B0B0B0 | 40 |

---

## 주의사항

1. categories 삭제 시 transactions.category_id는 NULL로 설정됨 (ON DELETE SET NULL)
2. users 삭제 시 해당 사용자의 categories 전체 삭제 (ON DELETE CASCADE)
3. 시스템 카테고리는 API 레벨에서도 수정/삭제 차단 (403 반환)
4. 커스텀 카테고리 sort_order 기본값: 기존 최대값 + 10
