# F-03: PIN 잠금 -- 기술 설계서

## 1. 참조

- 인수조건: docs/project/features.md #F-03
- 시스템 설계: docs/system/system-design.md (4.4 PIN 잠금 구현 방식, 4.6 PBKDF2 키 파생 방식)
- 관련 설계: docs/specs/F-01/design.md (인증 흐름, auth.store.ts 구조)

## 2. 구현 범위

### 포함

| 항목 | AC 매핑 |
|------|---------|
| 4-6자리 PIN 등록 (확인 입력 포함) | AC-01 |
| 앱 재진입/백그라운드 복귀 시 PIN 입력 화면 표시 | AC-02 |
| PIN 5회 연속 오입력 시 10분간 앱 잠금 + 경고 메시지 | AC-03 |
| PIN 변경 (기존 PIN 확인 후 새 PIN 설정) | AC-04 |
| PIN 해시 서버 저장 (bcryptjs) | AC-01 |
| PBKDF2 키 파생 + sessionStorage 보관 | AC-01, AC-02 |
| pin-store.ts (Zustand + sessionStorage persist) | AC-01 ~ AC-04 |
| PinPad / PinSetup / PinGuard 컴포넌트 | AC-01 ~ AC-04 |
| POST /api/users/pin (설정/변경) | AC-01, AC-04 |
| POST /api/users/pin/verify (검증) | AC-02, AC-03 |
| usePinLock 커스텀 훅 (visibilitychange 감지) | AC-02 |

### 제외

| 항목 | 사유 |
|------|------|
| /private 경로 전용 PIN 잠금 (F-18) | 별도 기능, Phase 5에서 구현 |
| PIN 분실 복구 (이메일 기반 재설정) | v1에서 미지원, PIN 분실 시 재설정 안내만 제공 |
| 생체인증 (Face ID / Touch ID) | v1 범위 외 |
| PIN 복잡도 요구사항 (연속 숫자 금지 등) | v1에서는 길이 검증만 적용 |

## 3. 아키텍처 결정

### 결정 1: PIN 해싱 라이브러리

- **선택지**: A) bcryptjs (서버 사이드) / B) crypto-js SHA-256 (클라이언트 사이드)
- **결정**: A) bcryptjs (서버 사이드)
- **근거**: system-design.md 4.4절에 "서버: `users.pin_hash` = bcrypt(PIN + salt)" 명시. bcrypt는 salt 내장 + adaptive cost factor를 지원하여 PIN처럼 짧은 입력에 대한 brute-force 공격 방어에 적합. 클라이언트에서 PIN을 HTTPS로 서버에 전송하고 서버에서 해시 비교.

### 결정 2: 잠금 상태 관리 위치

- **선택지**: A) 서버 DB만 (pin_failed_count, pin_locked_until) / B) 클라이언트 sessionStorage만 / C) 서버 + 클라이언트 이중 관리
- **결정**: C) 서버 + 클라이언트 이중 관리
- **근거**: 서버 DB에 `pin_failed_count`와 `pin_locked_until`을 저장하여 다른 디바이스/탭에서도 잠금 상태를 일관되게 유지. 클라이언트 sessionStorage에도 `failedAttempts`와 `lockedUntil`을 캐시하여 불필요한 API 호출을 방지. PIN 검증 API 응답에 잠금 상태를 포함하여 동기화.

### 결정 3: 앱 재진입 감지 방식

- **선택지**: A) `visibilitychange` 이벤트 / B) `focus` 이벤트 / C) `pagehide` + `pageshow` 이벤트
- **결정**: A) `visibilitychange` 이벤트
- **근거**: system-design.md에 "visibilitychange 이벤트 + sessionStorage 상태 확인"으로 명시. `visibilitychange`는 탭 전환, 앱 백그라운드 전환, 화면 잠금 등 모든 시나리오를 포괄하며 PWA 환경에서 가장 안정적.

### 결정 4: PIN 전송 보안

- **선택지**: A) 평문 전송 (HTTPS 의존) / B) 클라이언트에서 해시 후 전송
- **결정**: A) 평문 전송 (HTTPS 의존)
- **근거**: bcrypt 해싱은 서버에서 수행해야 하므로 클라이언트에서 사전 해싱은 불필요. HTTPS가 전송 구간 암호화를 보장하며, bcryptjs는 서버 사이드 전용 라이브러리. 클라이언트에서 해시하면 "해시가 곧 비밀번호"가 되어 보안 이점 없음.

### 결정 5: bcryptjs salt 관리 방식

- **선택지**: A) bcryptjs 내장 salt 사용 (pin_salt 컬럼 불필요) / B) pin_salt 컬럼에 별도 저장
- **결정**: B) pin_salt 컬럼에 별도 저장
- **근거**: system-design.md users 테이블에 `pin_salt` 컬럼이 정의되어 있음. bcryptjs의 `genSalt()`로 생성한 salt를 `pin_salt`에 저장하고, PBKDF2 키 파생 시에도 이 salt를 사용하여 암호화 키를 파생. PIN 검증(bcrypt)과 키 파생(PBKDF2)에 동일한 salt를 재사용.

### 결정 6: PinGuard 적용 위치

- **선택지**: A) (dashboard)/layout.tsx에서 전체 래핑 / B) 루트 layout.tsx에서 래핑 / C) 개별 페이지에서 적용
- **결정**: A) (dashboard)/layout.tsx에서 전체 래핑
- **근거**: PIN 잠금은 인증된 사용자의 대시보드 영역에만 적용. (auth) 라우트 그룹은 PIN 검증 불필요. (dashboard)/layout.tsx에서 PinGuard를 래핑하면 하위 모든 보호 경로에 일괄 적용.

## 4. 파일 구조

```
app/
  api/
    users/
      pin/
        route.ts              -- POST: PIN 설정/변경
        verify/
          route.ts            -- POST: PIN 검증
  (dashboard)/
    layout.tsx                -- (수정) PinGuard 래핑 추가
    settings/
      page.tsx                -- (수정) PIN 변경 UI 추가
components/
  auth/
    pin-pad.tsx               -- 숫자 키패드 + PIN 입력 도트 UI
    pin-setup.tsx             -- PIN 초기 설정 화면 (입력 + 확인)
    pin-guard.tsx             -- PIN 보호 래퍼 컴포넌트
    pin-change.tsx            -- PIN 변경 화면 (기존 확인 + 새 설정)
    pin-lock-screen.tsx       -- 잠금 화면 (타이머 표시)
store/
  pin.store.ts                -- PIN 상태 관리 (Zustand + sessionStorage)
hooks/
  use-pin-lock.ts             -- 앱 재진입 감지 + PIN 잠금 로직
lib/
  crypto/
    encryption.ts             -- (기존) deriveKey 함수 수정: salt 파라미터 추가
types/
  pin.ts                      -- PIN 관련 타입 정의
```

### 신규 생성 파일 (9개)

| 파일 | 목적 |
|------|------|
| `app/api/users/pin/route.ts` | PIN 설정/변경 API |
| `app/api/users/pin/verify/route.ts` | PIN 검증 API |
| `components/auth/pin-pad.tsx` | 숫자 키패드 + PIN 입력 도트 |
| `components/auth/pin-setup.tsx` | PIN 초기 설정 (입력 + 확인 2단계) |
| `components/auth/pin-guard.tsx` | PIN 보호 래퍼 (미인증 시 PIN 입력/설정 표시) |
| `components/auth/pin-change.tsx` | PIN 변경 (기존 확인 + 새 설정) |
| `components/auth/pin-lock-screen.tsx` | 잠금 화면 (카운트다운 타이머) |
| `store/pin.store.ts` | Zustand PIN 상태 + sessionStorage persist |
| `hooks/use-pin-lock.ts` | visibilitychange 감지 + 재진입 잠금 훅 |
| `types/pin.ts` | PIN 관련 TypeScript 타입 |

### 기존 수정 파일 (3개)

| 파일 | 변경 내용 |
|------|-----------|
| `app/(dashboard)/layout.tsx` | PinGuard 컴포넌트로 children 래핑 |
| `lib/crypto/encryption.ts` | `deriveKey(pin, salt)` 시그니처 변경: salt를 파라미터로 받도록 수정 |
| `package.json` | `bcryptjs` + `@types/bcryptjs` 의존성 추가 |

### 의존성 추가

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

## 5. API 설계

### POST /api/users/pin -- PIN 설정/변경

- **파일**: `app/api/users/pin/route.ts`
- **목적**: 최초 PIN 설정 또는 기존 PIN 변경
- **인증**: 필요 (JWT, Supabase Auth)

#### Request Body

```typescript
// PIN 최초 설정
{
  "pin": "1234",           // 4-6자리 숫자 문자열
  "confirmPin": "1234"     // 확인 입력 (pin과 동일해야 함)
}

// PIN 변경
{
  "pin": "5678",           // 새 PIN
  "confirmPin": "5678",    // 새 PIN 확인
  "currentPin": "1234"     // 기존 PIN (변경 시에만 필수)
}
```

#### Response

**성공 (200)**:
```json
{
  "success": true,
  "data": {
    "pinSet": true,
    "salt": "generated-bcrypt-salt-string"
  }
}
```

**에러 케이스**:

| HTTP 코드 | 상황 | 응답 body |
|-----------|------|-----------|
| 400 | PIN 길이 4-6자리 미충족 | `{ "error": "PIN은 4-6자리 숫자여야 합니다" }` |
| 400 | pin과 confirmPin 불일치 | `{ "error": "PIN이 일치하지 않습니다" }` |
| 400 | PIN이 숫자가 아닌 문자 포함 | `{ "error": "PIN은 숫자만 입력 가능합니다" }` |
| 401 | JWT 인증 실패 | `{ "error": "인증이 필요합니다" }` |
| 403 | 기존 PIN 불일치 (변경 시) | `{ "error": "현재 PIN이 올바르지 않습니다" }` |
| 409 | PIN 이미 설정됨 (currentPin 미제공) | `{ "error": "PIN이 이미 설정되어 있습니다. 변경 시 현재 PIN을 입력해주세요" }` |
| 423 | 계정 잠금 상태 | `{ "error": "계정이 잠겨 있습니다", "lockedUntil": 1708700400000 }` |
| 500 | 서버 내부 오류 | `{ "error": "일시적인 오류가 발생했습니다" }` |

#### 서버 로직

```
1. JWT에서 user_id 추출
2. 요청 유효성 검사 (pin 길이, 숫자 여부, confirmPin 일치)
3. users 테이블에서 현재 pin_hash 조회
4. [PIN 변경인 경우]
   a. currentPin 필수 확인
   b. bcrypt.compare(currentPin, pin_hash) 검증
   c. 불일치 시 403 반환
5. [PIN 최초 설정인 경우]
   a. pin_hash가 이미 존재하면 409 반환
6. bcrypt.genSalt(12) -> salt 생성
7. bcrypt.hash(pin, salt) -> pin_hash 생성
8. users 테이블 UPDATE: pin_hash, pin_salt, pin_failed_count=0, pin_locked_until=null
9. salt를 응답에 포함 (클라이언트 PBKDF2 키 파생용)
```

### POST /api/users/pin/verify -- PIN 검증

- **파일**: `app/api/users/pin/verify/route.ts`
- **목적**: 사용자 입력 PIN과 저장된 해시 비교
- **인증**: 필요 (JWT, Supabase Auth)

#### Request Body

```typescript
{
  "pin": "1234"     // 사용자 입력 PIN
}
```

#### Response

**성공 (200)**:
```json
{
  "success": true,
  "data": {
    "verified": true,
    "salt": "bcrypt-salt-string"
  }
}
```

**실패 (200, verified: false)**:
```json
{
  "success": true,
  "data": {
    "verified": false,
    "failedAttempts": 3,
    "maxAttempts": 5,
    "remainingAttempts": 2
  }
}
```

**잠금 (423)**:
```json
{
  "error": "PIN 5회 연속 오입력으로 계정이 잠겼습니다",
  "lockedUntil": 1708700400000,
  "remainingSeconds": 542
}
```

**에러 케이스**:

| HTTP 코드 | 상황 | 응답 body |
|-----------|------|-----------|
| 400 | PIN 미입력 | `{ "error": "PIN을 입력해주세요" }` |
| 401 | JWT 인증 실패 | `{ "error": "인증이 필요합니다" }` |
| 404 | PIN 미설정 상태 | `{ "error": "PIN이 설정되지 않았습니다", "pinSet": false }` |
| 423 | 계정 잠금 중 | 위 잠금 응답 참조 |
| 500 | 서버 내부 오류 | `{ "error": "일시적인 오류가 발생했습니다" }` |

#### 서버 로직

```
1. JWT에서 user_id 추출
2. users 테이블에서 pin_hash, pin_salt, pin_failed_count, pin_locked_until 조회
3. pin_hash가 null이면 404 반환 (PIN 미설정)
4. pin_locked_until 확인
   a. pin_locked_until > NOW() → 423 반환 (잔여 시간 포함)
   b. pin_locked_until <= NOW() → 잠금 해제: pin_failed_count=0, pin_locked_until=null
5. bcrypt.compare(pin, pin_hash)
6. [일치]
   a. pin_failed_count=0, pin_locked_until=null UPDATE
   b. salt를 응답에 포함 (클라이언트 PBKDF2 키 파생용)
   c. { verified: true, salt } 반환
7. [불일치]
   a. pin_failed_count++ UPDATE
   b. pin_failed_count >= 5 → pin_locked_until = NOW() + 10분 UPDATE
   c. { verified: false, failedAttempts, remainingAttempts } 반환
   d. pin_failed_count >= 5면 423 반환
```

## 6. DB 설계

### 기존 테이블 활용: `public.users`

F-03에서는 새 테이블을 생성하지 않음. system-design.md에 이미 정의된 `users` 테이블의 PIN 관련 컬럼을 활용.

```sql
-- 이미 정의된 users 테이블의 PIN 관련 컬럼
-- pin_hash      TEXT              -- bcrypt 해시된 PIN
-- pin_salt      TEXT              -- PIN 해싱용 salt (PBKDF2 키 파생에도 사용)
-- pin_failed_count  INTEGER DEFAULT 0   -- PIN 연속 실패 횟수
-- pin_locked_until  TIMESTAMPTZ         -- PIN 잠금 해제 시각
```

### PIN 관련 컬럼 상세

| 컬럼 | 타입 | 기본값 | 제약조건 | 설명 |
|------|------|--------|----------|------|
| `pin_hash` | TEXT | NULL | - | bcrypt(PIN, salt) 결과. NULL이면 PIN 미설정 |
| `pin_salt` | TEXT | NULL | - | bcrypt.genSalt(12)로 생성한 salt. PBKDF2 키 파생에도 재사용 |
| `pin_failed_count` | INTEGER | 0 | CHECK >= 0 | PIN 연속 실패 횟수. 성공 시 0으로 리셋 |
| `pin_locked_until` | TIMESTAMPTZ | NULL | - | 잠금 해제 시각. NULL이면 잠금 없음 |

### RLS 정책 (기존)

users 테이블에 이미 적용된 RLS 정책으로 충분:
- `users_select_own`: 본인 레코드만 조회 가능
- `users_update_own`: 본인 레코드만 수정 가능

PIN 관련 API는 서버 사이드 Route Handler에서 Supabase 서버 클라이언트를 사용하므로 RLS가 자동 적용됨.

### Supabase 수동 작업

PIN 관련 컬럼은 users 테이블 생성 DDL에 이미 포함되어 있으므로 추가 마이그레이션 불필요. `handle_new_user()` 트리거가 실행된 상태이면 별도 작업 없음.

## 7. PIN 검증 흐름 상세

### 7.1 PIN 최초 설정 흐름 (AC-01)

```
사용자               PinSetup           POST /api/users/pin    Supabase DB
  |                     |                       |                   |
  |-- 4-6자리 입력 ---->|                       |                   |
  |                     |-- step='input'        |                   |
  |<-- "확인 입력" -----|                       |                   |
  |-- 동일 PIN 입력 --->|                       |                   |
  |                     |-- step='confirm'      |                   |
  |                     |-- pin/confirmPin 비교  |                   |
  |                     |  [불일치 시 에러]      |                   |
  |                     |                       |                   |
  |                     |-- POST { pin, confirmPin } ------------>  |
  |                     |                       |-- genSalt(12) --> |
  |                     |                       |-- bcrypt.hash --> |
  |                     |                       |-- UPDATE pin_hash, pin_salt
  |                     |<-- { success, salt } --|                   |
  |                     |                       |                   |
  |                     |-- PBKDF2(pin, salt) -> encryptionKey      |
  |                     |-- pinStore.setPinVerified(true, key)      |
  |                     |-- sessionStorage 저장                     |
  |<-- 완료 (앱 진입) --|                       |                   |
```

### 7.2 PIN 검증 흐름 (AC-02)

```
사용자              PinGuard/PinPad     POST /api/users/pin/verify   Supabase DB
  |                     |                          |                     |
  |  [앱 재진입]        |                          |                     |
  |                     |-- isPinVerified 확인     |                     |
  |                     |-- false → PinPad 표시    |                     |
  |<-- PIN 입력 화면 ---|                          |                     |
  |                     |                          |                     |
  |-- PIN 입력 -------->|                          |                     |
  |                     |-- POST { pin } --------->|                     |
  |                     |                          |-- 잠금 확인 ------->|
  |                     |                          |-- bcrypt.compare -->|
  |                     |                          |                     |
  |                     |  [성공]                  |                     |
  |                     |<-- { verified, salt } ---|                     |
  |                     |-- PBKDF2(pin, salt) -> encryptionKey           |
  |                     |-- pinStore.setPinVerified(true, key)           |
  |<-- 앱 진입 ---------|                          |                     |
  |                     |                          |                     |
  |                     |  [실패]                  |                     |
  |                     |<-- { verified: false, failedAttempts } ---     |
  |                     |-- pinStore.setFailedAttempts(n)                |
  |<-- "PIN이 틀렸습니다 (n/5)" 에러 표시          |                     |
  |                     |                          |                     |
  |                     |  [5회 실패 -> 잠금]      |                     |
  |                     |<-- 423 { lockedUntil } --|                     |
  |                     |-- PinLockScreen 표시     |                     |
  |<-- "10분간 잠금" + 카운트다운 타이머 ----------|                     |
```

### 7.3 PIN 변경 흐름 (AC-04)

```
사용자              PinChange           POST /api/users/pin        Supabase DB
  |                     |                       |                      |
  |  [설정 > PIN 변경]  |                       |                      |
  |                     |-- step='current'      |                      |
  |<-- "현재 PIN 입력" -|                       |                      |
  |-- 현재 PIN -------->|                       |                      |
  |                     |-- step='newPin'       |                      |
  |<-- "새 PIN 입력" ---|                       |                      |
  |-- 새 PIN ---------->|                       |                      |
  |                     |-- step='confirm'      |                      |
  |<-- "확인 입력" -----|                       |                      |
  |-- 새 PIN 확인 ----->|                       |                      |
  |                     |                       |                      |
  |                     |-- POST { currentPin, pin, confirmPin } --->  |
  |                     |                       |-- 기존 PIN 검증      |
  |                     |                       |-- 새 PIN 해시 생성   |
  |                     |                       |-- UPDATE             |
  |                     |<-- { success, salt } -|                      |
  |                     |                       |                      |
  |                     |-- PBKDF2(newPin, newSalt) -> newKey          |
  |                     |-- pinStore.updateEncryptionKey(newKey)       |
  |<-- "PIN 변경 완료" -|                       |                      |
```

**주의사항**: PIN 변경 시 기존 암호화 키로 암호화된 데이터(일기, 관계 메모)는 복호화 불가능해짐. 이 문제는 F-16/F-27 구현 시 "PIN 변경 시 기존 데이터 재암호화" 로직으로 해결 예정. F-03에서는 PIN 변경 시 사용자에게 경고 메시지를 표시.

### 7.4 앱 재진입 감지 흐름 (AC-02)

```
사용자              usePinLock 훅         pinStore             PinGuard
  |                     |                     |                    |
  |  [탭 백그라운드]     |                     |                    |
  |                     |-- visibilitychange  |                    |
  |                     |   (hidden)          |                    |
  |                     |-- 타임스탬프 기록   |                    |
  |                     |   (sessionStorage)  |                    |
  |                     |                     |                    |
  |  [탭 포그라운드]     |                     |                    |
  |                     |-- visibilitychange  |                    |
  |                     |   (visible)         |                    |
  |                     |-- 경과 시간 확인    |                    |
  |                     |  [30초 이상]        |                    |
  |                     |-- resetPinVerification()                 |
  |                     |                     |-- isPinVerified=false
  |                     |                     |-- encryptionKey=null
  |                     |                     |                    |
  |                     |                     |                    |-- 재렌더링
  |                     |                     |                    |-- PinPad 표시
  |<-- PIN 입력 화면 ---|---------------------|--------------------|
```

**재진입 임계값**: 30초 (PWA 앱 전환 시 짧은 전환은 허용). 이 값은 `PIN_REENTRY_THRESHOLD_MS` 상수로 관리.

## 8. 상태 관리 상세

### 8.1 pin.store.ts 인터페이스

```typescript
// store/pin.store.ts
import { create } from 'zustand'

interface PinState {
  // 상태
  isPinSet: boolean              // PIN 설정 완료 여부 (서버 조회 결과)
  isPinVerified: boolean         // 현재 세션에서 PIN 인증 완료 여부
  failedAttempts: number         // 연속 실패 횟수
  lockedUntil: number | null     // 잠금 해제 Unix timestamp (ms)
  encryptionKey: string | null   // PBKDF2 파생 암호화 키
  isLoading: boolean             // API 호출 중 여부

  // 액션
  setIsPinSet: (value: boolean) => void
  setPinVerified: (verified: boolean, key?: string | null) => void
  setFailedAttempts: (count: number) => void
  setLockedUntil: (timestamp: number | null) => void
  setLoading: (loading: boolean) => void
  resetPinVerification: () => void     // 앱 재진입 시 호출
  resetLockState: () => void           // 잠금 해제 시 호출
  isLocked: () => boolean              // 현재 잠금 상태 확인
  getRemainingLockSeconds: () => number // 잔여 잠금 시간 (초)
}
```

### 8.2 persist 전략

| 필드 | 저장소 | 생존 주기 | 근거 |
|------|--------|-----------|------|
| `isPinSet` | 없음 (서버 조회) | 매 세션 시작 시 API 호출 | 서버가 SSOT |
| `isPinVerified` | sessionStorage | 탭 닫으면 소멸 | 재진입 시 재인증 필요 |
| `encryptionKey` | sessionStorage | 탭 닫으면 소멸 | 보안상 영구 저장 불가 |
| `failedAttempts` | sessionStorage | 탭 닫으면 소멸 | 서버 DB와 동기화됨 |
| `lockedUntil` | sessionStorage | 탭 닫으면 소멸 | 서버 DB와 동기화됨 |
| `isLoading` | 없음 (메모리) | 컴포넌트 생존 주기 | UI 상태 |

### 8.3 sessionStorage 키

```typescript
const SESSION_KEYS = {
  PIN_VERIFIED: 'mylifeos_pin_verified',
  ENCRYPTION_KEY: 'mylifeos_encryption_key',
  FAILED_ATTEMPTS: 'mylifeos_pin_failed_attempts',
  LOCKED_UNTIL: 'mylifeos_pin_locked_until',
  LAST_HIDDEN_AT: 'mylifeos_last_hidden_at',  // visibilitychange용
} as const
```

### 8.4 초기화 로직

```
앱 시작 (PinGuard 마운트)
  |
  |-- sessionStorage에서 isPinVerified 읽기
  |-- sessionStorage에서 encryptionKey 읽기
  |-- sessionStorage에서 failedAttempts, lockedUntil 읽기
  |
  |-- isPinVerified가 true이면
  |   |-- 그대로 앱 진입 허용
  |
  |-- isPinVerified가 false이면 (또는 없으면)
  |   |-- GET /api/users/profile 호출하여 pin_hash 존재 여부 확인
  |   |-- pin_hash 존재 → isPinSet=true → PinPad 표시
  |   |-- pin_hash 없음  → isPinSet=false → PinSetup 표시
```

### 8.5 auth.store.ts와의 관계

기존 `auth.store.ts`에 있는 `isPinVerified`와 `encryptionKey`는 `pin.store.ts`로 이관. `auth.store.ts`의 해당 필드는 유지하되, F-01에서 이미 구현된 `setPinVerified` 액션은 `pin.store.ts`의 동일 액션으로 대체 사용.

```typescript
// auth.store.ts (기존 유지, 수정 없음)
// isPinVerified, encryptionKey, setPinVerified는
// pin.store.ts에서 관리하되, auth.store.ts에도 동기화 유지
// 이유: F-01 테스트에서 auth.store.ts의 setPinVerified를 참조하므로 호환성 유지
```

## 9. 핵심 컴포넌트 명세

### 9.1 PinPad (`components/auth/pin-pad.tsx`)

**역할**: 숫자 키패드 + PIN 입력 도트 UI. 재사용 가능한 기본 입력 컴포넌트.

```typescript
interface PinPadProps {
  length: number                         // PIN 길이 (4-6)
  onComplete: (pin: string) => void      // PIN 입력 완료 콜백
  error?: string | null                  // 에러 메시지
  disabled?: boolean                     // 잠금 시 비활성화
  title?: string                         // 상단 안내 문구
  subtitle?: string                      // 부제 (실패 횟수 등)
}
```

**UI 구조**:
```
+----------------------------------+
|           My Life OS             |
|                                  |
|          {title}                 |
|          {subtitle}             |
|                                  |
|        * * * O O O               |   <- 입력 도트 (length에 따라 4-6개)
|                                  |
|      [ 1 ]  [ 2 ]  [ 3 ]        |
|      [ 4 ]  [ 5 ]  [ 6 ]        |
|      [ 7 ]  [ 8 ]  [ 9 ]        |
|      [   ]  [ 0 ]  [ <- ]       |   <- 빈칸, 0, 백스페이스
|                                  |
|        {error message}           |   <- 빨간색 에러 메시지
+----------------------------------+
```

**동작**:
1. 숫자 버튼 클릭/터치 시 해당 숫자 추가
2. 백스페이스(삭제) 버튼으로 마지막 숫자 제거
3. 지정 길이(`length`)만큼 입력 완료 시 `onComplete` 콜백 자동 호출
4. 물리 키보드 숫자 입력도 지원 (keydown 이벤트)
5. `disabled` 시 모든 버튼 비활성화 + 회색 처리
6. 입력 시 진동 피드백 (`navigator.vibrate(10)`, 지원 시)

### 9.2 PinSetup (`components/auth/pin-setup.tsx`)

**역할**: PIN 최초 설정 화면. 2단계(입력 + 확인).

```typescript
interface PinSetupProps {
  onComplete: () => void      // 설정 완료 콜백
}
```

**상태 머신**:
```
[input] --> 사용자 PIN 입력 완료 --> [confirm] --> 확인 PIN 입력
  |                                      |
  |                                      |-- 일치 → API 호출 → onComplete
  |                                      |-- 불일치 → 에러 → [input] 복귀
```

**2단계 흐름**:
1. **Step 1 (input)**: "PIN을 설정해주세요" + PinPad (length 선택 가능: 4/5/6자리)
2. **Step 2 (confirm)**: "PIN을 다시 입력해주세요" + PinPad
3. 확인 PIN이 일치하면 `POST /api/users/pin` 호출
4. 성공 시 PBKDF2 키 파생 -> `pinStore.setPinVerified(true, key)` -> `onComplete`
5. 불일치 시 "PIN이 일치하지 않습니다. 다시 설정해주세요" 에러 -> Step 1 복귀

**PIN 길이 선택**: v1에서는 기본 6자리 고정. 향후 설정 옵션 추가 가능하도록 `length` prop은 유지.

### 9.3 PinGuard (`components/auth/pin-guard.tsx`)

**역할**: PIN 보호 래퍼 컴포넌트. 자식을 렌더링하기 전에 PIN 인증 상태를 확인.

```typescript
interface PinGuardProps {
  children: React.ReactNode
}
```

**렌더링 분기**:

```
PinGuard
  |
  |-- isLoading → 로딩 스피너
  |
  |-- !isPinSet → PinSetup (최초 설정)
  |
  |-- isPinSet && isLocked() → PinLockScreen (잠금 화면)
  |
  |-- isPinSet && !isPinVerified → PinPad (검증)
  |
  |-- isPinVerified → children (앱 렌더링)
```

**내부 로직**:
1. 마운트 시 `usePinLock` 훅 호출 (visibilitychange 감지 시작)
2. `pinStore`에서 `isPinSet`, `isPinVerified`, `isLocked()` 조회
3. PIN 미설정 시: 사용자 프로필에서 `pin_hash` 존재 여부 확인 (초기 1회)
4. 상태에 따라 PinSetup / PinPad / PinLockScreen / children 렌더링

### 9.4 PinChange (`components/auth/pin-change.tsx`)

**역할**: PIN 변경 화면. 설정 페이지에서 사용.

```typescript
interface PinChangeProps {
  onComplete: () => void      // 변경 완료 콜백
  onCancel: () => void        // 취소 콜백
}
```

**3단계 흐름**:
1. **Step 1 (current)**: "현재 PIN을 입력해주세요" + PinPad
2. **Step 2 (newPin)**: "새 PIN을 입력해주세요" + PinPad
3. **Step 3 (confirm)**: "새 PIN을 다시 입력해주세요" + PinPad
4. API 호출: `POST /api/users/pin` (currentPin, pin, confirmPin)
5. 성공 시 새 키 파생 -> pinStore 업데이트 -> 경고 메시지 -> onComplete
6. 경고: "PIN이 변경되었습니다. 기존 암호화된 데이터는 새 PIN으로 접근됩니다"

### 9.5 PinLockScreen (`components/auth/pin-lock-screen.tsx`)

**역할**: 5회 실패 후 잠금 화면. 카운트다운 타이머 표시.

```typescript
interface PinLockScreenProps {
  lockedUntil: number        // 잠금 해제 Unix timestamp (ms)
  onUnlock: () => void       // 잠금 해제 시 콜백
}
```

**UI 구조**:
```
+----------------------------------+
|                                  |
|          [잠금 아이콘]           |
|                                  |
|     PIN 5회 연속 오입력으로      |
|     앱이 잠겼습니다              |
|                                  |
|        09:42 후 해제             |   <- 실시간 카운트다운
|                                  |
|     보안을 위해 잠시 후          |
|     다시 시도해주세요            |
|                                  |
+----------------------------------+
```

**동작**:
1. 1초 간격 `setInterval`로 잔여 시간 계산 및 표시
2. 타이머 만료 시 `pinStore.resetLockState()` -> `onUnlock()` 호출
3. 페이지 새로고침 시에도 `lockedUntil`은 sessionStorage에서 복원

### 9.6 usePinLock 훅 (`hooks/use-pin-lock.ts`)

```typescript
function usePinLock(): void
```

**동작 로직**:
1. `visibilitychange` 이벤트 리스너 등록
2. `hidden` 시: `sessionStorage`에 `LAST_HIDDEN_AT = Date.now()` 저장
3. `visible` 시:
   a. `LAST_HIDDEN_AT` 조회
   b. 경과 시간 = `Date.now() - LAST_HIDDEN_AT`
   c. 경과 시간 > `PIN_REENTRY_THRESHOLD_MS` (30초) 이면:
      - `pinStore.resetPinVerification()` 호출
      - `isPinVerified = false`, `encryptionKey = null`
   d. `LAST_HIDDEN_AT` 삭제
4. 컴포넌트 언마운트 시 이벤트 리스너 정리

**상수**:
```typescript
const PIN_REENTRY_THRESHOLD_MS = 30 * 1000  // 30초
```

## 10. 에러 처리

### 10.1 PIN 입력 에러

| 상황 | 메시지 | UI 동작 |
|------|--------|---------|
| PIN 불일치 (검증) | "PIN이 올바르지 않습니다 (N/5)" | PinPad 에러 표시, 입력 초기화, 진동 |
| PIN 불일치 (설정 확인) | "PIN이 일치하지 않습니다. 다시 설정해주세요" | Step 1로 복귀, 입력 초기화 |
| PIN 불일치 (변경 - 현재) | "현재 PIN이 올바르지 않습니다" | Step 1 유지, 입력 초기화 |
| 5회 실패 잠금 | "PIN 5회 연속 오입력으로 앱이 잠겼습니다" | PinLockScreen 전환, 카운트다운 |
| 잠금 해제 시도 (잠금 중) | "MM:SS 후 다시 시도해주세요" | PinLockScreen 유지 |
| 네트워크 오류 | "네트워크 연결을 확인해주세요" | PinPad 에러 표시, 재시도 가능 |
| 서버 오류 | "일시적인 오류가 발생했습니다. 다시 시도해주세요" | PinPad 에러 표시, 재시도 가능 |

### 10.2 실패 횟수 시각 피드백

| 횟수 | 표시 | 색상 |
|------|------|------|
| 1-2회 | "PIN이 올바르지 않습니다 (1/5)" | 빨간색 텍스트 |
| 3-4회 | "PIN이 올바르지 않습니다 (3/5). 5회 실패 시 10분간 잠깁니다" | 빨간색 텍스트 + 경고 아이콘 |
| 5회 | 잠금 화면 전환 | - |

## 11. UI 설계

### 11.1 PIN 입력 화면 (검증)

```
+----------------------------------+
|                                  |
|          [Shield 아이콘]         |
|                                  |
|        PIN을 입력해주세요        |
|                                  |
|         * * * O O O              |
|                                  |
|      +-----+ +-----+ +-----+    |
|      |  1  | |  2  | |  3  |    |
|      +-----+ +-----+ +-----+    |
|      +-----+ +-----+ +-----+    |
|      |  4  | |  5  | |  6  |    |
|      +-----+ +-----+ +-----+    |
|      +-----+ +-----+ +-----+    |
|      |  7  | |  8  | |  9  |    |
|      +-----+ +-----+ +-----+    |
|      +-----+ +-----+ +-----+    |
|      |     | |  0  | |  <  |    |
|      +-----+ +-----+ +-----+    |
|                                  |
+----------------------------------+
```

### 11.2 PIN 설정 화면 (Step 1)

```
+----------------------------------+
|                                  |
|          [Key 아이콘]            |
|                                  |
|       PIN을 설정해주세요         |
|    앱 보안을 위해 4-6자리의      |
|    PIN을 설정합니다              |
|                                  |
|         O O O O O O              |
|                                  |
|      +-----+ +-----+ +-----+    |
|      |  1  | |  2  | |  3  |    |
|      ...  (키패드 동일)  ...     |
|      +-----+ +-----+ +-----+    |
|                                  |
+----------------------------------+
```

### 11.3 PIN 설정 화면 (Step 2 - 확인)

```
+----------------------------------+
|                                  |
|          [Key 아이콘]            |
|                                  |
|     PIN을 다시 입력해주세요      |
|       확인을 위해 한 번 더       |
|       입력해주세요               |
|                                  |
|         O O O O O O              |
|                                  |
|      (키패드 동일)               |
|                                  |
+----------------------------------+
```

### 11.4 잠금 화면

```
+----------------------------------+
|                                  |
|                                  |
|          [Lock 아이콘]           |
|          (빨간색)                |
|                                  |
|     PIN 5회 연속 오입력으로      |
|     앱이 잠겼습니다              |
|                                  |
|          09:42                   |   <- MM:SS 카운트다운
|          후 해제                 |
|                                  |
|     보안을 위해 잠시 후          |
|     다시 시도해주세요            |
|                                  |
|                                  |
+----------------------------------+
```

### 11.5 PIN 변경 화면 (설정 페이지 내)

```
+----------------------------------+
|  < 설정         PIN 변경         |
|                                  |
|          [Key 아이콘]            |
|                                  |
|    현재 PIN을 입력해주세요       |
|                                  |
|         O O O O O O              |
|                                  |
|      (키패드 동일)               |
|                                  |
|      [ 취소 ]                    |
+----------------------------------+
```

### 11.6 사용할 shadcn/ui 컴포넌트

```bash
# 이미 설치된 컴포넌트 활용 (F-01에서 설치됨)
# button, card, input은 이미 설치 상태
# 추가 설치 불필요
```

| 컴포넌트 | 용도 |
|----------|------|
| `Button` | 키패드 숫자 버튼, 취소 버튼 |
| `Card` | PIN 입력 영역 래퍼 |

### 11.7 사용할 lucide-react 아이콘

| 아이콘 | 용도 |
|--------|------|
| `Shield` | PIN 입력 화면 상단 |
| `KeyRound` | PIN 설정 화면 상단 |
| `Lock` | 잠금 화면 상단 |
| `Delete` | 백스페이스 버튼 |
| `AlertTriangle` | 3-4회 실패 경고 |

## 12. 보안 설계

### 12.1 PIN 해싱

- **알고리즘**: bcryptjs
- **salt rounds**: 12 (bcrypt.genSalt(12))
- **저장**: `users.pin_hash`에 bcrypt 해시 저장, `users.pin_salt`에 salt 저장
- PIN 원문은 서버에서 해싱 직후 즉시 폐기 (메모리에서 GC)

### 12.2 전송 보안

- PIN은 HTTPS를 통해 서버로 전송 (평문 전송, HTTPS가 구간 암호화)
- 서버에서만 bcrypt 해싱 수행 (클라이언트에서 해싱하면 해시가 곧 비밀번호)
- API 호출 시 JWT 인증 필수 (미인증 요청 차단)

### 12.3 클라이언트 보안

- PIN 원문: 입력 즉시 API 전송 후 메모리에서 폐기, 어떤 저장소에도 저장하지 않음
- 암호화 키: sessionStorage에만 저장 (탭 닫으면 소멸)
- 암호화 키는 `sessionStorage`에 저장하므로 XSS 취약점에 노출 가능 -> CSP 헤더로 완화
- `isPinVerified` 플래그: sessionStorage에 저장 (탭 닫으면 소멸)

### 12.4 Brute-force 방어

| 방어 계층 | 세부 사항 |
|-----------|-----------|
| 클라이언트 | 5회 실패 시 PinLockScreen 즉시 표시 |
| 서버 DB | `pin_failed_count >= 5` 시 `pin_locked_until = NOW() + 10분` |
| 서버 검증 | API 호출마다 `pin_locked_until` 확인, 잠금 중이면 423 응답 |
| 이중 관리 | 클라이언트 우회해도 서버에서 잠금 강제 |

### 12.5 PBKDF2 키 파생

- **알고리즘**: PBKDF2 (crypto-js)
- **해시 함수**: SHA-256
- **반복 횟수**: 100,000회
- **키 길이**: 256-bit
- **salt**: bcrypt salt를 재사용 (`users.pin_salt`)
- 기존 `lib/crypto/encryption.ts`의 `deriveKey()` 함수를 수정하여 salt를 파라미터로 받도록 변경

```typescript
// 변경 전 (현재)
export function deriveKey(pin: string): string {
  const key = CryptoJS.PBKDF2(pin, SALT, { ... })  // 하드코딩된 SALT
}

// 변경 후
export function deriveKey(pin: string, salt: string): string {
  const key = CryptoJS.PBKDF2(pin, salt, {
    keySize: 256 / 32,
    iterations: 100000,
    hasher: CryptoJS.algo.SHA256,
  })
  return key.toString()
}
```

### 12.6 위협 모델

| 위협 | 방어 |
|------|------|
| 네트워크 스니핑 | HTTPS 전송 암호화 |
| 서버 DB 유출 | bcrypt 해시만 저장, PIN 원문 복원 불가 |
| 클라이언트 XSS | sessionStorage만 사용 (localStorage 대비 노출 범위 축소), CSP 헤더 |
| Brute-force | 5회 제한 + 10분 잠금 (서버 강제) |
| 세션 탈취 | sessionStorage (탭 종료 시 소멸), 30초 재진입 임계값 |
| 개발자 도구 조작 | 서버 사이드 잠금 검증 (클라이언트 우회 불가) |

## 13. 성능 설계

### 13.1 API 호출 최적화

- PIN 검증 API는 로그인 세션당 최소 호출 (재진입 시에만)
- 잠금 상태는 클라이언트 캐시하여 잠금 중 반복 호출 방지
- PBKDF2 키 파생 (100,000회 반복)은 약 200-500ms 소요 -> 로딩 인디케이터 표시

### 13.2 번들 사이즈

- `bcryptjs`는 서버 사이드 전용 (클라이언트 번들에 미포함)
- `crypto-js`는 이미 설치되어 있으므로 추가 번들 증가 없음
- PIN 컴포넌트는 dynamic import 불필요 (초기 로드 시 필요)

### 13.3 렌더링 최적화

- PinPad 키패드 버튼은 `React.memo`로 불필요한 재렌더링 방지
- PinGuard는 `isPinVerified` 상태 변경 시에만 재렌더링
- 카운트다운 타이머는 PinLockScreen 내부에서만 1초 간격 업데이트

---

## 변경 이력

| 날짜 | 변경 내용 | 이유 |
|------|-----------|------|
| 2026-02-23 | 초안 작성 | F-03 PIN 잠금 기능 설계 |
