# F-27 인간관계 메모 DB 스키마

## 테이블: public.relations

| 컬럼 | 타입 | NOT NULL | 기본값 | 설명 |
|------|------|----------|--------|------|
| id | UUID | Y | gen_random_uuid() | 기본 키 |
| user_id | UUID | Y | - | 사용자 ID (users 테이블 FK) |
| name | TEXT | Y | - | 인물 이름 |
| relationship_type | TEXT | Y | - | 관계 유형: family/friend/colleague/other |
| last_met_at | DATE | N | NULL | 마지막 만난 날짜 |
| memo_encrypted | TEXT | N | NULL | AES-256 암호화된 메모 |
| created_at | TIMESTAMPTZ | Y | NOW() | 생성 일시 |
| updated_at | TIMESTAMPTZ | Y | NOW() | 수정 일시 |

## 제약 조건
- `relationship_type` CHECK: `IN ('family', 'friend', 'colleague', 'other')`
- `user_id` → `public.users(id) ON DELETE CASCADE`

## Row Level Security (RLS)
- 활성화 여부: 활성화
- 정책: `relations_owner_all` — 소유자(auth.uid() = user_id)만 모든 작업(SELECT/INSERT/UPDATE/DELETE) 가능

## 인덱스
| 인덱스명 | 컬럼 | 목적 |
|---------|------|------|
| idx_relations_user_id | user_id | 사용자별 목록 조회 최적화 |

## 트리거
- `set_relations_updated_at`: UPDATE 시 `updated_at` 자동 갱신 (`update_updated_at()` 함수 사용)

## 마이그레이션 파일
`docs/migrations/005_phase5_private.sql` (기존 파일에 append)
