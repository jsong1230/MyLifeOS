# F-05 Todo API 스펙 확정본

## 공통 사항

- Base URL: `/api/todos`
- 인증: Supabase Cookie 세션 (모든 엔드포인트 필수)
- 응답 형식: `{ success: boolean, data?: T, error?: string }`
- Content-Type: `application/json`

---

## 1. 할일 목록 조회

### `GET /api/todos`

인증된 사용자의 할일 목록을 sort_order 오름차순으로 반환합니다.

#### 쿼리 파라미터

| 파라미터 | 타입   | 필수 | 설명                         |
|----------|--------|------|------------------------------|
| date     | string | 선택 | 날짜 필터 (YYYY-MM-DD 형식)  |
| month    | string | 선택 | 월 필터 (YYYY-MM 형식)       |

- `date`와 `month`를 모두 생략하면 전체 목록 반환
- `date`와 `month`를 동시에 넣으면 `date`가 우선 적용

#### 응답 (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "할일 제목",
      "description": "설명",
      "due_date": "2026-02-23",
      "priority": "high",
      "status": "pending",
      "category": "업무",
      "sort_order": 0,
      "completed_at": null,
      "created_at": "2026-02-23T07:00:00.000Z",
      "updated_at": "2026-02-23T07:00:00.000Z"
    }
  ]
}
```

#### 에러 응답

| 상태 코드 | 설명          |
|-----------|---------------|
| 401       | 인증 필요     |
| 500       | 서버 오류     |

---

## 2. 할일 생성

### `POST /api/todos`

새 할일을 생성합니다. sort_order는 현재 최대값 + 1로 자동 설정됩니다.

#### 요청 바디

```json
{
  "title": "할일 제목",
  "description": "설명 (선택)",
  "due_date": "2026-02-23",
  "priority": "medium",
  "category": "업무"
}
```

| 필드        | 타입   | 필수 | 설명                              |
|-------------|--------|------|-----------------------------------|
| title       | string | 필수 | 할일 제목 (최대 200자)            |
| description | string | 선택 | 상세 설명                         |
| due_date    | string | 선택 | 마감일 (YYYY-MM-DD 형식)          |
| priority    | string | 선택 | `high` / `medium` / `low` (기본: `medium`) |
| category    | string | 선택 | 카테고리 (최대 50자)              |

#### 응답 (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "할일 제목",
    "description": null,
    "due_date": "2026-02-23",
    "priority": "medium",
    "status": "pending",
    "category": "업무",
    "sort_order": 5,
    "completed_at": null,
    "created_at": "2026-02-23T07:00:00.000Z",
    "updated_at": "2026-02-23T07:00:00.000Z"
  }
}
```

#### 에러 응답

| 상태 코드 | 설명                      |
|-----------|---------------------------|
| 400       | 제목 누락 또는 유효성 오류 |
| 401       | 인증 필요                 |
| 500       | 서버 오류                 |

---

## 3. 할일 수정

### `PATCH /api/todos/[id]`

특정 할일을 수정합니다. status를 `completed`로 변경 시 `completed_at`이 자동 설정됩니다.

#### 경로 파라미터

| 파라미터 | 타입   | 필수 | 설명        |
|----------|--------|------|-------------|
| id       | string | 필수 | 할일 UUID   |

#### 요청 바디 (부분 업데이트 가능)

```json
{
  "title": "수정된 제목",
  "description": "수정된 설명",
  "due_date": "2026-03-01",
  "priority": "high",
  "status": "completed",
  "category": "개인",
  "sort_order": 2
}
```

| 필드        | 타입   | 설명                                        |
|-------------|--------|---------------------------------------------|
| title       | string | 할일 제목                                   |
| description | string | 상세 설명                                   |
| due_date    | string | 마감일 (null로 설정 가능)                   |
| priority    | string | `high` / `medium` / `low`                  |
| status      | string | `pending` / `completed` / `cancelled`       |
| category    | string | 카테고리 (null로 설정 가능)                 |
| sort_order  | number | 정렬 순서                                   |

- `status: "completed"` → `completed_at` 자동 설정
- `status: "pending"` 또는 `"cancelled"` → `completed_at` null로 초기화

#### 응답 (200 OK)

```json
{
  "success": true,
  "data": { /* 수정된 Todo 객체 */ }
}
```

#### 에러 응답

| 상태 코드 | 설명                      |
|-----------|---------------------------|
| 400       | 유효성 오류               |
| 401       | 인증 필요                 |
| 404       | 할일을 찾을 수 없음       |
| 500       | 서버 오류                 |

---

## 4. 할일 삭제

### `DELETE /api/todos/[id]`

특정 할일을 삭제합니다.

#### 경로 파라미터

| 파라미터 | 타입   | 필수 | 설명      |
|----------|--------|------|-----------|
| id       | string | 필수 | 할일 UUID |

#### 응답 (200 OK)

```json
{
  "success": true,
  "data": null
}
```

#### 에러 응답

| 상태 코드 | 설명                  |
|-----------|-----------------------|
| 401       | 인증 필요             |
| 404       | 할일을 찾을 수 없음   |
| 500       | 서버 오류             |

---

## 5. 할일 순서 일괄 변경

### `POST /api/todos/reorder`

여러 할일의 sort_order를 한 번에 업데이트합니다. 드래그 앤 드롭 후 호출됩니다.

#### 요청 바디

```json
{
  "items": [
    { "id": "uuid-1", "sort_order": 0 },
    { "id": "uuid-2", "sort_order": 1 },
    { "id": "uuid-3", "sort_order": 2 }
  ]
}
```

| 필드              | 타입            | 필수 | 설명               |
|-------------------|-----------------|------|--------------------|
| items             | array           | 필수 | 순서 변경 항목 배열 |
| items[].id        | string (UUID)   | 필수 | 할일 ID            |
| items[].sort_order| number          | 필수 | 새 정렬 순서       |

#### 응답 (200 OK)

```json
{
  "success": true,
  "data": null
}
```

#### 에러 응답

| 상태 코드 | 설명                        |
|-----------|-----------------------------|
| 400       | items 배열 누락 또는 유효성 오류 |
| 401       | 인증 필요                   |
| 404       | 일부 항목을 찾을 수 없음     |
| 500       | 서버 오류                   |

---

## 타입 정의

```typescript
type TodoPriority = 'high' | 'medium' | 'low'
type TodoStatus = 'pending' | 'completed' | 'cancelled'

interface Todo {
  id: string
  user_id: string
  title: string
  description?: string | null
  due_date?: string | null  // DATE (YYYY-MM-DD)
  priority: TodoPriority
  status: TodoStatus
  category?: string | null
  sort_order: number
  completed_at?: string | null
  created_at: string
  updated_at: string
}
```
