# F-01: 회원가입/로그인 -- 테스트 명세

## 참조

- 설계서: docs/specs/F-01/design.md
- 인수조건: docs/project/features.md #F-01

## 테스트 환경

| 항목 | 도구 |
|------|------|
| 단위 테스트 | Vitest + React Testing Library |
| 통합 테스트 | Vitest + React Testing Library (Supabase mock) |
| E2E 테스트 | Playwright |
| Supabase Mock | `vi.mock('@/lib/supabase/client')` 방식 |

---

## 1. 단위 테스트

### 1.1 AuthForm 컴포넌트 (`components/auth/auth-form.tsx`)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| U-01 | login 모드 렌더링 | `mode='login'` | 이메일 input, 비밀번호 input, "로그인" 버튼 표시 |
| U-02 | signup 모드 렌더링 | `mode='signup'` | 이메일, 비밀번호, 비밀번호 확인 input, "회원가입" 버튼 표시 |
| U-03 | reset 모드 렌더링 | `mode='reset'` | 이메일 input만 표시, "재설정 이메일 발송" 버튼 표시 |
| U-04 | 빈 이메일 제출 방지 | 이메일 비어있는 상태에서 제출 | onSubmit 호출되지 않음, 이메일 필드 에러 표시 |
| U-05 | 잘못된 이메일 형식 | `email='invalid'` 제출 | onSubmit 호출되지 않음, "올바른 이메일 형식을 입력해주세요" 에러 |
| U-06 | 짧은 비밀번호 검증 | `password='1234'` (8자 미만) | onSubmit 호출되지 않음, "비밀번호는 최소 8자 이상이어야 합니다" 에러 |
| U-07 | 비밀번호 불일치 (signup) | `password='abcd1234'`, `confirmPassword='abcd5678'` | onSubmit 호출되지 않음, "비밀번호가 일치하지 않습니다" 에러 |
| U-08 | 유효한 폼 제출 | `email='test@test.com'`, `password='abcd1234'` | onSubmit이 `{ email, password }`와 함께 호출됨 |
| U-09 | 로딩 상태 | `isLoading=true` | 버튼 disabled, 로딩 스피너 표시 |
| U-10 | 에러 메시지 표시 | `error='이메일 또는 비밀번호가 올바르지 않습니다'` | 에러 메시지가 화면에 표시됨 |
| U-11 | login 모드 링크 존재 | `mode='login'` | "회원가입" 링크(/signup), "비밀번호 찾기" 링크(/reset-password) 존재 |
| U-12 | signup 모드 링크 존재 | `mode='signup'` | "이미 계정이 있으신가요?" 링크(/login) 존재 |

### 1.2 GoogleOAuthButton 컴포넌트 (`components/auth/google-oauth-button.tsx`)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| U-13 | 렌더링 확인 | - | Google 아이콘 + "Google로 계속하기" 텍스트 표시 |
| U-14 | 클릭 시 OAuth 호출 | 버튼 클릭 | `supabase.auth.signInWithOAuth({ provider: 'google' })` 호출됨 |
| U-15 | redirectTo 설정 확인 | 버튼 클릭 | options.redirectTo에 `/callback` 포함 |

### 1.3 useInactivityTimeout 훅 (`hooks/use-inactivity-timeout.ts`)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| U-16 | 타이머 시작 | 훅 마운트 | 30분(1,800,000ms) 타이머 설정됨 |
| U-17 | 이벤트 발생 시 타이머 리셋 | `mousemove` 이벤트 디스패치 | 타이머가 리셋되어 새로운 30분 시작 |
| U-18 | 타이머 만료 시 로그아웃 | 30분 경과 (vi.advanceTimersByTime 사용) | `signOut()` 호출됨, `useAuthStore.reset()` 호출됨 |
| U-19 | 여러 이벤트 타입 감지 | `keydown`, `touchstart`, `click`, `scroll` 각각 디스패치 | 각 이벤트에서 타이머 리셋됨 |
| U-20 | 언마운트 시 정리 | 훅 언마운트 | 이벤트 리스너 제거됨, 타이머 클리어됨 |
| U-21 | throttle 동작 | 100ms 간격으로 10번 mousemove | 타이머 리셋 1-2번만 발생 (1초 throttle) |
| U-22 | 커스텀 타임아웃 | `timeoutMs=60000` (1분) | 1분 후 로그아웃 |

### 1.4 useAuthStore (`store/auth.store.ts`)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| U-23 | 초기 상태 | - | `user: null`, `isLoading: true`, `isPinVerified: false`, `encryptionKey: null` |
| U-24 | setUser 동작 | `setUser(mockUser)` | `user`가 `mockUser`로 변경 |
| U-25 | setLoading 동작 | `setLoading(false)` | `isLoading`이 `false`로 변경 |
| U-26 | reset 동작 | 상태 설정 후 `reset()` | 모든 필드 초기값으로 리셋 (`isLoading: false`) |
| U-27 | setUser(null) 동작 | `setUser(mockUser)` 후 `setUser(null)` | `user`가 `null`로 변경 |

### 1.5 auth 유효성 검증 (`lib/validators/auth.ts`)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| U-28 | 유효한 이메일 | `'user@example.com'` | 통과 |
| U-29 | 잘못된 이메일 - @ 없음 | `'userexample.com'` | 에러 |
| U-30 | 잘못된 이메일 - 도메인 없음 | `'user@'` | 에러 |
| U-31 | 유효한 비밀번호 | `'MyPass123'` | 통과 |
| U-32 | 짧은 비밀번호 | `'Ab1'` | 에러: 8자 미만 |
| U-33 | 숫자 없는 비밀번호 | `'abcdefgh'` | 에러: 영문+숫자 조합 필요 |
| U-34 | 에러 메시지 매핑 | `AuthError('Invalid login credentials')` | `'이메일 또는 비밀번호가 올바르지 않습니다'` |
| U-35 | 알 수 없는 에러 매핑 | `AuthError('Unknown error')` | `'일시적인 오류가 발생했습니다. 다시 시도해주세요'` |

---

## 2. 통합 테스트 (Supabase Mock)

### 2.1 이메일 회원가입 (AC-01)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| I-01 | 회원가입 성공 | `email='new@test.com'`, `password='Test1234'` | `signUp()` 호출, "이메일 인증을 완료해주세요" 메시지 표시 |
| I-02 | 중복 이메일 회원가입 | `email='existing@test.com'` | "이미 가입된 이메일입니다. 로그인해주세요" 에러 표시 |
| I-03 | 회원가입 후 UI 전환 | 성공 후 | 폼이 사라지고 이메일 인증 안내 화면으로 전환 |

### 2.2 이메일 로그인 (AC-03)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| I-04 | 로그인 성공 | `email='user@test.com'`, `password='Test1234'` | `signInWithPassword()` 호출 성공, `useAuthStore.setUser(user)` 호출, `/`로 리다이렉트 |
| I-05 | 잘못된 비밀번호 | `email='user@test.com'`, `password='wrong'` | "이메일 또는 비밀번호가 올바르지 않습니다" 에러 표시 |
| I-06 | 미인증 이메일 로그인 | Supabase가 `Email not confirmed` 반환 | "이메일 인증을 완료해주세요" 에러 표시 |
| I-07 | 네트워크 오류 | `signInWithPassword()`가 네트워크 에러 throw | "네트워크 연결을 확인해주세요" 에러 표시 |

### 2.3 Google OAuth (AC-02)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| I-08 | OAuth 시작 | Google 버튼 클릭 | `signInWithOAuth({ provider: 'google', options: { redirectTo } })` 호출 |
| I-09 | OAuth 콜백 성공 | GET `/callback?code=valid_code` | `exchangeCodeForSession(code)` 호출, `/`로 302 리다이렉트 |
| I-10 | OAuth 콜백 실패 - code 없음 | GET `/callback` (code 없음) | `/login`으로 리다이렉트 |
| I-11 | OAuth 콜백 실패 - 잘못된 code | GET `/callback?code=invalid` | `/login?error=auth_error`로 리다이렉트 |

### 2.4 비밀번호 재설정 (AC-04)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| I-12 | 재설정 이메일 발송 성공 | `email='user@test.com'` | `resetPasswordForEmail()` 호출, "이메일을 확인해주세요" 메시지 표시 |
| I-13 | 존재하지 않는 이메일 | `email='nouser@test.com'` | 보안상 동일한 성공 메시지 표시 (이메일 존재 여부 노출 방지) |
| I-14 | Rate limit 초과 | 60초 내 재요청 | "잠시 후 다시 시도해주세요" 에러 표시 |
| I-15 | 새 비밀번호 설정 성공 | `/reset-password/update`에서 `password='NewPass123'` | `updateUser({ password })` 호출, "변경 완료" 메시지 + `/login` 리다이렉트 |
| I-16 | 새 비밀번호 불일치 | `password='NewPass123'`, `confirm='NewPass456'` | "비밀번호가 일치하지 않습니다" 에러 (클라이언트 검증) |

### 2.5 세션/미들웨어 (AC-03)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| I-17 | 미인증 보호 경로 접근 | `user=null`, 경로=`/` | `/login`으로 리다이렉트 |
| I-18 | 인증 상태 로그인 접근 | `user=validUser`, 경로=`/login` | `/`로 리다이렉트 |
| I-19 | 인증 상태 보호 경로 | `user=validUser`, 경로=`/time` | 정상 접근 허용 |
| I-20 | 공개 경로 접근 | `user=null`, 경로=`/signup` | 정상 접근 허용 |
| I-21 | callback 경로 접근 | `user=null`, 경로=`/callback` | 정상 접근 허용 (리다이렉트 없음) |
| I-22 | reset-password 접근 | `user=null`, 경로=`/reset-password` | 정상 접근 허용 |

### 2.6 Auth State Listener

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| I-23 | 세션 변경 감지 | `onAuthStateChange` 이벤트 `SIGNED_IN` | `useAuthStore.setUser(user)` 호출 |
| I-24 | 로그아웃 감지 | `onAuthStateChange` 이벤트 `SIGNED_OUT` | `useAuthStore.setUser(null)` 호출 |
| I-25 | 초기 로딩 완료 | 앱 마운트 후 세션 확인 완료 | `useAuthStore.setLoading(false)` 호출 |

---

## 3. E2E 테스트 (Playwright)

### 3.1 페이지 접근 및 렌더링

| # | 시나리오 | 단계 | 예상 결과 |
|---|----------|------|-----------|
| E-01 | 로그인 페이지 표시 | 1. `/login` 접속 | 이메일 input, 비밀번호 input, 로그인 버튼, Google 버튼 표시 |
| E-02 | 회원가입 페이지 표시 | 1. `/signup` 접속 | 이메일, 비밀번호, 비밀번호 확인 input, 회원가입 버튼 표시 |
| E-03 | 비밀번호 재설정 페이지 | 1. `/reset-password` 접속 | 이메일 input, 재설정 버튼 표시 |

### 3.2 인증 흐름

| # | 시나리오 | 단계 | 예상 결과 |
|---|----------|------|-----------|
| E-04 | 비로그인 보호 경로 접근 | 1. 로그아웃 상태에서 `/` 직접 접속 | `/login`으로 자동 리다이렉트 |
| E-05 | 비로그인 하위 경로 | 1. 로그아웃 상태에서 `/time` 접속 | `/login`으로 자동 리다이렉트 |
| E-06 | 로그인 -> 대시보드 | 1. `/login` 접속 2. 테스트 이메일/비밀번호 입력 3. 로그인 클릭 | `/` 대시보드로 리다이렉트 |
| E-07 | Google OAuth 버튼 | 1. `/login` 접속 2. Google 버튼 클릭 | Google OAuth 페이지로 이동 (URL에 accounts.google.com 포함) |
| E-08 | 페이지 간 전환 | 1. `/login` 접속 2. "회원가입" 링크 클릭 3. "로그인" 링크 클릭 | `/signup` -> `/login` 정상 전환 |
| E-09 | 인증 상태 로그인 접근 | 1. 로그인 상태에서 `/login` 접속 | `/`로 자동 리다이렉트 |

### 3.3 폼 유효성 검사

| # | 시나리오 | 단계 | 예상 결과 |
|---|----------|------|-----------|
| E-10 | 빈 폼 제출 | 1. `/login`에서 빈 폼 제출 | 에러 메시지 표시, 페이지 이동 없음 |
| E-11 | 잘못된 이메일 형식 | 1. `/signup`에서 `email='invalid'` 입력 후 제출 | 이메일 형식 에러 메시지 표시 |
| E-12 | 비밀번호 불일치 | 1. `/signup`에서 비밀번호/확인 다르게 입력 후 제출 | "비밀번호가 일치하지 않습니다" 표시 |

### 3.4 비밀번호 재설정

| # | 시나리오 | 단계 | 예상 결과 |
|---|----------|------|-----------|
| E-13 | 재설정 이메일 요청 | 1. `/reset-password` 접속 2. 이메일 입력 3. 발송 클릭 | 성공 메시지 표시 |
| E-14 | 비밀번호 찾기 링크 | 1. `/login`에서 "비밀번호를 잊으셨나요?" 클릭 | `/reset-password`로 이동 |

### 3.5 로그아웃

| # | 시나리오 | 단계 | 예상 결과 |
|---|----------|------|-----------|
| E-15 | 수동 로그아웃 | 1. 로그인 상태 2. 로그아웃 버튼 클릭 | `/login`으로 리다이렉트 |

---

## 4. 경계 조건 / 에러 케이스

| # | 케이스 | 입력/상황 | 예상 결과 |
|---|--------|-----------|-----------|
| B-01 | 이메일 경계값 - 최소 | `a@b.c` | 유효한 이메일로 처리 |
| B-02 | 이메일 경계값 - 특수문자 | `user+tag@example.com` | 유효한 이메일로 처리 |
| B-03 | 비밀번호 경계값 - 정확히 8자 | `Abcdefg1` (8자) | 유효한 비밀번호로 처리 |
| B-04 | 비밀번호 경계값 - 7자 | `Abcdef1` (7자) | 에러: 8자 미만 |
| B-05 | XSS 시도 - 이메일 필드 | `<script>alert(1)</script>@test.com` | HTML 이스케이프 처리, Supabase가 거부 |
| B-06 | SQL Injection 시도 | `'; DROP TABLE users; --@test.com` | Supabase Auth가 안전하게 처리 |
| B-07 | 동시 로그인 시도 | 같은 계정으로 두 탭에서 동시 로그인 | 두 탭 모두 성공 (Supabase는 다중 세션 허용) |
| B-08 | 네트워크 끊김 중 제출 | 오프라인 상태에서 로그인 제출 | "네트워크 연결을 확인해주세요" 에러 |
| B-09 | 토큰 만료 후 페이지 접근 | access_token 만료 상태 | middleware에서 refresh 시도, 실패 시 `/login` 리다이렉트 |
| B-10 | 비활동 타이머 - 정확히 30분 | 30분 0초 경과 | 자동 로그아웃 실행 |
| B-11 | 비활동 타이머 - 29분 59초 | 29분 59초 경과 후 마우스 이동 | 타이머 리셋, 로그아웃 안 됨 |
| B-12 | OAuth 콜백 - error 파라미터 | `/callback?error=access_denied` | `/login?error=auth_error`로 리다이렉트 |
| B-13 | 이중 폼 제출 방지 | 로그인 버튼 빠르게 두 번 클릭 | 첫 번째 요청만 처리, 두 번째는 isLoading으로 차단 |

---

## 5. 테스트 파일 구조

```
__tests__/
  components/
    auth/
      auth-form.test.tsx          -- U-01 ~ U-12
      google-oauth-button.test.tsx -- U-13 ~ U-15
  hooks/
    use-inactivity-timeout.test.ts -- U-16 ~ U-22
  store/
    auth-store.test.ts            -- U-23 ~ U-27
  lib/
    validators/
      auth.test.ts                -- U-28 ~ U-35
  integration/
    auth/
      signup.test.tsx             -- I-01 ~ I-03
      login.test.tsx              -- I-04 ~ I-07
      oauth.test.tsx              -- I-08 ~ I-11
      reset-password.test.tsx     -- I-12 ~ I-16
      middleware.test.ts          -- I-17 ~ I-22
      auth-state.test.tsx         -- I-23 ~ I-25
  e2e/
    auth.spec.ts                  -- E-01 ~ E-15
```

## 6. Mock 설정 가이드

### Supabase Client Mock

```typescript
// __tests__/mocks/supabase.ts
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn(),
    exchangeCodeForSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))
```

### Next.js Router Mock

```typescript
const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/login',
}))
```

---

## 변경 이력

| 날짜 | 변경 내용 | 이유 |
|------|-----------|------|
| 2026-02-23 | 초안 작성 | F-01 테스트 명세 |
