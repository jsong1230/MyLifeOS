# Phase 8 계획

> 작성일: 2026-03-07
> 상태: 계획 중

## 범위

| 분류 | 항목 수 |
|------|---------|
| 신규 기능 (F-46~F-50) | 5개 |
| 품질 개선 | 3개 |
| UX 개선 | 3개 |
| **합계** | **11개** |

---

## Wave 1 — 빠른 승리 (소규모)

병렬 그룹 PG-8A: F-48, F-49 (독립 CRUD, 동시 개발)
병렬 그룹 PG-8B: FAB 개선, E2E 테스트 확대 (독립)

### F-48: 혈압/혈당 기록
- **모듈**: 건강
- **DB**: `health_measurements` 테이블 (migration 029)
  - `id, user_id, type(blood_pressure|blood_sugar|weight|etc), value, value2(이완기), unit, measured_at, note`
- **API**: `/api/health/measurements` CRUD
- **UI**: `/health/measurements` 페이지, 날짜별 조회, 추이 차트

### F-49: 포모도로 통계
- **모듈**: 시간
- **DB**: 기존 `pomodoro_sessions` 활용 (migration 불필요)
- **API**: `/api/time/pomodoro/stats` — 기간별 집중 시간 합산, 요일별 패턴
- **UI**: `/time/pomodoro` 페이지 하단에 통계 섹션 추가 (주간 차트)

### FAB 빠른 입력 개선
- **모듈**: 공통
- **현재**: 할일/지출/식사/일기 4종
- **추가**: 수분(+200ml 원탭), 약 복용 체크 (오늘 미복용 약 목록)
- **파일**: `components/layout/fab.tsx`, `components/layout/fab-menu.tsx`

### E2E 테스트 확대 (Phase 7)
- water, pomodoro, books, shopping, streaks, medications 테스트 추가
- `tests/e2e/` 에 파일 추가

---

## Wave 2 — 중규모

병렬 그룹 PG-8C: F-46, F-47 (독립 기능)
병렬 그룹 PG-8D: 온보딩, 알림 센터 (독립 기능)

### F-46: 위젯 커스터마이징
- **모듈**: 공통
- **DB**: `user_settings.dashboard_layout` JSONB 컬럼 추가
- **UI**: 대시보드 편집 모드 (카드 표시/숨김, 순서 드래그)
- **컴포넌트**: `DashboardEditor`, `DraggableCard`

### F-47: 캘린더 구독 내보내기 (iCal)
- **모듈**: 시간
- **API**: `/api/time/calendar/ical` — GET → `.ics` 파일 반환
  - 할일(due_date 있는 것), 루틴, 타임블록 포함
- **UI**: 설정 페이지에 "캘린더 앱에 구독" 버튼 + URL 복사

### 온보딩 플로우
- **트리거**: 첫 로그인 후 (user_settings.onboarding_completed 컬럼)
- **단계**: PIN 설정 → 기본 통화 설정 → 카테고리 확인 → 첫 할일 추가
- **컴포넌트**: `OnboardingModal` (4단계 progress bar)

### 알림 센터
- **모듈**: 공통
- **DB**: `notifications` 테이블 (id, user_id, type, title, body, read_at, created_at)
- **API**: `/api/notifications` GET/PATCH(읽음)
- **UI**: 헤더 벨 아이콘 → 드롭다운 목록 (읽지 않은 뱃지)
- **연동**: 기존 Cron이 push 발송 시 DB에도 저장

---

## Wave 3 — 대규모

### F-50: 데이터 백업/복원
- **모듈**: 공통
- **내보내기**: 기존 F-33(CSV/JSON)에서 확장 → 암호화 ZIP
  - 암호화 데이터(일기/관계/메모)는 복호화 후 포함 (PIN 인증 필요)
  - 파일명: `mylifeos_backup_YYYYMMDD.zip`
- **가져오기**: ZIP 업로드 → 파싱 → 테이블별 upsert
  - 충돌 전략: skip(기본) / overwrite 선택
- **API**: `/api/export/backup` (POST), `/api/import` (POST)

### Lighthouse 성능 최적화
- **목표**: Performance 80점+
- **작업**:
  - `next/image` 전환 (img → Image 컴포넌트)
  - 동적 import 확대 (차트 컴포넌트 lazy load)
  - `font-display: swap` 설정
  - unused CSS 제거

### 오프라인 지원
- **Service Worker 강화**: API 응답 캐싱 (stale-while-revalidate)
- **오프라인 입력 큐**: IndexedDB에 임시 저장 → 온라인 복귀 시 자동 동기화
- **대상**: 수분 섭취, 할일 완료 체크, 식사 기록 (가장 빈번한 입력)

---

## 마이그레이션 계획

| Migration | 내용 | Wave |
|-----------|------|------|
| 029 | health_measurements 테이블 | 1 |
| 030 | user_settings.dashboard_layout 컬럼 | 2 |
| 031 | user_settings.onboarding_completed 컬럼 | 2 |
| 032 | notifications 테이블 | 2 |

---

## 우선순위 권장 순서

```
Wave 1 (PG-8A + PG-8B 병렬) → Wave 2 (PG-8C + PG-8D 병렬) → Wave 3
```

Wave 1부터 시작하면 가장 빠르게 사용자 가치를 전달할 수 있음.
