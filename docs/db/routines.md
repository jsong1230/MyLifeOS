# F-07 루틴 DB 스키마 (확정본)

기준일: 2026-02-23

---

## 테이블: public.routines

루틴 설정 정보를 저장합니다.

```sql
CREATE TABLE public.routines (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  description   TEXT,
  frequency     TEXT        NOT NULL CHECK (frequency IN ('daily', 'weekly', 'custom')),
  days_of_week  INTEGER[],  -- weekly: [0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토]
  interval_days INTEGER,    -- custom: N일 간격 (1 이상)
  time_of_day   TIME,       -- 실행 시간 (HH:MM)
  streak        INTEGER     NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 컬럼 설명

| 컬럼          | 타입        | 설명                                                          |
| ------------- | ----------- | ------------------------------------------------------------- |
| id            | UUID        | 기본 키                                                       |
| user_id       | UUID        | 사용자 ID (users.id FK, cascade delete)                      |
| title         | TEXT        | 루틴 제목 (필수)                                              |
| description   | TEXT        | 루틴 설명 (선택)                                              |
| frequency     | TEXT        | 반복 주기: daily / weekly / custom                           |
| days_of_week  | INTEGER[]   | 요일 목록 (0=일~6=토), weekly 주기에서만 사용                 |
| interval_days | INTEGER     | N일 간격, custom 주기에서만 사용                              |
| time_of_day   | TIME        | 실행 시간 (선택)                                              |
| streak        | INTEGER     | 연속 달성 일수 (0 이상)                                       |
| is_active     | BOOLEAN     | 활성 여부 (false: 일시정지)                                   |
| created_at    | TIMESTAMPTZ | 생성 일시                                                     |
| updated_at    | TIMESTAMPTZ | 수정 일시                                                     |

### 인덱스

```sql
-- user_id 기반 루틴 목록 조회 최적화
CREATE INDEX idx_routines_user_id ON public.routines (user_id);

-- 활성 루틴 필터링 최적화
CREATE INDEX idx_routines_user_active ON public.routines (user_id, is_active);
```

### RLS (Row Level Security)

```sql
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routines_owner_all" ON public.routines
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 테이블: public.routine_logs

루틴 체크인 기록을 저장합니다.

```sql
CREATE TABLE public.routine_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id   UUID        NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date         DATE        NOT NULL,
  completed    BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_routine_logs_routine_date UNIQUE (routine_id, date)
);
```

### 컬럼 설명

| 컬럼         | 타입        | 설명                                              |
| ------------ | ----------- | ------------------------------------------------- |
| id           | UUID        | 기본 키                                           |
| routine_id   | UUID        | 루틴 ID (routines.id FK, cascade delete)         |
| user_id      | UUID        | 사용자 ID (users.id FK, cascade delete)          |
| date         | DATE        | 체크인 날짜 (YYYY-MM-DD)                          |
| completed    | BOOLEAN     | 완료 여부                                         |
| completed_at | TIMESTAMPTZ | 완료 처리 시각 (completed=true일 때 설정)         |
| created_at   | TIMESTAMPTZ | 레코드 생성 일시                                  |

### 유니크 제약

- `UNIQUE (routine_id, date)`: 루틴 + 날짜 조합으로 하나의 로그만 허용 (upsert 기준)

### 인덱스

```sql
-- 특정 날짜의 루틴 로그 조회 최적화
CREATE INDEX idx_routine_logs_user_date ON public.routine_logs (user_id, date);

-- streak 계산 시 어제 로그 조회 최적화
CREATE INDEX idx_routine_logs_routine_date ON public.routine_logs (routine_id, date);
```

### RLS (Row Level Security)

```sql
ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routine_logs_owner_all" ON public.routine_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## ERD

```
public.users
    │
    ├──< public.routines (user_id → users.id)
    │       │
    │       └──< public.routine_logs (routine_id → routines.id)
    │
    └──< public.routine_logs (user_id → users.id)
```

---

## 데이터 정합성 규칙

1. `frequency='daily'`: `days_of_week=NULL`, `interval_days=NULL`
2. `frequency='weekly'`: `days_of_week` 배열 필수 (0~6), `interval_days=NULL`
3. `frequency='custom'`: `interval_days` 1 이상 필수, `days_of_week=NULL`
4. `streak`는 체크인 API에서만 업데이트 (직접 수정 금지)
5. `routine_logs.completed=false` 처리 시 `completed_at=NULL` 설정
