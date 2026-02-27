# Changelog

## [미정] - 2026-02-27 (F-36~F-37 + 분석 탭 통합)

### Added
- **F-36 투자 트래킹**: 주식/ETF/가상화폐/부동산 자산 CRUD + 거래 내역(매수/매도) 기록
  - `supabase/migrations/20260227000021_investments.sql` — investments + investment_transactions 테이블, RLS, 트리거
  - `app/api/investments/route.ts`, `app/api/investments/[id]/route.ts` — CRUD Route Handlers
  - `app/api/investments/[id]/transactions/route.ts` — 거래 내역 CRUD
  - `components/investments/investments-tab.tsx` — 포트폴리오 요약 + 거래 이력 다이얼로그
  - 다중 통화(KRW/CAD/USD) 지원, i18n 완전 적용
- **F-37 AI 인사이트**: Claude Haiku API로 30일 데이터 분석 → 개인화 인사이트 생성
  - `supabase/migrations/20260227000022_ai_insights.sql` — user당 최신 1건 저장하는 ai_insights 테이블 (UNIQUE user_id)
  - `app/api/ai/insights/route.ts` — GET(저장 인사이트 조회) + POST(생성 후 DB UPSERT)
  - `hooks/use-ai-insights.ts` — useQuery 자동 로드 + useMutation 생성 훅
  - 기기 간 동기화: DB 저장 후 어느 기기에서나 동일 인사이트 확인 가능
- **분석 탭 통합**: 목표·투자·AI 인사이트를 "분석" 페이지 단일 탭으로 통합
  - `app/(dashboard)/reports/page.tsx` — 5개 탭: 주간/월간/목표/투자/AI 인사이트
  - `components/goals/goals-tab.tsx` — GoalsPage → GoalsTab 컴포넌트로 추출
  - `components/investments/investments-tab.tsx` — InvestmentsPage → InvestmentsTab 컴포넌트로 추출
  - `app/(dashboard)/money/investments/page.tsx` → `redirect('/reports')` 교체
  - `app/(dashboard)/goals/page.tsx` → `redirect('/reports')` 교체
  - `app/(dashboard)/insights/page.tsx` → `redirect('/reports')` 교체
- **네비게이션 축소**: 하단 바 + 사이드바 8개 → 6개 (AI인사이트·목표·투자 제거, 분석 탭으로 통합)
  - `components/layout/bottom-nav.tsx`, `components/layout/sidebar.tsx` 업데이트
- **리포트 → 분석 명칭 변경**: `nav.reports` ko→"분석" / en→"Analytics"
- **사용자 가이드 업데이트** (`public/manual.html`, `public/manual.en.html`)
  - 08 분석 섹션 신규 추가 (주간/월간/목표/투자/AI 인사이트 5개 설명)
  - 기존 섹션 번호 갱신 (계정관리·보안·FAQ: 08~10 → 09~11)

### Fixed
- **VAPID 빌드 크래시**: `setVapidDetails`를 모듈 최상단 즉시 실행 → `sendPushNotification` 내부 lazy init으로 변경하여 빌드 타임 환경변수 미설정 크래시 방지

---

## [미정] - 2026-02-24 (Wave 1~3)

### Fixed
- **security**: PIN API 응답에서 bcrypt salt 노출 제거 → 클라이언트 자체 salt 생성(crypto.randomUUID) 방식으로 재설계
- **quality**: money 컴포넌트 4개(recurring-summary, budget-list, expense-bar-chart, monthly-trend-chart) KRW 하드코딩 → `useSettingsStore.defaultCurrency` 교체
- **api**: categories/[id] 409, diaries 400/409, diet-goal 400, users/pin 400/409/404/423 에러 응답 `apiError()` 표준화 완료 (전체 Route Handler 0건 잔존)
- **dashboard**: 금전 요약 카드 `원` 하드코딩 → `formatCurrency` 교체 (₩/$/CA$ 동적 표시)
- **money**: USD/CAD 거래 입력 시 소수점(cent) 입력 가능하도록 수정 (blur 시 포맷 적용)
- **money**: 거래 목록 날짜 헤더·하단 합계에서 통화 혼합 합산 제거 → 통화별 분리 표시
- **money**: 홈 Money 요약 카드·지출 현황 카드 통화 혼합 합산 전면 수정 → CAD/USD/KRW 완전 분리
- **money**: `calcTotalsByCurrency` 공통 유틸로 추출 (`lib/currency.ts`), 3개 컴포넌트 재사용
- **test**: validator 테스트를 i18n 에러 코드 기준으로 업데이트 (48 tests all passing)

### Added
- **Wave 1 — i18n 완성 + 차트/날짜 locale 처리**
  - theme-toggle aria-label, category-badge, recurring-summary, budget-list i18n 적용
  - 폼 컴포넌트(recurring-form, category-form, drink-form, diary-form, transaction-filter) placeholder/aria-label 다국어화
  - 차트 Y축 단위(만/억/K/M) locale 분기 처리 (expense-bar-chart, monthly-trend-chart, asset-trend-chart, expense-pie-chart)
  - 날짜 포맷 9개 파일 `'ko-KR'` 하드코딩 → `useLocale()` 기반 `Intl.DateTimeFormat` 전환
  - `lib/api-errors.ts` CONFLICT(409), LOCKED(423) 코드 추가, data 파라미터 추가
- **Wave 2 — 테스트 확대**
  - 단위 테스트: convertCurrency/convertTotalsToCurrency 12개 + useExchangeRates 훅 7개 추가 (총 133개 PASS)
  - E2E 테스트: money.spec.ts(16) + pin.spec.ts(11) + time.spec.ts(11) + health.spec.ts(18) 추가 (총 56개 신규)
- **i18n Phase 1-6: 영문 지원 + 다중 통화 (KRW/CAD/USD) 전체 구현 완성**
  - `next-intl` 쿠키 기반 설정 (URL 변경 없는 언어 전환)
  - `lib/currency.ts`: KRW/CAD/USD 통합 포맷 유틸 (`formatCurrency`, `formatCurrencyCompact`, `parseAmountInput` 등)
  - `lib/api-errors.ts`: API 에러 코드 상수 + `apiError()` 헬퍼
  - `app/api/settings/route.ts`: 사용자 설정 GET/PATCH API (locale 변경 시 쿠키 동기화)
  - `hooks/use-settings.ts`: React Query 기반 설정 훅
  - `hooks/use-api-error.ts`: 클라이언트 에러 번역 훅
  - `store/settings.store.ts`: Zustand 언어/통화 전역 상태
  - `types/settings.ts`: `UserSettings` 타입 (locale, default_currency)
  - `components/common/currency-select.tsx`: 재사용 통화 셀렉터 컴포넌트
  - `docs/migrations/009_user_settings_currency.sql`: user_settings 테이블 + currency 컬럼 추가
  - 설정 페이지: 언어(한국어/English) + 기본 통화(KRW/CAD/USD) 선택 UI
  - messages/ko.json, messages/en.json: ~500개 번역 키 (Phase 3-6 적용)
  - 금전/리포트/사적기록/설정 컴포넌트 7개 번역 키 적용 완료

---

## Phase 1-6 이전 완료 기능 (F-01~F-33)

모든 기능 구현 완료 — 상세 이력은 git log 참조.
