# 다국어(한국어/영어) + 다중 통화(KRW/CAD/USD) 지원 계획

## Context

가족이 캐나다에 거주하며 아이들은 영어가 편해서, 개인 라이프 매니지먼트 앱에 영어 지원이 필요합니다.
또한 KRW, CAD, USD 세 가지 통화를 모두 관리할 수 있어야 합니다.

**현재 상태**: 33개 기능 완성, ~209개 파일에 약 3,687 라인의 한국어 텍스트 하드코딩, 통화 포맷 함수 11+ 중복(모두 KRW 전용), DB에 currency 컬럼 없음.

**사용자 결정사항**:
- 통화: 기본 통화 설정 + 건별 다른 통화 선택 (합산은 동일 통화끼리만)
- 언어 라우팅: 쿠키 기반 (URL 변경 없음)

---

## Phase 1: 기반 구축 — next-intl + 통화 유틸 + DB 마이그레이션

### 1A. next-intl 설치 및 설정 (쿠키 기반, without i18n routing)

- `npm install next-intl`
- **새 파일** `i18n/request.ts`: 쿠키에서 locale 읽기 (기본값 'ko')
- **수정** `next.config.ts`: `createNextIntlPlugin('./i18n/request.ts')` 적용
- **수정** `app/layout.tsx`: async Server Component로 변환, `NextIntlClientProvider` 래핑

```
// i18n/request.ts 핵심
const locale = cookieStore.get('locale')?.value || 'ko';
return { locale, messages: (await import(`../messages/${locale}.json`)).default };
```

### 1B. 번역 메시지 파일 생성

- **새 디렉토리** `messages/`
- **새 파일** `messages/ko.json`, `messages/en.json`
- 약 500개 키, 네임스페이스별 분리:

| 네임스페이스 | 키 수 | 내용 |
|---|---|---|
| `common` | ~50 | 저장, 취소, 삭제, 불러오는 중... |
| `nav` | ~15 | 홈, 시간 관리, 금전 관리, ... |
| `auth` | ~25 | 로그인, 회원가입, 폼 라벨 |
| `validation` | ~10 | 이메일/비밀번호 검증 메시지 |
| `errors` | ~15 | API 에러 코드별 번역 |
| `pin` | ~20 | PIN 설정/변경/잠금 |
| `dashboard` | ~30 | 인사말, 요약 카드 |
| `money.*` | ~80 | 거래, 예산, 자산, 정기지출, 차트 |
| `time.*` | ~85 | 할일, 루틴, 캘린더, 타임블록, 통계 |
| `health.*` | ~80 | 식사, 수면, 운동, 음주, 체성분 |
| `private.*` | ~55 | 일기, 감정, 인간관계 |
| `reports` | ~20 | 리포트 |
| `settings` | ~20 | 설정 페이지 |
| `currency` | ~15 | 통화명, 축약 단위 |

### 1C. 공통 통화 포맷 유틸리티

- **새 파일** `lib/currency.ts`
- 기존 11+ 중복 `formatKRW()` 를 대체할 통합 함수:
  - `formatCurrency(amount, currency)` — 전체 표시: "₩1,234,567" / "$1,234.56 CAD"
  - `formatAmount(amount, currency)` — 숫자만: "1,234,567" / "1,234.56"
  - `formatCurrencyCompact(amount, currency, locale)` — 차트용 축약: "1.2억"/"345만" (KRW/ko), "1.2M"/"345K" (USD)
  - `parseAmountInput(value, currency)` — 입력 파싱: KRW는 정수, CAD/USD는 소수점 2자리

### 1D. user_settings 타입 + Zustand 스토어

- **새 파일** `types/settings.ts` — `UserSettings { locale, default_currency }`
- **새 파일** `store/settings.store.ts` — locale, defaultCurrency 상태

### 1E. DB 마이그레이션

- **새 파일** `docs/migrations/009_user_settings_currency.sql`
  - `user_settings` 테이블 (locale, default_currency) + RLS
  - `transactions`, `budgets`, `assets`, `recurring_expenses`에 `currency TEXT NOT NULL DEFAULT 'KRW'` 컬럼 추가
  - 통화별 인덱스 + 트리거 (신규 유저 시 기본 설정 자동 생성)

### 1F. Settings API + 훅

- **새 파일** `app/api/settings/route.ts` — GET/PATCH (locale 변경 시 쿠키도 설정)
- **새 파일** `hooks/use-settings.ts` — React Query 훅

---

## Phase 2: API 에러 코드 시스템

### 2A. 에러 코드 상수 정의

- **새 파일** `lib/api-errors.ts`
- `apiError('AUTH_REQUIRED')` 헬퍼 함수로 통일

### 2B. API Route 44개 파일 리팩토링

```typescript
// Before:
return NextResponse.json({ success: false, error: '인증이 필요합니다' }, { status: 401 })
// After:
return apiError('AUTH_REQUIRED')
```

### 2C. 클라이언트 에러 번역 훅

- **새 파일** `hooks/use-api-error.ts`
- hooks 23개 파일에서 `throw new Error(json.error ?? 'FETCH_FAILED')` 패턴으로 통일
- 컴포넌트에서 `translateError(code)` → `t('errors.AUTH_REQUIRED')` 로 표시

---

## Phase 3: 네비게이션 + 인증 + 대시보드 i18n

가장 가시성 높은 영역 먼저 적용.

### 수정 파일 (~20개)

| 영역 | 파일 | 변경 내용 |
|---|---|---|
| 네비게이션 | `sidebar.tsx`, `bottom-nav.tsx`, `header.tsx`, `fab.tsx` | NAV_ITEMS → `useTranslations('nav')` |
| 인증 | `auth-form.tsx`, `google-oauth-button.tsx`, `pin-*.tsx` (5개) | MODE_CONFIG, 라벨, 에러 메시지 → `useTranslations('auth')` |
| 유효성 | `lib/validators/auth.ts` | 한국어 메시지 → 에러 코드 반환 |
| 대시보드 | `greeting-header.tsx`, `*-summary-card.tsx` (4개) | 인사말, 날짜 포맷 → locale 기반 |
| 설정 | `settings/page.tsx` | 기존 텍스트 → `useTranslations('settings')` |

### 패턴 예시

```typescript
// sidebar.tsx — Before:
const NAV_ITEMS = [{ label: '홈', ... }, { label: '시간 관리', ... }]
// After:
const t = useTranslations('nav')
const items = [{ label: t('home'), ... }, { label: t('time'), ... }]
```

---

## Phase 4: 금전 모듈 i18n + 통화 지원 (가장 복잡)

### 4A. 타입에 currency 필드 추가 (4개 파일)

- `types/transaction.ts`, `types/asset.ts`, `types/budget.ts`, `types/recurring.ts`
- `currency: CurrencyCode` 필드 추가

### 4B. API Route에 currency 포함 (6개 파일)

- SELECT/INSERT에 currency 포함, 필터 파라미터 지원
- `monthly-stats` — 통화별 그룹핑

### 4C. formatKRW 제거 + formatCurrency 적용 (19개 컴포넌트)

| 컴포넌트 | 특이사항 |
|---|---|
| `transaction-form.tsx` | `parseInt()` → `parseAmountInput()` (소수점 지원), '원' suffix → 동적 |
| `asset-summary.tsx` | 만/억 축약 → `formatCurrencyCompact()`, 통화별 그룹 표시 |
| `summary-cards.tsx` | 통화별 분리 합계 |
| `budget-form.tsx`, `recurring-form.tsx` | 통화 셀렉터 추가 |
| 나머지 12개 | `formatKRW()` → `formatCurrency()` 단순 교체 |

### 4D. Recharts 한국어 dataKey 수정 (5개 파일)

```typescript
// Before: dataKey="수입", dataKey="지출"
// After: dataKey="income" name={t('money.charts.income')}, dataKey="expense" name={t('money.charts.expense')}
```

- `expense-bar-chart.tsx` — "예산"/"지출" → "budget"/"spent"
- `monthly-trend-chart.tsx` — "수입"/"지출" → "income"/"expense"
- `body-trend-chart.tsx` — "체중"/"체지방률"/"근육량" → "weight"/"bodyFat"/"muscle"
- `stats/page.tsx` — "달성률" → "rate"
- `expense-pie-chart.tsx` — 카테고리명 (DB 한국어 → i18n 매핑)

### 4E. 리포트 (2개 파일)

- `monthly-report.tsx`, `weekly-report.tsx` — formatKRW 제거 + 텍스트 i18n

---

## Phase 5: 시간 + 건강 + 사적 기록 모듈 i18n (~50개 파일)

### 5A. 시간 관리 (17개 파일)

- 할일: `todo-form.tsx`, `todo-item.tsx`, `todo-list.tsx`
- 루틴: `routine-form.tsx`, `routine-item.tsx`, `routine-list.tsx`
- 캘린더: `calendar-view.tsx` — 요일 ['일','월',...] → locale 기반
- 타임블록: `time-block-form.tsx`, `time-block-timeline.tsx`
- 통계: `stats/page.tsx` — "N월 N일 ~ N월 N일" → locale 기반
- 페이지: `time/page.tsx`, `time/layout.tsx`, `time/blocks/page.tsx`, `time/calendar/page.tsx`, `time/routines/page.tsx`

### 5B. 건강 관리 (18개 파일)

- 폼: `body-log-form.tsx`, `exercise-form.tsx`, `drink-form.tsx`, `meal-form.tsx`, `sleep-form.tsx`
- 표시: `body-trend-chart.tsx`, `calorie-card.tsx`, `drink-summary.tsx`, `sleep-summary.tsx` 등
- 라벨 맵: `DRINK_TYPE_LABELS`, `EXERCISE_INTENSITY_LABEL` → `t('health.drinkTypes.beer')` 패턴으로 전환

### 5C. 사적 기록 (14개 파일)

- 일기: `diary-form.tsx`, `diary-view.tsx`, `diary-search.tsx`
- 감정: `emotion-calendar.tsx`, `emotion-tags.tsx` 등
- 인간관계: `relation-form.tsx`, `relation-item.tsx`, `relation-list.tsx`
- `EMOTION_LABELS` → `t('private.emotions.happy')` 패턴

---

## Phase 6: 설정 UI + 마무리

### 6A. 설정 페이지에 언어/통화 선택 추가

- 언어 선택: 한국어 / English 드롭다운 → PATCH `/api/settings` + `locale` 쿠키 + `router.refresh()`
- 기본 통화 선택: KRW / CAD / USD 드롭다운

### 6B. 재사용 통화 셀렉터 컴포넌트

- **새 파일** `components/common/currency-select.tsx`
- transaction-form, asset-form, budget-form, recurring-form에서 사용

### 6C. metadata i18n

- `app/layout.tsx` 메타데이터 title/description → locale 기반

---

## 핵심 파일 목록

| 구분 | 파일 | 역할 |
|---|---|---|
| i18n 설정 | `i18n/request.ts` | next-intl 쿠키 기반 설정 |
| 번역 | `messages/ko.json`, `messages/en.json` | ~500 키 번역 파일 |
| 통화 | `lib/currency.ts` | 통합 포맷 유틸 (기존 11+ 함수 대체) |
| 에러 | `lib/api-errors.ts` | API 에러 코드 상수 + 헬퍼 |
| DB | `docs/migrations/009_user_settings_currency.sql` | user_settings + currency 컬럼 |
| API | `app/api/settings/route.ts` | 사용자 설정 CRUD |
| 루트 | `app/layout.tsx` | NextIntlClientProvider 래핑 |
| 스토어 | `store/settings.store.ts` | locale + 기본 통화 상태 |

## 검증 방법

1. **타입 체크**: `npm run type-check` 통과
2. **언어 전환**: 설정 > 언어 변경 > 모든 페이지 텍스트 변경 확인
3. **통화 전환**: 설정 > 기본 통화 CAD 변경 > 거래 입력 시 소수점 지원 + "$" 표시 확인
4. **혼합 통화**: KRW + USD 거래 → 요약에서 통화별 분리 표시 확인
5. **차트**: Y축/Tooltip이 통화 + 언어에 맞게 표시 확인
6. **새 유저**: 회원가입 → 기본 설정 자동 생성 확인
7. **쿠키 유지**: 언어 변경 후 새로고침 → 언어 유지 확인
8. **Playwright**: 주요 흐름 자동 테스트

## 예상 규모

| Phase | 수정/새 파일 수 | 예상 기간 |
|---|---|---|
| Phase 1: 기반 | ~5 수정 + 8 신규 | 1-2일 |
| Phase 2: API 에러 코드 | ~67 수정 + 2 신규 | 1-2일 |
| Phase 3: 네비/인증/대시보드 | ~20 수정 | 1일 |
| Phase 4: 금전 모듈 + 통화 | ~30 수정 + 1 신규 | 2-3일 |
| Phase 5: 시간/건강/사적기록 | ~50 수정 | 2-3일 |
| Phase 6: 설정 UI + 마무리 | ~5 수정 + 1 신규 | 1일 |
| **합계** | **~150 수정 + 12 신규** | **8-12일** |
