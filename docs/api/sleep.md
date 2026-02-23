# F-14 수면 기록 API 스펙 (확정본)

## 공통

- Base URL: `/api/health/sleep`
- 인증: Supabase Auth (쿠키 기반 세션)
- 응답 형식: `{ success: boolean, data?: T, error?: string }`
- 인증 실패 시: `{ success: false, error: '인증이 필요합니다' }` — 401

---

## GET /api/health/sleep

주간 수면 목록 및 집계 조회

### 쿼리 파라미터

| 파라미터 | 타입   | 필수 | 설명                                         |
|---------|--------|------|----------------------------------------------|
| week    | string | 선택 | 주 시작일 YYYY-MM-DD (기본: 이번 주 월요일)   |
| date    | string | 선택 | 특정 날짜 단일 조회 YYYY-MM-DD (`week` 대체)  |

### 응답 (주간 모드)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "value": 7.5,
      "value2": 4,
      "date": "2025-12-02",
      "time_start": "23:00",
      "time_end": "06:30",
      "note": null,
      "created_at": "2025-12-02T23:00:00Z",
      "updated_at": "2025-12-02T23:00:00Z"
    }
  ],
  "summary": {
    "avg_hours": 7.2,
    "avg_quality": 3.8,
    "week_start": "2025-12-01",
    "week_end": "2025-12-07"
  }
}
```

### 응답 (단일 날짜 모드)

```json
{
  "success": true,
  "data": [ /* SleepLog[] */ ]
}
```

### 에러

| 코드 | 상황                             |
|------|----------------------------------|
| 400  | 날짜/주 시작일 형식 오류 (YYYY-MM-DD) |
| 401  | 인증 실패                        |
| 500  | DB 조회 실패                     |

---

## POST /api/health/sleep

수면 기록 생성

### 요청 Body

```json
{
  "time_start": "23:00",
  "time_end": "07:00",
  "value2": 4,
  "date": "2025-12-02",
  "note": "커피 3잔 마심"
}
```

| 필드       | 타입   | 필수 | 설명                            |
|------------|--------|------|---------------------------------|
| time_start | string | 필수 | 취침 시각 HH:MM                 |
| time_end   | string | 필수 | 기상 시각 HH:MM                 |
| value2     | number | 선택 | 수면 질 1-5 정수                |
| date       | string | 선택 | YYYY-MM-DD (기본: 오늘)         |
| note       | string | 선택 | 메모                            |

- `value` (수면 시간)는 서버에서 자동 계산
- `time_end <= time_start`인 경우 자정 초과로 처리 (다음 날 기상)
- 소수점 1자리 반올림 처리 (예: 23:00~07:00 = 8.0h)

### 응답 (201)

```json
{
  "success": true,
  "data": { /* SleepLog */ }
}
```

### 에러

| 코드 | 상황                                |
|------|-------------------------------------|
| 400  | time_start/time_end 누락 또는 형식 오류 |
| 400  | value2 범위 오류 (1~5 외)           |
| 400  | 날짜 형식 오류                      |
| 401  | 인증 실패                           |
| 500  | DB 저장 실패                        |

---

## PATCH /api/health/sleep/:id

수면 기록 수정

### 경로 파라미터

| 파라미터 | 타입   | 설명             |
|---------|--------|------------------|
| id      | string | 수면 기록 UUID   |

### 요청 Body

```json
{
  "time_start": "22:30",
  "time_end": "07:00",
  "value2": 5,
  "date": "2025-12-02",
  "note": null
}
```

모든 필드 선택. `time_start` 또는 `time_end` 변경 시 `value`(수면 시간) 자동 재계산.

### 응답 (200)

```json
{
  "success": true,
  "data": { /* SleepLog */ }
}
```

### 에러

| 코드 | 상황                           |
|------|--------------------------------|
| 400  | 시각/날짜 형식 오류            |
| 400  | value2 범위 오류               |
| 401  | 인증 실패                      |
| 404  | 기록 없음 또는 소유권 불일치   |
| 500  | DB 수정 실패                   |

---

## DELETE /api/health/sleep/:id

수면 기록 삭제

### 응답 (200)

```json
{ "success": true }
```

### 에러

| 코드 | 상황                         |
|------|------------------------------|
| 401  | 인증 실패                    |
| 404  | 기록 없음 또는 소유권 불일치 |
| 500  | DB 삭제 실패                 |

---

## 수면 시간 계산 로직

```
time_end > time_start  → 당일 수면 (예: 00:00~07:00 = 7h)
time_end <= time_start → 자정 초과 (예: 23:00~07:00 = 8h, 다음 날 기상)
value = round((endMin - startMin) / 60 * 10) / 10  // 소수점 1자리
```
