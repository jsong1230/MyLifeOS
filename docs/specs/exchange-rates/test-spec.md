# 환율 자동 변환 -- 테스트 명세

## 참조
- 설계서: docs/specs/exchange-rates/change-design.md

---

## 단위 테스트

### 대상: `convertCurrency(amount, from, to, rates)`

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 동일 통화 변환 | `convertCurrency(1000, 'KRW', 'KRW', rates)` | `1000` (변환 없이 그대로) |
| USD -> KRW 변환 | `convertCurrency(100, 'USD', 'KRW', { base: 'USD', date: '2026-02-24', rates: { KRW: 1350, CAD: 1.36 } })` | `135000` (100 * 1350) |
| USD -> CAD 변환 | `convertCurrency(100, 'USD', 'CAD', { base: 'USD', date: '2026-02-24', rates: { KRW: 1350, CAD: 1.36 } })` | `136` (100 * 1.36) |
| KRW -> USD 변환 | `convertCurrency(135000, 'KRW', 'USD', { base: 'USD', date: '2026-02-24', rates: { KRW: 1350, CAD: 1.36 } })` | `100` (135000 / 1350) |
| KRW -> CAD 변환 | `convertCurrency(135000, 'KRW', 'CAD', { base: 'USD', date: '2026-02-24', rates: { KRW: 1350, CAD: 1.36 } })` | `136` (135000 * 1.36 / 1350) |
| CAD -> KRW 변환 | `convertCurrency(136, 'CAD', 'KRW', { base: 'USD', date: '2026-02-24', rates: { KRW: 1350, CAD: 1.36 } })` | `135000` (136 * 1350 / 1.36) |
| CAD -> USD 변환 | `convertCurrency(136, 'CAD', 'USD', { base: 'USD', date: '2026-02-24', rates: { KRW: 1350, CAD: 1.36 } })` | `100` (136 / 1.36) |
| 금액 0 | `convertCurrency(0, 'USD', 'KRW', rates)` | `0` |
| 음수 금액 | `convertCurrency(-100, 'USD', 'KRW', rates)` | `-135000` |
| KRW 소수점 반올림 | `convertCurrency(1, 'USD', 'KRW', { base: 'USD', date: '...', rates: { KRW: 1350.7, CAD: 1.36 } })` | `1351` (KRW는 정수 반올림) |
| USD 소수점 반올림 | `convertCurrency(1000, 'KRW', 'USD', { base: 'USD', date: '...', rates: { KRW: 1350, CAD: 1.36 } })` | `0.74` (소수점 2자리) |

### 대상: `convertTotalsToCurrency(totalsByCurrency, targetCurrency, rates)`

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 단일 통화 (변환 불필요) | `{ KRW: { income: 3000000, expense: 1500000 } }`, target=KRW | `{ income: 3000000, expense: 1500000 }` |
| 다중 통화 합산 (KRW 기준) | `{ KRW: { income: 3000000, expense: 1500000 }, USD: { income: 2000, expense: 800 } }`, target=KRW, rates={KRW:1350, CAD:1.36} | `{ income: 3000000 + 2700000, expense: 1500000 + 1080000 }` = `{ income: 5700000, expense: 2580000 }` |
| 다중 통화 합산 (USD 기준) | `{ KRW: { income: 1350000, expense: 0 }, USD: { income: 500, expense: 200 } }`, target=USD | `{ income: 1000 + 500, expense: 0 + 200 }` = `{ income: 1500, expense: 200 }` |
| 빈 객체 | `{}`, target=KRW | `{ income: 0, expense: 0 }` |
| 3개 통화 합산 | KRW + USD + CAD 모두 있는 경우, target=KRW | 3개 통화 모두 KRW로 환산하여 합산 |

---

## 통합 테스트

### API: GET /api/exchange-rates

| 시나리오 | 입력 | 예상 결과 |
|----------|------|-----------|
| 정상 조회 | `GET /api/exchange-rates` | 200, `{ success: true, data: { base: "USD", date: "YYYY-MM-DD", rates: { KRW: number, CAD: number } } }` |
| frankfurter.app 장애 시 | 외부 API 500 응답 | 200, fallback 환율 반환 (`date: "1970-01-01"`) |
| frankfurter.app 타임아웃 | 외부 API 5초 초과 | 200, fallback 환율 반환 |
| 응답 형식 검증 | `GET /api/exchange-rates` | `data.rates`에 KRW, CAD 키가 반드시 존재 |
| 캐싱 동작 | 1시간 내 연속 2회 호출 | 두 번째 호출은 캐시 응답 (외부 API 재호출 없음) |

---

## 경계 조건 / 에러 케이스

### 변환 함수 경계 조건
- 매우 큰 금액 변환: `convertCurrency(999999999999, 'KRW', 'USD', rates)` -- JavaScript 부동소수점 정밀도 이내 결과 확인
- rates 객체에 대상 통화가 없는 경우: `convertCurrency(100, 'USD', 'EUR', rates)` -- 0 또는 에러 반환 (EUR은 CURRENCY_CODES에 없음)
- rates.rates가 빈 객체인 경우: 0 반환

### UI 경계 조건
- 거래 데이터가 단일 통화만 포함: 기준 통화 토글 비표시 확인
- 거래 데이터가 0건: 토글 비표시, 기존 EmptyState 유지 확인
- 환율 로딩 중: 환산 합계 영역에 스켈레톤/로딩 표시 확인
- 환율 로드 실패: 환산 합계 섹션 미표시, 기존 통화별 표시 정상 동작 확인
- 기준 통화 토글 빠른 전환: 마지막 선택된 통화의 결과만 표시 (race condition 없음)

### 홈 대시보드 카드 경계 조건
- 사용자 설정의 default_currency와 동일한 통화만 거래: 환산 합계 미표시
- 사용자 설정 로드 전: 기본값 KRW로 동작
- 카드 내 표시 공간: 환산 합계 1줄이 카드 높이를 크게 늘리지 않음

---

## 회귀 테스트

| 기존 기능 | 영향 여부 | 검증 방법 |
|-----------|-----------|-----------|
| 거래 목록 CRUD | 무영향 | 거래 추가/수정/삭제 후 목록 정상 표시 확인 |
| 통화별 분리 표시 (기존 SummaryCards) | 무영향 (additive 변경) | 기준 통화 미선택 시 기존과 동일한 레이아웃 확인 |
| 홈 대시보드 카드 기존 동작 | 무영향 (additive 변경) | 단일 통화 거래 시 기존과 완전 동일한 렌더링 확인 |
| `formatCurrency` 함수 | 무영향 | 기존 단위 테스트 통과 확인 |
| `calcTotalsByCurrency` 함수 | 무영향 | 기존 단위 테스트 통과 확인 |
| 설정 페이지 (default_currency) | 무영향 | 설정 변경 후 정상 저장 확인 |
| 자산 현황 (asset-summary) | 무영향 (이번 스코프 밖) | 자산 요약 페이지 정상 표시 확인 |
| 예산 관리 | 무영향 | 예산 차트 정상 표시 확인 |
| 월별 추이 차트 (MonthlyTrendChart) | 무영향 | 차트 정상 렌더링 확인 |
| i18n (ko/en 전환) | 신규 키 추가만 | 기존 번역 키 미변경 확인, 신규 키 양 언어 존재 확인 |
