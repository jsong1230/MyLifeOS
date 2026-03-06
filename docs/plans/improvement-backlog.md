# MyLifeOS 개선 백로그

> 작성일: 2026-02-27
> 분석 방법: 전체 코드베이스 심층 리뷰 (API Routes, Components, Hooks, Store, Migrations)
> 이전 Wave 1~4 작업과 별개로 신규 발굴된 이슈들

---

## 처리 현황

| 심각도 | 전체 | 완료 | 보류 |
|--------|------|------|------|
| Critical | 1 | 1 | 0 |
| High | 12 | 12 | 0 |

| Medium | 8 | 8 | 0 |
| Low | 3 | 3 | 0 |
| **합계** | **25** | **25** | **0** |

---

## Critical

### ✅ C-01. 암호화 key/salt 저장 위치 3곳 혼재
- **완료:** `lib/constants/pin-storage-keys.ts` 상수 파일 생성, salt 저장 위치 localStorage로 단일화, `hooks/use-pin-verification.ts` 훅 추출
- **커밋:** cc349a1 (2026-02-27)

---

## High

### ✅ H-01. 회원탈퇴 API — CASCADE 없이 즉시 삭제
- **완료:** deleteUser 전 17개 테이블 Promise.all 병렬 삭제, signOut() 세션 무효화 추가
- **커밋:** cc349a1 (2026-02-27)

### ✅ H-02. crypto-js PBKDF2 — Web Crypto API 전환
- **완료:** `lib/crypto/encryption.ts` 비동기 Web Crypto AES-GCM 전환 (v2 포맷), lazy migration 방식
  - 신규 암호문: `v2:<base64(12-byte IV + ciphertext + auth tag)>`
  - 기존 데이터: 레거시 키로 복호화 → 자동으로 v2로 업마이그레이션
  - sessionStorage: `enc_key` (base64, Web Crypto), `enc_key_legacy` (hex, crypto-js)
- **커밋:** H-02 암호화 마이그레이션 (2026-03-05)

### ✅ H-03. calendar-view.tsx — todosByDate O(42n) 반복 filter
- **완료:** useMemo + Map<string, Todo[]> 사전 구축으로 O(n+42) 개선
- **커밋:** cc349a1 (2026-02-27)

### ✅ H-04. todos/reorder — 트랜잭션 없이 N개 개별 UPDATE
- **완료:** 단일 upsert(onConflict: 'id') 전환, recurring/batch-record도 동일 처리
- **커밋:** 753c635 (2026-02-27)

### ✅ H-05. dashboard queryKey에 날짜 포함 — 캐시 무한 누적
- **완료:** queryKey ['dashboard', 'summary'] 단순화, staleTime: 60_000 추가
- **커밋:** cc349a1 (2026-02-27)

### ✅ H-06. assets/body/exercise API — select('*') 과다 사용
- **완료:** 각 API 실제 사용 컬럼만 명시적 지정
- **커밋:** cc349a1 (2026-02-27)

### ✅ H-07. 초기 스키마 마이그레이션(001~011) 부재
- **완료:** `supabase/migrations/20260223000000_initial_schema.sql` 생성 (19테이블, 32인덱스, RLS 정책, handle_new_user 트리거, 시스템 카테고리 시드)
- **커밋:** 753c635 (2026-02-27)

### ✅ H-08. monthly report API — 5개 DB 쿼리 순차 실행
- **완료:** todos, sleep, drinks, diaries 쿼리를 단일 Promise.all로 병렬화
- **커밋:** cc349a1 (2026-02-27)

### ✅ H-09. meal-form.tsx — 분량 UI 한국어 하드코딩 잔존
- **완료:** halfServing, nServings, servingUnit 등 5개 번역 키로 교체 (ko/en 동기화)
- **커밋:** cc349a1 (2026-02-27)

### ✅ H-10. diary-search.tsx — 동일 일기 이중 복호화 + debounce 없음
- **완료:** decryptedDiaries useMemo 캐싱, 검색 debounce 300ms 추가
- **커밋:** cc349a1 (2026-02-27)

### ✅ H-11. PIN 검증 로직 2곳 중복 구현
- **완료:** `hooks/use-pin-verification.ts` 훅 추출, pin-guard + private/layout 재사용
- **커밋:** cc349a1 (2026-02-27)

### ✅ H-12. 날짜 유틸 함수 6개 파일에 중복 (UTC/로컬 혼재)
- **완료:** `lib/date-utils.ts` 생성 (getToday, getMonthRange 등 6개 함수), 6개 파일 통합, 로컬 타임존 통일
- **커밋:** cc349a1 (2026-02-27)

### ✅ H-13. 암호화 핵심 로직 단위 테스트 전무
- **완료:** `tests/unit/lib/crypto/encryption.test.ts` 17개 케이스 추가 (전체 146개 PASS)
- **커밋:** cc349a1 (2026-02-27)

---

## Medium

### ✅ M-01. 민감 API getUser() JWT 재검증 미호출
- **완료:** app/api/ 전체 51개 Route에 supabase.auth.getUser() 재검증 추가
- **커밋:** 753c635 (2026-02-27)

### ✅ M-02. 예산 vs 지출 통화 혼합 — 환율 변환 없이 직접 비교
- **완료:** 예산 통화와 동일한 지출만 집계하도록 Map<categoryId, Map<currency, amount>> 구조 변경
- **커밋:** 753c635 (2026-02-27)

### ✅ M-03. FoodSearchCombobox — listbox role 누락, 키보드 네비게이션 없음
- **완료:** role=listbox/combobox, aria-activedescendant, ArrowDown/Up/Enter/Escape 키보드 핸들러 구현
- **커밋:** 753c635 (2026-02-27)

### ✅ M-04. auth.store + pin.store — isPinVerified/encryptionKey 상태 중복
- **완료:** auth.store의 PIN 관련 상태 제거, pin.store로 일원화
- **커밋:** cc349a1 (2026-02-27)

### ✅ M-05. export/route.ts — 동일 쿼리 8개 중복 작성
- **완료:** 모듈별 쿼리 함수 추출, queryMap 객체로 switch 대체 (321→226줄)
- **커밋:** cc349a1 (2026-02-27)

### ✅ M-06. 음주 경고 F-25 — count가 잔 수 아닌 기록 건수
- **완료:** logs.reduce((acc, log) => acc + (log.drink_count ?? 1), 0) 로 수정
- **커밋:** cc349a1 (2026-02-27)

### ✅ M-07. 루틴 날짜 파싱 — UTC/로컬 타임존 혼재
- **완료:** new Date(dateParam + 'T00:00:00') 로 로컬 타임존 명시
- **커밋:** cc349a1 (2026-02-27)

### ✅ M-08. 한식 DB 345개 — 서버 번들 포함, 선형 탐색
- **완료:** Supabase foods 테이블 이전 (migrations/20260227000015_foods_table.sql + seeds/foods.sql), food-nutrition.ts ilike 쿼리로 교체
- **커밋:** 753c635 (2026-02-27)
- **주의:** foods 테이블 CLI push + seeds/foods.sql 시딩 필요

---

## Low

### ✅ L-01. as unknown as T 타입 단언 남용
- **완료:** types/database.types.ts 수동 작성 (15개 테이블), 명시적 DB 타입 기반 캐스트로 교체, gen:types 스크립트 추가
- **커밋:** 753c635 (2026-02-27)

### ✅ L-02. private/layout.tsx — PinPad 미사용, 모바일 키패드 미보장
- **완료:** type="password" Input → PinPad 컴포넌트 교체
- **커밋:** cc349a1 (2026-02-27)

### ✅ L-03. yearly 정기지출 — 자동 기록 완전 제외
- **완료:** monthly/yearly 분기 처리, 연간 정기지출 자동 기록 지원
- **커밋:** cc349a1 (2026-02-27)

---

## 남은 작업

**없음 — 25개 항목 전체 완료** ✅
