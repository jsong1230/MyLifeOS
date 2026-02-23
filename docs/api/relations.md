# F-27 인간관계 메모 API 스펙

## 개요
- 인증: Supabase Auth (세션 쿠키)
- 응답 형식: `{ success: boolean, data?: T, error?: string }`
- 암호화: 메모(`memo_encrypted`)는 클라이언트에서 AES-256으로 암호화한 값을 그대로 저장/반환. 복호화는 클라이언트에서 수행.

---

## GET /api/relations

내 인간관계 목록 전체 조회 (이름 오름차순 정렬)

### 응답 200
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "홍길동",
      "relationship_type": "friend",
      "last_met_at": "2026-01-15",
      "memo_encrypted": "U2FsdGVkX1...",
      "created_at": "2026-02-01T00:00:00Z",
      "updated_at": "2026-02-01T00:00:00Z"
    }
  ]
}
```

### 응답 401
```json
{ "success": false, "error": "인증이 필요합니다" }
```

---

## POST /api/relations

인간관계 등록

### 요청 바디
```json
{
  "name": "홍길동",
  "relationship_type": "friend",
  "last_met_at": "2026-01-15",
  "memo_encrypted": "U2FsdGVkX1..."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | 필수 | 인물 이름 |
| relationship_type | "family"\|"friend"\|"colleague"\|"other" | 필수 | 관계 유형 |
| last_met_at | string (YYYY-MM-DD) | 선택 | 마지막 만난 날짜 |
| memo_encrypted | string | 선택 | 클라이언트에서 AES-256 암호화된 메모 |

### 응답 201
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "홍길동",
    "relationship_type": "friend",
    "last_met_at": "2026-01-15",
    "memo_encrypted": "U2FsdGVkX1...",
    "created_at": "2026-02-23T00:00:00Z",
    "updated_at": "2026-02-23T00:00:00Z"
  }
}
```

### 응답 400
```json
{ "success": false, "error": "이름은 필수입니다" }
{ "success": false, "error": "유효하지 않은 관계 유형입니다" }
{ "success": false, "error": "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)" }
```

---

## PATCH /api/relations/:id

인간관계 수정 (소유자만 가능)

### 요청 바디 (부분 업데이트)
```json
{
  "name": "홍길동",
  "relationship_type": "colleague",
  "last_met_at": "2026-02-20",
  "memo_encrypted": "U2FsdGVkX1..."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | 선택 | 인물 이름 |
| relationship_type | "family"\|"friend"\|"colleague"\|"other" | 선택 | 관계 유형 |
| last_met_at | string\|null | 선택 | 마지막 만난 날짜 (null이면 삭제) |
| memo_encrypted | string\|null | 선택 | 암호화된 메모 (null이면 삭제) |

### 응답 200
```json
{
  "success": true,
  "data": { ... }
}
```

### 응답 404
```json
{ "success": false, "error": "인간관계 항목을 찾을 수 없습니다" }
```

---

## DELETE /api/relations/:id

인간관계 삭제 (소유자만 가능)

### 응답 200
```json
{ "success": true, "data": null }
```

### 응답 404
```json
{ "success": false, "error": "인간관계 항목을 찾을 수 없습니다" }
```
