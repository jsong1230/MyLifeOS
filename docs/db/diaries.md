# DB 스키마: 일기 (F-16)

## 테이블: public.diaries

날짜별 일기 본문(AES-256 암호화)과 감정 태그를 저장한다.

```sql
CREATE TABLE IF NOT EXISTS public.diaries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  content_encrypted TEXT NOT NULL,
  emotion_tags      JSONB NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_diaries_user_date UNIQUE (user_id, date)
);
```

### 컬럼 설명

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 일기 고유 ID |
| user_id | UUID | NOT NULL, FK → users(id) | 소유자 |
| date | DATE | NOT NULL | 일기 날짜 |
| content_encrypted | TEXT | NOT NULL | AES-256 암호화된 일기 본문 |
| emotion_tags | JSONB | NOT NULL, DEFAULT '[]' | 감정 태그 배열 (EmotionType[]) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 수정 시각 (트리거 자동 갱신) |

### 제약 조건

- `uq_diaries_user_date`: (user_id, date) 복합 유니크 — 사용자당 날짜별 1개 일기 보장

### 인덱스

```sql
CREATE INDEX IF NOT EXISTS idx_diaries_user_date ON public.diaries(user_id, date DESC);
```

날짜 범위 조회(월별 목록, 특정 날짜 조회) 최적화.

### RLS (Row Level Security)

```sql
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diaries_owner_all" ON public.diaries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

로그인한 사용자는 자신의 일기만 조회/생성/수정/삭제 가능.

### updated_at 트리거

```sql
DROP TRIGGER IF EXISTS set_diaries_updated_at ON public.diaries;
CREATE TRIGGER set_diaries_updated_at
  BEFORE UPDATE ON public.diaries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

`update_updated_at()` 함수는 Phase 0 마이그레이션에서 생성됨.

---

## emotion_tags JSONB 구조

```json
["happy", "grateful"]
```

유효 값 목록:
`happy` | `sad` | `angry` | `anxious` | `excited` | `calm` | `tired` | `lonely` | `grateful` | `proud`

---

## 마이그레이션 파일

`docs/migrations/005_phase5_private.sql`
