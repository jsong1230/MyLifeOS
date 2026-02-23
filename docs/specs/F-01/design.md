# F-01: 회원가입/로그인 -- 기술 설계서

## 1. 참조

- 인수조건: docs/project/features.md #F-01
- 시스템 설계: docs/system/system-design.md (4. 인증 & 보안 설계)

## 2. 구현 범위

### 포함

| 항목 | AC 매핑 |
|------|---------|
| 이메일+비밀번호 회원가입 + 인증 이메일 발송 | AC-01 |
| Google OAuth 소셜 로그인 | AC-02 |
| JWT 세션 생성 + 대시보드 리다이렉트 | AC-03 |
| 이메일 기반 비밀번호 재설정 | AC-04 |
| 30분 비활동 자동 로그아웃 | AC-05 |
| Next.js middleware 기반 보호 경로 | AC-03 |
| `auth.store.ts` 확장 (isLoading 추가) | AC-03 |
| Supabase Auth 프로필 동기화 (public.users 자동 생성) | AC-01, AC-02 |

### 제외

| 항목 | 사유 |
|------|------|
| PIN 잠금 (F-03) | 별도 기능으로 분리, Phase 0 PG-0A에서 병렬 구현 |
| 이메일 인증 재발송 UI | v1에서는 Supabase 기본 이메일만 사용 |
| 소셜 로그인 추가 제공자 (Apple, Kakao 등) | v1은 Google만 지원 |
| 프로필 편집 (이름, 타임존) | F-02 또는 Settings에서 구현 |

## 3. 아키텍처 결정

### 결정 1: 인증 라이브러리 선택

- **선택지**: A) `@supabase/ssr` / B) `@supabase/auth-helpers-nextjs` (deprecated)
- **결정**: A) `@supabase/ssr`
- **근거**: 프로젝트에 이미 `@supabase/ssr` v0.8.0이 설치되어 있고, `lib/supabase/client.ts`와 `server.ts`가 이 패키지 기반으로 구성됨. `auth-helpers`는 deprecated 상태.

### 결정 2: OAuth 콜백 경로 위치

- **선택지**: A) `app/(auth)/callback/route.ts` / B) `app/api/auth/callback/route.ts`
- **결정**: A) `app/(auth)/callback/route.ts`
- **근거**: system-design.md 디렉토리 구조에서 `(auth)` 라우트 그룹 내 `callback/route.ts`로 정의되어 있음. OAuth 콜백은 API가 아닌 인증 플로우의 일부이므로 `(auth)` 그룹이 적합.

### 결정 3: 미들웨어 파일명

- **선택지**: A) `middleware.ts` (루트) / B) `proxy.ts` (루트)
- **결정**: A) `middleware.ts` (루트)
- **근거**: Next.js는 루트의 `middleware.ts`만 자동 인식함. 시스템 설계서에 `proxy.ts`로 언급되어 있으나, 이는 명명 의도이며 실제 파일명은 `middleware.ts`여야 함. 내부에서 `lib/supabase/middleware.ts`의 `updateSession()`을 호출하는 구조 유지.

### 결정 4: 비활동 감지 구현 위치

- **선택지**: A) 글로벌 Provider에서 훅 실행 / B) 각 보호 페이지에서 개별 실행
- **결정**: A) 글로벌 Provider에서 훅 실행
- **근거**: 30분 비활동 타임아웃은 앱 전체에 적용되어야 함. `(dashboard)` 레이아웃 또는 루트 레이아웃의 Provider에서 `useInactivityTimeout` 훅을 한 번만 마운트하여 모든 보호 경로에 일괄 적용.

### 결정 5: public.users 자동 생성 방식

- **선택지**: A) Supabase Database Trigger / B) OAuth 콜백에서 수동 INSERT / C) 첫 로그인 시 클라이언트에서 upsert
- **결정**: A) Supabase Database Trigger
- **근거**: `auth.users`에 새 레코드가 삽입될 때 자동으로 `public.users`에 프로필 행을 생성하는 Trigger를 설정. 이메일과 OAuth 모두 동일하게 동작하며, 클라이언트 로직 분산을 방지.

### 결정 6: 폼 유효성 검사

- **선택지**: A) zod + react-hook-form / B) 네이티브 HTML validation + 커스텀 검증 함수
- **결정**: B) 네이티브 HTML validation + 커스텀 검증 함수
- **근거**: F-01은 이메일/비밀번호 2개 필드만 검증하므로 react-hook-form 도입은 과도. 이후 F-05, F-08 등 복잡한 폼에서 필요 시 도입. 현재 package.json에 zod/react-hook-form 미설치 상태.

## 4. 파일 구조

```
app/
  (auth)/
    layout.tsx              -- 인증 전용 레이아웃 (센터 정렬 카드)
    login/
      page.tsx              -- 로그인 페이지
    signup/
      page.tsx              -- 회원가입 페이지
    callback/
      route.ts              -- OAuth 콜백 Route Handler
    reset-password/
      page.tsx              -- 비밀번호 재설정 이메일 요청
      update/
        page.tsx            -- 새 비밀번호 입력
  (dashboard)/
    layout.tsx              -- 대시보드 레이아웃 (InactivityProvider 포함)
components/
  auth/
    auth-form.tsx           -- 공통 인증 폼 (login/signup/reset 모드)
    google-oauth-button.tsx -- Google OAuth 버튼
hooks/
  use-inactivity-timeout.ts -- 30분 비활동 감지 훅
store/
  auth.store.ts             -- (기존 확장) isLoading, setLoading 추가
lib/
  supabase/
    middleware.ts            -- (기존 수정) 공개 경로 목록 확장
  validators/
    auth.ts                 -- 이메일/비밀번호 유효성 검증 함수
middleware.ts               -- (신규) 루트 미들웨어
```

### 신규 생성 파일 (10개)

| 파일 | 목적 |
|------|------|
| `app/(auth)/layout.tsx` | 인증 페이지 공통 레이아웃 |
| `app/(auth)/login/page.tsx` | 로그인 페이지 |
| `app/(auth)/signup/page.tsx` | 회원가입 페이지 |
| `app/(auth)/callback/route.ts` | OAuth 콜백 처리 |
| `app/(auth)/reset-password/page.tsx` | 비밀번호 재설정 요청 |
| `app/(auth)/reset-password/update/page.tsx` | 새 비밀번호 설정 |
| `components/auth/auth-form.tsx` | 공통 인증 폼 컴포넌트 |
| `components/auth/google-oauth-button.tsx` | Google OAuth 버튼 |
| `hooks/use-inactivity-timeout.ts` | 비활동 감지 커스텀 훅 |
| `middleware.ts` | Next.js 루트 미들웨어 |

### 기존 수정 파일 (3개)

| 파일 | 변경 내용 |
|------|-----------|
| `store/auth.store.ts` | `isLoading`, `setLoading` 속성 추가 |
| `lib/supabase/middleware.ts` | 공개 경로에 `/reset-password`, `/callback` 추가 |
| `app/layout.tsx` | QueryClientProvider, AuthStateListener 래핑 (향후 확장 준비) |

## 5. API 설계

F-01은 Supabase Auth SDK를 직접 호출하므로 별도의 Route Handler API는 OAuth 콜백 1개만 존재.

### GET /callback (OAuth 콜백)

- **파일**: `app/(auth)/callback/route.ts`
- **목적**: Google OAuth 인증 완료 후 code를 세션으로 교환
- **인증**: 불필요 (인증 과정 자체)
- **Query Parameters**: `code` (string, Supabase가 자동 부여)
- **Response**: `302 Redirect` to `/`
- **에러 케이스**:

| 상황 | 처리 |
|------|------|
| `code` 파라미터 없음 | `/login`으로 리다이렉트 |
| `exchangeCodeForSession` 실패 | `/login?error=auth_error`로 리다이렉트 |

### Supabase Auth SDK 호출 목록

| 함수 | 사용 위치 | 목적 |
|------|-----------|------|
| `supabase.auth.signUp({ email, password })` | signup/page.tsx | 이메일 회원가입 |
| `supabase.auth.signInWithPassword({ email, password })` | login/page.tsx | 이메일 로그인 |
| `supabase.auth.signInWithOAuth({ provider: 'google' })` | google-oauth-button.tsx | Google OAuth |
| `supabase.auth.resetPasswordForEmail(email)` | reset-password/page.tsx | 비밀번호 재설정 이메일 |
| `supabase.auth.updateUser({ password })` | reset-password/update/page.tsx | 새 비밀번호 설정 |
| `supabase.auth.signOut()` | use-inactivity-timeout.ts, 헤더 로그아웃 | 로그아웃 |
| `supabase.auth.getUser()` | middleware.ts | 인증 상태 확인 |
| `supabase.auth.onAuthStateChange()` | AuthStateListener | 세션 변경 감지 |
| `supabase.auth.exchangeCodeForSession(code)` | callback/route.ts | OAuth 코드 교환 |

## 6. DB 설계

### 기존 테이블 활용: `public.users`

F-01에서는 새 테이블을 생성하지 않음. 기존 `public.users` 테이블을 그대로 사용.

```sql
-- 이미 정의된 users 테이블 (system-design.md 참조)
-- F-01에서 사용하는 컬럼: id, email, name, created_at
-- F-03(PIN)에서 사용하는 컬럼: pin_hash, pin_salt, pin_failed_count, pin_locked_until
```

### Supabase Database Trigger (신규)

회원가입 시 `auth.users`에 레코드가 생성되면 `public.users`에 자동으로 프로필 행을 생성하는 트리거.

```sql
-- auth.users 신규 생성 시 public.users에 프로필 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**참고**: Google OAuth 사용자의 경우 `raw_user_meta_data`에 `full_name`이 포함되어 이름이 자동 설정됨.

## 7. 인증 흐름 상세

### 7.1 이메일 회원가입 흐름 (AC-01)

```
사용자                  signup/page.tsx         Supabase Auth         이메일
  |                          |                       |                  |
  |-- 이메일/비밀번호 입력 -->|                       |                  |
  |                          |-- signUp() ---------->|                  |
  |                          |                       |-- 인증메일 발송 ->|
  |                          |<-- { user, session } -|                  |
  |<-- "인증 이메일 확인" ----|                       |                  |
  |                          |                       |                  |
  |  [이메일 링크 클릭] ------|---------------------->|                  |
  |                          |                       |-- 계정 활성화    |
  |<-------- /callback 리다이렉트 --------------------|                  |
  |                          |                       |                  |
  callback/route.ts          |                       |                  |
  |-- exchangeCodeForSession -->                     |                  |
  |-- 302 Redirect / ------->|                       |                  |
```

**세부 사항**:
- `signUp()` 호출 시 Supabase가 자동으로 인증 이메일 발송
- 이메일 미인증 상태에서는 로그인 불가 (Supabase Auth가 자동 차단)
- 회원가입 직후 "이메일 인증을 완료해주세요" 안내 메시지 표시
- 이메일 인증 링크의 redirect URL은 Supabase Dashboard에서 `/callback`으로 설정

### 7.2 Google OAuth 흐름 (AC-02)

```
사용자         google-oauth-button.tsx    Supabase Auth    Google    callback/route.ts
  |                    |                       |             |              |
  |-- 버튼 클릭 ------>|                       |             |              |
  |                    |-- signInWithOAuth() -->|             |              |
  |<--- 302 Redirect to Google OAuth URL ------|             |              |
  |-------------------------------------------------->       |              |
  |                    |                       |<-- code ----|              |
  |<------ /callback?code=xxx 리다이렉트 ------|             |              |
  |                    |                       |             |              |
  |---------------------------------------------------------------->       |
  |                    |                       |             |   exchangeCodeForSession
  |                    |                       |             |   세션 저장 (쿠키)
  |<------- 302 Redirect / ----------------------------------------|
```

**세부 사항**:
- `signInWithOAuth` 호출 시 `redirectTo` 옵션으로 `${origin}/callback` 지정
- Google OAuth scope: `email`, `profile` (Supabase 기본값)
- 최초 OAuth 로그인 시 `auth.users` 자동 생성 -> Trigger로 `public.users` 자동 생성

### 7.3 이메일 로그인 흐름 (AC-03)

```
사용자                 login/page.tsx        Supabase Auth     middleware.ts
  |                         |                      |                |
  |-- 이메일/비밀번호 입력 ->|                      |                |
  |                         |-- signInWithPassword -->              |
  |                         |<-- { user, session } -|              |
  |                         |-- useAuthStore.setUser(user)         |
  |                         |-- router.push('/') -->               |
  |                         |                      |                |
  |  [이후 모든 요청] -------|--------------------->|-- getUser() -->|
  |                         |                      |  JWT 검증      |
  |                         |                      |<-- user -------|
  |<-- 페이지 렌더링 --------|                      |                |
```

### 7.4 비밀번호 재설정 흐름 (AC-04)

```
사용자              reset-password/page.tsx     Supabase Auth     이메일
  |                         |                        |              |
  |-- 이메일 입력 ---------->|                        |              |
  |                         |-- resetPasswordForEmail -->           |
  |                         |                        |-- 재설정메일 ->|
  |<-- "이메일 확인" --------|                        |              |
  |                         |                        |              |
  |  [이메일 링크 클릭]      |                        |              |
  |-----------> /reset-password/update (토큰 포함)    |              |
  |                         |                        |              |
  reset-password/update/page.tsx                     |              |
  |-- 새 비밀번호 입력 ----->|                        |              |
  |                         |-- updateUser({ password }) -->        |
  |                         |<-- 성공 ------------------|              |
  |<-- "변경 완료" + /login 리다이렉트 ---|           |              |
```

**세부 사항**:
- `resetPasswordForEmail()` 호출 시 Supabase가 `type=recovery` 링크를 이메일로 발송
- 재설정 링크는 `/reset-password/update`로 리다이렉트 (Supabase Dashboard에서 설정)
- 링크 클릭 시 Supabase가 자동으로 임시 세션을 생성하므로 `updateUser()` 호출 가능
- 비밀번호 변경 완료 후 `/login`으로 리다이렉트

### 7.5 30분 자동 로그아웃 흐름 (AC-05)

```
사용자                  useInactivityTimeout       Supabase Auth
  |                           |                         |
  |  [앱 활성 상태]            |                         |
  |                           |-- 타이머 시작 (30분) ----|
  |                           |                         |
  |-- mousemove/keydown/etc -->|                         |
  |                           |-- 타이머 리셋 ----------|
  |                           |                         |
  |  [30분 비활동]             |                         |
  |                           |-- 타이머 만료 ----------|
  |                           |-- signOut() ----------->|
  |                           |-- useAuthStore.reset() -|
  |<-- /login 리다이렉트 ------|                         |
```

## 8. 세션 관리 상세

### 8.1 middleware.ts (루트 미들웨어)

```typescript
// middleware.ts
import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 8.2 lib/supabase/middleware.ts 수정

기존 코드의 공개 경로 목록에 `/reset-password`와 `/callback` 추가.

```typescript
// 변경 전
if (
  !user &&
  !request.nextUrl.pathname.startsWith('/login') &&
  !request.nextUrl.pathname.startsWith('/signup')
)

// 변경 후
const publicPaths = ['/login', '/signup', '/callback', '/reset-password']
const isPublicPath = publicPaths.some(path =>
  request.nextUrl.pathname.startsWith(path)
)

if (!user && !isPublicPath) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

// 인증 상태에서 공개 경로 접근 시 대시보드로 리다이렉트
if (user && isPublicPath && !request.nextUrl.pathname.startsWith('/callback')) {
  const url = request.nextUrl.clone()
  url.pathname = '/'
  return NextResponse.redirect(url)
}
```

### 8.3 경로 보호 정책

| 경로 패턴 | 접근 정책 | 미인증 시 |
|-----------|-----------|-----------|
| `/login` | 공개 (인증 시 `/`로 리다이렉트) | 허용 |
| `/signup` | 공개 (인증 시 `/`로 리다이렉트) | 허용 |
| `/callback` | 공개 (OAuth 처리용) | 허용 |
| `/reset-password` | 공개 | 허용 |
| `/reset-password/update` | 공개 (임시 세션 필요) | 허용 |
| `/*` (그 외 전체) | 보호 | `/login`으로 리다이렉트 |

## 9. Zustand Store 확장

### auth.store.ts

```typescript
import { create } from 'zustand'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  isLoading: boolean        // 추가: 인증 상태 로딩 중 여부
  isPinVerified: boolean
  encryptionKey: string | null
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void    // 추가
  setPinVerified: (verified: boolean, key?: string) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,          // 초기값 true (앱 시작 시 세션 확인 중)
  isPinVerified: false,
  encryptionKey: null,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setPinVerified: (verified, key) =>
    set({ isPinVerified: verified, encryptionKey: key ?? null }),
  reset: () => set({
    user: null,
    isLoading: false,
    isPinVerified: false,
    encryptionKey: null,
  }),
}))
```

**변경 사항**:
- `isLoading: boolean` 추가 -- 앱 초기 로딩 시 세션 확인 완료 전까지 스플래시/로딩 표시용
- `setLoading` 액션 추가
- `reset()`에 `isLoading: false` 포함

## 10. 핵심 컴포넌트 명세

### 10.1 AuthForm (`components/auth/auth-form.tsx`)

**역할**: 로그인, 회원가입, 비밀번호 재설정 폼을 단일 컴포넌트로 통합.

```typescript
interface AuthFormProps {
  mode: 'login' | 'signup' | 'reset'
  onSubmit: (data: AuthFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

interface AuthFormData {
  email: string
  password?: string          // reset 모드에서는 불필요
  confirmPassword?: string   // signup 모드에서만 사용
}
```

**렌더링 분기**:

| mode | 필드 | 제출 버튼 텍스트 | 하단 링크 |
|------|------|-----------------|-----------|
| `login` | 이메일, 비밀번호 | "로그인" | "회원가입" / "비밀번호 찾기" |
| `signup` | 이메일, 비밀번호, 비밀번호 확인 | "회원가입" | "이미 계정이 있으신가요?" |
| `reset` | 이메일 | "재설정 이메일 발송" | "로그인으로 돌아가기" |

**유효성 검사 규칙**:

| 필드 | 규칙 |
|------|------|
| 이메일 | 필수, 이메일 형식 (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) |
| 비밀번호 | 필수, 최소 8자, 영문+숫자 조합 |
| 비밀번호 확인 | signup 모드 전용, 비밀번호와 일치 |

### 10.2 GoogleOAuthButton (`components/auth/google-oauth-button.tsx`)

```typescript
interface GoogleOAuthButtonProps {
  className?: string
}
```

**동작**:
1. 클릭 시 `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })` 호출
2. 로딩 상태 표시 (구글 아이콘 + "Google로 계속하기" 텍스트)
3. `redirectTo`는 `window.location.origin + '/callback'`

### 10.3 useInactivityTimeout (`hooks/use-inactivity-timeout.ts`)

```typescript
function useInactivityTimeout(timeoutMs: number = 30 * 60 * 1000): void
```

**동작 로직**:
1. `mousemove`, `keydown`, `touchstart`, `click`, `scroll` 이벤트 리스너 등록
2. 이벤트 발생 시 `setTimeout` 리셋
3. 타이머 만료 시:
   - `supabase.auth.signOut()` 호출
   - `useAuthStore.getState().reset()` 호출
   - `router.push('/login?reason=inactivity')` 실행
4. 컴포넌트 언마운트 시 이벤트 리스너 및 타이머 정리

**사용 위치**: `app/(dashboard)/layout.tsx`에서 한 번만 호출.

**주의사항**:
- 이벤트 리스너는 `passive: true` 옵션으로 등록하여 스크롤 성능 영향 방지
- `throttle` 적용: 이벤트 핸들러를 1초 간격으로 throttle하여 과도한 타이머 리셋 방지
- 탭 비활성(visibilitychange) 시에도 타이머 유지

### 10.4 (auth)/layout.tsx

```typescript
// 서버 컴포넌트
export default function AuthLayout({ children }: { children: React.ReactNode })
```

**렌더링 구조**:
```
<div className="min-h-screen flex items-center justify-center bg-gray-50">
  <div className="w-full max-w-sm px-4">
    <div className="text-center mb-8">
      {/* 로고 + 앱명 */}
    </div>
    <Card>
      {children}
    </Card>
  </div>
</div>
```

## 11. 에러 처리

### Supabase Auth 에러 코드 매핑

| Supabase 에러 메시지 | 사용자 표시 메시지 | 발생 상황 |
|---------------------|-------------------|-----------|
| `Invalid login credentials` | "이메일 또는 비밀번호가 올바르지 않습니다" | 로그인 실패 |
| `Email not confirmed` | "이메일 인증을 완료해주세요. 메일함을 확인하세요" | 미인증 이메일로 로그인 시도 |
| `User already registered` | "이미 가입된 이메일입니다. 로그인해주세요" | 중복 이메일 회원가입 |
| `Password should be at least 6 characters` | "비밀번호는 최소 8자 이상이어야 합니다" | 짧은 비밀번호 |
| `For security purposes, you can only request this once every 60 seconds` | "잠시 후 다시 시도해주세요 (1분 제한)" | 이메일 재발송 rate limit |
| Network error / timeout | "네트워크 연결을 확인해주세요" | 네트워크 오류 |
| 기타 | "일시적인 오류가 발생했습니다. 다시 시도해주세요" | 알 수 없는 오류 |

### 에러 처리 유틸리티

```typescript
// lib/validators/auth.ts
export function getAuthErrorMessage(error: AuthError): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다',
    'Email not confirmed': '이메일 인증을 완료해주세요. 메일함을 확인하세요',
    'User already registered': '이미 가입된 이메일입니다. 로그인해주세요',
    // ...
  }
  return errorMap[error.message] ?? '일시적인 오류가 발생했습니다. 다시 시도해주세요'
}
```

## 12. UI 설계

### 12.1 공통 레이아웃

- **배경**: `bg-gray-50` (전체 화면)
- **카드**: `max-w-sm`, 중앙 정렬, `rounded-lg shadow-sm`
- **상단**: 앱 로고(아이콘) + "My Life OS" 텍스트 (text-2xl font-bold)
- **모바일 우선**: 전체 너비 사용, 패딩 `px-4`

### 12.2 로그인 페이지 (`/login`)

```
+----------------------------------+
|          [Logo Icon]             |
|          My Life OS              |
|                                  |
|  +----------------------------+  |
|  | 이메일                     |  |
|  | [input]                    |  |
|  |                            |  |
|  | 비밀번호                   |  |
|  | [input]                    |  |
|  |                            |  |
|  |  [    로그인 버튼     ]    |  |
|  |                            |  |
|  |  -------- 또는 --------   |  |
|  |                            |  |
|  |  [G  Google로 계속하기]    |  |
|  |                            |  |
|  |  비밀번호를 잊으셨나요?     |  |
|  |  계정이 없으신가요? 가입    |  |
|  +----------------------------+  |
+----------------------------------+
```

### 12.3 회원가입 페이지 (`/signup`)

```
+----------------------------------+
|          [Logo Icon]             |
|          My Life OS              |
|                                  |
|  +----------------------------+  |
|  | 이메일                     |  |
|  | [input]                    |  |
|  |                            |  |
|  | 비밀번호                   |  |
|  | [input]                    |  |
|  |                            |  |
|  | 비밀번호 확인              |  |
|  | [input]                    |  |
|  |                            |  |
|  |  [    회원가입 버튼    ]   |  |
|  |                            |  |
|  |  -------- 또는 --------   |  |
|  |                            |  |
|  |  [G  Google로 계속하기]    |  |
|  |                            |  |
|  |  이미 계정이 있으신가요?    |  |
|  |  로그인                    |  |
|  +----------------------------+  |
+----------------------------------+
```

### 12.4 회원가입 완료 안내

회원가입 성공 후 동일 페이지에서 폼을 숨기고 안내 메시지 표시:

```
+----------------------------------+
|          [메일 아이콘]            |
|    이메일 인증을 완료해주세요      |
|                                   |
|  {email}으로 인증 이메일을         |
|  발송했습니다.                     |
|  이메일의 링크를 클릭하여          |
|  계정을 활성화해주세요.            |
|                                   |
|  [  로그인 페이지로 이동  ]       |
+----------------------------------+
```

### 12.5 비밀번호 재설정 (`/reset-password`)

```
+----------------------------------+
|          [Logo Icon]             |
|       비밀번호 재설정             |
|                                  |
|  +----------------------------+  |
|  | 가입한 이메일 주소          |  |
|  | [input]                    |  |
|  |                            |  |
|  |  [  재설정 이메일 발송  ]  |  |
|  |                            |  |
|  |  로그인으로 돌아가기        |  |
|  +----------------------------+  |
+----------------------------------+
```

### 12.6 새 비밀번호 설정 (`/reset-password/update`)

```
+----------------------------------+
|          [Logo Icon]             |
|       새 비밀번호 설정            |
|                                  |
|  +----------------------------+  |
|  | 새 비밀번호                 |  |
|  | [input]                    |  |
|  |                            |  |
|  | 새 비밀번호 확인            |  |
|  | [input]                    |  |
|  |                            |  |
|  |  [  비밀번호 변경  ]       |  |
|  +----------------------------+  |
+----------------------------------+
```

### 12.7 사용할 shadcn/ui 컴포넌트

구현 전 아래 컴포넌트를 설치해야 함:

```bash
npx shadcn@latest add button input card label separator
```

| 컴포넌트 | 용도 |
|----------|------|
| `Button` | 제출 버튼, Google OAuth 버튼 |
| `Input` | 이메일, 비밀번호 입력 |
| `Card`, `CardHeader`, `CardContent`, `CardFooter` | 폼 감싸기 |
| `Label` | 입력 필드 라벨 |
| `Separator` | "또는" 구분선 |

## 13. Supabase 설정 사항

Supabase Dashboard에서 아래 항목을 수동 설정해야 함 (코드 외 작업):

| 설정 항목 | 위치 | 값 |
|-----------|------|-----|
| Google OAuth Provider 활성화 | Authentication > Providers > Google | Client ID/Secret 입력 |
| Site URL | Authentication > URL Configuration | `https://{domain}` 또는 `http://localhost:3000` |
| Redirect URLs | Authentication > URL Configuration | `http://localhost:3000/callback`, `https://{domain}/callback` |
| Email 인증 Redirect | Authentication > Email Templates > Confirm signup | `/callback` |
| Password Recovery Redirect | Authentication > Email Templates > Reset password | `/reset-password/update` |
| Database Trigger | SQL Editor | `handle_new_user()` 트리거 실행 |

## 14. 성능 설계

### 14.1 미들웨어 최적화

- `matcher` 설정으로 정적 파일(이미지, 폰트, SW) 요청은 미들웨어 바이패스
- `getUser()` 호출은 Supabase SDK가 내부적으로 JWT 검증만 수행 (DB 조회 없음)

### 14.2 비활동 감지 최적화

- 이벤트 리스너: `{ passive: true }` 옵션으로 메인 스레드 블로킹 방지
- throttle: 이벤트 핸들러를 1초 간격으로 제한하여 불필요한 타이머 리셋 최소화
- 단일 `setTimeout` 사용 (setInterval 대비 메모리 효율적)

### 14.3 번들 사이즈

- `@supabase/ssr`은 이미 설치되어 있으므로 추가 번들 증가 없음
- `lucide-react`에서 아이콘 tree-shaking 적용 (개별 import)

## 15. 환경 변수

`.env.local`에 필요한 변수 (`.env.example`에 기록):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

추가 환경변수 불필요 (Google OAuth 설정은 Supabase Dashboard에서 관리).

---

## 변경 이력

| 날짜 | 변경 내용 | 이유 |
|------|-----------|------|
| 2026-02-23 | 초안 작성 | F-01 기능 설계 |
