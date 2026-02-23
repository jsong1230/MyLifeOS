# F-02: 메인 대시보드 -- 기술 설계서

## 1. 참조

- 인수조건: docs/project/features.md #F-02
- 시스템 설계: docs/system/system-design.md
- 관련 설계: docs/specs/F-01/design.md (인증, auth.store.ts)
- 관련 설계: docs/specs/F-03/design.md (PIN 잠금, PinGuard, dashboard layout)

## 2. 구현 범위

### 포함

| 항목 | AC 매핑 |
|------|---------|
| 시간 모듈 요약 카드 (할일 완료/전체, 루틴 달성 현황) | AC-01 |
| 금전 모듈 요약 카드 (이번달 총 지출, 예산 대비 소진률) | AC-02 |
| 건강 모듈 요약 카드 (오늘 칼로리, 이번주 음주 횟수, 어젯밤 수면) | AC-03 |
| 사적 기록 요약 카드 (오늘 감정 상태, 최근 일기 작성일) | AC-04 |
| FAB (Floating Action Button) 빠른 입력 진입 | AC-05 |
| 하단 네비게이션 바 (모바일) | 공통 레이아웃 |
| 사이드바 (데스크탑) | 공통 레이아웃 |
| 상단 헤더 | 공통 레이아웃 |
| 빈 상태(Empty State) UI (모든 카드) | 현재 데이터 미존재 |

### 제외

| 항목 | 사유 |
|------|------|
| 실제 데이터 API 연동 | Phase 2~5 기능 미구현. 현재는 빈 상태 UI만 표시 |
| 대시보드 요약 API (GET /api/dashboard) | 각 모듈 API가 구현되면 추가 예정. 현재는 API 없음 |
| React Query 데이터 fetching 로직 | API 미존재이므로 현재 불필요 |
| 리포트/알림 기능 | F-19 (Phase 6)에서 구현 |
| 다크 모드 스타일 | F-28 (Phase 6)에서 구현 |

## 3. 아키텍처 결정

### 결정 1: 대시보드 레이아웃 적용 위치

- **선택지**: A) `app/(dashboard)/layout.tsx`에 네비게이션 추가 / B) `app/(dashboard)/page.tsx`에 직접 네비게이션 포함
- **결정**: A) `app/(dashboard)/layout.tsx`에 네비게이션 추가
- **근거**: 하단 네비게이션 바, 사이드바, 헤더는 대시보드 하위 모든 페이지(time, money, health, private, settings)에서 공통으로 사용됨. 기존 layout.tsx에 InactivityProvider와 PinGuard가 래핑되어 있으므로, 이 안에 레이아웃 셸(AppShell)을 추가하는 것이 적합. 단, PinGuard의 children으로 AppShell이 들어가야 PIN 인증 전에는 네비게이션이 보이지 않음.

### 결정 2: 네비게이션 컴포넌트 분리 방식

- **선택지**: A) 단일 `AppShell` 컴포넌트 (반응형 분기 내부 처리) / B) `BottomNav` + `Sidebar` 별도 컴포넌트
- **결정**: B) `BottomNav` + `Sidebar` 별도 컴포넌트
- **근거**: system-design.md에 `components/layout/bottom-nav.tsx`, `components/layout/sidebar.tsx`, `components/layout/header.tsx`로 분리 정의되어 있음. 각 컴포넌트의 관심사를 분리하고 독립적으로 테스트 가능. AppShell은 이들을 조합하는 래퍼 역할.

### 결정 3: 요약 카드 데이터 전략 (Phase 1 한정)

- **선택지**: A) 빈 상태 UI를 하드코딩 / B) 더미 데이터를 넣고 API 연동 준비 / C) React Query 훅의 빈 응답으로 빈 상태 표시
- **결정**: A) 빈 상태 UI를 하드코딩
- **근거**: Phase 2~5 기능(할일, 금전, 건강, 일기)이 미구현이므로 API 엔드포인트 자체가 존재하지 않음. 불필요한 API 호출 및 에러 처리를 피하고, 각 카드에 "준비 중" 상태의 일러스트/메시지를 표시. 추후 각 모듈 구현 시 카드 내부를 실데이터로 교체하는 구조로 설계.

### 결정 4: FAB 구현 방식

- **선택지**: A) Radix UI Popover 기반 / B) 커스텀 CSS 애니메이션 / C) shadcn/ui Sheet (바텀시트)
- **결정**: B) 커스텀 CSS 애니메이션
- **근거**: FAB는 하단 우측 고정 위치에 + 버튼으로 표시되며, 클릭 시 4개 옵션이 위로 펼쳐지는 패턴. Popover는 앵커 기준 위치 계산이 고정 버튼과 맞지 않고, Sheet는 UX가 다름. Tailwind 애니메이션 + 상태 기반 조건부 렌더링이 가장 간결하고 PWA 모바일 환경에 적합.

### 결정 5: 카드 클릭 시 라우팅 전략

- **선택지**: A) 카드 클릭 시 해당 모듈 메인 페이지로 이동 / B) 카드 클릭 비활성화 (데이터 없으므로)
- **결정**: A) 카드 클릭 시 해당 모듈 메인 페이지로 이동
- **근거**: 비록 현재 모듈 페이지가 미구현이지만, 라우팅 구조는 system-design.md에 정의되어 있음. 카드 탭 시 해당 모듈 경로(/time, /money, /health, /private)로 이동하되, 해당 페이지가 없으면 404 대신 "준비 중" 페이지를 표시. 이는 네비게이션 흐름을 미리 검증하는 효과가 있음.

### 결정 6: 모듈별 라우트 그룹 구조

- **선택지**: A) `/time`, `/money` 등 독립 라우트 (dashboard 라우트 그룹 밖) / B) `/(dashboard)/time`, `/(dashboard)/money` 등 대시보드 그룹 내부
- **결정**: B) `/(dashboard)/time`, `/(dashboard)/money` 등 대시보드 그룹 내부
- **근거**: system-design.md에서는 `/time`, `/money`로 독립 라우트로 정의되어 있으나, InactivityProvider + PinGuard가 `(dashboard)` 레이아웃에만 적용됨. 모든 인증 필요 페이지가 이 보호 레이어를 공유하려면 `(dashboard)` 그룹 내부에 위치해야 함. 단, URL은 `/(dashboard)/time`이 아닌 `/time`으로 표시됨 (라우트 그룹은 URL에 영향 없음).

## 4. 파일 구조

```
app/
  (dashboard)/
    layout.tsx               -- (수정) AppShell 래핑 추가
    page.tsx                 -- (수정) 대시보드 메인 페이지 (4개 요약 카드 + 인사)
    time/
      page.tsx               -- (신규) 시간 모듈 메인 "준비 중" 페이지
    money/
      page.tsx               -- (신규) 금전 모듈 메인 "준비 중" 페이지
    health/
      page.tsx               -- (신규) 건강 모듈 메인 "준비 중" 페이지
    private/
      page.tsx               -- (신규) 사적 기록 메인 "준비 중" 페이지
components/
  layout/
    app-shell.tsx            -- 메인 레이아웃 셸 (헤더 + 사이드바 + 메인 + 하단 네비)
    header.tsx               -- 상단 헤더 (앱 이름, 사용자 아바타, 설정 링크)
    bottom-nav.tsx           -- 하단 네비게이션 바 (모바일 전용)
    sidebar.tsx              -- 사이드바 (데스크탑 전용)
    fab.tsx                  -- Floating Action Button (빠른 입력)
  dashboard/
    time-summary-card.tsx    -- 시간 모듈 요약 카드
    money-summary-card.tsx   -- 금전 모듈 요약 카드
    health-summary-card.tsx  -- 건강 모듈 요약 카드
    private-summary-card.tsx -- 사적 기록 요약 카드
    greeting-header.tsx      -- 인사말 헤더 (시간대별 + 사용자 이름)
    empty-state.tsx          -- 공통 빈 상태 UI 컴포넌트
  common/
    module-placeholder.tsx   -- 모듈 "준비 중" 페이지 공통 컴포넌트
```

### 신규 생성 파일 (15개)

| 파일 | 목적 |
|------|------|
| `components/layout/app-shell.tsx` | 반응형 레이아웃 셸 (헤더+사이드바+하단네비+메인 영역 조합) |
| `components/layout/header.tsx` | 상단 헤더 바 |
| `components/layout/bottom-nav.tsx` | 모바일 하단 네비게이션 바 |
| `components/layout/sidebar.tsx` | 데스크탑 사이드바 |
| `components/layout/fab.tsx` | Floating Action Button |
| `components/dashboard/time-summary-card.tsx` | 시간 모듈 요약 카드 |
| `components/dashboard/money-summary-card.tsx` | 금전 모듈 요약 카드 |
| `components/dashboard/health-summary-card.tsx` | 건강 모듈 요약 카드 |
| `components/dashboard/private-summary-card.tsx` | 사적 기록 요약 카드 |
| `components/dashboard/greeting-header.tsx` | 시간대별 인사말 + 사용자 이름 |
| `components/dashboard/empty-state.tsx` | 공통 빈 상태 UI |
| `components/common/module-placeholder.tsx` | "준비 중" 모듈 페이지 |
| `app/(dashboard)/time/page.tsx` | 시간 모듈 placeholder |
| `app/(dashboard)/money/page.tsx` | 금전 모듈 placeholder |
| `app/(dashboard)/health/page.tsx` | 건강 모듈 placeholder |
| `app/(dashboard)/private/page.tsx` | 사적 기록 모듈 placeholder |

### 기존 수정 파일 (2개)

| 파일 | 변경 내용 |
|------|-----------|
| `app/(dashboard)/layout.tsx` | PinGuard children 내부에 AppShell 래핑 추가 |
| `app/(dashboard)/page.tsx` | 빈 페이지를 4개 요약 카드 + FAB 대시보드로 교체 |

## 5. API 설계

### Phase 1 (현재): API 없음

F-02 Phase 1에서는 신규 API를 생성하지 않음. 모든 카드는 빈 상태(Empty State) UI를 표시.

### Phase 2 이후 (향후): GET /api/dashboard/summary

각 모듈이 구현되면 대시보드 요약 데이터를 단일 API로 제공. 현재는 인터페이스만 정의.

- **파일**: `app/api/dashboard/summary/route.ts` (향후 생성)
- **목적**: 4개 모듈 요약 데이터를 한 번에 조회
- **인증**: 필요 (JWT, Supabase Auth)
- **메서드**: GET

#### Response (향후 구현)

```typescript
{
  "success": true,
  "data": {
    "time": {
      "todayTodos": { "completed": 3, "total": 7 },
      "todayRoutines": { "completed": 2, "total": 5 }
    },
    "money": {
      "monthlyExpense": 1250000,
      "budget": 2000000,
      "burnRate": 62.5
    },
    "health": {
      "todayCalories": 1850,
      "weeklyDrinks": 2,
      "lastSleepHours": 7.5
    },
    "private": {
      "todayMood": "happy",
      "lastDiaryDate": "2026-02-22"
    }
  }
}
```

#### 에러 케이스 (향후)

| HTTP 코드 | 상황 |
|-----------|------|
| 401 | JWT 인증 실패 |
| 500 | 서버 내부 오류 |

#### 향후 API 구현 시 쿼리 전략

대시보드 요약 API는 여러 테이블을 조회해야 하므로, Supabase의 RPC(Remote Procedure Call)를 사용하여 단일 DB 함수로 처리 예정:

```sql
-- 향후 구현 예정
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_user_id UUID, p_date DATE)
RETURNS JSON AS $$
  SELECT json_build_object(
    'time', json_build_object(
      'todayTodos', (SELECT json_build_object(
        'completed', COUNT(*) FILTER (WHERE status = 'completed'),
        'total', COUNT(*)
      ) FROM todos WHERE user_id = p_user_id AND due_date = p_date),
      'todayRoutines', (SELECT json_build_object(
        'completed', COUNT(*) FILTER (WHERE completed = TRUE),
        'total', COUNT(*)
      ) FROM routine_logs WHERE user_id = p_user_id AND date = p_date)
    ),
    'money', json_build_object(
      'monthlyExpense', (SELECT COALESCE(SUM(amount), 0) FROM transactions
        WHERE user_id = p_user_id AND type = 'expense'
        AND date >= date_trunc('month', p_date)
        AND date < date_trunc('month', p_date) + INTERVAL '1 month'),
      'budget', (SELECT COALESCE(SUM(amount), 0) FROM budgets
        WHERE user_id = p_user_id
        AND year_month = to_char(p_date, 'YYYY-MM'))
    ),
    'health', json_build_object(
      'todayCalories', (SELECT COALESCE(SUM(calories), 0) FROM meal_logs
        WHERE user_id = p_user_id AND date = p_date),
      'weeklyDrinks', (SELECT COUNT(DISTINCT date) FROM drink_logs
        WHERE user_id = p_user_id
        AND date >= p_date - INTERVAL '6 days' AND date <= p_date),
      'lastSleepHours', (SELECT value FROM health_logs
        WHERE user_id = p_user_id AND log_type = 'sleep'
        AND date = p_date - INTERVAL '1 day'
        ORDER BY created_at DESC LIMIT 1)
    ),
    'private', json_build_object(
      'todayMood', (SELECT mood FROM diary_entries
        WHERE user_id = p_user_id AND date = p_date),
      'lastDiaryDate', (SELECT MAX(date) FROM diary_entries
        WHERE user_id = p_user_id)
    )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

## 6. DB 설계

### Phase 1: DB 변경 없음

F-02 Phase 1에서는 새로운 테이블이나 컬럼을 추가하지 않음. 모든 요약 카드는 빈 상태 UI를 표시하므로 DB 조회가 불필요.

### 향후 참조하는 기존 테이블

| 테이블 | 요약 카드 | 조회 대상 |
|--------|-----------|-----------|
| `todos` | 시간 모듈 | `due_date = today`, `status` 카운트 |
| `routine_logs` | 시간 모듈 | `date = today`, `completed` 카운트 |
| `transactions` | 금전 모듈 | 이번달 `type = 'expense'` SUM |
| `budgets` | 금전 모듈 | 이번달 예산 SUM |
| `meal_logs` | 건강 모듈 | `date = today` 칼로리 SUM |
| `drink_logs` | 건강 모듈 | 이번주 음주 날짜 COUNT DISTINCT |
| `health_logs` | 건강 모듈 | `log_type = 'sleep'`, 어젯밤 value |
| `diary_entries` | 사적 기록 | `date = today` mood, MAX(date) |

## 7. 컴포넌트 상세 설계

### 7.1 AppShell (`components/layout/app-shell.tsx`)

**역할**: 대시보드 전체 레이아웃을 구성하는 셸 컴포넌트. 반응형으로 모바일/데스크탑 레이아웃 분기.

```typescript
'use client'

interface AppShellProps {
  children: React.ReactNode
}
```

**레이아웃 구조**:

```
[Mobile: < 768px]                    [Desktop: >= 768px]
+----------------------------+       +------+----------------------------+
| Header                     |       | Side | Header                     |
+----------------------------+       | bar  +----------------------------+
|                            |       |      |                            |
|   Main Content             |       |      |   Main Content             |
|   (children)               |       |      |   (children)               |
|                            |       |      |                            |
|                            |       |      |                            |
|                        [FAB]|      |      |                        [FAB]|
+----------------------------+       |      +----------------------------+
| Bottom Nav                 |       |      |
+----------------------------+       +------+
```

**반응형 전략**:
- `md` 브레이크포인트(768px)를 기준으로 모바일/데스크탑 전환
- 모바일: 하단 네비게이션 바 표시, 사이드바 숨김
- 데스크탑: 사이드바 표시, 하단 네비게이션 바 숨김
- FAB는 양쪽 모두 표시

**CSS 구조**:
```
<div className="flex min-h-screen">
  {/* Desktop Sidebar */}
  <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
    <Sidebar />
  </aside>

  {/* Main Area */}
  <div className="flex-1 md:ml-64">
    <Header />
    <main className="px-4 pb-20 md:pb-6 pt-4">
      {children}
    </main>
  </div>

  {/* Mobile Bottom Nav */}
  <nav className="fixed bottom-0 inset-x-0 md:hidden">
    <BottomNav />
  </nav>

  {/* FAB */}
  <FAB />
</div>
```

### 7.2 Header (`components/layout/header.tsx`)

**역할**: 상단 헤더. 앱 이름(모바일) 또는 현재 페이지 제목(데스크탑), 사용자 아바타, 설정 링크.

```typescript
'use client'

// 헤더는 현재 경로에 따라 제목을 변경
// - / : "My Life OS"
// - /time : "시간 관리"
// - /money : "금전 관리"
// - /health : "건강 관리"
// - /private : "사적 기록"
// - /settings : "설정"
```

**UI 구조**:
```
+---------------------------------------------------+
| [Logo/Title]                   [User Avatar] [Cog] |
+---------------------------------------------------+
```

**구현 사항**:
- `usePathname()`으로 현재 경로 감지하여 제목 변경
- 사용자 아바타: `useAuthStore()`에서 user 정보 가져와 이니셜 표시 (이미지 URL 있으면 이미지)
- 설정 아이콘: 클릭 시 `/settings`로 이동
- 높이: `h-14` (56px)
- `sticky top-0 z-30 bg-background/95 backdrop-blur`

**사용할 lucide-react 아이콘**:
| 아이콘 | 용도 |
|--------|------|
| `Settings` | 설정 링크 |
| `User` | 사용자 아바타 fallback |

### 7.3 BottomNav (`components/layout/bottom-nav.tsx`)

**역할**: 모바일 환경 하단 네비게이션 바. 5개 탭 (홈, 시간, 금전, 건강, 사적기록).

```typescript
'use client'
```

**UI 구조**:
```
+----------+----------+----------+----------+----------+
|  [Home]  |  [Clock] | [Wallet] | [Heart]  |  [Book]  |
|    홈    |   시간   |   금전   |   건강   |   기록   |
+----------+----------+----------+----------+----------+
```

**네비게이션 항목**:

| 순서 | 라벨 | 아이콘 | 경로 | 활성 조건 |
|------|------|--------|------|-----------|
| 1 | 홈 | `Home` | `/` | pathname === '/' |
| 2 | 시간 | `Clock` | `/time` | pathname.startsWith('/time') |
| 3 | 금전 | `Wallet` | `/money` | pathname.startsWith('/money') |
| 4 | 건강 | `Heart` | `/health` | pathname.startsWith('/health') |
| 5 | 기록 | `BookOpen` | `/private` | pathname.startsWith('/private') |

**스타일**:
- 고정 위치: `fixed bottom-0 inset-x-0 z-40`
- 배경: `bg-background border-t`
- 높이: `h-16` (64px) + 하단 safe area (`pb-safe`)
- 활성 탭: `text-primary font-medium`
- 비활성 탭: `text-muted-foreground`
- safe area padding: `env(safe-area-inset-bottom)` (iOS PWA 대응)

### 7.4 Sidebar (`components/layout/sidebar.tsx`)

**역할**: 데스크탑 환경 좌측 사이드바. 네비게이션 + 사용자 정보.

```typescript
'use client'
```

**UI 구조**:
```
+----------------------------+
|  [Logo] My Life OS         |
+----------------------------+
|                            |
|  [Home]    홈              |
|  [Clock]   시간 관리       |
|  [Wallet]  금전 관리       |
|  [Heart]   건강 관리       |
|  [Book]    사적 기록       |
|                            |
|  --------------------------
|                            |
|  [Settings] 설정           |
+----------------------------+
```

**스타일**:
- 너비: `w-64` (256px)
- 배경: `bg-sidebar border-r`
- 상단: 로고 + 앱 이름
- 네비게이션 항목: BottomNav와 동일한 5개 + 설정
- 활성 항목: `bg-sidebar-accent text-sidebar-accent-foreground` (globals.css의 sidebar 변수 사용)
- 비활성 항목: `text-sidebar-foreground hover:bg-sidebar-accent/50`

### 7.5 FAB (`components/layout/fab.tsx`)

**역할**: 빠른 입력을 위한 Floating Action Button. 클릭 시 4개 옵션 펼침.

```typescript
'use client'

// FAB 상태: 접힘(collapsed) / 펼침(expanded)
```

**UI 구조 (접힘 상태)**:
```
                                    +------+
                                    |  +   |  <- 56x56 원형 버튼
                                    +------+
```

**UI 구조 (펼침 상태)**:
```
                              +--[할일 추가]--+
                              +--[지출 입력]--+
                              +--[식사 기록]--+
                              +--[일기 쓰기]--+
                                    +------+
                                    |  X   |  <- + -> X 회전 애니메이션
                                    +------+
```

**FAB 옵션 항목**:

| 순서 | 라벨 | 아이콘 | 경로 | 모듈 |
|------|------|--------|------|------|
| 1 | 할일 추가 | `CheckSquare` | `/time` | 시간 |
| 2 | 지출 입력 | `Receipt` | `/money` | 금전 |
| 3 | 식사 기록 | `Utensils` | `/health` | 건강 |
| 4 | 일기 쓰기 | `PenLine` | `/private` | 사적기록 |

**동작 로직**:
1. + 버튼 클릭: `expanded` 상태 토글
2. 펼침 시 배경 오버레이 (반투명 검정) 표시
3. 오버레이 클릭 시 접힘
4. 옵션 클릭 시: 해당 경로로 `router.push()` 후 접힘
5. 스크롤 시 자동 접힘 (선택적)

**애니메이션**:
- + 아이콘: 펼침 시 45도 회전 (X 모양) - `transition-transform duration-200 rotate-45`
- 옵션 버튼: 아래에서 위로 순차적 등장 (`translate-y` + `opacity` 트랜지션, stagger 50ms)
- 오버레이: fade in/out (`opacity` 트랜지션)

**위치**:
- `fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50`
- 모바일: BottomNav(h-16) 위 + 여백 = bottom-24 (96px)
- 데스크탑: bottom-8 (32px)

### 7.6 GreetingHeader (`components/dashboard/greeting-header.tsx`)

**역할**: 대시보드 상단 시간대별 인사말 + 사용자 이름.

```typescript
'use client'
```

**인사말 규칙**:

| 시간대 | 인사말 |
|--------|--------|
| 05:00 ~ 11:59 | "좋은 아침이에요" |
| 12:00 ~ 17:59 | "좋은 오후예요" |
| 18:00 ~ 21:59 | "좋은 저녁이에요" |
| 22:00 ~ 04:59 | "오늘도 수고했어요" |

**UI 구조**:
```
+-----------------------------------------------+
| 좋은 아침이에요, {name}님                       |
| 2026년 2월 23일 월요일                         |
+-----------------------------------------------+
```

**데이터 소스**: `useAuthStore()`에서 `user.user_metadata.full_name` 또는 `user.email` 사용.

### 7.7 요약 카드 공통 구조

4개 요약 카드는 동일한 레이아웃 패턴을 따름.

**공통 Props 인터페이스**:

```typescript
interface SummaryCardProps {
  // 향후 API 연동 시 데이터를 받을 수 있도록 optional props 정의
  // Phase 1에서는 모두 undefined -> 빈 상태 표시
}
```

**공통 카드 레이아웃**:
```
+-----------------------------------------------+
| [아이콘] {모듈명}                    [바로가기>] |
+-----------------------------------------------+
|                                               |
|  {데이터가 있을 때: 요약 정보}                  |
|  {데이터가 없을 때: 빈 상태 UI}                |
|                                               |
+-----------------------------------------------+
```

**빈 상태 UI 패턴 (`components/dashboard/empty-state.tsx`)**:

```typescript
interface EmptyStateProps {
  icon: React.ReactNode        // lucide-react 아이콘
  title: string                // 예: "할일이 아직 없어요"
  description: string          // 예: "할일을 추가하고 하루를 관리해보세요"
}
```

```
+-----------------------------------------------+
|                                               |
|              [아이콘 (muted)]                  |
|              {title}                          |
|        {description (muted)}                  |
|                                               |
+-----------------------------------------------+
```

### 7.8 TimeSummaryCard (`components/dashboard/time-summary-card.tsx`)

**빈 상태 메시지**:
- 아이콘: `ListTodo`
- 제목: "할일이 아직 없어요"
- 설명: "할일을 추가하고 하루를 관리해보세요"

**향후 데이터 표시 (참고용)**:
```
+-----------------------------------------------+
| [Clock] 시간 관리                      [>]     |
+-----------------------------------------------+
|  오늘 할일        3 / 7 완료                   |
|  [===========-------] 43%                     |
|                                               |
|  오늘 루틴        2 / 5 달성                   |
|  [=========---------] 40%                     |
+-----------------------------------------------+
```

### 7.9 MoneySummaryCard (`components/dashboard/money-summary-card.tsx`)

**빈 상태 메시지**:
- 아이콘: `Wallet`
- 제목: "이번 달 지출 기록이 없어요"
- 설명: "지출을 기록하고 예산을 관리해보세요"

**향후 데이터 표시 (참고용)**:
```
+-----------------------------------------------+
| [Wallet] 금전 관리                      [>]    |
+-----------------------------------------------+
|  이번달 지출                                   |
|  1,250,000원                                  |
|                                               |
|  예산 소진률      62.5%                        |
|  [=============-----] 2,000,000원 중           |
+-----------------------------------------------+
```

### 7.10 HealthSummaryCard (`components/dashboard/health-summary-card.tsx`)

**빈 상태 메시지**:
- 아이콘: `Heart`
- 제목: "건강 기록을 시작해보세요"
- 설명: "식사, 음주, 수면을 기록하고 건강을 관리하세요"

**향후 데이터 표시 (참고용)**:
```
+-----------------------------------------------+
| [Heart] 건강 관리                       [>]    |
+-----------------------------------------------+
|  오늘 칼로리      1,850 kcal                   |
|  이번주 음주      2회                          |
|  어젯밤 수면      7시간 30분                    |
+-----------------------------------------------+
```

### 7.11 PrivateSummaryCard (`components/dashboard/private-summary-card.tsx`)

**빈 상태 메시지**:
- 아이콘: `BookOpen`
- 제목: "아직 일기가 없어요"
- 설명: "오늘의 감정과 이야기를 기록해보세요"

**향후 데이터 표시 (참고용)**:
```
+-----------------------------------------------+
| [BookOpen] 사적 기록                    [>]    |
+-----------------------------------------------+
|  오늘 감정        [행복 아이콘]                  |
|  최근 일기        2026-02-22 (어제)             |
+-----------------------------------------------+
```

### 7.12 ModulePlaceholder (`components/common/module-placeholder.tsx`)

**역할**: 미구현 모듈 페이지의 "준비 중" 표시 공통 컴포넌트.

```typescript
interface ModulePlaceholderProps {
  moduleName: string           // "시간 관리" 등
  icon: React.ReactNode        // lucide-react 아이콘
  description: string          // "할일, 캘린더, 루틴 기능이 곧 추가됩니다"
}
```

**UI 구조**:
```
+-----------------------------------------------+
|                                               |
|              [아이콘 (size-16)]                |
|                                               |
|           {moduleName}                        |
|                                               |
|       {description}                           |
|                                               |
|           준비 중입니다                        |
|                                               |
+-----------------------------------------------+
```

## 8. 시퀀스 흐름

### 8.1 대시보드 최초 진입 흐름

```
사용자                 middleware.ts        PinGuard          DashboardPage
  |                        |                   |                    |
  |-- GET / ------------->|                    |                    |
  |                        |-- JWT 검증        |                    |
  |                        |-- 인증 OK         |                    |
  |                        |                   |                    |
  |<------ (dashboard)/layout.tsx 렌더링 ----->|                    |
  |                        |                   |                    |
  |                        |              PinGuard 마운트           |
  |                        |              PIN 상태 확인              |
  |                        |                   |                    |
  |  [PIN 인증 완료 시]     |                   |                    |
  |                        |                   |-- children 렌더링 ->|
  |                        |                   |                    |
  |                        |                   |              AppShell 렌더링
  |                        |                   |              Header + Sidebar/BottomNav
  |                        |                   |              DashboardPage 렌더링
  |                        |                   |              4개 요약 카드 (빈 상태)
  |                        |                   |              FAB 표시
  |<------- 대시보드 UI ---|-------------------|----------------|
```

### 8.2 FAB 빠른 입력 흐름

```
사용자                    FAB              Router
  |                        |                  |
  |-- + 버튼 클릭 -------->|                  |
  |                        |-- expanded=true  |
  |<-- 4개 옵션 펼침 ------|                  |
  |<-- 오버레이 표시 ------|                  |
  |                        |                  |
  |-- "지출 입력" 클릭 --->|                  |
  |                        |-- expanded=false |
  |                        |-- router.push('/money')
  |                        |                  |-- /money 라우팅
  |<------ 금전 모듈 페이지 (준비 중) --------|
```

### 8.3 카드 탭 -> 모듈 이동 흐름

```
사용자              TimeSummaryCard         Router
  |                        |                  |
  |-- 카드 클릭 ---------->|                  |
  |                        |-- Link href="/time"
  |                        |                  |-- /time 라우팅
  |<--- (dashboard)/time/page.tsx (준비 중) --|
```

## 9. 상태 관리

### Phase 1에서 사용하는 Store

| Store | 사용 위치 | 사용 목적 |
|-------|-----------|-----------|
| `useAuthStore` | Header, GreetingHeader | 사용자 이름/이메일 표시 |
| (React useState) | FAB | expanded/collapsed 상태 토글 |

### Phase 2 이후 추가 예정

| Store/훅 | 목적 |
|----------|------|
| `useDashboardSummary` (React Query 훅) | GET /api/dashboard/summary 데이터 캐시 |

## 10. 네비게이션 라우트 매핑

| 경로 | 페이지 | 네비게이션 라벨 |
|------|--------|----------------|
| `/` | 메인 대시보드 | 홈 |
| `/time` | 시간 모듈 (Phase 2) | 시간 |
| `/money` | 금전 모듈 (Phase 3) | 금전 |
| `/health` | 건강 모듈 (Phase 4) | 건강 |
| `/private` | 사적 기록 (Phase 5) | 기록 |
| `/settings` | 설정 | (헤더/사이드바에서만 접근) |

## 11. 영향 범위

### 기존 `app/(dashboard)/layout.tsx` 변경

현재:
```tsx
import { InactivityProvider } from '@/components/common/inactivity-provider'
import { PinGuard } from '@/components/auth/pin-guard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <InactivityProvider>
      <PinGuard>{children}</PinGuard>
    </InactivityProvider>
  )
}
```

변경 후:
```tsx
import { InactivityProvider } from '@/components/common/inactivity-provider'
import { PinGuard } from '@/components/auth/pin-guard'
import { AppShell } from '@/components/layout/app-shell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <InactivityProvider>
      <PinGuard>
        <AppShell>{children}</AppShell>
      </PinGuard>
    </InactivityProvider>
  )
}
```

**주의**: AppShell은 PinGuard 안에 위치하여, PIN 인증이 완료되기 전에는 네비게이션 바가 표시되지 않음.

### 기존 `app/(dashboard)/page.tsx` 변경

전체 교체: 빈 페이지 -> 4개 요약 카드 + GreetingHeader 대시보드.

## 12. UI 설계

### 12.1 대시보드 메인 페이지 (모바일)

```
+----------------------------------+  375px 기준
| [Logo] My Life OS     [Avatar][S]|  <- Header (h-14)
+----------------------------------+
|                                  |
| 좋은 아침이에요, 제이슨님         |  <- GreetingHeader
| 2026년 2월 23일 월요일           |
|                                  |
| +------------------------------+ |
| | [Clock] 시간 관리          [>]| |  <- TimeSummaryCard
| |                               | |
| |     [ListTodo 아이콘]         | |
| |     할일이 아직 없어요        | |
| |   할일을 추가하고 하루를      | |
| |   관리해보세요                | |
| +------------------------------+ |
|                                  |
| +------------------------------+ |
| | [Wallet] 금전 관리         [>]| |  <- MoneySummaryCard
| |                               | |
| |     [Wallet 아이콘]           | |
| |  이번 달 지출 기록이 없어요   | |
| |   지출을 기록하고 예산을      | |
| |   관리해보세요                | |
| +------------------------------+ |
|                                  |
| +------------------------------+ |
| | [Heart] 건강 관리          [>]| |  <- HealthSummaryCard
| |                               | |
| |     [Heart 아이콘]            | |
| |  건강 기록을 시작해보세요     | |
| |   식사, 음주, 수면을 기록하고 | |
| |   건강을 관리하세요           | |
| +------------------------------+ |
|                                  |
| +------------------------------+ |
| | [BookOpen] 사적 기록       [>]| |  <- PrivateSummaryCard
| |                               | |
| |     [BookOpen 아이콘]         | |
| |  아직 일기가 없어요           | |
| |   오늘의 감정과 이야기를      | |
| |   기록해보세요                | |
| +------------------------------+ |
|                                  |
|                           +----+ |
|                           | +  | |  <- FAB (bottom-24 right-4)
|                           +----+ |
|                                  |
+----------------------------------+
| [Home] [Clock] [Wallet] [Heart] [Book] |  <- BottomNav (h-16)
+----------------------------------+
```

### 12.2 대시보드 메인 페이지 (데스크탑)

```
+--------+----------------------------------------------+
| [Logo] | [현재 페이지 제목]        [Avatar] [Settings] | <- Header
|        +----------------------------------------------+
|        |                                              |
| 홈     | 좋은 아침이에요, 제이슨님                      |
| 시간   | 2026년 2월 23일 월요일                        |
| 금전   |                                              |
| 건강   | +--------------------+ +--------------------+ |
| 기록   | | 시간 관리 요약     | | 금전 관리 요약     | |  <- 2열 그리드
|        | | (빈 상태)          | | (빈 상태)          | |
| -----  | +--------------------+ +--------------------+ |
| 설정   |                                              |
|        | +--------------------+ +--------------------+ |
|        | | 건강 관리 요약     | | 사적 기록 요약     | |
|        | | (빈 상태)          | | (빈 상태)          | |
|        | +--------------------+ +--------------------+ |
|        |                                              |
|        |                                        [FAB] |
+--------+----------------------------------------------+
```

**카드 그리드**:
- 모바일: `grid grid-cols-1 gap-4`
- 데스크탑: `grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6`

### 12.3 FAB 펼침 상태 (모바일)

```
+----------------------------------+
|                                  |
|  (배경 오버레이: bg-black/40)     |
|                                  |
|            +--[할일 추가]--+      |
|            +--[지출 입력]--+      |
|            +--[식사 기록]--+      |
|            +--[일기 쓰기]--+      |
|                           +----+ |
|                           | X  | |
|                           +----+ |
|                                  |
+----------------------------------+
| [Home] [Clock] [Wallet] [Heart] [Book] |
+----------------------------------+
```

**FAB 옵션 버튼 스타일**:
- 각 옵션: `flex items-center gap-3 bg-background shadow-lg rounded-full px-4 py-3`
- 왼쪽 원형 아이콘 배경 + 라벨 텍스트
- 오른쪽 정렬 (FAB 버튼 위에 우측 정렬)

### 12.4 사용할 shadcn/ui 컴포넌트

현재 설치된 컴포넌트 활용:

| 컴포넌트 | 용도 |
|----------|------|
| `Card`, `CardHeader`, `CardContent` | 요약 카드 래퍼 |
| `Button` | FAB 버튼, 네비게이션 항목 |

추가 설치 필요:

```bash
npx shadcn@latest add progress
```

| 컴포넌트 | 용도 |
|----------|------|
| `Progress` | 향후 예산 소진률, 할일 완료율 프로그레스 바 표시용 (Phase 2 이후) |

### 12.5 사용할 lucide-react 아이콘

| 아이콘 | 용도 |
|--------|------|
| `Home` | 네비게이션 - 홈 |
| `Clock` | 네비게이션/카드 - 시간 관리 |
| `Wallet` | 네비게이션/카드 - 금전 관리 |
| `Heart` | 네비게이션/카드 - 건강 관리 |
| `BookOpen` | 네비게이션/카드 - 사적 기록 |
| `Settings` | 헤더 - 설정 |
| `User` | 헤더 - 사용자 아바타 fallback |
| `Plus` | FAB 메인 버튼 |
| `CheckSquare` | FAB - 할일 추가 |
| `Receipt` | FAB - 지출 입력 |
| `Utensils` | FAB - 식사 기록 |
| `PenLine` | FAB - 일기 쓰기 |
| `ListTodo` | 빈 상태 - 시간 카드 |
| `ChevronRight` | 카드 바로가기 화살표 |
| `Construction` | 모듈 placeholder - 준비 중 |

## 13. 반응형 설계

### 브레이크포인트

| 범위 | 분류 | 레이아웃 |
|------|------|----------|
| < 768px | 모바일 | 하단 네비 + 1열 카드 그리드 |
| >= 768px (md) | 태블릿/데스크탑 | 사이드바 + 2열 카드 그리드 |
| >= 1024px (lg) | 대형 데스크탑 | 사이드바 + 2열 카드 (더 넓은 gap) |

### Safe Area 대응 (PWA/iOS)

```css
/* BottomNav에 적용 */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* 메인 콘텐츠 하단 여백 */
main {
  padding-bottom: calc(4rem + env(safe-area-inset-bottom, 0px) + 1.5rem);
  /* BottomNav 높이(4rem) + safe area + FAB 여유(1.5rem) */
}
```

### 모바일 기준 (375px)

- 카드: `w-full`, 좌우 padding `px-4` (16px)
- 실제 카드 너비: 375 - 32 = 343px
- 인사말 텍스트: `text-xl` (20px)
- 카드 제목: `text-sm` (14px)
- 카드 내용: `text-base` (16px)

## 14. 성능 설계

### 14.1 컴포넌트 최적화

- **서버 컴포넌트 활용**: `app/(dashboard)/page.tsx`를 서버 컴포넌트로 유지하고, 클라이언트 인터랙션이 필요한 부분(FAB, GreetingHeader)만 `'use client'`로 분리
- **코드 스플리팅**: FAB 옵션 목록은 펼침 시에만 렌더링 (조건부 렌더링)
- **메모이제이션**: BottomNav, Sidebar의 네비게이션 항목 목록을 `useMemo`로 메모이제이션
- **이미지 최적화**: 아이콘은 lucide-react의 트리 셰이킹 적용 (개별 import)

### 14.2 레이아웃 시프트 방지

- Header, BottomNav, Sidebar는 고정 높이/너비를 명시하여 CLS(Cumulative Layout Shift) 방지
- `min-h-screen`으로 콘텐츠 영역 최소 높이 보장

### 14.3 번들 사이즈

- 신규 의존성 추가 없음 (lucide-react, shadcn/ui 모두 기존 설치 상태)
- 추후 `progress` shadcn/ui 컴포넌트 1개 추가 (< 1KB gzipped)

## 15. 접근성 설계

| 요소 | 접근성 속성 |
|------|-------------|
| BottomNav | `<nav role="navigation" aria-label="메인 메뉴">` |
| Sidebar | `<nav role="navigation" aria-label="사이드 메뉴">` |
| FAB 메인 버튼 | `aria-label="빠른 입력"`, `aria-expanded` 상태 반영 |
| FAB 오버레이 | `aria-hidden="true"`, 클릭 시 FAB 접힘 |
| 요약 카드 링크 | `<Link>` 래핑, 카드 전체 클릭 가능 |
| 빈 상태 아이콘 | `aria-hidden="true"` (장식용) |
| 활성 네비게이션 | `aria-current="page"` |

---

## 변경 이력

| 날짜 | 변경 내용 | 이유 |
|------|-----------|------|
| 2026-02-23 | 초안 작성 | F-02 메인 대시보드 기능 설계 |
