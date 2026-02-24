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
- ⏭️ 다음: 신규 기능 개발 (AI 인사이트 / 푸시 알림 / 투자 트래킹 / 장기 목표 관리)

## 중요 결정사항
- `middleware.ts` (루트) 사용 — Next.js가 자동 인식하는 파일명 (proxy.ts는 내부 명명 의도였음)
- `categories` 독립 테이블 분리 (F-09 커스텀 카테고리 지원)
- 클라이언트 전용 AES-256 암호화: PIN → PBKDF2(100,000회) → 키 파생, sessionStorage 보관
- 폼 검증은 네이티브 함수 사용 (zod/react-hook-form은 복잡한 폼 기능 시 도입)

## Supabase 수동 선행 작업
- [x] `.env.local` 환경변수 입력 (Supabase URL, anon key)
- [x] Supabase Dashboard → Google OAuth Provider 활성화
- [x] Redirect URLs 등록: `http://localhost:3000/callback`
- [x] SQL Editor → `handle_new_user()` 트리거 실행
- [x] 009_user_settings_currency.sql 실행 (user_settings 테이블 + currency 컬럼)

## 프로젝트 관리
- 방식: file
