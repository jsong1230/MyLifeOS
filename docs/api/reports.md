# API 스펙: 주간/월간 리포트 (F-19)

## 공통 사항

- 모든 API는 Supabase Auth 세션 인증 필수
- 응답 형식: `{ success: boolean, data?: T, error?: string }`

---

## GET /api/reports/weekly

주간 리포트를 집계하여 반환합니다.

### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `week` | `YYYY-MM-DD` | 선택 | 주 시작 월요일 날짜. 생략 시 이번 주 월요일 |

### 응답 (200 OK)

```json
{
  "success": true,
  "data": {
    "week_start": "2026-02-16",
    "todos": {
      "total": 10,
      "completed": 7,
      "rate": 70
    },
    "spending": {
      "income": 3000000,
      "expense": 150000
    },
    "health": {
      "avg_sleep": 7.2,
      "drink_days": 2
    },
    "emotions": {
      "happy": 3,
      "calm": 2,
      "tired": 1
    }
  }
}
```

### 집계 기준

- `todos`: `due_date`가 해당 주(월~일)에 속하는 할일
- `spending`: `date`가 해당 주에 속하는 거래
- `health.avg_sleep`: `health_logs` 테이블에서 `log_type='sleep'`, `value`(수면 시간 h) 평균
- `health.drink_days`: `drink_logs`에서 해당 주 음주 기록이 있는 고유 날짜 수
- `emotions`: `diaries`에서 해당 주 `emotion_tags` 배열 내 각 태그 횟수 합산

### 에러 응답

| 상태 코드 | 설명 |
|-----------|------|
| 400 | `week` 파라미터 형식 오류 (YYYY-MM-DD 아닌 경우) |
| 401 | 인증 필요 |
| 500 | 집계 쿼리 실패 |

---

## GET /api/reports/monthly

월간 리포트를 집계하여 반환합니다. 전월 대비 지출 변화도 포함합니다.

### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `year` | `YYYY` | 필수 | 연도 |
| `month` | `M` 또는 `MM` | 필수 | 월 (1~12) |

### 응답 (200 OK)

```json
{
  "success": true,
  "data": {
    "year": 2026,
    "month": 2,
    "todos": {
      "total": 45,
      "completed": 38,
      "rate": 84
    },
    "spending": {
      "income": 4500000,
      "expense": 1230000,
      "prev_expense": 1100000,
      "change_pct": 12
    },
    "health": {
      "avg_sleep": 7.0,
      "drink_days": 6
    },
    "emotions": {
      "happy": 10,
      "calm": 8,
      "grateful": 5,
      "tired": 4
    }
  }
}
```

### 집계 기준

- `todos`: `due_date`가 해당 월에 속하는 할일
- `spending.income/expense`: 해당 월 거래 합산
- `spending.prev_expense`: 전월 지출 합산
- `spending.change_pct`: `(이번달 지출 - 전월 지출) / 전월 지출 * 100` (전월이 0이면 0)
- `health.avg_sleep`: 해당 월 수면 기록 평균 (소수점 1자리)
- `health.drink_days`: 해당 월 고유 음주 날짜 수
- `emotions`: 해당 월 일기 감정 태그 횟수 합산

### 에러 응답

| 상태 코드 | 설명 |
|-----------|------|
| 400 | `year`/`month` 파라미터 누락 또는 유효하지 않은 값 |
| 401 | 인증 필요 |
| 500 | 집계 쿼리 실패 |
