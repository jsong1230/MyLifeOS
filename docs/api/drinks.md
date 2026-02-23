# F-13 음주 기록 API 스펙

## 개요
주종/도수/양(ml)/잔 수를 기록하고 주간 집계를 조회하는 음주 관리 API

---

## GET /api/health/drinks

주간(또는 특정 날짜) 음주 기록 목록을 조회합니다.

### 쿼리 파라미터

| 파라미터 | 타입   | 필수 | 설명 |
|---------|--------|------|------|
| `week`  | string | X    | 해당 주 임의 날짜 (YYYY-MM-DD). 입력된 날짜가 속한 주(월~일) 기록 조회 |
| `date`  | string | X    | 특정 날짜 (YYYY-MM-DD). 단일 날짜 기록 조회 |

- 파라미터 없으면 이번 주(오늘 기준 월~일) 기록 조회
- `date`와 `week` 동시 입력 시 `date` 우선

### 응답

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "drink_type": "beer",
      "alcohol_pct": 5.0,
      "amount_ml": 355.0,
      "drink_count": 1.0,
      "date": "2026-02-23",
      "note": "치킨과 함께",
      "created_at": "2026-02-23T12:00:00Z",
      "updated_at": "2026-02-23T12:00:00Z"
    }
  ],
  "summary": {
    "count": 3,
    "total_ml": 1065.0
  },
  "week_start": "2026-02-23",
  "week_end": "2026-03-01"
}
```

- `summary.count`: 해당 기간 기록 건수
- `summary.total_ml`: 해당 기간 총 음주량(ml) 합계
- `week_start`, `week_end`: 주간 조회 시에만 포함 (date 파라미터 사용 시 미포함)

### 오류 응답

| 상태 코드 | 조건 |
|----------|------|
| 400 | 날짜 형식 오류 (YYYY-MM-DD 아닌 경우) |
| 401 | 인증 없음 |
| 500 | 서버 오류 |

---

## POST /api/health/drinks

새 음주 기록을 생성합니다.

### 요청 바디

```json
{
  "drink_type": "beer",
  "amount_ml": 355,
  "alcohol_pct": 5.0,
  "drink_count": 1.0,
  "date": "2026-02-23",
  "note": "치킨과 함께"
}
```

| 필드         | 타입   | 필수 | 설명 |
|-------------|--------|------|------|
| `drink_type` | string | Y    | 주종: `beer`, `soju`, `wine`, `whiskey`, `other` |
| `amount_ml`  | number | Y    | 음주량(ml), 0 초과 |
| `alcohol_pct`| number | X    | 도수(%), 0~100 |
| `drink_count`| number | X    | 잔 수, 0 이상 |
| `date`       | string | X    | 날짜 (YYYY-MM-DD), 기본값: 오늘 |
| `note`       | string | X    | 메모 |

### 응답

```json
{
  "success": true,
  "data": { /* DrinkLog 객체 */ }
}
```

- 상태 코드: 201

### 오류 응답

| 상태 코드 | 조건 |
|----------|------|
| 400 | 필수 필드 누락, 유효하지 않은 주종, 음주량 <= 0, 도수 범위 초과 |
| 401 | 인증 없음 |
| 500 | 서버 오류 |

---

## PATCH /api/health/drinks/:id

음주 기록을 수정합니다.

### 경로 파라미터

| 파라미터 | 타입   | 필수 | 설명 |
|---------|--------|------|------|
| `id`    | string | Y    | 음주 기록 UUID |

### 요청 바디

모든 필드 선택. 입력된 필드만 수정됨.

```json
{
  "drink_type": "soju",
  "amount_ml": 360,
  "alcohol_pct": 16,
  "drink_count": 2,
  "date": "2026-02-23",
  "note": "수정된 메모"
}
```

### 응답

```json
{
  "success": true,
  "data": { /* 수정된 DrinkLog 객체 */ }
}
```

### 오류 응답

| 상태 코드 | 조건 |
|----------|------|
| 400 | 유효하지 않은 주종, 음주량 <= 0, 도수 범위 초과, 날짜 형식 오류 |
| 401 | 인증 없음 |
| 404 | 기록 없음 또는 타인 소유 기록 |
| 500 | 서버 오류 |

---

## DELETE /api/health/drinks/:id

음주 기록을 삭제합니다.

### 경로 파라미터

| 파라미터 | 타입   | 필수 | 설명 |
|---------|--------|------|------|
| `id`    | string | Y    | 음주 기록 UUID |

### 응답

```json
{
  "success": true,
  "data": null
}
```

### 오류 응답

| 상태 코드 | 조건 |
|----------|------|
| 401 | 인증 없음 |
| 404 | 기록 없음 또는 타인 소유 기록 |
| 500 | 서버 오류 |

---

## DrinkLog 타입

```typescript
interface DrinkLog {
  id: string           // UUID
  user_id: string      // UUID
  drink_type: DrinkType
  alcohol_pct: number | null
  amount_ml: number
  drink_count: number | null
  date: string         // YYYY-MM-DD
  note: string | null
  created_at: string   // ISO 8601
  updated_at: string   // ISO 8601
}

type DrinkType = 'beer' | 'soju' | 'wine' | 'whiskey' | 'other'
```
