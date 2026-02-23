# F-02: 메인 대시보드 -- 테스트 명세

## 참조

- 설계서: docs/specs/F-02/design.md
- 인수조건: docs/project/features.md #F-02

## 테스트 환경

- 프레임워크: Vitest + @testing-library/react + jsdom
- 테스트 파일 위치: `tests/` (프로젝트 루트 하위, 소스 구조와 동일하게 미러링)
- 테스트 파일 명명: `{컴포넌트명}.test.tsx` 또는 `{훅명}.test.ts`

## 단위 테스트

### 1. GreetingHeader (`components/dashboard/greeting-header.tsx`)

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 아침 시간대 인사말 표시 | 시스템 시간 08:00 | "좋은 아침이에요" 텍스트 렌더링 |
| 오후 시간대 인사말 표시 | 시스템 시간 14:00 | "좋은 오후예요" 텍스트 렌더링 |
| 저녁 시간대 인사말 표시 | 시스템 시간 19:00 | "좋은 저녁이에요" 텍스트 렌더링 |
| 심야 시간대 인사말 표시 | 시스템 시간 23:00 | "오늘도 수고했어요" 텍스트 렌더링 |
| 새벽 시간대 인사말 표시 | 시스템 시간 03:00 | "오늘도 수고했어요" 텍스트 렌더링 |
| 경계값: 05:00 | 시스템 시간 05:00 | "좋은 아침이에요" 텍스트 렌더링 |
| 경계값: 12:00 | 시스템 시간 12:00 | "좋은 오후예요" 텍스트 렌더링 |
| 경계값: 18:00 | 시스템 시간 18:00 | "좋은 저녁이에요" 텍스트 렌더링 |
| 경계값: 22:00 | 시스템 시간 22:00 | "오늘도 수고했어요" 텍스트 렌더링 |
| 사용자 이름 표시 | authStore.user.user_metadata.full_name = "제이슨" | "제이슨님" 텍스트 포함 |
| 이름 없는 사용자 | authStore.user.email = "test@example.com" | 이메일 앞부분 "test" 또는 전체 이메일 표시 |
| 오늘 날짜 표시 | 시스템 날짜 2026-02-23 | "2026년 2월 23일" 텍스트 포함 |
| 요일 표시 | 시스템 날짜 2026-02-23 (월요일) | "월요일" 텍스트 포함 |

**테스트 파일**: `tests/components/dashboard/greeting-header.test.tsx`

**테스트 구현 가이드**:
- `vi.useFakeTimers()`로 시스템 시간 모킹
- `useAuthStore`를 모킹하여 사용자 정보 주입
- `vi.setSystemTime(new Date('2026-02-23T08:00:00'))` 패턴 사용

### 2. EmptyState (`components/dashboard/empty-state.tsx`)

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 아이콘 렌더링 | icon={ListTodo 컴포넌트} | 아이콘 요소 렌더링됨 |
| 제목 텍스트 렌더링 | title="할일이 아직 없어요" | 해당 텍스트 표시 |
| 설명 텍스트 렌더링 | description="할일을 추가하고..." | 해당 텍스트 표시 |
| muted 스타일 적용 | 기본 렌더링 | 설명 텍스트에 text-muted-foreground 클래스 |

**테스트 파일**: `tests/components/dashboard/empty-state.test.tsx`

### 3. TimeSummaryCard (`components/dashboard/time-summary-card.tsx`)

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 빈 상태 렌더링 | props 없음 | "할일이 아직 없어요" 텍스트 표시 |
| 카드 제목 표시 | 기본 렌더링 | "시간 관리" 텍스트 표시 |
| 바로가기 링크 존재 | 기본 렌더링 | /time 경로 링크 존재 |
| Clock 아이콘 표시 | 기본 렌더링 | Clock 아이콘 렌더링 |

**테스트 파일**: `tests/components/dashboard/time-summary-card.test.tsx`

### 4. MoneySummaryCard (`components/dashboard/money-summary-card.tsx`)

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 빈 상태 렌더링 | props 없음 | "이번 달 지출 기록이 없어요" 텍스트 표시 |
| 카드 제목 표시 | 기본 렌더링 | "금전 관리" 텍스트 표시 |
| 바로가기 링크 존재 | 기본 렌더링 | /money 경로 링크 존재 |

**테스트 파일**: `tests/components/dashboard/money-summary-card.test.tsx`

### 5. HealthSummaryCard (`components/dashboard/health-summary-card.tsx`)

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 빈 상태 렌더링 | props 없음 | "건강 기록을 시작해보세요" 텍스트 표시 |
| 카드 제목 표시 | 기본 렌더링 | "건강 관리" 텍스트 표시 |
| 바로가기 링크 존재 | 기본 렌더링 | /health 경로 링크 존재 |

**테스트 파일**: `tests/components/dashboard/health-summary-card.test.tsx`

### 6. PrivateSummaryCard (`components/dashboard/private-summary-card.tsx`)

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 빈 상태 렌더링 | props 없음 | "아직 일기가 없어요" 텍스트 표시 |
| 카드 제목 표시 | 기본 렌더링 | "사적 기록" 텍스트 표시 |
| 바로가기 링크 존재 | 기본 렌더링 | /private 경로 링크 존재 |

**테스트 파일**: `tests/components/dashboard/private-summary-card.test.tsx`

### 7. FAB (`components/layout/fab.tsx`)

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 기본 상태: + 버튼만 표시 | 초기 렌더링 | + 아이콘 버튼 1개만 보임, 옵션 숨김 |
| 클릭 시 옵션 펼침 | + 버튼 클릭 | 4개 옵션("할일 추가", "지출 입력", "식사 기록", "일기 쓰기") 표시 |
| 펼침 시 오버레이 표시 | + 버튼 클릭 | 오버레이 요소 렌더링 |
| 오버레이 클릭 시 접힘 | 오버레이 클릭 | 옵션 숨김, 오버레이 제거 |
| + 버튼 재클릭 시 접힘 | 펼침 상태에서 X 버튼 클릭 | 옵션 숨김 |
| "할일 추가" 클릭 시 라우팅 | "할일 추가" 클릭 | router.push('/time') 호출 |
| "지출 입력" 클릭 시 라우팅 | "지출 입력" 클릭 | router.push('/money') 호출 |
| "식사 기록" 클릭 시 라우팅 | "식사 기록" 클릭 | router.push('/health') 호출 |
| "일기 쓰기" 클릭 시 라우팅 | "일기 쓰기" 클릭 | router.push('/private') 호출 |
| 옵션 클릭 후 자동 접힘 | 아무 옵션 클릭 | 클릭 후 expanded=false |
| aria-label 존재 | 기본 렌더링 | "빠른 입력" aria-label 존재 |
| aria-expanded 상태 반영 | 펼침/접힘 | aria-expanded="true" / "false" |

**테스트 파일**: `tests/components/layout/fab.test.tsx`

**테스트 구현 가이드**:
- `next/navigation`의 `useRouter`를 모킹하여 `push` 호출 검증
- `@testing-library/user-event`의 `userEvent.click()` 사용

### 8. BottomNav (`components/layout/bottom-nav.tsx`)

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 5개 네비게이션 항목 렌더링 | 기본 렌더링 | "홈", "시간", "금전", "건강", "기록" 5개 항목 |
| 홈 경로 활성 표시 | pathname = "/" | 홈 탭에 활성 스타일, 나머지 비활성 |
| 시간 경로 활성 표시 | pathname = "/time" | 시간 탭에 활성 스타일 |
| 하위 경로에서도 활성 | pathname = "/time/calendar" | 시간 탭에 활성 스타일 |
| 각 항목 올바른 href | 기본 렌더링 | 각각 "/", "/time", "/money", "/health", "/private" |
| nav 역할 존재 | 기본 렌더링 | `role="navigation"` 속성 존재 |
| aria-label 존재 | 기본 렌더링 | `aria-label="메인 메뉴"` 존재 |
| 활성 탭 aria-current | pathname = "/" | 홈 탭에 `aria-current="page"` |

**테스트 파일**: `tests/components/layout/bottom-nav.test.tsx`

**테스트 구현 가이드**:
- `next/navigation`의 `usePathname`을 모킹하여 경로 상태 주입

### 9. Sidebar (`components/layout/sidebar.tsx`)

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 앱 로고/이름 표시 | 기본 렌더링 | "My Life OS" 텍스트 표시 |
| 6개 네비게이션 항목 | 기본 렌더링 | "홈", "시간 관리", "금전 관리", "건강 관리", "사적 기록", "설정" |
| 활성 경로 하이라이트 | pathname = "/money" | 금전 관리 항목에 활성 스타일 |
| 각 항목 올바른 href | 기본 렌더링 | 각각 "/", "/time", "/money", "/health", "/private", "/settings" |
| nav 역할 존재 | 기본 렌더링 | `role="navigation"` 속성 존재 |

**테스트 파일**: `tests/components/layout/sidebar.test.tsx`

### 10. Header (`components/layout/header.tsx`)

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 앱 이름 표시 | 기본 렌더링 | "My Life OS" 텍스트 표시 |
| 설정 링크 존재 | 기본 렌더링 | /settings 경로 링크 존재 |
| 사용자 아바타 표시 | authStore.user 존재 | 아바타 또는 이니셜 표시 |

**테스트 파일**: `tests/components/layout/header.test.tsx`

### 11. AppShell (`components/layout/app-shell.tsx`)

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| children 렌더링 | children="테스트 콘텐츠" | "테스트 콘텐츠" 렌더링 |
| Header 렌더링 | 기본 렌더링 | Header 컴포넌트 존재 |
| BottomNav 렌더링 | 기본 렌더링 | BottomNav 컴포넌트 존재 |
| Sidebar 렌더링 | 기본 렌더링 | Sidebar 컴포넌트 존재 |
| FAB 렌더링 | 기본 렌더링 | FAB 컴포넌트 존재 |

**테스트 파일**: `tests/components/layout/app-shell.test.tsx`

### 12. ModulePlaceholder (`components/common/module-placeholder.tsx`)

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 모듈명 표시 | moduleName="시간 관리" | "시간 관리" 텍스트 표시 |
| 설명 표시 | description="할일, 캘린더..." | 해당 텍스트 표시 |
| "준비 중" 텍스트 | 기본 렌더링 | "준비 중입니다" 텍스트 표시 |

**테스트 파일**: `tests/components/common/module-placeholder.test.tsx`

## 통합 테스트

### 1. DashboardPage 전체 렌더링

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 4개 요약 카드 모두 렌더링 | 페이지 렌더링 | "시간 관리", "금전 관리", "건강 관리", "사적 기록" 4개 카드 존재 |
| 모든 카드 빈 상태 표시 | 페이지 렌더링 (API 없음) | 각 카드에 빈 상태 메시지 표시 |
| 인사말 헤더 렌더링 | 페이지 렌더링 | GreetingHeader 컴포넌트 존재 |
| FAB 존재 | 페이지 렌더링 | FAB 버튼 존재 |

**테스트 파일**: `tests/app/dashboard/page.test.tsx`

**테스트 구현 가이드**:
- DashboardPage를 직접 import하여 렌더링 테스트
- useAuthStore, usePathname 등 필요한 의존성 모킹
- 각 카드의 제목 텍스트로 존재 여부 확인

### 2. FAB -> 라우팅 흐름

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| FAB 펼침 -> 옵션 클릭 -> 라우팅 | FAB 클릭 -> "할일 추가" 클릭 | router.push('/time') 호출 확인 |
| FAB 펼침 -> 오버레이 클릭 -> 접힘 | FAB 클릭 -> 오버레이 클릭 | 옵션이 화면에서 사라짐 |

**테스트 파일**: `tests/components/layout/fab.test.tsx` (단위 테스트와 통합)

### 3. 카드 클릭 -> 모듈 이동

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 시간 카드 클릭 -> /time 이동 | TimeSummaryCard 내 링크 클릭 | /time 경로로 이동 |
| 금전 카드 클릭 -> /money 이동 | MoneySummaryCard 내 링크 클릭 | /money 경로로 이동 |
| 건강 카드 클릭 -> /health 이동 | HealthSummaryCard 내 링크 클릭 | /health 경로로 이동 |
| 사적기록 카드 클릭 -> /private 이동 | PrivateSummaryCard 내 링크 클릭 | /private 경로로 이동 |

**테스트 파일**: `tests/components/dashboard/summary-cards.test.tsx`

**테스트 구현 가이드**:
- 각 카드 컴포넌트를 렌더링하고 Link의 href 속성 확인
- `screen.getByRole('link')` 또는 `screen.getAllByRole('link')` 사용

### 4. 네비게이션 활성 상태

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 홈 경로에서 홈 탭 활성 | pathname="/" + BottomNav 렌더링 | 홈 탭 활성 스타일, 나머지 비활성 |
| /time 경로에서 시간 탭 활성 | pathname="/time" + BottomNav 렌더링 | 시간 탭 활성 |
| /time/calendar 하위 경로에서도 | pathname="/time/calendar" + BottomNav 렌더링 | 시간 탭 활성 |
| Sidebar도 동일하게 동작 | pathname="/money" + Sidebar 렌더링 | 금전 관리 항목 활성 |

**테스트 파일**: `tests/components/layout/navigation.test.tsx`

## 경계 조건 / 에러 케이스

### GreetingHeader 경계 조건

- **시간대 경계값 (04:59 -> 05:00)**: 04:59은 "오늘도 수고했어요", 05:00은 "좋은 아침이에요"
- **시간대 경계값 (11:59 -> 12:00)**: 11:59은 "좋은 아침이에요", 12:00은 "좋은 오후예요"
- **시간대 경계값 (17:59 -> 18:00)**: 17:59은 "좋은 오후예요", 18:00은 "좋은 저녁이에요"
- **시간대 경계값 (21:59 -> 22:00)**: 21:59은 "좋은 저녁이에요", 22:00은 "오늘도 수고했어요"
- **user가 null인 경우**: 인사말에 이름 없이 "좋은 아침이에요" 만 표시 (이름 부분 생략 또는 기본값)
- **user_metadata.full_name이 빈 문자열**: email에서 @ 앞부분 추출하여 표시

### FAB 경계 조건

- **빠른 연속 클릭**: 펼침/접힘 상태가 깨지지 않아야 함
- **옵션 클릭과 동시에 오버레이 클릭**: 라우팅이 1회만 발생해야 함
- **키보드 접근**: Escape 키로 FAB 접힘 (선택적)

### BottomNav 경계 조건

- **알 수 없는 경로 (예: /unknown)**: 어떤 탭도 활성화되지 않음
- **설정 경로 (/settings)**: BottomNav에 설정 항목 없으므로 어떤 탭도 활성화되지 않음
- **pathname이 undefined**: usePathname이 null을 반환할 수 있음 (Next.js 특성) -> 방어 처리 확인

### 레이아웃 경계 조건

- **AppShell에서 PinGuard 미인증 상태**: AppShell이 PinGuard 내부에 있으므로, PIN 미인증 시 AppShell 자체가 렌더링되지 않아야 함 (PinGuard가 PinPad를 표시)
- **매우 긴 사용자 이름**: 헤더/인사말에서 텍스트 오버플로우 처리 (`truncate` 또는 `line-clamp`)

## 스냅샷 테스트

### 대상 컴포넌트

| 컴포넌트 | 스냅샷 목적 |
|----------|-------------|
| EmptyState | 빈 상태 UI 구조 일관성 검증 |
| TimeSummaryCard (빈 상태) | 카드 구조 일관성 검증 |
| MoneySummaryCard (빈 상태) | 카드 구조 일관성 검증 |
| HealthSummaryCard (빈 상태) | 카드 구조 일관성 검증 |
| PrivateSummaryCard (빈 상태) | 카드 구조 일관성 검증 |
| ModulePlaceholder | placeholder 구조 일관성 검증 |

**참고**: 스냅샷 테스트는 UI 구조 변경 시 의도적 업데이트가 필요하므로, 핵심 로직 테스트를 우선 작성하고 스냅샷은 선택적으로 추가.

## 테스트 파일 목록 요약

| 테스트 파일 | 대상 | 테스트 수 (예상) |
|-------------|------|-----------------|
| `tests/components/dashboard/greeting-header.test.tsx` | GreetingHeader | 13 |
| `tests/components/dashboard/empty-state.test.tsx` | EmptyState | 4 |
| `tests/components/dashboard/time-summary-card.test.tsx` | TimeSummaryCard | 4 |
| `tests/components/dashboard/money-summary-card.test.tsx` | MoneySummaryCard | 3 |
| `tests/components/dashboard/health-summary-card.test.tsx` | HealthSummaryCard | 3 |
| `tests/components/dashboard/private-summary-card.test.tsx` | PrivateSummaryCard | 3 |
| `tests/components/dashboard/summary-cards.test.tsx` | 카드 라우팅 통합 | 4 |
| `tests/components/layout/fab.test.tsx` | FAB | 12 |
| `tests/components/layout/bottom-nav.test.tsx` | BottomNav | 8 |
| `tests/components/layout/sidebar.test.tsx` | Sidebar | 5 |
| `tests/components/layout/header.test.tsx` | Header | 3 |
| `tests/components/layout/app-shell.test.tsx` | AppShell | 5 |
| `tests/components/layout/navigation.test.tsx` | 네비게이션 통합 | 4 |
| `tests/components/common/module-placeholder.test.tsx` | ModulePlaceholder | 3 |
| `tests/app/dashboard/page.test.tsx` | DashboardPage 통합 | 4 |
| **합계** | | **78** |

## 공통 모킹 설정

### Next.js 모킹

```typescript
// tests/__mocks__/next-navigation.ts
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) =>
    <a href={href} {...props}>{children}</a>,
}))
```

### Zustand Store 모킹

```typescript
// tests/__mocks__/auth-store.ts
vi.mock('@/store/auth.store', () => ({
  useAuthStore: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { full_name: '테스트 사용자' },
    },
    isLoading: false,
    isPinVerified: true,
    encryptionKey: null,
  })),
}))
```

### 시간 모킹 패턴

```typescript
// GreetingHeader 테스트에서 사용
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('아침 인사말 표시', () => {
  vi.setSystemTime(new Date('2026-02-23T08:00:00'))
  render(<GreetingHeader />)
  expect(screen.getByText(/좋은 아침이에요/)).toBeInTheDocument()
})
```

## 회귀 테스트

F-02는 Greenfield 기능이지만, 기존 구현물(F-01, F-03)에 대한 영향을 검증.

| 기존 기능 | 영향 여부 | 검증 방법 |
|-----------|-----------|-----------|
| F-01 인증 흐름 | 없음 | 변경 파일 없음. 기존 auth 라우트 미수정 |
| F-03 PinGuard | 간접 영향 | `(dashboard)/layout.tsx` 수정으로 PinGuard children 변경. PinGuard가 AppShell을 children으로 받아도 기존 동작(PIN 미인증 시 PinPad 표시) 유지 확인 |
| F-03 PIN 변경 (설정 페이지) | 없음 | settings/page.tsx 미수정. AppShell 내부에서 /settings 라우팅만 추가 |
| 기존 middleware.ts | 없음 | 라우트 보호 로직 미수정. 신규 경로(/time, /money 등)도 `/*` 패턴으로 보호됨 |

### 회귀 테스트 케이스

| 테스트 | 검증 내용 |
|--------|-----------|
| PinGuard + AppShell 통합 | PinGuard에 AppShell이 children으로 전달될 때, PIN 미인증 상태에서 PinPad가 표시되고 AppShell은 렌더링되지 않아야 함 |
| PinGuard + AppShell 통합 | PIN 인증 완료 후 AppShell + children이 정상 렌더링되어야 함 |
| 대시보드 레이아웃 구조 | InactivityProvider > PinGuard > AppShell > children 순서 보장 |

**테스트 파일**: `tests/app/dashboard/layout.test.tsx`

**테스트 구현 가이드**:
```typescript
// PinGuard를 모킹하여 children 전달만 검증
vi.mock('@/components/auth/pin-guard', () => ({
  PinGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// InactivityProvider도 동일하게 패스스루 모킹
vi.mock('@/components/common/inactivity-provider', () => ({
  InactivityProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
```
