# F-12 식사 기록 API 스펙 확정본

## 공통

- Base URL: `/api/health/meals`
- 인증: Supabase Auth 쿠키 세션 필수 (미인증 시 401 반환)
- 응답 형식: `{ success: boolean, data?: T, error?: string }`

---

## GET /api/health/meals

날짜별 식사 기록 목록을 조회합니다.

### 쿼리 파라미터

| 파라미터 | 타입   | 필수 | 기본값     | 설명                       |
|----------|--------|------|-----------|----------------------------|
| `date`   | string | 아니오 | 오늘 날짜 | 조회 날짜 (형식: YYYY-MM-DD) |

### 응답 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "meal_type": "breakfast",
      "food_name": "오트밀",
      "calories": 350.00,
      "protein": 12.5,
      "carbs": 60.0,
      "fat": 5.0,
      "date": "2026-02-23",
      "created_at": "2026-02-23T08:00:00Z",
      "updated_at": "2026-02-23T08:00:00Z"
    }
  ]
}
```

- 정렬 순서: `breakfast → lunch → dinner → snack` (같은 유형 내에서는 `created_at` 오름차순)

### 응답 400 Bad Request

```json
{ "success": false, "error": "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)" }
```

### 응답 401 Unauthorized

```json
{ "success": false, "error": "인증이 필요합니다" }
```

---

## POST /api/health/meals

새로운 식사 기록을 생성합니다.

### 요청 바디

```json
{
  "meal_type": "lunch",
  "food_name": "비빔밥",
  "calories": 500,
  "protein": 18.0,
  "carbs": 85.0,
  "fat": 10.0,
  "date": "2026-02-23"
}
```

| 필드        | 타입   | 필수 | 설명                                      |
|-------------|--------|------|-------------------------------------------|
| `meal_type` | string | 예   | `breakfast` / `lunch` / `dinner` / `snack` |
| `food_name` | string | 예   | 음식명 (빈 문자열 불가)                    |
| `calories`  | number | 아니오 | 칼로리 (kcal, 0 이상)                   |
| `protein`   | number | 아니오 | 단백질 (g)                              |
| `carbs`     | number | 아니오 | 탄수화물 (g)                            |
| `fat`       | number | 아니오 | 지방 (g)                                |
| `date`      | string | 아니오 | 날짜 (YYYY-MM-DD, 기본값: 오늘)         |

### 응답 201 Created

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "meal_type": "lunch",
    "food_name": "비빔밥",
    "calories": 500.00,
    "protein": 18.0,
    "carbs": 85.0,
    "fat": 10.0,
    "date": "2026-02-23",
    "created_at": "2026-02-23T12:00:00Z",
    "updated_at": "2026-02-23T12:00:00Z"
  }
}
```

### 에러 응답

| 상태 | 메시지 |
|------|--------|
| 400  | `유효하지 않은 식사 유형입니다 (breakfast/lunch/dinner/snack)` |
| 400  | `음식명은 필수입니다` |
| 400  | `칼로리는 0 이상의 숫자여야 합니다` |
| 400  | `날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)` |
| 401  | `인증이 필요합니다` |
| 500  | `식사 기록 생성에 실패했습니다` |

---

## PATCH /api/health/meals/[id]

식사 기록을 수정합니다.

### URL 파라미터

| 파라미터 | 타입   | 설명        |
|----------|--------|-------------|
| `id`     | string | 식사 기록 UUID |

### 요청 바디 (부분 수정 가능)

```json
{
  "food_name": "참치비빔밥",
  "calories": 520
}
```

| 필드        | 타입          | 설명                |
|-------------|---------------|---------------------|
| `meal_type` | string        | 식사 유형 (선택)     |
| `food_name` | string        | 음식명 (선택)        |
| `calories`  | number \| null | 칼로리 (선택)       |
| `protein`   | number \| null | 단백질 (선택)       |
| `carbs`     | number \| null | 탄수화물 (선택)     |
| `fat`       | number \| null | 지방 (선택)         |
| `date`      | string        | 날짜 (선택)          |

### 응답 200 OK

```json
{
  "success": true,
  "data": { /* 수정된 MealLog */ }
}
```

### 에러 응답

| 상태 | 메시지 |
|------|--------|
| 400  | `유효하지 않은 식사 유형입니다` |
| 400  | `음식명은 빈 값일 수 없습니다` |
| 400  | `날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)` |
| 401  | `인증이 필요합니다` |
| 404  | `식사 기록을 찾을 수 없습니다` |
| 500  | `식사 기록 수정에 실패했습니다` |

---

## DELETE /api/health/meals/[id]

식사 기록을 삭제합니다.

### URL 파라미터

| 파라미터 | 타입   | 설명        |
|----------|--------|-------------|
| `id`     | string | 식사 기록 UUID |

### 응답 200 OK

```json
{ "success": true, "data": null }
```

### 에러 응답

| 상태 | 메시지 |
|------|--------|
| 401  | `인증이 필요합니다` |
| 404  | `식사 기록을 찾을 수 없습니다` |
| 500  | `식사 기록 삭제에 실패했습니다` |
