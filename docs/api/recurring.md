# F-30 정기 지출 관리 API 스펙

## 공통

- 인증: Supabase Auth 세션 (쿠키 기반)
- 응답 형식: `{ success: boolean, data?: T, error?: string }`
- 모든 엔드포인트는 인증 필수 (미인증 시 401 반환)

---

## GET /api/recurring

정기 지출 목록 조회

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "넷플릭스",
      "amount": 13900,
      "billing_day": 15,
      "cycle": "monthly",
      "category_id": null,
      "is_active": true,
      "created_at": "2026-02-23T00:00:00Z",
      "updated_at": "2026-02-23T00:00:00Z"
    }
  ]
}
```

### 정렬

- `is_active DESC` (활성 항목 우선)
- `billing_day ASC` (결제일 오름차순)

---

## POST /api/recurring

정기 지출 등록

### Request Body

```json
{
  "name": "넷플릭스",         // 필수, 비어있지 않은 문자열
  "amount": 13900,            // 필수, 양수
  "billing_day": 15,          // 필수, 1-31 정수
  "cycle": "monthly",         // 필수, "monthly" | "yearly"
  "category_id": "uuid"       // 선택사항
}
```

### Response (201)

```json
{
  "success": true,
  "data": { /* RecurringExpense */ }
}
```

### 에러

| 상태 코드 | 에러 메시지                          | 원인                    |
| --------- | ------------------------------------ | ----------------------- |
| 400       | 이름은 필수입니다                    | name 누락 또는 빈 값    |
| 400       | 금액은 필수입니다                    | amount 누락             |
| 400       | 금액은 0보다 커야 합니다             | amount <= 0             |
| 400       | 결제일은 1에서 31 사이의 정수여야 합니다 | billing_day 범위 초과 |
| 400       | 유효하지 않은 주기입니다             | cycle 값 오류           |
| 401       | 인증이 필요합니다                    | 미인증                  |
| 500       | 정기 지출 등록에 실패했습니다        | DB 오류                 |

---

## PATCH /api/recurring/[id]

정기 지출 수정 (부분 업데이트)

### Request Body

모든 필드 선택사항 (최소 1개 이상 필요)

```json
{
  "name": "넷플릭스 프리미엄",
  "amount": 17000,
  "billing_day": 20,
  "cycle": "yearly",
  "category_id": "uuid",      // null 전달 시 카테고리 해제
  "is_active": false
}
```

### Response (200)

```json
{
  "success": true,
  "data": { /* 수정된 RecurringExpense */ }
}
```

### 에러

| 상태 코드 | 에러 메시지                              | 원인                  |
| --------- | ---------------------------------------- | --------------------- |
| 400       | 수정할 필드가 없습니다                   | 빈 body              |
| 404       | 정기 지출 항목을 찾을 수 없습니다        | id 없음 또는 권한 없음|

---

## DELETE /api/recurring/[id]

정기 지출 삭제

### Response (200)

```json
{
  "success": true,
  "data": null
}
```

### 에러

| 상태 코드 | 에러 메시지                        | 원인          |
| --------- | ---------------------------------- | ------------- |
| 401       | 인증이 필요합니다                  | 미인증        |
| 500       | 정기 지출 삭제에 실패했습니다      | DB 오류       |
