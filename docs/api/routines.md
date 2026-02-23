# F-07 루틴 API 스펙 (확정본)

기준일: 2026-02-23

## 공통 사항

- 모든 응답: `{ success: boolean, data?: T, error?: string }`
- 인증: Supabase JWT (쿠키 기반 세션)
- 미인증 요청: `401 Unauthorized`

---

## 1. GET /api/routines

오늘(또는 지정 날짜)의 루틴 목록을 조회합니다. 각 루틴에 해당 날짜의 체크인 로그가 포함됩니다.

### 쿼리 파라미터

| 파라미터 | 타입   | 필수 | 설명                    |
| -------- | ------ | ---- | ----------------------- |
| date     | string | N    | 조회 날짜 (YYYY-MM-DD) |

### 응답 (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "아침 운동",
      "description": null,
      "frequency": "daily",
      "days_of_week": null,
      "interval_days": null,
      "time_of_day": "07:00",
      "streak": 5,
      "is_active": true,
      "created_at": "2026-02-01T00:00:00Z",
      "updated_at": "2026-02-23T00:00:00Z",
      "log": {
        "id": "uuid",
        "routine_id": "uuid",
        "user_id": "uuid",
        "date": "2026-02-23",
        "completed": true,
        "completed_at": "2026-02-23T07:15:00Z",
        "created_at": "2026-02-23T07:15:00Z"
      }
    }
  ]
}
```

### 오늘 실행일 판단 로직

| frequency | 판단 기준                                                              |
| --------- | ---------------------------------------------------------------------- |
| daily     | 항상 표시                                                              |
| weekly    | `days_of_week` 배열에 오늘 요일 포함 (0=일, 1=월, ..., 6=토)         |
| custom    | `created_at` 기준으로 `interval_days` 간격에 해당하는 날짜인 경우    |

---

## 2. POST /api/routines

새 루틴을 생성합니다.

### 요청 Body

```json
{
  "title": "아침 운동",
  "description": "30분 유산소",
  "frequency": "weekly",
  "days_of_week": [1, 3, 5],
  "interval_days": null,
  "time_of_day": "07:00"
}
```

| 필드          | 타입     | 필수 | 설명                                          |
| ------------- | -------- | ---- | --------------------------------------------- |
| title         | string   | Y    | 루틴 제목                                     |
| description   | string   | N    | 루틴 설명                                     |
| frequency     | string   | Y    | 반복 주기 (daily / weekly / custom)           |
| days_of_week  | number[] | 조건 | frequency=weekly 시 필수 (0~6)               |
| interval_days | number   | 조건 | frequency=custom 시 필수 (1 이상)            |
| time_of_day   | string   | N    | 실행 시간 (HH:MM)                            |

### 응답 (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "아침 운동",
    "description": "30분 유산소",
    "frequency": "weekly",
    "days_of_week": [1, 3, 5],
    "interval_days": null,
    "time_of_day": "07:00",
    "streak": 0,
    "is_active": true,
    "created_at": "2026-02-23T00:00:00Z",
    "updated_at": "2026-02-23T00:00:00Z"
  }
}
```

---

## 3. PATCH /api/routines/[id]

루틴을 수정합니다.

### 경로 파라미터

| 파라미터 | 타입   | 설명      |
| -------- | ------ | --------- |
| id       | string | 루틴 UUID |

### 요청 Body (모든 필드 선택)

```json
{
  "title": "저녁 스트레칭",
  "frequency": "daily",
  "days_of_week": null,
  "interval_days": null,
  "time_of_day": "22:00",
  "is_active": true
}
```

### 응답 (200 OK)

```json
{
  "success": true,
  "data": { ...Routine }
}
```

### 오류

| 상태 코드 | 원인                          |
| --------- | ----------------------------- |
| 400       | 제목 빈 문자열, 잘못된 frequency |
| 404       | 루틴 없음 또는 권한 없음      |

---

## 4. DELETE /api/routines/[id]

루틴을 삭제합니다. (cascade: routine_logs도 삭제)

### 경로 파라미터

| 파라미터 | 타입   | 설명      |
| -------- | ------ | --------- |
| id       | string | 루틴 UUID |

### 응답 (200 OK)

```json
{
  "success": true,
  "data": { "id": "uuid" }
}
```

---

## 5. GET /api/routines/logs

특정 날짜의 루틴 로그 목록을 조회합니다.

### 쿼리 파라미터

| 파라미터 | 타입   | 필수 | 설명                    |
| -------- | ------ | ---- | ----------------------- |
| date     | string | Y    | 조회 날짜 (YYYY-MM-DD) |

### 응답 (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "routine_id": "uuid",
      "user_id": "uuid",
      "date": "2026-02-23",
      "completed": true,
      "completed_at": "2026-02-23T07:15:00Z",
      "created_at": "2026-02-23T07:00:00Z"
    }
  ]
}
```

---

## 6. POST /api/routines/logs

루틴 체크인을 처리합니다. (upsert: routine_id + date 기준)

### 요청 Body

```json
{
  "routineId": "uuid",
  "date": "2026-02-23",
  "completed": true
}
```

| 필드      | 타입    | 필수 | 설명                     |
| --------- | ------- | ---- | ------------------------ |
| routineId | string  | Y    | 루틴 UUID                |
| date      | string  | Y    | 날짜 (YYYY-MM-DD)       |
| completed | boolean | Y    | 완료 여부                |

### streak 업데이트 로직

- `completed=true`: 어제 로그가 `completed=true`이면 `streak+1`, 아니면 `streak=1`
- `completed=false`: `streak=0`으로 리셋

### 응답 (200 OK)

```json
{
  "success": true,
  "data": {
    "log": {
      "id": "uuid",
      "routine_id": "uuid",
      "user_id": "uuid",
      "date": "2026-02-23",
      "completed": true,
      "completed_at": "2026-02-23T07:15:00Z",
      "created_at": "2026-02-23T07:00:00Z"
    },
    "streak": 6
  }
}
```
