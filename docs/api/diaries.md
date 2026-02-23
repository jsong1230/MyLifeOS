# API 스펙: 일기 (F-16)

## 개요
날짜별 일기 CRUD API. 콘텐츠는 클라이언트 사이드 AES-256 암호화 후 저장된다.
모든 엔드포인트는 Supabase Auth 세션 쿠키가 필요하다.

---

## 공통 응답 형식

```json
{ "success": true, "data": <T> }
{ "success": false, "error": "<메시지>" }
```

---

## DiaryEntry 타입

```ts
interface DiaryEntry {
  id: string            // UUID
  user_id: string       // UUID (소유자)
  date: string          // DATE (YYYY-MM-DD)
  content_encrypted: string  // AES-256 암호화된 본문
  emotion_tags: EmotionType[]  // 감정 태그 목록
  created_at: string    // TIMESTAMPTZ
  updated_at: string    // TIMESTAMPTZ
}

type EmotionType =
  | 'happy' | 'sad' | 'angry' | 'anxious' | 'excited'
  | 'calm' | 'tired' | 'lonely' | 'grateful' | 'proud'
```

---

## 엔드포인트

### GET /api/diaries

특정 날짜의 일기를 조회한다. 없으면 `data: null` 반환.

**쿼리 파라미터**

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| date | Y | 조회할 날짜 (YYYY-MM-DD) |

**응답 200**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "date": "2026-02-23",
    "content_encrypted": "U2FsdGVkX1...",
    "emotion_tags": ["happy", "grateful"],
    "created_at": "2026-02-23T10:00:00Z",
    "updated_at": "2026-02-23T10:00:00Z"
  }
}
```

**응답 200 (일기 없음)**
```json
{ "success": true, "data": null }
```

**에러**

| 상태코드 | 조건 |
|---------|------|
| 400 | date 파라미터 누락 또는 형식 오류 |
| 401 | 미인증 |
| 500 | DB 오류 |

---

### POST /api/diaries

새 일기를 생성한다. 같은 날짜에 이미 일기가 있으면 409를 반환한다.

**요청 바디**
```json
{
  "content_encrypted": "U2FsdGVkX1...",
  "emotion_tags": ["happy"],
  "date": "2026-02-23"
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| content_encrypted | Y | AES-256 암호화된 일기 본문 |
| emotion_tags | Y | 감정 태그 배열 (1개 이상) |
| date | N | 날짜 (기본값: 서버 오늘 날짜) |

**응답 201**
```json
{
  "success": true,
  "data": { ...DiaryEntry }
}
```

**에러**

| 상태코드 | 조건 |
|---------|------|
| 400 | 필수 필드 누락 / 유효하지 않은 감정 태그 |
| 401 | 미인증 |
| 409 | 해당 날짜에 이미 일기 존재 |
| 500 | DB 오류 |

---

### PATCH /api/diaries/[id]

기존 일기를 수정한다. 소유자만 수정 가능.

**요청 바디** (모든 필드 선택)
```json
{
  "content_encrypted": "U2FsdGVkX1...",
  "emotion_tags": ["calm", "grateful"]
}
```

**응답 200**
```json
{
  "success": true,
  "data": { ...DiaryEntry }
}
```

**에러**

| 상태코드 | 조건 |
|---------|------|
| 400 | 유효하지 않은 필드 값 |
| 401 | 미인증 |
| 404 | 일기를 찾을 수 없음 (타인 소유 포함) |
| 500 | DB 오류 |

---

### DELETE /api/diaries/[id]

일기를 삭제한다. 소유자만 삭제 가능.

**응답 200**
```json
{ "success": true }
```

**에러**

| 상태코드 | 조건 |
|---------|------|
| 401 | 미인증 |
| 404 | 일기를 찾을 수 없음 (타인 소유 포함) |
| 500 | DB 오류 |

---

### GET /api/diaries/list

해당 월의 일기 목록을 조회한다. 감정 캘린더 용도로 `content_encrypted`를 제외하고 `id/date/emotion_tags`만 반환한다.

**쿼리 파라미터**

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| year | Y | 연도 (숫자, 예: 2026) |
| month | Y | 월 (숫자, 예: 2) |

**응답 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "date": "2026-02-23",
      "emotion_tags": ["happy"]
    }
  ]
}
```

**에러**

| 상태코드 | 조건 |
|---------|------|
| 400 | year/month 파라미터 누락 또는 범위 오류 |
| 401 | 미인증 |
| 500 | DB 오류 |

---

## 암호화 흐름

```
[클라이언트]
  PIN 입력 → PBKDF2(100,000회) → enc_key 파생
  enc_key → sessionStorage 보관

[저장 시]
  encrypt(plaintext, enc_key) → content_encrypted → POST /api/diaries

[조회 시]
  GET /api/diaries → content_encrypted
  decrypt(content_encrypted, enc_key) → plaintext → 화면 표시
```
