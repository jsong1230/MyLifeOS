# MyLifeOS 개선 백로그

> 작성일: 2026-02-27
> 분석 방법: 전체 코드베이스 심층 리뷰 (API Routes, Components, Hooks, Store, Migrations)
> 이전 Wave 1~4 작업과 별개로 신규 발굴된 이슈들

---

## 요약

| 심각도 | 건수 |
|--------|------|
| Critical | 1 |
| High | 12 |
| Medium | 8 |
| Low | 3 |
| **합계** | **25** |

---

## Critical

### C-01. 암호화 key/salt 저장 위치 3곳 혼재
- **파일:** `components/auth/pin-setup.tsx:54`, `components/auth/pin-guard.tsx:82`, `app/(dashboard)/private/layout.tsx:90`
- **문제:** `pin-setup`은 salt를 `sessionStorage`에 저장하고, `pin-guard`/`private/layout`은 `localStorage`에서 읽음. 스토리지 키도 `pin_encryption_key` / `enc_key` / `pin_enc_salt` 3가지로 혼재. 페이지 새로고침 시 복호화 불가 가능성.
- **개선:** salt 저장 위치를 `localStorage`로 단일화, 상수를 `SESSION_KEYS` 파일에서 일원 관리.

---

## High

### H-01. 회원탈퇴 API — CASCADE 없이 즉시 삭제 → 데이터 고아(orphan) 발생
- **파일:** `app/api/users/delete-request/route.ts:24`
- **문제:** `adminClient.auth.admin.deleteUser()` 호출 시 `todos`, `transactions`, `diaries`, `relations`, `meal_logs` 등 연관 데이터가 삭제되지 않고 남음. 탈퇴 전 세션 무효화/로그아웃 처리도 없음.
- **개선:** 삭제 전 연관 테이블 데이터 일괄 삭제 또는 DB 레벨 `ON DELETE CASCADE` 설정, `signOut()` 호출.

### H-02. crypto-js PBKDF2 — 메인 스레드 블로킹, 타이밍 공격 취약
- **파일:** `lib/crypto/encryption.ts:11`
- **문제:** 순수 JS 구현으로 100,000회 반복 시 메인 스레드가 블로킹되고 실행 시간이 일정하지 않아 타이밍 공격에 취약.
- **개선:** `window.crypto.subtle.deriveKey()` (PBKDF2) + `window.crypto.subtle.encrypt()` (AES-GCM, random IV)로 전환.

### H-03. calendar-view.tsx — todosByDate O(42n) 반복 filter
- **파일:** `components/time/calendar-view.tsx:60`
- **문제:** `useCallback`으로 메모이제이션된 함수가 42개 셀 각각에서 전체 todos 배열을 filter → O(42n) 연산.
- **개선:** `useMemo`로 날짜별 `Map<string, Todo[]>` 사전 구축 → O(1) 조회.

### H-04. todos/reorder — 트랜잭션 없이 N개 개별 UPDATE
- **파일:** `app/api/todos/reorder/route.ts:49`
- **문제:** N개 항목 리오더 시 N개 개별 DB UPDATE 쿼리 병렬 실행. 트랜잭션 없어 부분 실패 시 순서가 불일치. `recurring/batch-record/route.ts`도 동일 패턴.
- **개선:** 단일 `upsert` bulk 호출 또는 DB RPC 함수로 원자적 처리.

### H-05. dashboard queryKey에 날짜 포함 — 캐시 무한 누적
- **파일:** `hooks/use-dashboard-summary.ts:47`
- **문제:** `queryKey: ['dashboard', 'summary', today, month]` — 날짜 바뀔 때마다 새 캐시 엔트리 생성, staleTime 미설정으로 매 렌더 refetch.
- **개선:** queryKey를 `['dashboard', 'summary']`로 단순화, `staleTime: 60_000` 추가.

### H-06. assets/body/exercise API — select('*') 과다 사용
- **파일:** `app/api/assets/route.ts:65,114`, `app/api/health/body/route.ts:21,68`, `app/api/health/exercise/route.ts:21,79`
- **문제:** 필요한 컬럼만 있어도 전체 컬럼 조회 → 불필요한 네트워크 페이로드.
- **개선:** 각 API가 실제로 사용하는 컬럼만 명시적으로 지정.

### H-07. 초기 스키마 마이그레이션(001~011) 부재
- **파일:** `supabase/migrations/` (012, 013, 014만 존재)
- **문제:** 새 환경에서 DB 재구성 불가, CI/CD 환경에서 상태 재현 불가.
- **개선:** `001_initial_schema.sql` 추가, 주요 쿼리 패턴(`user_id + date`)에 복합 인덱스 확인.

### H-08. monthly report API — 5개 DB 쿼리 순차 실행
- **파일:** `app/api/reports/monthly/route.ts:55-168`
- **문제:** todos → transactions → sleep → drinks → diaries 쿼리가 순차 실행되어 응답 시간 누적.
- **개선:** 모든 쿼리를 `Promise.all`로 단일 병렬 호출.

### H-09. meal-form.tsx — 분량 UI 한국어 하드코딩 잔존
- **파일:** `components/health/meal-form.tsx:206,224,241`
- **문제:** "1인분", "½인분", "인분 (또는 개)" 텍스트가 하드코딩되어 영어 전환 시에도 한국어 표시.
- **개선:** `t('portion')`, `t('servingUnit')` 등 번역 키로 교체, `messages/ko.json` / `messages/en.json`에 키 추가.

### H-10. diary-search.tsx — 동일 일기 이중 복호화 + debounce 없음
- **파일:** `components/private/diary-search.tsx:183`
- **문제:** filter 단계 + map 단계에서 같은 일기를 각각 복호화 → 2배 CPU 낭비. 키워드 변경 시 즉시 전체 복호화 실행.
- **개선:** 복호화 결과를 별도 `useMemo`로 캐싱(rawDiaries/encKey 변경 시만 실행), 검색 debounce 300ms 추가.

### H-11. PIN 검증 로직 2곳 중복 구현
- **파일:** `components/auth/pin-guard.tsx`, `app/(dashboard)/private/layout.tsx`
- **문제:** PIN API 호출, salt 파생 로직이 두 컴포넌트에 각각 독립 구현 → 변경 시 두 곳 동시 수정 필요.
- **개선:** 공통 `usePinVerification` 훅으로 추출.

### H-12. 날짜 유틸 함수 6개 파일에 중복 (UTC/로컬 혼재)
- **파일:** `app/api/dashboard/summary/route.ts`, `app/api/reports/monthly/route.ts`, `app/api/transactions/route.ts`, `app/api/health/meals/route.ts`, `hooks/use-dashboard-summary.ts`, `hooks/use-calendar.ts`
- **문제:** `getToday()`, `getMonthRange()` 등이 6개 이상 파일에 각기 다르게 구현. `new Date().toISOString().split('T')[0]`(UTC)와 `new Date().getFullYear()...`(로컬) 혼재.
- **개선:** `lib/date-utils.ts`에 통합, 타임존 처리 통일.

### H-13. 암호화 핵심 로직 단위 테스트 전무
- **파일:** `lib/crypto/encryption.ts`
- **문제:** PBKDF2 키 파생, AES 암호화/복호화, PIN 잠금 로직, 음식 검색 병합 알고리즘에 테스트 없음.
- **개선:** `tests/unit/lib/crypto/encryption.test.ts` 추가 (키 파생 일관성, 암복호화 왕복, 잘못된 키 시 오류).

---

## Medium

### M-01. dashboard/summary API — supabase.auth.getUser() 미호출
- **파일:** `app/api/dashboard/summary/route.ts:22`
- **문제:** `x-user-id` 헤더만 신뢰하고 JWT 재검증 없음. 미들웨어 우회 시 임의 userId로 접근 가능.
- **개선:** 민감 데이터 반환 API는 `supabase.auth.getUser()`로 JWT 재검증.

### M-02. 예산 vs 지출 통화 혼합 — 환율 변환 없이 직접 비교
- **파일:** `app/api/budgets/route.ts:125`
- **문제:** 예산(KRW) vs 지출(USD) 직접 비교 → percentage 오계산.
- **개선:** 지출 집계 시 예산 통화로 환율 변환 후 비교, 또는 동일 통화 지출만 집계.

### M-03. FoodSearchCombobox — listbox role 누락, 키보드 네비게이션 없음
- **파일:** `components/health/food-search-combobox.tsx:87`
- **문제:** `role="option"` 요소의 부모에 `role="listbox"` 없음. 화살표키/Enter 키보드 선택 미지원.
- **개선:** `<ul role="listbox">` 추가, `aria-activedescendant`, `onKeyDown` 핸들러 구현.

### M-04. auth.store + pin.store — isPinVerified/encryptionKey 상태 중복
- **파일:** `store/auth.store.ts:7-8`, `store/pin.store.ts:22-24`
- **문제:** 동일 개념의 상태가 두 스토어에 중복 존재 → 동기화 누락 시 상태 불일치.
- **개선:** `auth.store.ts`의 PIN 관련 상태 제거, `pin.store.ts`로 일원화.

### M-05. export/route.ts — 동일 쿼리 8개 중복 작성
- **파일:** `app/api/export/route.ts`
- **문제:** `module === 'all'` 분기와 개별 `switch` 케이스에 동일 Supabase 쿼리가 중복.
- **개선:** 모듈별 쿼리 함수 추출 후 `all` 분기에서 재사용.

### M-06. 음주 경고 F-25 — count가 잔 수 아닌 기록 건수
- **파일:** `app/api/health/drinks/route.ts:89`
- **문제:** `summary.count = logs.length` (기록 건수) → 하루 5잔을 1건으로 기록해도 1로 카운트. WHO 14잔 기준 오작동.
- **개선:** `count: logs.reduce((acc, log) => acc + (log.drink_count ?? 1), 0)`.

### M-07. 루틴 날짜 파싱 — UTC/로컬 타임존 혼재
- **파일:** `app/api/routines/route.ts:87-94`
- **문제:** `new Date('2026-02-27')`는 UTC 자정(KST 기준 전날 오후 3시)으로 파싱 → 루틴 날짜 매칭 오류 가능.
- **개선:** `new Date(dateParam + 'T00:00:00')` 또는 로컬 타임존 명시 파싱.

### M-08. 한식 DB 345개 + 영문명 맵 — 서버 번들 포함, 선형 탐색
- **파일:** `lib/korean-foods-db.ts`, `lib/food-en-names.ts`
- **문제:** ~860줄 정적 데이터가 번들에 포함, 검색마다 전체 배열 순회.
- **개선:** Supabase 테이블로 이전 또는 빌드 타임 인덱스 생성으로 O(1) 검색.

---

## Low

### L-01. as unknown as T 타입 단언 남용
- **파일:** `app/api/transactions/route.ts:61,116`, `app/api/export/route.ts:178`
- **문제:** `as unknown as Transaction[]` 패턴으로 TypeScript 타입 시스템 우회.
- **개선:** `supabase gen types typescript` 활용 또는 명시적 타입 단언 제거.

### L-02. private/layout.tsx — PinPad 미사용, 모바일 키패드 미보장
- **파일:** `app/(dashboard)/private/layout.tsx:152`
- **문제:** 기존 `PinPad` 컴포넌트 있음에도 별도 `<Input type="password" inputMode="numeric">` 사용 → 일부 모바일에서 숫자 키패드 미표시, UI 불일치.
- **개선:** `PinPad` 컴포넌트 재사용.

### L-03. yearly 정기지출 — 자동 기록 완전 제외
- **파일:** `hooks/use-recurring-auto-record.ts:17`
- **문제:** `cycle !== 'monthly'` 조건으로 연간 정기지출이 자동 기록 대상에서 제외.
- **개선:** yearly 사이클도 연 1회 자동 기록 지원.

---

## 권장 작업 순서

### 즉시 수정 (버그 / 데이터 무결성)
1. **M-06** 음주 경고 drink_count 합산 수정 — 코드 1줄, 기능 오작동
2. **H-09** meal-form.tsx 한국어 하드코딩 번역 키 교체
3. **C-01** 암호화 salt 스토리지 키 단일화 — 복호화 불가 위험

### 단기 개선 (1~2주)
4. **H-12** `lib/date-utils.ts` 날짜 유틸 통합
5. **H-10** `diary-search.tsx` 복호화 캐싱 + debounce
6. **H-03** `calendar-view.tsx` Map 기반 O(1) 최적화
7. **H-08** `monthly report` 쿼리 완전 병렬화
8. **H-05** dashboard queryKey 단순화 + staleTime
9. **H-13** `encryption.ts` 단위 테스트 추가
10. **M-07** 루틴 날짜 파싱 타임존 통일

### 중기 리팩터링 (1개월)
11. **H-11** PIN 로직 `usePinVerification` 훅 통합
12. **M-04** auth.store / pin.store 상태 중복 제거
13. **H-06** `select('*')` → 명시적 컬럼 지정
14. **H-01** 회원탈퇴 CASCADE 처리 보완
15. **H-07** 초기 스키마 마이그레이션 파일 추가
16. **M-05** export API 쿼리 함수 추출 리팩터링
17. **L-02** private/layout PinPad 컴포넌트 통일
18. **L-03** yearly 정기지출 자동 기록 지원

### 장기 개선
19. **H-02** Web Crypto API 암호화 마이그레이션
20. **M-01** 모든 민감 API getUser() JWT 재검증 통일
21. **M-02** 예산 통화 환율 변환 처리
22. **M-03** FoodSearchCombobox 접근성(키보드 네비게이션) 개선
23. **M-08** 한식 DB Supabase 테이블 이전
24. **L-01** Supabase 타입 자동 생성 도입
25. **H-04** todos/reorder bulk upsert 전환
