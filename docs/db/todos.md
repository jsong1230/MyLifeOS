# F-05 Todos DB 스키마 확정본

## 테이블: `todos`

할일 관리 핵심 테이블. 사용자별 할일 항목을 저장합니다.

### 컬럼 정의

| 컬럼명       | 타입                     | NOT NULL | 기본값          | 설명                                         |
|--------------|--------------------------|----------|-----------------|----------------------------------------------|
| id           | uuid                     | O        | gen_random_uuid() | PK                                          |
| user_id      | uuid                     | O        | —               | FK → auth.users(id), 소유자                  |
| title        | varchar(200)             | O        | —               | 할일 제목                                    |
| description  | text                     | X        | NULL            | 상세 설명                                    |
| due_date     | date                     | X        | NULL            | 마감일 (날짜 only, 시간 없음)                |
| priority     | varchar(10)              | O        | 'medium'        | 우선순위: `high` / `medium` / `low`          |
| status       | varchar(20)              | O        | 'pending'       | 상태: `pending` / `completed` / `cancelled`  |
| category     | varchar(50)              | X        | NULL            | 카테고리 (자유 텍스트)                       |
| sort_order   | integer                  | O        | 0               | 정렬 순서 (0부터 시작, 오름차순)             |
| completed_at | timestamptz              | X        | NULL            | 완료 처리 일시 (status=completed 시 자동 설정) |
| created_at   | timestamptz              | O        | now()           | 생성 일시                                    |
| updated_at   | timestamptz              | O        | now()           | 수정 일시                                    |

### DDL

```sql
CREATE TABLE todos (
  id           uuid         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        varchar(200) NOT NULL,
  description  text,
  due_date     date,
  priority     varchar(10)  NOT NULL DEFAULT 'medium'
                            CHECK (priority IN ('high', 'medium', 'low')),
  status       varchar(20)  NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'completed', 'cancelled')),
  category     varchar(50),
  sort_order   integer      NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);
```

### 인덱스

```sql
-- 사용자별 목록 조회 (메인 쿼리)
CREATE INDEX idx_todos_user_id_sort_order
  ON todos (user_id, sort_order ASC);

-- 날짜 필터 쿼리
CREATE INDEX idx_todos_user_id_due_date
  ON todos (user_id, due_date);

-- 상태별 필터 (미래 확장용)
CREATE INDEX idx_todos_user_id_status
  ON todos (user_id, status);
```

### Row Level Security (RLS)

```sql
-- RLS 활성화
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 조회 허용
CREATE POLICY "todos_select_own"
  ON todos FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 데이터만 삽입 허용
CREATE POLICY "todos_insert_own"
  ON todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 데이터만 수정 허용
CREATE POLICY "todos_update_own"
  ON todos FOR UPDATE
  USING (auth.uid() = user_id);

-- 본인 데이터만 삭제 허용
CREATE POLICY "todos_delete_own"
  ON todos FOR DELETE
  USING (auth.uid() = user_id);
```

### 외래키 관계

```
auth.users (id)
    └─── todos (user_id) ON DELETE CASCADE
```

사용자 삭제 시 해당 사용자의 모든 할일이 CASCADE 삭제됩니다.

### updated_at 자동 갱신 트리거

```sql
-- 수정 시 updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
```

### 비즈니스 규칙

1. `sort_order`는 새 항목 추가 시 현재 최대 sort_order + 1로 자동 설정
2. `status`가 `completed`로 변경되면 `completed_at`이 현재 시각으로 자동 설정 (API 레이어)
3. `status`가 `pending` 또는 `cancelled`로 변경되면 `completed_at`이 NULL로 초기화
4. 마감일 초과 판단은 클라이언트에서 처리 (due_date < today)
5. `priority` 미지정 시 기본값 `medium` 적용
