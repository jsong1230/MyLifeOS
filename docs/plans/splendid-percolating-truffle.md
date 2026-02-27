# MyLifeOS 사용자 피드백 기반 버그 수정 및 기능 개선 계획

## Context

실제 사용자(캐나다 거주, CAD 통화 설정)로부터 받은 피드백을 기반으로 버그 수정과 기능 개선을 진행합니다.
주요 문제: 통화 하드코딩(KRW), FAB 겹침/바로가기 불량, 운동 날짜 기본값 오류, 로그아웃/탈퇴 기능 부재, 식사 표시 방식 등.

---

## Wave 1: 즉시 수정 가능한 버그 (8개)

### 1-1. 운동 추가 날짜 기본값 버그
- **문제**: 운동 추가 시 오늘이 아닌 주 시작일(월요일)이 기본값
- **원인**: `defaultDate={weekStart}` 전달
- **파일**: `app/(dashboard)/health/exercise/page.tsx:254`
- **수정**: 신규 추가(editingLog가 null)일 때 `defaultDate` prop을 전달하지 않음 → form 내부의 `getTodayString()` fallback이 동작

### 1-2. 거래내역 FAB 겹침
- **문제**: 글로벌 FAB(z-50, bottom-8)과 로컬 FAB(z-20, bottom-6)이 데스크탑에서 겹침
- **파일**: `app/(dashboard)/money/transactions/page.tsx:160-170`
- **수정**: 로컬 FAB 블록 삭제 (글로벌 FAB이 이미 "지출 입력" 옵션 제공, 1-6에서 경로 개선)

### 1-3. 통화 하드코딩 수정 (3개 파일, 총 10곳)

**a) `components/money/asset-summary.tsx`** (4곳)
- L7: `import { useSettingsStore } from '@/store/settings.store'` 추가
- 컴포넌트 내: `const currency = useSettingsStore((s) => s.defaultCurrency)` 추가
- L59: `formatCurrency(total, 'KRW')` → `formatCurrency(total, currency)`
- L60: `formatCurrencyCompact(total, 'KRW')` → `formatCurrencyCompact(total, currency)`
- L88: `formatCurrency(value, 'KRW')` → `formatCurrency(value, currency)`
- L118: `formatCurrency(value, 'KRW')` → `formatCurrency(value, currency)`

**b) `components/money/budget-progress.tsx`** (4곳)
- `useSettingsStore` import + `const currency = useSettingsStore((s) => s.defaultCurrency)`
- L53: `formatCurrency(spent, 'KRW')` → `formatCurrency(spent, budget.currency ?? currency)`
- L56: `formatCurrency(amount, 'KRW')` → `formatCurrency(amount, budget.currency ?? currency)`
- L102: `formatCurrency(Math.abs(remaining), 'KRW')` → 동일 패턴
- L103: `formatCurrency(remaining, 'KRW')` → 동일 패턴

**c) `components/money/summary-cards.tsx`** (2곳)
- `useSettingsStore` import + currency 읽기
- L98: `(currencies[0] ?? 'KRW')` → `(currencies[0] ?? currency)`
- L176: `formatCurrency(0, 'KRW')` → `formatCurrency(0, currency)`

### 1-4. 예산/정기지출 금액 input step 수정
- **문제**: `step={1000}` (예산) / `step={100}` (정기지출) — KRW 전용, CAD/USD에 부적절
- **수정**:
  - `lib/currency.ts`에 헬퍼 추가:
    ```ts
    export function getCurrencyStep(currency: CurrencyCode): number {
      return currency === 'KRW' ? 1000 : 1
    }
    ```
  - `components/money/budget-form.tsx:121`: `step={1000}` → `step={getCurrencyStep(currency)}`
  - `components/money/recurring-form.tsx:138`: `step={100}` → `step={getCurrencyStep(currency)}`
  - 두 폼 모두 `useSettingsStore`에서 `defaultCurrency` 읽기

### 1-5. 정기지출 currency 미전송 수정
- **문제**: recurring-form이 submit 데이터에 `currency` 필드를 포함하지 않아 API에서 KRW fallback
- **파일**: `components/money/recurring-form.tsx:97-103`
- **수정**: `useSettingsStore`에서 `defaultCurrency` 읽은 후, submit 데이터에 `currency: defaultCurrency` 추가

### 1-6. FAB 바로가기 경로 수정 + 자동 폼 열기
- **문제**: `/money`, `/health`로만 이동 → 구체 페이지로 연결 안됨
- **파일**: `components/layout/fab.tsx:8-13`
- **수정**:
  ```ts
  { key: 'addTodo',    icon: CheckSquare, href: '/time?action=add' },
  { key: 'addExpense', icon: Receipt,     href: '/money/transactions?action=add' },
  { key: 'addMeal',    icon: Utensils,    href: '/health/meals?action=add' },
  { key: 'addDiary',   icon: PenLine,     href: '/private/diary?action=add' },
  ```
- **추가 수정**: 각 대상 페이지에서 `useSearchParams`로 `action=add` 감지 → `useEffect`로 폼 자동 오픈
  - `app/(dashboard)/money/transactions/page.tsx`: `handleOpenCreate()` 호출
  - `app/(dashboard)/health/meals/page.tsx`: 식사 추가 폼 오픈
  - `app/(dashboard)/time/page.tsx`: 할일 추가 폼 오픈 (또는 todos 탭)
  - `app/(dashboard)/private/diary/page.tsx`: 일기 작성 폼 오픈

### 1-7. 캘린더 할일 표시 개선
- **문제**: 날짜별 최대 2개만 표시 → 보통 우선순위 할일이 안 보임
- **파일**: `components/time/calendar-view.tsx:207-208`
- **수정**:
  - 우선순위순 정렬 추가: `[...dayTodos].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])`
  - 표시 개수 3개로 확대: `.slice(0, 3)`
  - extraCount 갱신: `dayTodos.length - 3`

### 1-8. 루틴 시간 input "유효하지 않은 값"
- **문제**: `<Input type="time">` 브라우저 네이티브 유효성 에러
- **파일**: `components/time/routine-form.tsx:213-218`
- **수정**: `step={60}` 속성 추가 (분 단위 입력 허용)

---

## Wave 2: 필수 기능 추가 (3개)

### 2-1. 로그아웃 버튼
- **현상**: 수동 로그아웃 UI 없음. 30분 비활동 자동 로그아웃만 존재
- **파일**: `app/(dashboard)/settings/page.tsx`
- **수정**: 보안 카드 아래에 "계정" 섹션 Card 추가
  - AlertDialog로 확인 → `supabase.auth.signOut()` + `useAuthStore.reset()` + `router.push('/login')`
- **i18n**: `messages/ko.json`, `messages/en.json`의 `settings` 키에 추가:
  - `account`, `logout`, `logoutConfirm`, `logoutDescription`

### 2-2. 회원탈퇴 (관리자 요청 방식)
- **수정**:
  - 설정 페이지 "계정" 섹션에 "회원 탈퇴 요청" 버튼 추가
  - AlertDialog 경고 → `POST /api/users/delete-request` 호출
  - **새 API**: `app/api/users/delete-request/route.ts`
    - 인증 확인 → `users` 테이블에 `deletion_requested_at = now()` upsert
    - 응답: `{ success: true, message: "탈퇴 요청 완료" }`
  - **DB 마이그레이션**: `docs/migrations/012_deletion_request.sql`
    - `ALTER TABLE public.users ADD COLUMN deletion_requested_at TIMESTAMPTZ DEFAULT NULL;`
  - **i18n**: `deleteAccount`, `deleteAccountDescription`, `deleteAccountConfirm`, `deleteAccountRequested`

### 2-3. 닉네임(별명) 설정
- **현상**: 이메일/비밀번호 가입 시 "U" 아바타만 표시
- **수정**:
  - 설정 페이지 최상단에 "프로필" Card 섹션 추가
  - 새 컴포넌트: `components/settings/nickname-form.tsx`
    - Input 필드 (현재 full_name 프리필)
    - "저장" 버튼 → `supabase.auth.updateUser({ data: { full_name: newName } })`
    - 성공 시 auth store의 user 객체 갱신
  - **i18n**: `profile`, `profileDescription`, `nickname`, `nicknamePlaceholder`, `nicknameSaved`

---

## Wave 3: 중규모 기능 개선 (3개)

### 3-1. 대시보드 식사 표시 → 유형별(아침/점심/저녁/간식)
- **현상**: "식사 3회" (음식 개별 항목 수) → 사용자 혼란
- **수정**:
  - `app/api/dashboard/summary/route.ts`: meal_logs select에 `meal_type` 추가, 유형별 count 집계
  - `hooks/use-dashboard-summary.ts`: `DashboardSummary.meals`에 `byType` 필드 추가
  - `components/dashboard/health-summary-card.tsx`: 유형별 "아침 1끼, 점심 1끼" 형태로 표시
  - **i18n**: `mealType.breakfast`, `mealType.lunch`, `mealType.dinner`, `mealType.snack`

### 3-2. 정기지출 "수동 기록" 버튼 (거래내역 연동 Phase 1)
- **현상**: 정기지출이 수입/지출/잔액에 전혀 반영되지 않음
- **수정**:
  - `components/money/recurring-item.tsx`: "기록" 버튼 추가
  - 클릭 시 `/money/transactions?action=add&amount={}&category={}&memo={}&currency={}` 로 이동
  - `app/(dashboard)/money/transactions/page.tsx`: URL params에서 기본값 읽어 TransactionForm에 전달
  - `components/money/transaction-form.tsx`: `defaultValues` prop 추가 (금액, 카테고리, 메모 프리필)

### 3-3. 예산 미분류 지출 처리
- **현상**: `category_id = null`인 예산의 spent가 항상 0
- **파일**: `app/api/budgets/route.ts:103`
- **수정**: 미분류 예산에 대해 `category_id IS NULL`인 거래의 지출 합계를 별도 조회하여 매핑

---

## Wave 4: 대규모 기능 개선 (4개)

### 4-1. 식사 칼로리 자동 계산 (음식 DB 연동)

**사용자 요구**: "칼로리를 자동으로 계산해주면 편리. 일반적인 1그릇 기준으로 넣어주고, 1/2 1/3그릇 옵션 또는 직접 수정 가능하면 좋겠다"

**현재 상태**: `components/health/meal-form.tsx`에서 칼로리/단백질/탄수화물/지방 모두 수동 입력 (선택사항). 음식명(`food_name`)만 필수.

**구현 방안**:

**a) 음식 영양정보 API 서비스 구축**
- **새 파일**: `lib/food-nutrition.ts`
  - 외부 API 연동: FatSecret API (무료 티어) 또는 USDA FoodData Central API (무료)
  - 한국 음식: 식품의약품안전처 식품영양성분 DB API (공공데이터포털)
  - `searchFoods(query: string, locale: string)` → 후보 목록 반환
  - `getFoodNutrition(foodId: string)` → 1인분 기준 { calories, protein, carbs, fat, servingSize }
- **새 파일**: `app/api/food-search/route.ts`
  - GET `?q=김치찌개&locale=ko` → 검색 결과 반환 (서버에서 외부 API 호출)
  - rate limiting + 캐싱 (React Query staleTime으로 클라이언트 캐시 활용)

**b) meal-form 개선**
- **파일**: `components/health/meal-form.tsx`
  - 음식명 Input → 자동완성(Combobox)으로 교체
  - 사용자가 음식 선택 시 1인분 기준 영양정보 자동 입력
  - **분량 선택기 추가**: 1인분(기본), 1/2, 1/3, 2인분 버튼 또는 직접 배수 입력
    ```tsx
    <div className="flex gap-2">
      {[0.33, 0.5, 1, 1.5, 2].map(multiplier => (
        <button onClick={() => applyMultiplier(multiplier)}>
          {multiplier === 1 ? '1인분' : `${multiplier}인분`}
        </button>
      ))}
      <Input type="number" step="0.1" min="0.1" /> {/* 직접 입력 */}
    </div>
    ```
  - 자동 입력된 값은 사용자가 자유롭게 수정 가능 (기존 Input 유지)
  - 외부 API 검색 결과 없으면 기존 수동 입력 모드 그대로 사용

**c) 새 컴포넌트**
- `components/health/food-search-combobox.tsx`: 음식 검색 자동완성
- `hooks/use-food-search.ts`: React Query 기반 debounced 검색 훅

**d) 타입 추가**
- `types/food.ts`:
  ```ts
  export interface FoodNutrition {
    id: string
    name: string
    calories: number      // 1인분 기준 kcal
    protein: number       // g
    carbs: number         // g
    fat: number           // g
    serving_size: string  // "1그릇 (300g)" 등
    source: 'usda' | 'korean_db' | 'fatsecret'
  }
  ```

**e) i18n**
- `servingSize`, `autoFill`, `searchFood`, `noFoodResults`, `portion`, `customPortion`

**영향**: meal-form 전면 개편, 새 API route, 새 컴포넌트 2개, 새 훅 1개, 외부 API 키 환경변수 추가

---

### 4-2. 시간관리 통합 뷰 (할일+루틴+타임블록 캘린더 통합)

**사용자 요구**: "루틴과 타임블록까지 캘린더에 다 통합해서 한눈에 보면 편리. 루틴 완료를 위해 일부러 루틴 탭에 들어가야 하는 번거로움"

**현재 상태**:
- 캘린더(`time/calendar/page.tsx`): 할일(todos)만 표시
- 루틴(`time/routines/page.tsx`): 별도 탭, 오늘 완료 토글만 가능
- 타임블록(`time/blocks/page.tsx`): 별도 탭, 일간 타임라인
- 각 모듈이 완전 분리 — 서로 다른 API, 다른 훅, 다른 컴포넌트

**구현 방안**:

**a) 캘린더 뷰에 루틴/타임블록 통합 표시**
- **파일**: `app/(dashboard)/time/calendar/page.tsx`
  - `useRoutines()` 훅 추가 호출 → 오늘 활성 루틴 목록 가져오기
  - `useTimeBlocks({ date: selectedDate })` 훅 추가 호출
  - 선택 날짜 패널(SelectedDatePanel)에 3개 섹션 통합:
    1. **할일** (기존)
    2. **루틴** (오늘 해당하는 루틴 + 완료 토글 버튼)
    3. **타임블록** (해당 날짜 일정 목록)

**b) CalendarView 월간 그리드에 루틴/타임블록 표시**
- **파일**: `components/time/calendar-view.tsx`
  - props 확장: `routines?: Routine[]`, `timeBlocks?: TimeBlock[]`, `routineLogs?: RoutineLog[]`
  - 날짜 셀에 아이콘/뱃지로 구분 표시:
    - 할일: 파란 점
    - 루틴(미완료): 주황 점
    - 루틴(완료): 초록 점
    - 타임블록: 보라 점
  - 날짜별 표시 개수 제한은 유지하되, 유형별 1개씩은 보장

**c) 루틴 완료 토글 인라인 처리**
- 캘린더 상세 패널에서 바로 루틴 완료/취소 가능
- `useToggleRoutine()` 훅 활용 (이미 `hooks/use-routines.ts`에 존재)
- 완료 토글 시 캘린더 뷰도 즉시 반영 (React Query invalidation)

**d) 타입/훅 확장**
- `hooks/use-calendar.ts`: 루틴/타임블록 데이터 통합 fetch 옵션 추가
- 캘린더 페이지에 필요한 모든 데이터를 한 번에 가져오는 `useDailyOverview(date)` 훅 신규 생성 고려

**e) i18n**
- `calendarRoutines`, `calendarTimeBlocks`, `routineCompleted`, `toggleRoutine`

**영향**: calendar page 대폭 수정, calendar-view 컴포넌트 props 확장, 새 훅 가능, i18n 추가

---

### 4-3. 정기지출 자동 거래 생성

**사용자 요구**: "정기지출이 생기면 수입/지출/잔액에 자동 연동되어야 한다"

**현재 상태**: `recurring_expenses`와 `transactions` 테이블 완전 분리. Wave 3의 "수동 기록" 버튼은 임시 조치.

**구현 방안 (클라이언트 기반 — Supabase Edge Function 불필요)**:

**a) DB 스키마 확장**
- **새 마이그레이션**: `docs/migrations/013_recurring_last_recorded.sql`
  ```sql
  ALTER TABLE public.recurring_expenses
    ADD COLUMN last_recorded_date DATE DEFAULT NULL;
  ```
  - 마지막으로 거래가 생성된 날짜 추적

**b) 대시보드 로딩 시 자동 체크 로직**
- **새 파일**: `hooks/use-recurring-auto-record.ts`
  - 대시보드 마운트 시 실행
  - 활성 정기지출 목록 조회
  - 각 항목의 `billing_day`와 `last_recorded_date` 비교
  - 이번 달 `billing_day`가 지났고 `last_recorded_date`가 이번 달이 아니면 → 미기록 항목으로 판별
  - **자동 생성 X, 사용자 확인 방식**: 미기록 항목이 있으면 배너/다이얼로그 표시
    - "이번 달 정기지출 N건이 아직 기록되지 않았습니다. [일괄 기록] [나중에]"
    - "일괄 기록" 클릭 → `POST /api/transactions` 반복 호출 + `PATCH /api/recurring/{id}` last_recorded_date 업데이트

**c) API 확장**
- **파일**: `app/api/recurring/[id]/route.ts` (기존 PATCH에 `last_recorded_date` 필드 허용)
- **새 API (선택)**: `app/api/recurring/batch-record/route.ts`
  - POST: 여러 정기지출을 한 번에 거래내역으로 생성
  - 각 항목에 대해 `transactions` INSERT + `recurring_expenses` last_recorded_date UPDATE

**d) UI**
- 대시보드 또는 금전관리 페이지 상단에 알림 배너
- `components/money/recurring-reminder-banner.tsx` (신규)

**e) 타입 확장**
- `types/recurring.ts`의 `RecurringExpense`에 `last_recorded_date?: string` 추가

**영향**: 새 마이그레이션, 새 훅, 새 API, 새 UI 컴포넌트, 타입 확장

---

### 4-4. 사용자 가이드 업데이트

**사용자 요구**: "탈퇴가 안되는 앱은 가입을 안한다. 사용자 가이드에 넣기를 추천"

**현재 상태**: `public/manual.html` (ko), `public/manual.en.html` (en) — 완전한 독립 HTML 문서, 약 1,175줄

**수정 내용**:

**a) `public/manual.html` (한국어)**
- 설정 섹션에 추가:
  - **프로필 설정**: 닉네임 변경 방법, "U" 대신 이름 표시 안내
  - **로그아웃**: 설정 > 계정 > 로그아웃 방법
  - **회원 탈퇴**: 설정 > 계정 > 탈퇴 요청 방법, 관리자 검토 프로세스 안내
  - **사용자 지칭 안내**: "실명이 아닌 닉네임으로 가입됩니다. 설정에서 표시 이름을 변경할 수 있습니다."

**b) `public/manual.en.html` (영어)**
- 동일한 내용 영어 번역 추가

**영향**: 정적 HTML 파일 2개 수정

---

## 수정 파일 요약

| Wave | 파일 | 변경 유형 |
|------|------|-----------|
| W1 | `app/(dashboard)/health/exercise/page.tsx` | `defaultDate` prop 조건부 제거 |
| W1 | `app/(dashboard)/money/transactions/page.tsx` | 로컬 FAB 삭제 + `?action=add` 감지 |
| W1 | `components/money/asset-summary.tsx` | 4x `'KRW'` → `currency` (store) |
| W1 | `components/money/budget-progress.tsx` | 4x `'KRW'` → `budget.currency ?? currency` |
| W1 | `components/money/summary-cards.tsx` | 2x fallback `'KRW'` → `currency` |
| W1 | `lib/currency.ts` | `getCurrencyStep()` 헬퍼 추가 |
| W1 | `components/money/budget-form.tsx` | 동적 step + store import |
| W1 | `components/money/recurring-form.tsx` | 동적 step + currency 전송 |
| W1 | `components/layout/fab.tsx` | href 경로 구체화 |
| W1 | `app/(dashboard)/health/meals/page.tsx` | `?action=add` 감지 |
| W1 | `app/(dashboard)/time/page.tsx` | `?action=add` 감지 |
| W1 | `app/(dashboard)/private/diary/page.tsx` | `?action=add` 감지 |
| W1 | `components/time/calendar-view.tsx` | 우선순위 정렬 + 표시 3개 확대 |
| W1 | `components/time/routine-form.tsx` | `step={60}` 추가 |
| W2 | `app/(dashboard)/settings/page.tsx` | 프로필/계정 섹션 추가 |
| W2 | `components/settings/nickname-form.tsx` | **신규** |
| W2 | `app/api/users/delete-request/route.ts` | **신규** |
| W2 | `docs/migrations/012_deletion_request.sql` | **신규** |
| W2 | `messages/ko.json` + `messages/en.json` | i18n 키 추가 |
| W3 | `app/api/dashboard/summary/route.ts` | meal_type 집계 추가 |
| W3 | `hooks/use-dashboard-summary.ts` | 타입 확장 |
| W3 | `components/dashboard/health-summary-card.tsx` | 유형별 표시 |
| W3 | `components/money/recurring-item.tsx` | "기록" 버튼 추가 |
| W3 | `components/money/transaction-form.tsx` | defaultValues prop 추가 |
| W3 | `app/api/budgets/route.ts` | 미분류 예산 지출 처리 |
| W4 | `lib/food-nutrition.ts` | **신규** — 음식 영양정보 API 클라이언트 |
| W4 | `app/api/food-search/route.ts` | **신규** — 음식 검색 API route |
| W4 | `components/health/food-search-combobox.tsx` | **신규** — 음식 자동완성 |
| W4 | `hooks/use-food-search.ts` | **신규** — 음식 검색 훅 |
| W4 | `types/food.ts` | **신규** — 음식 영양정보 타입 |
| W4 | `components/health/meal-form.tsx` | 자동완성 + 분량 선택기 통합 |
| W4 | `app/(dashboard)/time/calendar/page.tsx` | 루틴/타임블록 데이터 통합 |
| W4 | `components/time/calendar-view.tsx` | props 확장 + 루틴/타임블록 표시 |
| W4 | `hooks/use-recurring-auto-record.ts` | **신규** — 정기지출 자동 체크 |
| W4 | `components/money/recurring-reminder-banner.tsx` | **신규** — 미기록 알림 배너 |
| W4 | `app/api/recurring/batch-record/route.ts` | **신규** — 일괄 거래 생성 |
| W4 | `docs/migrations/013_recurring_last_recorded.sql` | **신규** — last_recorded_date 컬럼 |
| W4 | `types/recurring.ts` | `last_recorded_date` 필드 추가 |
| W4 | `public/manual.html` | 탈퇴/닉네임/로그아웃 안내 추가 |
| W4 | `public/manual.en.html` | 동일 영어 번역 |
| W4 | `messages/ko.json` + `messages/en.json` | Wave 4 관련 i18n 키 추가 |

---

## 검증 방법

1. **Wave 1 완료 후**:
   - `npm run type-check` — 타입 에러 0건 확인
   - `npm test` — 기존 테스트 PASS 확인
   - `npm run build` — 빌드 성공 확인
   - 수동 테스트: 설정에서 CAD 선택 → 자산/예산/정기지출/대시보드 모두 CA$ 표시 확인
   - 운동 추가 → 오늘 날짜 기본값 확인
   - FAB → 지출 입력 → 거래내역 페이지로 이동 + 폼 자동 오픈 확인

2. **Wave 2 완료 후**:
   - 설정 페이지에서 닉네임 변경 → 헤더 아바타 이니셜 업데이트 확인
   - 로그아웃 버튼 → 로그인 페이지 리다이렉트 확인
   - 탈퇴 요청 → API 응답 + DB 업데이트 확인

3. **Wave 3 완료 후**:
   - 대시보드 식사 카드에서 "아침 1끼, 저녁 1끼" 형태 표시 확인
   - 정기지출 "기록" 버튼 → 거래내역 폼 프리필 확인

4. **Wave 4 완료 후**:
   - 식사 폼: 음식명 입력 → 자동완성 목록 표시 → 선택 시 칼로리/영양소 자동 입력 확인
   - 분량 선택기: 1/2인분 선택 → 칼로리가 절반으로 자동 계산 확인
   - 캘린더: 날짜 선택 → 할일 + 루틴 + 타임블록 모두 상세 패널에 표시 확인
   - 루틴 완료: 캘린더 패널에서 루틴 완료 토글 → 상태 즉시 반영 확인
   - 정기지출 알림: 대시보드 진입 시 미기록 정기지출 배너 표시 확인
   - 일괄 기록: 배너에서 "일괄 기록" → 거래내역에 반영 확인
   - 사용자 가이드: manual.html 접속 → 탈퇴/닉네임/로그아웃 안내 표시 확인
