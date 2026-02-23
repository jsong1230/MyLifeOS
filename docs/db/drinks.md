# F-13 음주 기록 DB 스키마

## 테이블: drink_logs

음주 기록을 저장하는 테이블. 주종/도수/양/잔수/날짜/메모를 관리합니다.

### 스키마

```sql
CREATE TABLE public.drink_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  drink_type  TEXT NOT NULL CHECK (drink_type IN ('beer', 'soju', 'wine', 'whiskey', 'other')),
  alcohol_pct DECIMAL(4, 1),          -- 도수(%), NULL 허용
  amount_ml   DECIMAL(8, 1) NOT NULL, -- 양(ml), 필수
  drink_count DECIMAL(4, 1),          -- 잔 수, NULL 허용
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  note        TEXT,                   -- 메모, NULL 허용
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 컬럼 설명

| 컬럼          | 타입             | 제약                  | 설명 |
|--------------|------------------|-----------------------|------|
| `id`          | UUID             | PK, DEFAULT gen_uuid  | 기록 고유 ID |
| `user_id`     | UUID             | NOT NULL, FK(users)   | 사용자 ID (RLS) |
| `drink_type`  | TEXT             | NOT NULL, CHECK       | 주종: beer/soju/wine/whiskey/other |
| `alcohol_pct` | DECIMAL(4, 1)    | NULL 허용             | 도수(%). 예: 5.0, 16.5 |
| `amount_ml`   | DECIMAL(8, 1)    | NOT NULL              | 음주량(ml). 예: 355.0 |
| `drink_count` | DECIMAL(4, 1)    | NULL 허용             | 잔 수. 예: 1.5 (반 잔도 지원) |
| `date`        | DATE             | NOT NULL, DEFAULT NOW | 음주 날짜 (YYYY-MM-DD) |
| `note`        | TEXT             | NULL 허용             | 메모 |
| `created_at`  | TIMESTAMPTZ      | NOT NULL, DEFAULT NOW | 생성 시각 |
| `updated_at`  | TIMESTAMPTZ      | NOT NULL, DEFAULT NOW | 수정 시각 (트리거로 자동 갱신) |

### 인덱스

```sql
-- 사용자별 날짜 내림차순 조회 (주간 필터링 최적화)
CREATE INDEX idx_drink_logs_user_date ON public.drink_logs(user_id, date DESC);

-- user_id 단독 인덱스 (RLS 체크)
CREATE INDEX idx_drink_logs_user_id ON public.drink_logs(user_id);
```

### RLS 정책

```sql
ALTER TABLE public.drink_logs ENABLE ROW LEVEL SECURITY;

-- 본인 기록만 전체 CRUD 허용
CREATE POLICY "drink_logs_owner_all" ON public.drink_logs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 트리거

```sql
-- updated_at 자동 갱신 (update_updated_at 함수 사용)
CREATE TRIGGER set_drink_logs_updated_at
  BEFORE UPDATE ON public.drink_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 마이그레이션 파일

`docs/migrations/004_health_drinks.sql`

### 쿼리 패턴

**주간 기록 조회 (월요일~일요일)**
```sql
SELECT id, user_id, drink_type, alcohol_pct, amount_ml, drink_count, date, note, created_at, updated_at
FROM drink_logs
WHERE user_id = $1
  AND date >= $2  -- 주 시작일 (월요일)
  AND date <= $3  -- 주 종료일 (일요일)
ORDER BY date DESC, created_at DESC;
```

**주간 집계 계산** (애플리케이션 레이어에서 처리)
- `count`: 조회된 레코드 수
- `total_ml`: `SUM(amount_ml)`
