# F-03: PIN 잠금 -- 테스트 명세

## 참조

- 설계서: docs/specs/F-03/design.md
- 인수조건: docs/project/features.md #F-03

## 테스트 환경

| 항목 | 도구 |
|------|------|
| 단위 테스트 | Vitest + React Testing Library |
| 통합 테스트 | Vitest + React Testing Library (Supabase mock) |
| Supabase Mock | `vi.mock('@/lib/supabase/client')` / `vi.mock('@/lib/supabase/server')` |
| bcryptjs Mock | `vi.mock('bcryptjs')` (서버 테스트 시) |
| sessionStorage Mock | `vi.stubGlobal('sessionStorage', mockSessionStorage)` |

---

## 1. 단위 테스트

### 1.1 pin.store.ts (`store/pin.store.ts`)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| U-01 | 초기 상태 확인 | - | `isPinSet: false`, `isPinVerified: false`, `failedAttempts: 0`, `lockedUntil: null`, `encryptionKey: null`, `isLoading: false` |
| U-02 | setIsPinSet(true) | `setIsPinSet(true)` | `isPinSet`이 `true`로 변경 |
| U-03 | setPinVerified(true, key) | `setPinVerified(true, 'derived-key-123')` | `isPinVerified: true`, `encryptionKey: 'derived-key-123'` |
| U-04 | setPinVerified(true) -- 키 미제공 | `setPinVerified(true)` | `isPinVerified: true`, `encryptionKey: null` |
| U-05 | setFailedAttempts | `setFailedAttempts(3)` | `failedAttempts: 3` |
| U-06 | setLockedUntil | `setLockedUntil(1708700400000)` | `lockedUntil: 1708700400000` |
| U-07 | resetPinVerification | 상태 설정 후 `resetPinVerification()` | `isPinVerified: false`, `encryptionKey: null` (failedAttempts, lockedUntil 유지) |
| U-08 | resetLockState | `setFailedAttempts(5)` + `setLockedUntil(...)` 후 `resetLockState()` | `failedAttempts: 0`, `lockedUntil: null` |
| U-09 | isLocked() -- 잠금 상태 | `lockedUntil = Date.now() + 60000` | `isLocked()` 반환값 `true` |
| U-10 | isLocked() -- 잠금 해제 | `lockedUntil = Date.now() - 1000` | `isLocked()` 반환값 `false` |
| U-11 | isLocked() -- lockedUntil null | `lockedUntil = null` | `isLocked()` 반환값 `false` |
| U-12 | getRemainingLockSeconds | `lockedUntil = Date.now() + 300000` | 약 `300` 반환 (오차 +-1초) |
| U-13 | getRemainingLockSeconds -- 만료됨 | `lockedUntil = Date.now() - 1000` | `0` 반환 |
| U-14 | sessionStorage persist -- isPinVerified | `setPinVerified(true, 'key')` | sessionStorage에 `mylifeos_pin_verified: 'true'`, `mylifeos_encryption_key: 'key'` 저장 |
| U-15 | sessionStorage persist -- failedAttempts | `setFailedAttempts(3)` | sessionStorage에 `mylifeos_pin_failed_attempts: '3'` 저장 |
| U-16 | sessionStorage 복원 | sessionStorage에 값 사전 설정 후 store 초기화 | store 상태가 sessionStorage 값으로 복원됨 |

### 1.2 PinPad 컴포넌트 (`components/auth/pin-pad.tsx`)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| U-17 | 6자리 렌더링 | `length=6` | 6개의 도트 표시, 0-9 숫자 버튼 + 백스페이스 버튼 |
| U-18 | 4자리 렌더링 | `length=4` | 4개의 도트 표시 |
| U-19 | 숫자 입력 시 도트 채움 | 버튼 1, 2, 3 순서 클릭 | 3개의 도트가 채워짐 (filled 상태) |
| U-20 | 백스페이스 동작 | 3개 입력 후 백스페이스 클릭 | 2개 도트만 채워진 상태 |
| U-21 | 입력 완료 시 콜백 | `length=4`, 4개 숫자 입력 | `onComplete('1234')` 콜백 호출 |
| U-22 | 6자리 입력 완료 | `length=6`, 6개 숫자 입력 | `onComplete('123456')` 콜백 호출 |
| U-23 | 키보드 입력 지원 | keydown 이벤트 '5' | 도트 1개 채워짐 |
| U-24 | 키보드 백스페이스 | keydown 이벤트 'Backspace' | 마지막 도트 제거 |
| U-25 | 비숫자 키보드 입력 무시 | keydown 이벤트 'a' | 도트 변화 없음 |
| U-26 | disabled 상태 | `disabled=true` | 모든 버튼 disabled, 클릭 시 입력 안 됨 |
| U-27 | 에러 메시지 표시 | `error='PIN이 올바르지 않습니다'` | 에러 메시지 텍스트가 빨간색으로 표시 |
| U-28 | title 표시 | `title='PIN을 입력해주세요'` | 상단에 제목 텍스트 표시 |
| U-29 | subtitle 표시 | `subtitle='3/5 실패'` | 제목 아래 부제 텍스트 표시 |
| U-30 | 빈 상태에서 백스페이스 | 입력 없이 백스페이스 클릭 | 에러 없이 무시됨 |

### 1.3 PinSetup 컴포넌트 (`components/auth/pin-setup.tsx`)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| U-31 | 초기 렌더링 | - | "PIN을 설정해주세요" 제목 표시, PinPad 렌더링 |
| U-32 | Step 1 완료 -> Step 2 전환 | 6자리 입력 | "PIN을 다시 입력해주세요" 제목으로 변경 |
| U-33 | Step 2 확인 일치 | Step 1과 동일한 PIN 입력 | API 호출 발생 |
| U-34 | Step 2 확인 불일치 | Step 1과 다른 PIN 입력 | "PIN이 일치하지 않습니다. 다시 설정해주세요" 에러, Step 1로 복귀 |
| U-35 | API 성공 시 완료 | API mock 성공 응답 | `onComplete()` 콜백 호출 |
| U-36 | API 실패 시 에러 표시 | API mock 에러 응답 | 에러 메시지 표시, Step 1로 복귀 |

### 1.4 PinGuard 컴포넌트 (`components/auth/pin-guard.tsx`)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| U-37 | isPinVerified=true | pinStore.isPinVerified=true | children 렌더링 |
| U-38 | isPinSet=false | pinStore.isPinSet=false | PinSetup 컴포넌트 렌더링 |
| U-39 | isPinSet=true, isPinVerified=false | - | PinPad 컴포넌트 렌더링 |
| U-40 | isLocked=true | pinStore.isLocked()=true | PinLockScreen 렌더링 |
| U-41 | isLoading=true | pinStore.isLoading=true | 로딩 스피너 렌더링 |
| U-42 | PIN 검증 성공 후 전환 | PinPad에서 성공 | children으로 전환 |

### 1.5 PinLockScreen 컴포넌트 (`components/auth/pin-lock-screen.tsx`)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| U-43 | 잠금 화면 렌더링 | `lockedUntil = Date.now() + 600000` | 잠금 메시지 + 카운트다운 타이머 표시 |
| U-44 | 카운트다운 감소 | 1초 경과 (vi.advanceTimersByTime) | 타이머 값 1초 감소 |
| U-45 | 타이머 만료 | `lockedUntil` 도달 (vi.advanceTimersByTime) | `onUnlock()` 콜백 호출 |
| U-46 | MM:SS 형식 표시 | `lockedUntil = Date.now() + 542000` | "09:02" 형식으로 표시 |

### 1.6 PinChange 컴포넌트 (`components/auth/pin-change.tsx`)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| U-47 | 초기 렌더링 | - | "현재 PIN을 입력해주세요" 제목 표시 |
| U-48 | Step 1 -> Step 2 전환 | 현재 PIN 입력 | "새 PIN을 입력해주세요" 제목으로 변경 |
| U-49 | Step 2 -> Step 3 전환 | 새 PIN 입력 | "새 PIN을 다시 입력해주세요" 제목으로 변경 |
| U-50 | Step 3 확인 일치 | Step 2와 동일한 새 PIN | API 호출 발생 |
| U-51 | Step 3 확인 불일치 | Step 2와 다른 PIN | "PIN이 일치하지 않습니다" 에러, Step 2로 복귀 |
| U-52 | 취소 버튼 | 취소 클릭 | `onCancel()` 콜백 호출 |
| U-53 | API 성공 시 완료 | API mock 성공 | `onComplete()` 콜백 호출 |
| U-54 | API 실패 - 현재 PIN 불일치 | API 403 응답 | "현재 PIN이 올바르지 않습니다" 에러, Step 1로 복귀 |

### 1.7 usePinLock 훅 (`hooks/use-pin-lock.ts`)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| U-55 | visibilitychange 이벤트 리스너 등록 | 훅 마운트 | `document.addEventListener('visibilitychange', ...)` 호출됨 |
| U-56 | hidden 시 타임스탬프 기록 | `visibilitychange` -> `hidden` | sessionStorage에 `mylifeos_last_hidden_at` 저장 |
| U-57 | visible 30초 미만 복귀 | `hidden` 후 20초 경과 -> `visible` | `pinStore.resetPinVerification()` 호출 안 됨 |
| U-58 | visible 30초 이상 복귀 | `hidden` 후 31초 경과 -> `visible` | `pinStore.resetPinVerification()` 호출됨 |
| U-59 | 언마운트 시 정리 | 훅 언마운트 | `document.removeEventListener('visibilitychange', ...)` 호출됨 |
| U-60 | LAST_HIDDEN_AT 없이 visible | 직접 `visible` 이벤트 발생 | `resetPinVerification` 호출 안 됨 (에러 없음) |

### 1.8 deriveKey 함수 (`lib/crypto/encryption.ts`)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| U-61 | salt 파라미터로 키 파생 | `deriveKey('1234', 'salt-abc')` | 256-bit 키 문자열 반환 (비어있지 않음) |
| U-62 | 동일 입력 동일 출력 | `deriveKey('1234', 'salt-abc')` 두 번 호출 | 동일한 키 반환 |
| U-63 | 다른 PIN 다른 키 | `deriveKey('1234', 'salt')` vs `deriveKey('5678', 'salt')` | 서로 다른 키 반환 |
| U-64 | 다른 salt 다른 키 | `deriveKey('1234', 'salt-a')` vs `deriveKey('1234', 'salt-b')` | 서로 다른 키 반환 |

### 1.9 PIN 유효성 검증 유틸리티

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| U-65 | 유효한 4자리 PIN | `'1234'` | 통과 |
| U-66 | 유효한 6자리 PIN | `'123456'` | 통과 |
| U-67 | 3자리 PIN (미달) | `'123'` | 에러: "PIN은 4-6자리 숫자여야 합니다" |
| U-68 | 7자리 PIN (초과) | `'1234567'` | 에러: "PIN은 4-6자리 숫자여야 합니다" |
| U-69 | 문자 포함 PIN | `'12ab'` | 에러: "PIN은 숫자만 입력 가능합니다" |
| U-70 | 빈 문자열 PIN | `''` | 에러: "PIN을 입력해주세요" |
| U-71 | 특수문자 포함 | `'12#4'` | 에러: "PIN은 숫자만 입력 가능합니다" |

---

## 2. 통합 테스트 (API + Store + 컴포넌트)

### 2.1 PIN 설정 흐름 (AC-01)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| I-01 | PIN 최초 설정 성공 | `pin='123456'`, `confirmPin='123456'` | API 200, `pinStore.isPinSet=true`, `isPinVerified=true`, `encryptionKey` 존재 |
| I-02 | PIN 확인 불일치 | `pin='123456'`, `confirmPin='654321'` | API 400 또는 클라이언트 차단, 에러 메시지 표시 |
| I-03 | PIN 설정 후 sessionStorage 확인 | 설정 완료 | sessionStorage에 `pin_verified='true'`, `encryption_key` 존재 |
| I-04 | 이미 PIN 설정된 상태에서 재설정 시도 | currentPin 미제공 | API 409 "PIN이 이미 설정되어 있습니다" |

### 2.2 PIN 검증 흐름 (AC-02)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| I-05 | PIN 검증 성공 | 올바른 PIN | API 200 `verified=true`, `isPinVerified=true`, `encryptionKey` 파생됨 |
| I-06 | PIN 검증 실패 | 잘못된 PIN | API 200 `verified=false`, `failedAttempts` 증가, 에러 메시지 표시 |
| I-07 | PIN 미설정 상태에서 검증 | - | API 404, PinSetup 화면으로 전환 |
| I-08 | 앱 재진입 시 PIN 요구 | visibilitychange hidden -> visible (31초 후) | `isPinVerified=false`, PinPad 표시 |
| I-09 | 짧은 재진입은 PIN 미요구 | visibilitychange hidden -> visible (10초 후) | `isPinVerified=true` 유지, 앱 그대로 |

### 2.3 잠금 흐름 (AC-03)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| I-10 | 5회 연속 실패 시 잠금 | 5번 잘못된 PIN | API 423, PinLockScreen 표시, 카운트다운 타이머 동작 |
| I-11 | 잠금 중 PIN 입력 불가 | 잠금 상태에서 API 호출 | API 423, "잠겨 있습니다" 메시지 |
| I-12 | 잠금 해제 후 재시도 | 10분 경과 후 올바른 PIN | API 200 `verified=true`, 정상 진입 |
| I-13 | 3회 실패 후 성공 | 3번 실패 + 1번 성공 | `failedAttempts=0` 리셋, 정상 진입 |
| I-14 | 4회 실패 시 경고 메시지 | 4번 잘못된 PIN | "5회 실패 시 10분간 잠깁니다" 경고 표시 |

### 2.4 PIN 변경 흐름 (AC-04)

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| I-15 | PIN 변경 성공 | `currentPin='123456'`, `pin='654321'`, `confirmPin='654321'` | API 200, 새 salt로 키 재파생, `encryptionKey` 업데이트 |
| I-16 | 현재 PIN 불일치 | `currentPin='000000'` (잘못된 값) | API 403 "현재 PIN이 올바르지 않습니다" |
| I-17 | 새 PIN 확인 불일치 | `pin='111111'`, `confirmPin='222222'` | 클라이언트 차단, "PIN이 일치하지 않습니다" 에러 |
| I-18 | 변경 후 새 PIN으로 검증 | 변경 완료 후 재진입 시 새 PIN 입력 | 검증 성공 |
| I-19 | 잠금 상태에서 PIN 변경 시도 | 잠금 중 설정 페이지 접근 | 잠금 해제 후 시도 유도 또는 423 반환 |

### 2.5 API Route Handler (서버 사이드)

#### POST /api/users/pin

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| I-20 | JWT 미인증 요청 | Authorization 헤더 없음 | 401 `{ "error": "인증이 필요합니다" }` |
| I-21 | PIN 설정 성공 | `{ "pin": "1234", "confirmPin": "1234" }` | 200, DB에 pin_hash, pin_salt 저장됨 |
| I-22 | PIN 길이 미달 | `{ "pin": "12", "confirmPin": "12" }` | 400 `{ "error": "PIN은 4-6자리 숫자여야 합니다" }` |
| I-23 | PIN 비숫자 | `{ "pin": "abcd", "confirmPin": "abcd" }` | 400 `{ "error": "PIN은 숫자만 입력 가능합니다" }` |
| I-24 | PIN 불일치 | `{ "pin": "1234", "confirmPin": "5678" }` | 400 `{ "error": "PIN이 일치하지 않습니다" }` |
| I-25 | PIN 변경 - 기존 PIN 정확 | `{ "pin": "5678", "confirmPin": "5678", "currentPin": "1234" }` | 200, pin_hash 업데이트됨 |
| I-26 | PIN 변경 - 기존 PIN 불일치 | `{ "currentPin": "0000" }` | 403 `{ "error": "현재 PIN이 올바르지 않습니다" }` |

#### POST /api/users/pin/verify

| # | 시나리오 | 입력 | 예상 결과 |
|---|----------|------|-----------|
| I-27 | 검증 성공 | `{ "pin": "1234" }` (올바른 PIN) | 200 `{ "verified": true, "salt": "..." }` |
| I-28 | 검증 실패 | `{ "pin": "0000" }` (잘못된 PIN) | 200 `{ "verified": false, "failedAttempts": 1, "remainingAttempts": 4 }` |
| I-29 | 5회 실패 후 잠금 | 5번 연속 잘못된 PIN | 423 `{ "lockedUntil": ..., "remainingSeconds": 600 }` |
| I-30 | 잠금 중 검증 시도 | 잠금 상태에서 PIN 전송 | 423 `{ "lockedUntil": ..., "remainingSeconds": ... }` |
| I-31 | 잠금 만료 후 검증 | pin_locked_until < NOW() | 잠금 자동 해제, 정상 검증 진행 |
| I-32 | PIN 미설정 상태 | pin_hash가 null인 사용자 | 404 `{ "error": "PIN이 설정되지 않았습니다", "pinSet": false }` |
| I-33 | pin 필드 누락 | `{}` | 400 `{ "error": "PIN을 입력해주세요" }` |
| I-34 | 성공 시 failedAttempts 리셋 | 3회 실패 후 성공 | DB pin_failed_count=0 |

---

## 3. 경계 조건 / 에러 케이스

| # | 케이스 | 입력/상황 | 예상 결과 |
|---|--------|-----------|-----------|
| B-01 | PIN 경계값 - 정확히 4자리 | `'1234'` | 유효한 PIN으로 처리 |
| B-02 | PIN 경계값 - 정확히 6자리 | `'123456'` | 유효한 PIN으로 처리 |
| B-03 | PIN 경계값 - 3자리 | `'123'` | 에러: 4자리 미만 |
| B-04 | PIN 경계값 - 7자리 | `'1234567'` | 에러: 6자리 초과 |
| B-05 | 모두 같은 숫자 | `'0000'` | 유효한 PIN으로 처리 (v1에서 복잡도 미강제) |
| B-06 | 연속 숫자 | `'1234'` | 유효한 PIN으로 처리 (v1에서 복잡도 미강제) |
| B-07 | sessionStorage 비활성화 | 시크릿 모드 등 | 에러 catch 후 메모리 폴백, PIN 재입력 필요 |
| B-08 | 동시 탭 PIN 입력 | 두 탭에서 동시 검증 | 각 탭 독립적으로 검증 (sessionStorage 탭별 독립) |
| B-09 | 네트워크 끊김 중 PIN 설정 | 오프라인 상태에서 API 호출 | "네트워크 연결을 확인해주세요" 에러 |
| B-10 | 잠금 타이머 정확히 10분 | 5회 실패 즉시 | `lockedUntil = NOW + 600000ms`, 카운트다운 10:00부터 시작 |
| B-11 | 잠금 타이머 만료 직전 | 잔여 1초 | "00:01" 표시 후 1초 뒤 PinPad로 전환 |
| B-12 | 재진입 임계값 - 정확히 30초 | hidden 후 정확히 30초 경과 | PIN 재인증 요구 (30초 이상) |
| B-13 | 재진입 임계값 - 29초 | hidden 후 29초 경과 | PIN 재인증 미요구 |
| B-14 | PBKDF2 연산 시간 | 100,000 iterations | 200-500ms 내 완료 (타임아웃 없음) |
| B-15 | 페이지 새로고침 | F5 / 새로고침 | sessionStorage에서 상태 복원, isPinVerified 유지 |
| B-16 | 탭 완전 닫기 후 재접속 | 브라우저 탭 닫기 -> 새 탭 | sessionStorage 소멸, PIN 재인증 필요 |
| B-17 | visibilitychange 미지원 브라우저 | 구형 브라우저 | graceful fallback, 항상 PIN 요구 |
| B-18 | bcrypt hash 길이 검증 | `pin_hash` 필드 | bcrypt 해시 길이 60자 |
| B-19 | XSS 시도 - PIN 필드 | `'<script>'` | 숫자 아닌 입력은 클라이언트/서버 모두 거부 |
| B-20 | 동시 PIN 변경 요청 | 두 탭에서 동시 변경 | 먼저 완료된 요청 성공, 나중 요청은 기존 PIN 불일치로 403 |

---

## 4. 테스트 파일 구조

```
tests/
  unit/
    store/
      pin.store.test.ts                -- U-01 ~ U-16
    components/
      auth/
        pin-pad.test.tsx               -- U-17 ~ U-30
        pin-setup.test.tsx             -- U-31 ~ U-36
        pin-guard.test.tsx             -- U-37 ~ U-42
        pin-lock-screen.test.tsx       -- U-43 ~ U-46
        pin-change.test.tsx            -- U-47 ~ U-54
    hooks/
      use-pin-lock.test.ts             -- U-55 ~ U-60
    lib/
      crypto/
        encryption.test.ts             -- U-61 ~ U-64
      validators/
        pin.test.ts                    -- U-65 ~ U-71
  integration/
    pin/
      pin-setup.test.tsx               -- I-01 ~ I-04
      pin-verify.test.tsx              -- I-05 ~ I-09
      pin-lock.test.tsx                -- I-10 ~ I-14
      pin-change.test.tsx              -- I-15 ~ I-19
    api/
      pin-route.test.ts               -- I-20 ~ I-26
      pin-verify-route.test.ts         -- I-27 ~ I-34
```

---

## 5. Mock 설정 가이드

### 5.1 Supabase Client Mock (클라이언트 사이드)

```typescript
// tests/mocks/supabase.ts
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))
```

### 5.2 Supabase Server Client Mock (API Route)

```typescript
// tests/mocks/supabase-server.ts
const mockServerSupabase = {
  auth: {
    getUser: vi.fn(() => ({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockServerSupabase)),
}))
```

### 5.3 bcryptjs Mock

```typescript
// tests/mocks/bcryptjs.ts
vi.mock('bcryptjs', () => ({
  default: {
    genSalt: vi.fn(() => Promise.resolve('$2a$12$mock-salt')),
    hash: vi.fn(() => Promise.resolve('$2a$12$mock-hash')),
    compare: vi.fn(),
  },
  genSalt: vi.fn(() => Promise.resolve('$2a$12$mock-salt')),
  hash: vi.fn(() => Promise.resolve('$2a$12$mock-hash')),
  compare: vi.fn(),
}))
```

### 5.4 sessionStorage Mock

```typescript
// tests/mocks/session-storage.ts
function createMockSessionStorage() {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
}

// 테스트에서 사용
beforeEach(() => {
  const mockStorage = createMockSessionStorage()
  vi.stubGlobal('sessionStorage', mockStorage)
})
```

### 5.5 visibilitychange Mock

```typescript
// tests/helpers/visibility.ts
function simulateVisibilityChange(state: 'hidden' | 'visible') {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    writable: true,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}
```

### 5.6 PIN API fetch Mock

```typescript
// tests/mocks/pin-api.ts
function mockPinVerifySuccess(salt: string = 'mock-salt') {
  global.fetch = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({
        success: true,
        data: { verified: true, salt },
      }), { status: 200 })
    )
  )
}

function mockPinVerifyFailure(failedAttempts: number = 1) {
  global.fetch = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({
        success: true,
        data: {
          verified: false,
          failedAttempts,
          maxAttempts: 5,
          remainingAttempts: 5 - failedAttempts,
        },
      }), { status: 200 })
    )
  )
}

function mockPinLocked(lockedUntil: number, remainingSeconds: number) {
  global.fetch = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({
        error: 'PIN 5회 연속 오입력으로 계정이 잠겼습니다',
        lockedUntil,
        remainingSeconds,
      }), { status: 423 })
    )
  )
}
```

---

## 6. 인수조건 매핑

| 인수조건 | 테스트 커버리지 |
|----------|----------------|
| AC-01: 최초 PIN 등록 (4-6자리, 확인 입력 필수) | U-31~U-36, I-01~I-04, U-65~U-71, B-01~B-06 |
| AC-02: 앱 재진입 시 PIN 입력 화면 | U-37~U-42, U-55~U-60, I-05~I-09, B-12~B-16 |
| AC-03: 5회 오입력 시 10분 잠금 | U-43~U-46, I-10~I-14, I-29~I-31, B-10~B-11 |
| AC-04: PIN 변경 (기존 확인 후) | U-47~U-54, I-15~I-19, I-25~I-26, B-20 |

---

## 변경 이력

| 날짜 | 변경 내용 | 이유 |
|------|-----------|------|
| 2026-02-23 | 초안 작성 | F-03 PIN 잠금 테스트 명세 |
