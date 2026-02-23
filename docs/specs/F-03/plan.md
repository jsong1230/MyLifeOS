# F-03 PIN 잠금 — 구현 계획서

## 참조
- 설계서: docs/specs/F-03/design.md
- 인수조건: docs/project/features.md #F-03

## 전제 조건
- [ ] `public.users` 테이블에 `pin_hash`, `pin_salt`, `pin_failed_count`, `pin_locked_until` 컬럼이 존재해야 함 (system-design.md DDL 참조, F-01 Supabase 수동 선행 작업에 포함)
- [ ] F-01 구현 완료 (JWT 인증, Supabase 서버 클라이언트 사용 가능 상태)
- [ ] `bcryptjs` + `@types/bcryptjs` 패키지 설치: `npm install bcryptjs && npm install -D @types/bcryptjs`
- [ ] `hooks/` 디렉토리 생성 (없는 경우)

---

## 태스크 목록

### Phase 1: 기반 구현 (공유 유틸리티)

---

#### T-03-01: [shared] 타입 정의

- 담당: shared
- 작업 설명:
  `types/pin.ts`를 신규 생성하여 F-03 전체에서 사용하는 TypeScript 타입을 정의한다. PIN 입력 단계(PinStep), API 응답(PinApiResponse, PinVerifyResponse), 컴포넌트 prop 타입(PinPadProps, PinSetupProps, PinGuardProps, PinChangeProps, PinLockScreenProps)을 포함한다.
- 생성/수정 파일:
  - `types/pin.ts` (신규 생성)
- 완료 기준:
  - [ ] `PinStep` 유니온 타입 정의: `'input' | 'confirm' | 'current' | 'newPin'`
  - [ ] `PinApiResponse` 타입 정의: `{ success: boolean; data: { pinSet: boolean; salt: string } }`
  - [ ] `PinVerifyResponse` 타입 정의: `{ success: boolean; data: { verified: boolean; salt?: string; failedAttempts?: number; maxAttempts?: number; remainingAttempts?: number } }`
  - [ ] `PinLockResponse` 타입 정의: `{ error: string; lockedUntil: number; remainingSeconds: number }`
  - [ ] 각 컴포넌트 props 인터페이스 정의 (design.md 9절 참조)
  - [ ] TypeScript 컴파일 오류 없음

---

#### T-03-03: [shared] encryption.ts deriveKey 시그니처 수정

- 담당: shared
- 작업 설명:
  `lib/crypto/encryption.ts`의 기존 `deriveKey()` 함수에서 하드코딩된 SALT 상수를 제거하고, `salt`를 두 번째 파라미터로 받도록 시그니처를 변경한다. bcrypt에서 받은 `pin_salt`를 PBKDF2 키 파생에 재사용할 수 있게 된다. 기존 `deriveKey(pin)` 호출부가 없는지 확인하고, 있으면 함께 수정한다.
- 생성/수정 파일:
  - `lib/crypto/encryption.ts` (기존 수정)
- 완료 기준:
  - [ ] `deriveKey(pin: string, salt: string): string` 시그니처로 변경됨
  - [ ] PBKDF2 options: `keySize: 256/32`, `iterations: 100000`, `hasher: CryptoJS.algo.SHA256`
  - [ ] 하드코딩된 SALT 상수 제거 또는 주석 처리됨
  - [ ] TypeScript 컴파일 오류 없음
  - [ ] 기존 `deriveKey` 호출부가 있으면 새 시그니처에 맞게 함께 수정됨

---

#### T-03-02: [shared] pin.store.ts (Zustand + sessionStorage)

- 담당: shared
- 작업 설명:
  `store/pin.store.ts`를 신규 생성한다. design.md 8절 인터페이스를 기반으로 `isPinSet`, `isPinVerified`, `failedAttempts`, `lockedUntil`, `encryptionKey`, `isLoading` 상태와 액션을 구현한다. `SESSION_KEYS` 상수를 파일 내 정의하고, `isPinVerified`, `encryptionKey`, `failedAttempts`, `lockedUntil`은 sessionStorage에 persist한다. `isLocked()`, `getRemainingLockSeconds()` 헬퍼 메서드를 포함한다.
- 생성/수정 파일:
  - `store/pin.store.ts` (신규 생성)
- 완료 기준:
  - [ ] `SESSION_KEYS` 상수 정의: `PIN_VERIFIED`, `ENCRYPTION_KEY`, `FAILED_ATTEMPTS`, `LOCKED_UNTIL`, `LAST_HIDDEN_AT`
  - [ ] `isPinVerified`, `encryptionKey`, `failedAttempts`, `lockedUntil`이 sessionStorage에 읽기/쓰기됨
  - [ ] `isLoading`은 메모리 전용 (sessionStorage 저장 안 함)
  - [ ] `isLocked()`: `lockedUntil !== null && lockedUntil > Date.now()` 반환
  - [ ] `getRemainingLockSeconds()`: 잔여 초 반환, 잠금 아니면 0 반환
  - [ ] `resetPinVerification()`: `isPinVerified=false`, `encryptionKey=null` 설정 + sessionStorage 업데이트
  - [ ] `resetLockState()`: `failedAttempts=0`, `lockedUntil=null` 설정 + sessionStorage 업데이트
  - [ ] TypeScript 컴파일 오류 없음

---

#### T-03-04: [shared] use-pin-lock.ts 훅

- 담당: shared
- 작업 설명:
  `hooks/use-pin-lock.ts`를 신규 생성한다. `visibilitychange` 이벤트를 감지하여 앱이 백그라운드로 전환될 때 `LAST_HIDDEN_AT` 타임스탬프를 sessionStorage에 기록하고, 포그라운드 복귀 시 경과 시간이 `PIN_REENTRY_THRESHOLD_MS` (30초)를 초과하면 `pinStore.resetPinVerification()`을 호출한다. 컴포넌트 언마운트 시 이벤트 리스너를 정리한다.
- 생성/수정 파일:
  - `hooks/use-pin-lock.ts` (신규 생성)
- 완료 기준:
  - [ ] `PIN_REENTRY_THRESHOLD_MS = 30 * 1000` 상수 정의
  - [ ] `document.hidden` 시: `sessionStorage.setItem(SESSION_KEYS.LAST_HIDDEN_AT, Date.now().toString())` 실행
  - [ ] `document.visible` 시: 경과 시간 계산 후 30초 초과이면 `pinStore.resetPinVerification()` 호출
  - [ ] `visible` 처리 후 `LAST_HIDDEN_AT` sessionStorage 항목 삭제
  - [ ] 컴포넌트 언마운트 시 `removeEventListener` 정리 (useEffect cleanup)
  - [ ] TypeScript 컴파일 오류 없음

---

### Phase 2: 백엔드 구현

---

#### T-03-05: [backend] POST /api/users/pin Route Handler

- 담당: backend
- 작업 설명:
  `app/api/users/pin/route.ts`를 신규 생성한다. PIN 최초 설정 및 변경을 처리하는 POST 핸들러를 구현한다. design.md 5절 서버 로직 순서를 따른다: JWT 추출 → 유효성 검사 → 현재 pin_hash 조회 → 변경 시 기존 PIN 검증(bcrypt.compare) → 최초 설정 시 중복 확인 → bcrypt.genSalt(12) → bcrypt.hash → users 테이블 UPDATE → salt 응답 반환.
- 생성/수정 파일:
  - `app/api/users/pin/route.ts` (신규 생성)
- 완료 기준:
  - [ ] PIN 최초 설정: `pin` + `confirmPin`만 전달 시 정상 설정, salt 응답 포함
  - [ ] PIN 변경: `pin` + `confirmPin` + `currentPin` 전달 시 기존 PIN 검증 후 새 PIN으로 변경
  - [ ] PIN 미입력 또는 4-6자리 미충족 시 400 반환
  - [ ] 숫자 외 문자 포함 시 400 반환
  - [ ] `pin`과 `confirmPin` 불일치 시 400 반환
  - [ ] JWT 인증 실패 시 401 반환
  - [ ] 변경 시 기존 PIN 불일치 시 403 반환
  - [ ] 최초 설정인데 PIN 이미 존재 시 409 반환
  - [ ] 잠금 상태 시 423 반환 (`lockedUntil` 포함)
  - [ ] 서버 오류 시 500 반환
  - [ ] Supabase 서버 클라이언트(`lib/supabase/server.ts`) 사용
  - [ ] `bcryptjs`는 서버 사이드에서만 import

---

#### T-03-06: [backend] POST /api/users/pin/verify Route Handler

- 담당: backend
- 작업 설명:
  `app/api/users/pin/verify/route.ts`를 신규 생성한다. PIN 검증, 실패 횟수 관리, 잠금 처리를 구현한다. design.md 5절 서버 로직 순서: JWT 추출 → pin_hash/pin_salt/pin_failed_count/pin_locked_until 조회 → PIN 미설정 시 404 → 잠금 확인(만료 시 자동 해제) → bcrypt.compare → 성공 시 카운터 리셋 + salt 반환 → 실패 시 카운터 증가 + 5회 도달 시 10분 잠금.
- 생성/수정 파일:
  - `app/api/users/pin/verify/route.ts` (신규 생성)
- 완료 기준:
  - [ ] PIN 미설정 상태에서 요청 시 404 반환 (`pinSet: false` 포함)
  - [ ] 잠금 해제 시각이 지난 경우 자동으로 `pin_failed_count=0`, `pin_locked_until=null` 리셋
  - [ ] 잠금 중 요청 시 423 반환 (`lockedUntil`, `remainingSeconds` 포함)
  - [ ] PIN 일치 시 200 반환: `{ verified: true, salt }`, `pin_failed_count=0` UPDATE
  - [ ] PIN 불일치 시 200 반환: `{ verified: false, failedAttempts, maxAttempts: 5, remainingAttempts }`
  - [ ] 5회 실패 시 `pin_locked_until = NOW() + 10분` UPDATE 후 423 반환
  - [ ] JWT 인증 실패 시 401 반환
  - [ ] PIN 미입력 시 400 반환
  - [ ] Supabase 서버 클라이언트(`lib/supabase/server.ts`) 사용

---

### Phase 3: 프론트엔드 컴포넌트 구현

---

#### T-03-07: [frontend] PinPad 컴포넌트

- 담당: frontend
- 작업 설명:
  `components/auth/pin-pad.tsx`를 신규 생성한다. 숫자 키패드(1-9, 0, 백스페이스) + PIN 입력 도트 UI를 구현한다. design.md 9.1절 명세를 따른다. 지정 길이(`length`) 입력 완료 시 `onComplete` 콜백을 자동 호출한다.
- 생성/수정 파일:
  - `components/auth/pin-pad.tsx` (신규 생성)
- 완료 기준:
  - [ ] `PinPadProps` 인터페이스 구현: `length`, `onComplete`, `error?`, `disabled?`, `title?`, `subtitle?`
  - [ ] PIN 도트 UI: `length`개 도트, 입력된 숫자 수만큼 채워진 상태 표시
  - [ ] 키패드 레이아웃: 1-9, 빈칸, 0, 백스페이스(Delete 아이콘) 3열 그리드
  - [ ] 물리 키보드 숫자 입력 지원 (`keydown` 이벤트, `Backspace` 키 지원)
  - [ ] `length`만큼 입력 완료 시 `onComplete(pin)` 즉시 호출, 입력값 초기화
  - [ ] `navigator.vibrate(10)` 진동 피드백 (지원 환경에서만)
  - [ ] `disabled=true` 시 모든 버튼 비활성화 + 회색 처리
  - [ ] `error` prop 표시 시 빨간색 텍스트로 에러 메시지 표시
  - [ ] `Button`, `Card` (shadcn/ui), `Delete`, `Shield`, `KeyRound`, `Lock`, `AlertTriangle` (lucide-react) 아이콘 활용
  - [ ] `React.memo`로 키패드 버튼 불필요한 재렌더링 방지
  - [ ] TypeScript 컴파일 오류 없음

---

#### T-03-08: [frontend] PinSetup 컴포넌트

- 담당: frontend
- 작업 설명:
  `components/auth/pin-setup.tsx`를 신규 생성한다. 2단계(입력 → 확인) PIN 최초 설정 화면을 구현한다. design.md 9.2절 상태 머신을 따른다. API 호출 성공 후 PBKDF2 키 파생(`deriveKey(pin, salt)`)을 수행하고 `pinStore.setPinVerified(true, key)`를 호출한다.
- 생성/수정 파일:
  - `components/auth/pin-setup.tsx` (신규 생성)
- 완료 기준:
  - [ ] `PinSetupProps` 구현: `onComplete: () => void`
  - [ ] Step 1 (`input`): "PIN을 설정해주세요" 안내 + PinPad (length=6 기본값)
  - [ ] Step 2 (`confirm`): "PIN을 다시 입력해주세요" 안내 + PinPad
  - [ ] 확인 PIN 일치 시 `POST /api/users/pin` 호출 (fetch + JSON body)
  - [ ] API 성공 시: `deriveKey(pin, salt)` 호출 → `pinStore.setPinVerified(true, key)` → `onComplete()` 호출
  - [ ] 확인 PIN 불일치 시: "PIN이 일치하지 않습니다. 다시 설정해주세요" 에러 표시 + Step 1 복귀
  - [ ] API 호출 중 `pinStore.setLoading(true)` / 완료 후 `false` 설정
  - [ ] 네트워크/서버 오류 시 한국어 에러 메시지 표시
  - [ ] PBKDF2 키 파생 중 로딩 인디케이터 표시 (약 200-500ms 소요)
  - [ ] TypeScript 컴파일 오류 없음

---

#### T-03-09: [frontend] PinLockScreen 컴포넌트

- 담당: frontend
- 작업 설명:
  `components/auth/pin-lock-screen.tsx`를 신규 생성한다. PIN 5회 연속 오입력 후 표시되는 잠금 화면으로, 잠금 해제까지 남은 시간을 MM:SS 형식으로 실시간 카운트다운한다. design.md 9.5절 명세를 따른다.
- 생성/수정 파일:
  - `components/auth/pin-lock-screen.tsx` (신규 생성)
- 완료 기준:
  - [ ] `PinLockScreenProps` 구현: `lockedUntil: number`, `onUnlock: () => void`
  - [ ] Lock 아이콘(빨간색) + "PIN 5회 연속 오입력으로 앱이 잠겼습니다" 메시지 표시
  - [ ] `setInterval` 1초 간격으로 잔여 시간 MM:SS 형식 표시
  - [ ] 타이머 만료 시: `clearInterval` → `pinStore.resetLockState()` → `onUnlock()` 호출
  - [ ] 컴포넌트 언마운트 시 `clearInterval` 정리 (useEffect cleanup)
  - [ ] TypeScript 컴파일 오류 없음

---

#### T-03-10: [frontend] PinChange 컴포넌트

- 담당: frontend
- 작업 설명:
  `components/auth/pin-change.tsx`를 신규 생성한다. 설정 페이지에서 사용하는 3단계(기존 PIN 확인 → 새 PIN 입력 → 새 PIN 확인) PIN 변경 화면을 구현한다. design.md 9.4절 명세를 따른다. PIN 변경 성공 시 경고 메시지를 표시한다.
- 생성/수정 파일:
  - `components/auth/pin-change.tsx` (신규 생성)
- 완료 기준:
  - [ ] `PinChangeProps` 구현: `onComplete: () => void`, `onCancel: () => void`
  - [ ] Step 1 (`current`): "현재 PIN을 입력해주세요" + PinPad + 취소 버튼
  - [ ] Step 2 (`newPin`): "새 PIN을 입력해주세요" + PinPad
  - [ ] Step 3 (`confirm`): "새 PIN을 다시 입력해주세요" + PinPad
  - [ ] Step 3 완료 시 `POST /api/users/pin` 호출 (`currentPin`, `pin`, `confirmPin` 전달)
  - [ ] API 성공 시: `deriveKey(newPin, newSalt)` → `pinStore.setPinVerified(true, newKey)` → 경고 메시지 표시 → `onComplete()`
  - [ ] 경고 메시지: "PIN이 변경되었습니다. 기존 암호화된 데이터는 새 PIN으로 접근됩니다"
  - [ ] 기존 PIN 불일치(403) 시 "현재 PIN이 올바르지 않습니다" 에러 + Step 1 복귀
  - [ ] 취소 버튼 클릭 시 `onCancel()` 호출
  - [ ] TypeScript 컴파일 오류 없음

---

### Phase 4: 통합 컴포넌트 및 페이지 연결

---

#### T-03-11: [frontend] PinGuard 컴포넌트

- 담당: frontend
- 작업 설명:
  `components/auth/pin-guard.tsx`를 신규 생성한다. PIN 인증 상태에 따라 PinSetup / PinLockScreen / PinPad / children 중 하나를 렌더링하는 보호 래퍼 컴포넌트다. design.md 9.3절 렌더링 분기 로직을 구현한다. 마운트 시 `usePinLock` 훅을 호출하고, PIN 설정 여부를 서버에서 확인(초기 1회)한다.
- 생성/수정 파일:
  - `components/auth/pin-guard.tsx` (신규 생성)
- 완료 기준:
  - [ ] `PinGuardProps` 구현: `children: React.ReactNode`
  - [ ] 마운트 시 `usePinLock()` 훅 호출 (visibilitychange 감지 시작)
  - [ ] `isLoading=true` 시: 로딩 스피너 표시
  - [ ] `!isPinSet` 시: `PinSetup` 렌더링
  - [ ] `isPinSet && isLocked()` 시: `PinLockScreen` 렌더링
  - [ ] `isPinSet && !isPinVerified` 시: `PinPad` 렌더링 (PIN 검증 모드)
  - [ ] `isPinVerified` 시: `children` 렌더링
  - [ ] PinPad에서 PIN 입력 완료 시 `POST /api/users/pin/verify` 호출
  - [ ] 검증 성공 시: `deriveKey(pin, salt)` → `pinStore.setPinVerified(true, key)` → children 표시
  - [ ] 검증 실패 시 (3-4회): "PIN이 올바르지 않습니다 (N/5). 5회 실패 시 10분간 잠깁니다" 에러 표시
  - [ ] 검증 실패 시 (1-2회): "PIN이 올바르지 않습니다 (N/5)" 에러 표시
  - [ ] 5회 실패(423) 시: `pinStore.setLockedUntil()` 호출 → PinLockScreen으로 전환
  - [ ] 초기 마운트 시 `GET /api/users/profile`(또는 Supabase 직접 조회)로 `pin_hash` 존재 여부 확인 → `pinStore.setIsPinSet()` 설정
  - [ ] TypeScript 컴파일 오류 없음

---

#### T-03-12: [frontend] 대시보드 레이아웃 + 설정 페이지

- 담당: frontend
- 작업 설명:
  `app/(dashboard)/layout.tsx`에 `PinGuard`를 추가하여 모든 대시보드 하위 경로를 PIN 인증으로 보호한다. `app/(dashboard)/settings/page.tsx`를 신규 생성하여 `PinChange` 컴포넌트를 포함한 설정 페이지를 구현한다.
- 생성/수정 파일:
  - `app/(dashboard)/layout.tsx` (기존 수정 — PinGuard로 children 래핑)
  - `app/(dashboard)/settings/page.tsx` (신규 생성)
- 완료 기준:
  - [ ] `app/(dashboard)/layout.tsx`에서 `children`이 `<PinGuard>` 내부에 렌더링됨
  - [ ] 비인증 상태에서 대시보드 경로 접근 시 PIN 입력 화면이 표시됨
  - [ ] `app/(dashboard)/settings/page.tsx`에 `PinChange` 컴포넌트 포함
  - [ ] PIN 변경 완료 또는 취소 시 적절한 피드백 UI 표시 (성공 토스트 또는 이전 화면 복귀)
  - [ ] TypeScript 컴파일 오류 없음

---

### Phase 5: 검증

---

#### T-03-13: [shared] 통합 검증 및 quality-gate

- 담당: shared
- 작업 설명:
  F-03 인수조건 AC-01~AC-04 전체를 수동 및 자동으로 검증한다. `npm run type-check`와 `npm run build`가 오류 없이 완료되는지 확인한다.
- 완료 기준:
  - [ ] AC-01: 최초 설정 시 4-6자리 PIN 등록 (확인 입력 필수) — PinSetup 동작 확인
  - [ ] AC-02: 앱 재진입(백그라운드 복귀 포함) 시 PIN 입력 화면 표시 — 탭 전환 30초 후 PIN 화면 확인
  - [ ] AC-03: PIN 5회 연속 오입력 시 10분간 앱 잠금 및 경고 메시지 표시 — 잠금 화면 + 카운트다운 확인
  - [ ] AC-04: PIN 변경 기능 제공 (기존 PIN 확인 후 새 PIN 설정) — PinChange 3단계 동작 확인
  - [ ] `npm run type-check` 오류 없음
  - [ ] `npm run build` 오류 없음
  - [ ] 모바일(375px) 레이아웃에서 PinPad 키패드 정상 표시 확인

---

## 태스크 의존성

```
T-03-01 (타입 정의)          ──┐
T-03-03 (deriveKey 수정)     ──┼──▶ T-03-02 (pin.store)  ──┬──▶ T-03-05 (API: pin)    ──┐
T-03-04 (use-pin-lock 훅)    ──┘                            └──▶ T-03-06 (API: verify) ──┤
                                                                                           │
T-03-07 (PinPad)  ──┬──▶ T-03-08 (PinSetup)      ──┐                                    │
                    ├──▶ T-03-09 (PinLockScreen)  ──┼──▶ T-03-11 (PinGuard) ──▶ T-03-12 (레이아웃/설정)
                    └──▶ T-03-10 (PinChange)      ──┘         ▲
                                                              │
T-03-02 (pin.store)  ─────────────────────────────────────────┤
T-03-04 (use-pin-lock 훅)  ───────────────────────────────────┘

T-03-12 완료 후 ──▶ T-03-13 (통합 검증)
```

### 의존성 규칙 요약

| 태스크 | 선행 태스크 |
|--------|------------|
| T-03-02 | T-03-01, T-03-03 완료 후 시작 |
| T-03-05 | T-03-02 완료 후 시작 |
| T-03-06 | T-03-02 완료 후 시작 |
| T-03-08 | T-03-07 완료 후 시작 |
| T-03-09 | T-03-07 완료 후 시작 |
| T-03-10 | T-03-07 완료 후 시작 |
| T-03-11 | T-03-02, T-03-07, T-03-08, T-03-09, T-03-10 완료 후 시작 |
| T-03-12 | T-03-04, T-03-11 완료 후 시작 |
| T-03-13 | T-03-12 완료 후 시작 |

### 독립 실행 가능 태스크 (동시 착수 가능)
- T-03-01 (타입 정의)
- T-03-03 (deriveKey 수정)
- T-03-04 (use-pin-lock 훅)
- T-03-07 (PinPad 컴포넌트)

---

## 병렬 실행 판단

- Agent Team 권장: Yes
- 근거:
  - **그룹 A (독립 착수)**: T-03-01, T-03-03, T-03-04, T-03-07은 서로 다른 파일을 다루며 상호 의존성이 없어 4개 에이전트가 동시에 시작 가능
  - **그룹 B (A 완료 후)**: T-03-02는 T-03-01, T-03-03 완료 후 시작. T-03-08, T-03-09, T-03-10은 T-03-07 완료 후 서로 다른 컴포넌트 파일이므로 3개 에이전트 병렬 처리 가능
  - **그룹 C (B 완료 후)**: T-03-05, T-03-06은 T-03-02 완료 후 독립적인 Route Handler 파일로 2개 에이전트 병렬 처리 가능
  - **그룹 D (순차)**: T-03-11(T-03-02, T-03-07~10 의존), T-03-12(T-03-04, T-03-11 의존), T-03-13(T-03-12 의존)은 순차 처리

---

## 변경 이력

| 날짜 | 변경 내용 | 이유 |
|------|-----------|------|
| 2026-02-23 | 초안 작성 | F-03 PIN 잠금 구현 계획 수립 |
