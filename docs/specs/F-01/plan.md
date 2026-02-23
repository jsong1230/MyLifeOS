# F-01 구현 계획: 회원가입/로그인

## 참조
- 설계서: docs/specs/F-01/design.md
- 인수조건: docs/project/features.md #F-01

## 전제 조건
- [ ] Supabase 프로젝트 생성 및 환경변수 설정 (`.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] Supabase Dashboard: Google OAuth Provider 활성화 (Authentication > Providers > Google, Client ID/Secret 입력)
- [ ] Supabase Dashboard: Site URL 등록 (`http://localhost:3000`)
- [ ] Supabase Dashboard: Redirect URLs 등록 (`http://localhost:3000/callback`)
- [ ] Supabase Dashboard: Email Templates > Confirm signup redirect를 `/callback`으로 설정
- [ ] Supabase Dashboard: Email Templates > Reset password redirect를 `/reset-password/update`로 설정
- [ ] Supabase SQL Editor: `handle_new_user()` 트리거 실행 (design.md 6절 SQL 참조)
- [ ] shadcn/ui 컴포넌트 설치: `npx shadcn@latest add button input card label separator`

---

## 태스크 목록

### T-01-01: [✅] [shared] 미들웨어 및 공개 경로 설정

- 담당: shared
- 작업 설명:
  루트에 `middleware.ts`를 신규 생성하고, 기존 `lib/supabase/middleware.ts`의 공개 경로 목록에 `/callback`, `/reset-password`를 추가한다. 인증된 사용자가 공개 경로에 접근하면 `/`로 리다이렉트하고, 미인증 사용자가 보호 경로에 접근하면 `/login`으로 리다이렉트한다.
- 생성/수정 파일:
  - `middleware.ts` (신규 생성)
  - `lib/supabase/middleware.ts` (공개 경로 목록 확장)
- 완료 기준:
  - [ ] 비로그인 상태에서 `/` 접근 시 `/login`으로 리다이렉트됨
  - [ ] 로그인 상태에서 `/login` 접근 시 `/`로 리다이렉트됨
  - [ ] `/callback`, `/reset-password` 경로는 비로그인 상태에서도 접근 가능함

---

### T-01-02: [✅] [shared] Zustand auth store 확장

- 담당: shared
- 작업 설명:
  기존 `store/auth.store.ts`에 `isLoading: boolean` 상태와 `setLoading` 액션을 추가한다. 초기값은 `true`(앱 시작 시 세션 확인 중 상태)로 설정하고, `reset()` 액션에 `isLoading: false`를 포함시킨다.
- 생성/수정 파일:
  - `store/auth.store.ts` (기존 수정)
- 완료 기준:
  - [ ] `useAuthStore`에서 `isLoading`, `setLoading` 사용 가능
  - [ ] `reset()` 호출 시 `isLoading`이 `false`로 초기화됨
  - [ ] 타입스크립트 컴파일 오류 없음

---

### T-01-03: [✅] [shared] 에러 메시지 한국어 매핑 유틸리티

- 담당: shared
- 작업 설명:
  `lib/validators/auth.ts`를 신규 생성하여 이메일/비밀번호 유효성 검증 함수와 Supabase Auth 에러 메시지를 한국어로 매핑하는 `getAuthErrorMessage()` 함수를 구현한다. 설계서 11절의 에러 코드 매핑 테이블을 기준으로 작성한다.
- 생성/수정 파일:
  - `lib/validators/auth.ts` (신규 생성)
- 완료 기준:
  - [ ] `validateEmail()`, `validatePassword()`, `validateConfirmPassword()` 함수 동작 확인
  - [ ] `getAuthErrorMessage()` 함수가 알려진 에러 메시지를 한국어로 반환함
  - [ ] 알 수 없는 에러 메시지 입력 시 기본 한국어 메시지 반환함

---

### T-01-04: [frontend] 인증 레이아웃 및 공통 컴포넌트

- 담당: frontend
- 작업 설명:
  `app/(auth)/layout.tsx`를 생성하여 중앙 정렬 카드 레이아웃을 구현한다. `components/auth/auth-form.tsx`를 생성하여 `login`, `signup`, `reset` 세 가지 모드를 단일 컴포넌트로 통합 처리한다. `components/auth/google-oauth-button.tsx`를 생성하여 Google OAuth 버튼을 구현한다. shadcn/ui의 `Button`, `Input`, `Card`, `Label`, `Separator` 컴포넌트를 활용한다.
- 생성/수정 파일:
  - `app/(auth)/layout.tsx` (신규 생성)
  - `components/auth/auth-form.tsx` (신규 생성)
  - `components/auth/google-oauth-button.tsx` (신규 생성)
- 완료 기준:
  - [ ] `AuthForm`이 `mode` prop에 따라 필드/버튼 텍스트/하단 링크를 올바르게 렌더링함
  - [ ] `GoogleOAuthButton` 클릭 시 `supabase.auth.signInWithOAuth` 호출 및 로딩 상태 표시됨
  - [ ] 인증 레이아웃이 모바일(375px)에서 중앙 정렬로 정상 표시됨

---

### T-01-05: [frontend] 로그인 페이지

- 담당: frontend
- 작업 설명:
  `app/(auth)/login/page.tsx`를 생성한다. `AuthForm mode="login"`을 사용하여 이메일/비밀번호 로그인 폼을 구성한다. 로그인 성공 시 `useAuthStore.setUser()`로 상태를 업데이트하고 `router.push('/')`로 이동한다. 에러 발생 시 `getAuthErrorMessage()`로 변환한 한국어 메시지를 폼 상단에 표시한다. `GoogleOAuthButton`을 구분선 하단에 배치한다.
- 생성/수정 파일:
  - `app/(auth)/login/page.tsx` (신규 생성)
- 완료 기준:
  - [ ] 유효한 이메일/비밀번호 입력 후 로그인 성공 시 `/`로 이동함
  - [ ] 잘못된 자격증명 입력 시 한국어 에러 메시지 표시됨 (AC-03)
  - [ ] "비밀번호를 잊으셨나요?" 링크가 `/reset-password`로 이동함

---

### T-01-06: [frontend] 회원가입 페이지

- 담당: frontend
- 작업 설명:
  `app/(auth)/signup/page.tsx`를 생성한다. `AuthForm mode="signup"`을 사용하여 이메일, 비밀번호, 비밀번호 확인 폼을 구성한다. 회원가입 성공 시 폼을 숨기고 "이메일 인증을 완료해주세요" 안내 화면을 표시한다(설계서 12.4절 UI). 유효성 검사는 `lib/validators/auth.ts`의 함수를 사용한다.
- 생성/수정 파일:
  - `app/(auth)/signup/page.tsx` (신규 생성)
- 완료 기준:
  - [ ] 유효한 정보 입력 후 회원가입 성공 시 인증 이메일 안내 화면으로 전환됨 (AC-01)
  - [ ] 이미 가입된 이메일 입력 시 한국어 에러 메시지 표시됨
  - [ ] 비밀번호와 비밀번호 확인이 불일치 시 제출 전 클라이언트 검증 오류 표시됨

---

### T-01-07: [backend] OAuth 콜백 Route Handler

- 담당: backend
- 작업 설명:
  `app/(auth)/callback/route.ts`를 생성한다. GET 요청의 `code` 쿼리 파라미터를 추출하여 `supabase.auth.exchangeCodeForSession(code)`를 호출하고, 성공 시 `/`로, 실패 또는 `code` 미존재 시 `/login?error=auth_error`로 302 리다이렉트한다. Supabase 서버 클라이언트(`lib/supabase/server.ts`)를 사용한다.
- 생성/수정 파일:
  - `app/(auth)/callback/route.ts` (신규 생성)
- 완료 기준:
  - [ ] 유효한 `code` 파라미터로 요청 시 세션이 생성되고 `/`로 리다이렉트됨
  - [ ] `code` 파라미터 없는 요청 시 `/login`으로 리다이렉트됨 (AC-02)
  - [ ] `exchangeCodeForSession` 실패 시 `/login?error=auth_error`로 리다이렉트됨

---

### T-01-08: [frontend] 비밀번호 재설정 페이지

- 담당: frontend
- 작업 설명:
  `app/(auth)/reset-password/page.tsx`와 `app/(auth)/reset-password/update/page.tsx`를 각각 생성한다. 재설정 요청 페이지에서는 이메일 입력 후 `supabase.auth.resetPasswordForEmail()`을 호출하고 발송 완료 안내 메시지를 표시한다. 새 비밀번호 설정 페이지에서는 새 비밀번호, 비밀번호 확인을 입력받아 `supabase.auth.updateUser()`를 호출하고 성공 시 `/login`으로 리다이렉트한다.
- 생성/수정 파일:
  - `app/(auth)/reset-password/page.tsx` (신규 생성)
  - `app/(auth)/reset-password/update/page.tsx` (신규 생성)
- 완료 기준:
  - [ ] 유효한 이메일 입력 후 재설정 이메일 발송 성공 시 안내 메시지 표시됨 (AC-04)
  - [ ] 새 비밀번호 설정 완료 후 `/login`으로 이동함
  - [ ] "로그인으로 돌아가기" 링크가 `/login`으로 이동함

---

### T-01-09: [frontend] 30분 자동 로그아웃 훅 + 대시보드 레이아웃 적용

- 담당: frontend
- 작업 설명:
  `hooks/use-inactivity-timeout.ts`를 신규 생성한다. `mousemove`, `keydown`, `touchstart`, `click`, `scroll` 이벤트를 `{ passive: true }` 옵션으로 등록하고 1초 throttle을 적용한다. 타이머 만료 시 `supabase.auth.signOut()`, `useAuthStore.getState().reset()`, `router.push('/login?reason=inactivity')`를 순서대로 실행한다. `app/(dashboard)/layout.tsx`에서 이 훅을 한 번만 마운트한다.
- 생성/수정 파일:
  - `hooks/use-inactivity-timeout.ts` (신규 생성)
  - `app/(dashboard)/layout.tsx` (기존 수정 또는 신규 생성)
- 완료 기준:
  - [ ] 30분 비활동 후 자동으로 `/login?reason=inactivity`로 리다이렉트됨 (AC-05)
  - [ ] 사용자 이벤트(마우스/키보드 등) 발생 시 타이머가 리셋됨
  - [ ] 컴포넌트 언마운트 시 이벤트 리스너 및 타이머가 정리됨

---

## 태스크 의존성

```
T-01-01 (미들웨어)    ──┐
T-01-02 (auth store)  ──┤──▶ T-01-05 (로그인 페이지)   ──┐
T-01-03 (에러 유틸)   ──┤──▶ T-01-06 (회원가입 페이지) ──┤──▶ 통합 검증
T-01-04 (공통 컴포넌트)──┤──▶ T-01-08 (비밀번호 재설정)──┤
                         └──▶ T-01-07 (OAuth 콜백)    ──┤
                              T-01-09 (자동 로그아웃)  ──┘
```

- T-01-01, T-01-02, T-01-03은 독립 실행 가능 (순서 무관)
- T-01-04는 T-01-03 완료 후 시작 권장 (에러 유틸 import)
- T-01-05, T-01-06, T-01-08은 T-01-04 완료 후 시작 (공통 컴포넌트 의존)
- T-01-07은 T-01-01 완료 후 시작 (미들웨어/콜백 경로 연관)
- T-01-09는 T-01-02 완료 후 시작 (auth store `reset()` 사용)

## 병렬 실행 판단

- Agent Team 권장: Yes
- 근거: T-01-01~T-01-03은 설정/유틸리티 성격으로 파일 충돌 없이 병렬 처리 가능. T-01-04 완료 후 T-01-05, T-01-06, T-01-07, T-01-08도 서로 다른 파일을 생성하므로 병렬 처리 가능. T-01-07은 백엔드 Route Handler로 프론트엔드 페이지 작업과 완전 독립적.

## 검증 체크리스트 (전체 완료 기준)

- [ ] AC-01: 이메일/비밀번호 회원가입 후 인증 이메일 수신 및 계정 활성화 확인
- [ ] AC-02: Google OAuth 로그인 후 계정 생성 및 대시보드 진입 확인
- [ ] AC-03: 이메일 로그인 성공 시 JWT 세션 생성 및 `/`로 리다이렉트 확인
- [ ] AC-04: 비밀번호 재설정 이메일 수신 및 새 비밀번호 설정 후 로그인 성공 확인
- [ ] AC-05: 30분 비활동 후 자동 로그아웃 및 `/login?reason=inactivity` 이동 확인
- [ ] `public.users` 테이블에 신규 사용자 프로필 자동 생성 확인 (Trigger)
- [ ] 모바일(375px) 레이아웃 정상 표시 확인
