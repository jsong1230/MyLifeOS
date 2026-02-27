# My Life OS

## 프로젝트
개인의 시간·금전·건강·사적 기록을 하나의 플랫폼에서 통합 관리하는 라이프 매니지먼트 웹 앱 (PWA)

## 기술 스택
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Next.js Route Handlers (API Routes)
- DB: Supabase (PostgreSQL + Auth + RLS)
- 상태 관리: Zustand (클라이언트) + React Query (서버)
- 암호화: crypto-js (AES-256, 클라이언트 사이드)
- 차트: Recharts
- 배포: Vercel

## 디렉토리
- `app/` — Next.js App Router 페이지 (라우트 그룹: auth, dashboard, time, money, health, private)
- `app/api/` — Route Handlers (API 엔드포인트)
- `components/ui/` — shadcn/ui 컴포넌트
- `components/modules/` — 모듈별 컴포넌트 (time, money, health, private)
- `components/common/` — 공통 컴포넌트
- `lib/supabase/` — Supabase 클라이언트 (browser, server, middleware)
- `lib/crypto/` — AES-256 암호화/복호화 유틸
- `store/` — Zustand 전역 상태 (auth 등)
- `types/` — TypeScript 타입 정의
- `docs/` — 프로젝트 문서

## 실행
- 개발: `npm run dev`
- 테스트: `npm test`
- 빌드: `npm run build`
- 타입 체크: `npm run type-check`

## 환경변수
`.env.local.example` 파일 참고. `.env.local` 파일에 Supabase 환경변수 설정 필요:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `USDA_API_KEY` — 식품 영양정보 검색 (선택, 없으면 DEMO_KEY 사용)

## 현재 작업 상태
- ✅ 완료: 프로젝트 초기화, 스캐폴딩, docs/specs/F-01 설계 문서
- ✅ 완료: F-01 회원가입/로그인 (T-01-01~09 전체 구현, main merge — 2026-02-23)
  - 미들웨어, auth store, 에러 유틸, 인증 레이아웃/공통 컴포넌트
  - 로그인/회원가입/비밀번호 재설정 페이지, OAuth 콜백 Route Handler
  - 30분 비활동 자동 로그아웃 훅 + 대시보드 레이아웃
- ✅ 완료: F-03 PIN 잠금 (T-03-01~12 전체 구현, main commit — 2026-02-23)
  - types/pin.ts, store/pin.store.ts (sessionStorage persist)
  - hooks/use-pin-lock.ts (visibilitychange 30초 임계값)
  - components/auth: PinPad, PinSetup, PinLockScreen, PinChange, PinGuard
  - app/api/users/pin (설정/변경), app/api/users/pin/verify (검증 + 잠금)
  - app/(dashboard)/settings/page.tsx, PinGuard로 대시보드 전체 보호
- ✅ 완료: F-02 메인 대시보드 (AppShell 레이아웃, 4개 요약 카드, FAB, 모듈 placeholder — 2026-02-23)
- ✅ 완료: F-04 PWA 지원 (manifest.json, Apple 메타태그, 아이콘 404 해결 — 2026-02-23)
- ✅ 완료: F-21 자산 현황 (자산 CRUD + PieChart + 월별 추이 LineChart — 2026-02-23)
- ✅ 완료: F-22 월별 지출 추이 (최근 6개월 수입/지출 BarChart — 2026-02-23)
- ✅ 완료: F-23 체중/체성분 기록 (body_logs CRUD + 추이 LineChart — 2026-02-23)
- ✅ 완료: F-24 운동 기록 (exercise_logs CRUD + 주간 뷰 + 요약 — 2026-02-23)
- ✅ 완료: F-25 음주 경고 (WHO 14잔 기준: 80% 주의/100% 경고 배너 — 2026-02-23)
- ✅ 완료: F-26 일기 검색 (복호화 후 키워드 검색 + 감정 태그 필터 + 하이라이트 — 2026-02-23)
- ✅ 완료: F-27 인간관계 메모 (인물 CRUD + AES-256 메모 암호화 — 2026-02-23)
- ✅ 완료: F-20 완료율 통계 (할일 완료율 + 루틴 달성률 차트, 주간/월간 — 2026-02-23)
- ✅ 확인: F-05~F-19, F-28~F-33 전체 (big commit `75372d4`에서 구현 완료)
- 🎉 전체 기능 33개 모두 구현 완료 (F-01~F-33)
- ✅ 완료: Wave 1 — i18n 완성 + API 에러 표준화 + 차트/날짜 locale 처리 (2026-02-24)
  - 컴포넌트 i18n 적용 (category-badge, recurring-summary, budget-list, theme-toggle 등)
  - 폼 placeholder/aria-label 15개 키 다국어화
  - 전체 Route Handler apiError() 표준화 완료 (잔존 0건)
  - 차트 Y축 단위 locale 분기 (만/억 ↔ K/M), 날짜 포맷 9개 파일 locale-aware 전환
  - lib/api-errors.ts CONFLICT(409), LOCKED(423) 코드 추가
- ✅ 완료: Wave 2 — 테스트 확대 + quality-gate (2026-02-24)
  - 단위 테스트 133개 PASS (convertCurrency, useExchangeRates 신규)
  - E2E 테스트 56개 신규 (money, pin, time, health)
  - quality-gate 리뷰 (HIGH 이슈 2건 발견 → Wave 3에서 수정)
- ✅ 완료: Wave 3 — 보안/품질 HIGH 이슈 수정 (2026-02-24)
  - PIN API salt 노출 제거 → 클라이언트 자체 생성(crypto.randomUUID) 방식 재설계
  - money 컴포넌트 KRW 하드코딩 → useSettingsStore.defaultCurrency 교체
- ✅ 완료: Supabase 마이그레이션 009 실행 (user_settings + currency 컬럼) (2026-02-24)
- ✅ 완료: Vercel 배포 검증 — 전 페이지 정상, 환율 변환/언어 전환 동작 확인 (2026-02-24)
- ✅ 완료: Wave 4 — i18n 완전 완성 (2026-02-25)
  - 40개 파일 전수 수정: 하드코딩 한글 0건 달성
  - EMOTION_LABELS, ASSET_TYPE_LABEL, EXERCISE_INTENSITY_LABEL 타입 상수 → useTranslations 교체
  - layout aria-label, error.tsx, categories page, emotion/stats, reports nav 번역 키 적용
  - auth/layout getTranslations 서버사이드 처리, dialog.tsx sr-only 번역 키 적용
  - messages에 20+ 신규 키 추가 (ko/en 완전 동기화), 타입 체크 0 오류
- ✅ 완료: 사용자 피드백 기반 버그 수정 및 기능 개선 (Wave 1-4, 2026-02-27)
  - Wave 1(버그 8개): 운동 날짜 기본값, FAB 겹침, KRW 하드코딩 제거, input step 동적화, 정기지출 currency 전송, FAB 경로 + action=add, 캘린더 우선순위 정렬/3개 표시, 루틴 time step
  - Wave 2(필수 기능): 로그아웃 버튼, 회원탈퇴 요청 API(012 마이그레이션), 닉네임 설정
  - Wave 3(중규모): 대시보드 식사 유형별 표시, 정기지출 "기록" 버튼+프리필, 예산 미분류 지출 처리
  - Wave 4(대규모): 식사 칼로리 자동계산(USDA API+분량 선택기), 캘린더 루틴/타임블록 통합 뷰, 정기지출 자동체크/일괄기록(013 마이그레이션), 사용자 가이드 업데이트(ko/en)
  - Supabase CLI로 마이그레이션 012·013 원격 DB에 직접 적용 완료
- ✅ 완료: 리포트 통화별 분리 표시 (2026-02-27)
  - 수입/지출을 단일 환산 합계 대신 KRW·CAD·USD 각각 행으로 표시 (주간/월간)
  - 월간: 통화별 지출+수입+전월지출+전월대비% 테이블
- ✅ 완료: 식사 분량 입력 UX 개선 (2026-02-27)
  - USDA 100g 기준 → 실제 servingSize로 환산하여 1인분 정확히 계산
  - "1인분 = Xg / Y kcal" 기준 표시, 빠른 선택(½·1·2·3인분), 직접 입력 + 실시간 칼로리 미리보기
- ✅ 완료: 닉네임 새로고침 초기화 버그 수정 (2026-02-27)
  - providers.tsx에 AuthInitializer 추가: 앱 로드 시 getUser()로 store 복구 + onAuthStateChange 동기화
- ✅ 완료: 코드베이스 심층 리뷰 + 개선 백로그 25개 발굴 (2026-02-27)
  - docs/plans/improvement-backlog.md 작성
- ✅ 완료: 개선 1차 — 즉시/단기 10개 항목 agent team 병렬 처리 (2026-02-27, commit cc349a1)
  - 음주 drink_count 합산 수정, meal-form 번역 키, date-utils 통합, dashboard queryKey
  - diary-search 복호화 캐싱+debounce, calendar Map 최적화, report 병렬화
  - PIN salt 스토리지 단일화 + usePinVerification 훅, auth/pin store 일원화
  - export 쿼리 추출, select 명시화, PinPad 통일, yearly 정기지출 지원
  - encryption.ts 단위 테스트 17개 추가 (146개 전체 PASS)
- ✅ 완료: 개선 2차 — 중기/장기 7개 항목 agent team 병렬 처리 (2026-02-27, commit 753c635)
  - 전체 51개 API Route getUser() JWT 재검증 추가
  - todos/reorder + recurring/batch-record bulk upsert 전환 (트랜잭션 보장)
  - 예산 vs 지출 통화 혼합 비교 버그 수정 (동일 통화만 집계)
  - FoodSearchCombobox ARIA 접근성 + 키보드 네비게이션 구현
  - 한식 DB 345개 Supabase foods 테이블 이전 (로컬 배열 → ilike 쿼리)
  - 초기 스키마 마이그레이션 000_initial_schema.sql (19테이블, 32인덱스, RLS)
  - types/database.types.ts 수동 작성 + gen:types 스크립트 추가
- ⏸️ 보류: H-02 Web Crypto API 암호화 마이그레이션 (기존 데이터 재암호화 필요 — 별도 논의 후 진행)
- ✅ 완료: F-34 장기 목표 관리 (2026-02-27, commit 98691ee)
  - goals + goal_milestones 테이블, CRUD API 6개, React Query 훅 8개
  - GoalCard/GoalForm/GoalProgressBar/MilestoneList 컴포넌트
  - /goals 페이지 (탭 3개, 진척도 슬라이더, 마일스톤 체크리스트)
  - 네비게이션 "목표" 항목 추가 (sidebar/bottom-nav/header)
- ✅ 완료: F-35 푸시 알림 (2026-02-27, commit 98691ee)
  - web-push + VAPID 기반 Web Push API
  - push_subscriptions + notification_settings 테이블
  - Service Worker (/public/sw.js), Vercel Cron (매일 09:00 UTC)
  - 루틴·정기지출·목표 알림, 설정 페이지 UI 통합
- ⏭️ 다음: 신규 기능 개발 (AI 인사이트 / 투자 트래킹)

## 중요 결정사항
- `middleware.ts` (루트) 사용 — Next.js가 자동 인식하는 파일명 (proxy.ts는 내부 명명 의도였음)
- `categories` 독립 테이블 분리 (F-09 커스텀 카테고리 지원)
- 클라이언트 전용 AES-256 암호화: PIN → PBKDF2(100,000회) → 키 파생, localStorage 보관 (salt/key 상수: lib/constants/pin-storage-keys.ts)
- 폼 검증은 네이티브 함수 사용 (zod/react-hook-form은 복잡한 폼 기능 시 도입)
- 리포트 수입/지출: 환율 변환 없이 통화별 분리 표시 (KRW/CAD/USD 각각 행)
- 인증 store 초기화: providers.tsx AuthInitializer에서 onAuthStateChange로 세션 동기화
- USDA FoodData Central API: 서빙 사이즈 기준 영양소 계산 (100g 기준 → servingSize 환산)
- Supabase CLI로 마이그레이션 관리: `supabase migration list/push` 사용

## Supabase 수동 선행 작업
- [x] `.env.local` 환경변수 입력 (Supabase URL, anon key)
- [x] Supabase Dashboard → Google OAuth Provider 활성화
- [x] Redirect URLs 등록: `http://localhost:3000/callback`
- [x] SQL Editor → `handle_new_user()` 트리거 실행
- [x] 009_user_settings_currency.sql 실행 (user_settings 테이블 + currency 컬럼)
- [x] 012_deletion_request.sql — users.deletion_requested_at 컬럼 (CLI push 완료)
- [x] 013_recurring_last_recorded.sql — recurring_expenses.last_recorded_date 컬럼 (CLI push 완료)
- [ ] 20260227000015_foods_table.sql — foods 테이블 (CLI push 필요, seeds/foods.sql 시딩 필요)

## 프로젝트 관리
- 방식: file
