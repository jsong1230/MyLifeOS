# F-09 카테고리 관리 API 스펙

## 개요

카테고리 CRUD API. 시스템 기본 카테고리와 사용자 커스텀 카테고리를 관리합니다.

## 공통 응답 형식

```json
{ "success": true, "data": <payload> }
{ "success": false, "error": "<message>" }
```

## 엔드포인트

### GET /api/categories

카테고리 목록 조회. 시스템 카테고리 + 인증된 사용자의 커스텀 카테고리를 반환합니다.

**인증**: 필요 (Supabase Session Cookie)

**쿼리 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| type | `income` \| `expense` \| `both` | 아니오 | 카테고리 타입 필터. 미지정 시 전체 반환 |

**응답 200**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": null,
      "name": "식비",
      "icon": "🍚",
      "color": "#FF6B6B",
      "type": "expense",
      "is_system": true,
      "sort_order": 10,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**정렬**: `sort_order` 오름차순

**오류 응답**

| 상태 코드 | 설명 |
|-----------|------|
| 400 | 유효하지 않은 type 파라미터 |
| 401 | 인증 필요 |
| 500 | 서버 오류 |

---

### POST /api/categories

커스텀 카테고리 생성.

**인증**: 필요

**요청 Body**

```json
{
  "name": "카페",
  "type": "expense",
  "icon": "☕",
  "color": "#8B4513"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | 예 | 카테고리 이름 (최대 50자) |
| type | `income` \| `expense` \| `both` | 예 | 카테고리 타입 |
| icon | string | 아니오 | 이모지 아이콘 |
| color | string | 아니오 | HEX 색상 코드 (`#RRGGBB` 형식) |

**응답 201**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "user-uuid",
    "name": "카페",
    "icon": "☕",
    "color": "#8B4513",
    "type": "expense",
    "is_system": false,
    "sort_order": 100,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**오류 응답**

| 상태 코드 | 설명 |
|-----------|------|
| 400 | name 누락 또는 빈 값, 유효하지 않은 type, 잘못된 color 형식 |
| 401 | 인증 필요 |
| 500 | 서버 오류 |

---

### PATCH /api/categories/[id]

커스텀 카테고리 수정. 시스템 카테고리 수정 시 403 반환.

**인증**: 필요

**경로 파라미터**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| id | UUID | 수정할 카테고리 ID |

**요청 Body** (모든 필드 선택)

```json
{
  "name": "카페/음료",
  "type": "expense",
  "icon": "🧋",
  "color": "#4A90D9",
  "sort_order": 50
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | 아니오 | 변경할 이름 |
| type | `income` \| `expense` \| `both` | 아니오 | 변경할 타입 |
| icon | string \| null | 아니오 | 변경할 아이콘 (null로 삭제 가능) |
| color | string \| null | 아니오 | 변경할 색상 (null로 삭제 가능) |
| sort_order | number | 아니오 | 정렬 순서 |

**응답 200**

```json
{
  "success": true,
  "data": { /* 수정된 Category 객체 */ }
}
```

**오류 응답**

| 상태 코드 | 설명 |
|-----------|------|
| 400 | 빈 name, 유효하지 않은 type/color/sort_order, 수정할 필드 없음 |
| 401 | 인증 필요 |
| 403 | 시스템 카테고리 수정 시도 |
| 404 | 카테고리 없음 또는 타인 소유 |
| 500 | 서버 오류 |

---

### DELETE /api/categories/[id]

커스텀 카테고리 삭제. 시스템 카테고리 삭제 시 403, 사용 중이면 409 반환.

**인증**: 필요

**경로 파라미터**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| id | UUID | 삭제할 카테고리 ID |

**응답 200**

```json
{
  "success": true,
  "data": null
}
```

**오류 응답 409 (사용 중)**

```json
{
  "success": false,
  "error": "이 카테고리는 5개의 거래에서 사용 중입니다. 삭제하면 해당 거래의 카테고리가 해제됩니다.",
  "data": { "usageCount": 5 }
}
```

| 상태 코드 | 설명 |
|-----------|------|
| 401 | 인증 필요 |
| 403 | 시스템 카테고리 삭제 시도 |
| 404 | 카테고리 없음 또는 타인 소유 |
| 409 | 사용 중인 카테고리 (transactions 테이블에 참조 존재) |
| 500 | 서버 오류 |

---

## Category 타입 정의

```typescript
interface Category {
  id: string
  user_id: string | null  // null = 시스템 카테고리
  name: string
  icon: string | null     // 이모지
  color: string | null    // HEX (#RRGGBB)
  type: 'income' | 'expense' | 'both'
  is_system: boolean
  sort_order: number
  created_at: string      // ISO 8601
}
```

---

## 시스템 기본 카테고리 목록

### 지출 카테고리

| 이름 | 아이콘 | 색상 | sort_order |
|------|--------|------|------------|
| 식비 | 🍚 | #FF6B6B | 10 |
| 교통 | 🚌 | #4ECDC4 | 20 |
| 여가 | 🎮 | #45B7D1 | 30 |
| 쇼핑 | 🛍️ | #96CEB4 | 40 |
| 의료 | 🏥 | #FFEAA7 | 50 |
| 교육 | 📚 | #DDA0DD | 60 |
| 주거 | 🏠 | #98D8C8 | 70 |
| 기타 | 📦 | #B0B0B0 | 80 |

### 수입 카테고리

| 이름 | 아이콘 | 색상 | sort_order |
|------|--------|------|------------|
| 급여 | 💰 | #2ECC71 | 10 |
| 용돈 | 💵 | #27AE60 | 20 |
| 부수입 | 💸 | #F39C12 | 30 |
| 기타 | 📦 | #B0B0B0 | 40 |
