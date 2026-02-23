# F-08 수입/지출 API 스펙 (확정본)

## 공통 사항
- 인증: 모든 엔드포인트는 Supabase Auth 세션 필요 (미인증 시 401)
- 응답 형식: `{ success: boolean, data?: T, error?: string }`
- RLS: user_id 기반 행 단위 격리

---

## GET /api/transactions

거래 목록 조회. 카테고리 정보 자동 조인.

### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| month | string | - | YYYY-MM 형식. 해당 월 거래만 조회 |
| type | string | - | `income` 또는 `expense` |
| category_id | string (UUID) | - | 특정 카테고리 필터 |
| is_favorite | string | - | `true` 전달 시 즐겨찾기만 조회 |

### 정렬
- date 내림차순 → created_at 내림차순

### 응답 200

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "amount": 50000,
      "type": "expense",
      "category_id": "uuid",
      "category": {
        "id": "uuid",
        "name": "식비",
        "icon": "🍜",
        "color": "#FF5733",
        "type": "expense"
      },
      "memo": "점심 식사",
      "date": "2024-01-15",
      "is_favorite": false,
      "created_at": "2024-01-15T12:00:00Z",
      "updated_at": "2024-01-15T12:00:00Z"
    }
  ]
}
```

---

## POST /api/transactions

거래 생성.

### 요청 바디

```json
{
  "amount": 50000,
  "type": "expense",
  "category_id": "uuid",
  "memo": "점심 식사",
  "date": "2024-01-15",
  "is_favorite": false
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| amount | number | O | 금액 (양수) |
| type | string | O | `income` 또는 `expense` |
| category_id | string (UUID) | - | 카테고리 ID |
| memo | string | - | 메모 |
| date | string | - | YYYY-MM-DD. 기본값: 오늘 |
| is_favorite | boolean | - | 즐겨찾기 여부. 기본값: false |

### 응답 201

생성된 Transaction 객체 반환 (카테고리 조인 포함).

### 에러

| 상태 | 조건 |
|---|---|
| 400 | amount 누락 또는 0 이하 |
| 400 | type이 income/expense 이외 값 |
| 401 | 미인증 |
| 500 | DB 오류 |

---

## PATCH /api/transactions/[id]

거래 수정. 소유자 본인만 수정 가능.

### 요청 바디 (모든 필드 선택사항)

```json
{
  "amount": 60000,
  "type": "expense",
  "category_id": "uuid",
  "memo": "저녁 식사",
  "date": "2024-01-15",
  "is_favorite": true
}
```

### 응답 200

수정된 Transaction 객체 반환 (카테고리 조인 포함).

### 에러

| 상태 | 조건 |
|---|---|
| 400 | amount가 0 이하 |
| 400 | type이 income/expense 이외 값 |
| 401 | 미인증 |
| 404 | 존재하지 않거나 타인 소유 |
| 500 | DB 오류 |

---

## DELETE /api/transactions/[id]

거래 삭제. 소유자 본인만 삭제 가능.

### 응답 200

```json
{ "success": true, "data": null }
```

### 에러

| 상태 | 조건 |
|---|---|
| 401 | 미인증 |
| 404 | 존재하지 않거나 타인 소유 |
| 500 | DB 오류 |
