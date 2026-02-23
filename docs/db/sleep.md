# F-14 수면 기록 DB 스키마 (확정본)

## 테이블: health_logs (log_type = 'sleep')

기존 `health_logs` 테이블의 `sleep` 레코드를 수면 기록으로 활용합니다.

```sql
CREATE TABLE public.health_logs (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_type    TEXT          NOT NULL CHECK (log_type IN ('sleep', 'exercise', 'weight', 'body_fat', 'muscle_mass')),
  value       DECIMAL(10,2) NOT NULL,   -- 수면 시간(h), 소수점 1자리 (예: 7.5)
  value2      DECIMAL(10,2),            -- 수면 질 (1.00~5.00)
  unit        TEXT,                     -- 'hours' 고정
  note        TEXT,
  date        DATE          NOT NULL DEFAULT CURRENT_DATE,
  time_start  TIME,                     -- 취침 시각 (HH:MM)
  time_end    TIME,                     -- 기상 시각 (HH:MM)
  calories    DECIMAL(8,2),             -- 수면 기록 시 미사용
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);
```

## 수면 기록 저장 규칙

| 컬럼       | 저장값              | 설명                                |
|------------|---------------------|-------------------------------------|
| log_type   | `'sleep'`           | 고정값                              |
| value      | 수면 시간(h)        | calcSleepHours(time_start, time_end) |
| value2     | 수면 질 (1~5)       | 선택 입력                           |
| unit       | `'hours'`           | 고정값                              |
| time_start | HH:MM (TEXT → TIME) | 취침 시각                           |
| time_end   | HH:MM (TEXT → TIME) | 기상 시각                           |
| calories   | NULL                | 수면 기록 시 미사용                 |

## RLS 정책

```sql
-- 조회: 본인 기록만
CREATE POLICY "sleep_select" ON public.health_logs
  FOR SELECT USING (user_id = auth.uid());

-- 생성: 본인 user_id만
CREATE POLICY "sleep_insert" ON public.health_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 수정: 본인 기록만
CREATE POLICY "sleep_update" ON public.health_logs
  FOR UPDATE USING (user_id = auth.uid());

-- 삭제: 본인 기록만
CREATE POLICY "sleep_delete" ON public.health_logs
  FOR DELETE USING (user_id = auth.uid());
```

## 인덱스

```sql
-- 주간 조회 최적화 (user_id + log_type + date 복합 인덱스)
CREATE INDEX idx_health_logs_user_type_date
  ON public.health_logs (user_id, log_type, date DESC);
```

## 주간 집계 쿼리 패턴

```sql
-- 주간 수면 목록 + 집계
SELECT
  id, user_id, value, value2, date, time_start, time_end, note, created_at, updated_at
FROM health_logs
WHERE user_id = $1
  AND log_type = 'sleep'
  AND date BETWEEN $weekStart AND $weekEnd
ORDER BY date ASC;
```

## 자정 초과 수면 처리

- `time_end <= time_start`인 경우 다음 날 기상으로 처리
- `endMin += 24 * 60` 로직으로 수면 시간 계산
- `date` 컬럼은 **취침 날짜** 기준 저장 (기상 날짜 아님)
- 예: 12월 2일 23:00 취침 → 12월 3일 07:00 기상 → `date = '2025-12-02'`, `value = 8.0`
