# F-10 월별 예산 API 스펙

## 공통

- 인증: Supabase Auth (세션 쿠키)
- 응답 형식: `{ success: boolean, data?: T, error?: string }`
- 미인증 요청: `401 Unauthorized`

---

## GET /api/budgets

특정 월의 예산 목록과 해당 월 지출 현황을 반환합니다.

### 쿼리 파라미터

| 파라미터 | 타입   | 필수 | 설명                           |
| -------- | ------ | ---- | ------------------------------ |
| month    | string | 선택 | YYYY-MM 형식. 기본값: 현재 월  |

### 응답 200

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "category_id": "uuid",
      "category": {
        "id": "uuid",
        "name": "식비",
        "icon": "🍽️",
        "color": "#FF6B6B",
        "type": "expense",
        "is_system": true,
        "sort_order": 1,
        "created_at": "2026-02-01T00:00:00Z"
      },
      "amount": 500000,
      "year_month": "2026-02",
      "created_at": "2026-02-01T00:00:00Z",
      "updated_at": "2026-02-01T00:00:00Z",
      "spent": 350000,
      "remaining": 150000,
      "percentage": 70
    }
  ]
}
```

### 에러 응답

| 상태 코드 | 에러 메시지                                |
| --------- | ------------------------------------------ |
| 400       | 유효하지 않은 월 형식입니다 (YYYY-MM)      |
| 401       | 인증이 필요합니다                          |
| 500       | 예산 목록을 조회할 수 없습니다             |

---

## POST /api/budgets

예산을 생성하거나 업데이트합니다 (upsert).
같은 `user_id + category_id + year_month` 조합이 존재하면 금액을 업데이트합니다.

### 요청 바디

```json
{
  "category_id": "uuid",
  "amount": 500000,
  "year_month": "2026-02"
}
```

| 필드        | 타입   | 필수 | 설명                          |
| ----------- | ------ | ---- | ----------------------------- |
| category_id | string | 선택 | 카테고리 UUID (없으면 미분류) |
| amount      | number | 필수 | 예산 금액 (0보다 큰 수)       |
| year_month  | string | 필수 | YYYY-MM 형식                  |

### 응답 201

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "category_id": "uuid",
    "category": { ... },
    "amount": 500000,
    "year_month": "2026-02",
    "created_at": "2026-02-01T00:00:00Z",
    "updated_at": "2026-02-01T00:00:00Z"
  }
}
```

### 에러 응답

| 상태 코드 | 에러 메시지                                |
| --------- | ------------------------------------------ |
| 400       | 예산 금액은 필수입니다                     |
| 400       | 예산 금액은 0보다 큰 숫자여야 합니다       |
| 400       | 예산 월은 필수입니다                       |
| 400       | 유효하지 않은 월 형식입니다 (YYYY-MM)      |
| 401       | 인증이 필요합니다                          |
| 500       | 예산 저장에 실패했습니다                   |

---

## PATCH /api/budgets/[id]

특정 예산의 금액을 수정합니다.

### 경로 파라미터

| 파라미터 | 타입   | 설명           |
| -------- | ------ | -------------- |
| id       | string | 예산 UUID      |

### 요청 바디

```json
{
  "amount": 600000
}
```

| 필드   | 타입   | 필수 | 설명                    |
| ------ | ------ | ---- | ----------------------- |
| amount | number | 필수 | 수정할 금액 (0보다 큰 수) |

### 응답 200

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": 600000,
    ...
  }
}
```

### 에러 응답

| 상태 코드 | 에러 메시지                                |
| --------- | ------------------------------------------ |
| 400       | 유효하지 않은 ID입니다                     |
| 400       | 예산 금액은 필수입니다                     |
| 400       | 예산 금액은 0보다 큰 숫자여야 합니다       |
| 401       | 인증이 필요합니다                          |
| 404       | 예산을 찾을 수 없습니다                    |
| 500       | 예산 수정에 실패했습니다                   |

---

## DELETE /api/budgets/[id]

특정 예산을 삭제합니다.

### 경로 파라미터

| 파라미터 | 타입   | 설명       |
| -------- | ------ | ---------- |
| id       | string | 예산 UUID  |

### 응답 200

```json
{
  "success": true,
  "data": null
}
```

### 에러 응답

| 상태 코드 | 에러 메시지                   |
| --------- | ----------------------------- |
| 400       | 유효하지 않은 ID입니다        |
| 401       | 인증이 필요합니다             |
| 404       | 예산을 찾을 수 없습니다       |
| 500       | 예산 삭제에 실패했습니다      |

---

## BudgetStatus 타입 정의

```typescript
interface BudgetStatus {
  id: string
  user_id: string
  category_id?: string | null
  category?: Category | null
  amount: number
  year_month: string       // 'YYYY-MM'
  created_at: string
  updated_at: string
  spent: number            // 실제 지출액 (해당 월 transactions 합계)
  remaining: number        // 잔여 예산 (amount - spent)
  percentage: number       // 소진율 (0-100+, 반올림 정수)
}
```
