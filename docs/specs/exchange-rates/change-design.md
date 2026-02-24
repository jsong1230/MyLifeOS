# 환율 자동 변환 -- 변경 설계서

## 1. 참조
- 시스템 분석: 기존 다중 통화 지원 (KRW/USD/CAD) 기반 확장
- 관련 코드: `lib/currency.ts`, `components/money/summary-cards.tsx`, `components/dashboard/money-summary-card.tsx`

## 2. 변경 범위
- 변경 유형: 신규 추가 + 기존 수정
- 영향 받는 모듈: Money 대시보드, 홈 대시보드 Money 카드, lib/currency 유틸

## 3. 영향 분석

### 기존 API 변경
| API | 현재 | 변경 후 | 하위 호환성 |
|-----|------|---------|-------------|
| 없음 | - | 신규 API 추가만 | 완전 호환 |

### 기존 DB 변경
없음. DB 변경 없이 외부 API 캐싱으로 구현한다.

### 기존 컴포넌트 변경
| 컴포넌트 | 현재 동작 | 변경 후 | 하위 호환성 |
|-----------|-----------|---------|-------------|
| `components/money/summary-cards.tsx` | 통화별 분리 표시 (KRW/USD/CAD 각각) | 기존 표시 유지 + "기준 통화 토글" 선택 시 환산 합계 추가 표시 | 기본 동작 완전 유지 |
| `components/dashboard/money-summary-card.tsx` | 통화별 분리 표시 | 기존 표시 유지 + 환산 합계 1줄 추가 표시 (설정의 기본 통화 기준) | 기본 동작 완전 유지 |

### 사이드 이펙트
- 없음. 모든 변경은 추가적(additive)이며 기존 동작을 제거하지 않는다.
- frankfurter.app API 장애 시에도 기존 통화별 분리 표시는 정상 동작한다 (환산 합계만 표시 안 됨).

---

## 4. 아키텍처 결정

### 결정 1: 환율 데이터 소스
- **선택지**: A) 클라이언트에서 직접 frankfurter.app 호출 / B) Next.js Route Handler 프록시 + 서버 캐싱
- **결정**: B) Next.js Route Handler 프록시
- **근거**: 1시간 단위 `revalidate`로 불필요한 외부 API 호출 최소화. 클라이언트는 자체 API만 호출하므로 외부 의존성 캡슐화. CORS 문제 회피.

### 결정 2: 기준 통화 선택 상태 관리
- **선택지**: A) Zustand 전역 상태 / B) 컴포넌트 로컬 useState / C) URL 쿼리 파라미터
- **결정**: B) 컴포넌트 로컬 useState
- **근거**: 기준 통화 토글은 해당 페이지/카드 내에서만 사용되는 UI 상태이다. 페이지 이탈 시 초기화되어도 무방하다. 홈 대시보드 카드는 사용자 설정의 `default_currency`를 자동으로 사용한다.

### 결정 3: 환율 데이터 캐싱 계층
- **선택지**: A) Next.js `revalidate`만 사용 / B) `revalidate` + React Query `staleTime` 이중 캐싱
- **결정**: B) 이중 캐싱
- **근거**: 서버에서 `revalidate: 3600`으로 1시간 캐싱. 클라이언트에서 React Query `staleTime: 10 * 60 * 1000` (10분)으로 불필요한 fetch 방지. 환율은 실시간성이 중요하지 않으므로 공격적 캐싱이 적합하다.

### 결정 4: 변환 로직 위치
- **선택지**: A) 서버에서 변환 후 결과 전달 / B) 클라이언트에서 환율 받아 직접 변환
- **결정**: B) 클라이언트 변환
- **근거**: 거래 데이터는 이미 클라이언트에 로드되어 있다. 환율만 별도 fetch하여 클라이언트에서 변환하면 기존 API 수정 불필요. `convertCurrency` 순수 함수로 테스트 용이.

### 결정 5: 홈 대시보드 카드 환산 표시 방식
- **선택지**: A) 토글 UI 추가 / B) 사용자 설정의 기본 통화로 자동 환산 표시
- **결정**: B) 자동 환산 표시
- **근거**: 홈 카드는 공간이 제한적이다. 다중 통화가 있는 경우에만 기본 통화 기준 환산 합계를 자동으로 1줄 추가 표시한다. 토글은 Money 대시보드에만 배치한다.

---

## 5. 신규 API 설계

### GET /api/exchange-rates

- **목적**: frankfurter.app에서 최신 환율을 가져와 캐싱 후 반환
- **인증**: 불필요 (환율은 공개 데이터)
- **Query Parameters**: 없음 (KRW, USD, CAD 간 모든 환율을 한번에 반환)
- **외부 API 호출**: `https://api.frankfurter.app/latest?from=USD&to=KRW,CAD`
- **캐싱**: `export const revalidate = 3600` (1시간)

#### 외부 API 기준 통화 결정
frankfurter.app은 `from` 파라미터로 기준 통화를 지정한다. USD를 기준으로 호출하면 `{ rates: { KRW: 1350, CAD: 1.36 } }` 형태로 반환된다. 이로부터 모든 쌍의 환율을 계산할 수 있다:
- USD->KRW: `rates.KRW` (직접)
- USD->CAD: `rates.CAD` (직접)
- KRW->USD: `1 / rates.KRW`
- KRW->CAD: `rates.CAD / rates.KRW`
- CAD->USD: `1 / rates.CAD`
- CAD->KRW: `rates.KRW / rates.CAD`

**주의**: frankfurter.app은 KRW를 `from` 기준 통화로 지원하지 않는다. 따라서 USD를 기준으로 호출한다.

#### Response 타입
```typescript
// types/exchange-rate.ts

/** 환율 쌍 (from -> to) */
export interface ExchangeRates {
  /** 기준 통화 (frankfurter API의 base) */
  base: string
  /** 환율 조회 날짜 (YYYY-MM-DD) */
  date: string
  /** 통화 코드 -> 환율 맵 (base 기준 1단위당 값) */
  rates: Record<string, number>
}

/** API 응답 형태 */
export interface ExchangeRatesResponse {
  success: boolean
  data?: ExchangeRates
  error?: string
}
```

#### Response 예시
```json
{
  "success": true,
  "data": {
    "base": "USD",
    "date": "2026-02-24",
    "rates": {
      "KRW": 1350.25,
      "CAD": 1.3612
    }
  }
}
```

#### 에러 케이스
| 코드 | 상황 | 처리 |
|------|------|------|
| 200 (fallback) | frankfurter.app 장애 | 하드코딩된 fallback 환율 반환 + `stale: true` 플래그 |
| 500 | 서버 내부 오류 | `{ success: false, error: "SERVER_ERROR" }` |

#### Fallback 환율
외부 API 실패 시 사용할 기본값 (대략적 환율):
```typescript
const FALLBACK_RATES: ExchangeRates = {
  base: 'USD',
  date: '1970-01-01', // 오래된 날짜로 stale 표시
  rates: { KRW: 1350, CAD: 1.36 },
}
```

---

## 6. 변환 유틸 설계

### `lib/currency.ts`에 추가할 함수

```typescript
import type { ExchangeRates } from '@/types/exchange-rate'

/**
 * 통화 변환 함수
 * @param amount - 변환할 금액
 * @param from - 원래 통화 코드
 * @param to - 목표 통화 코드
 * @param rates - ExchangeRates 객체 (base=USD 기준)
 * @returns 변환된 금액 (목표 통화의 소수점 자릿수에 맞춰 반올림)
 *
 * 변환 공식 (base=USD 기준):
 * - USD->X: amount * rates[X]
 * - X->USD: amount / rates[X]
 * - X->Y: amount * (rates[Y] / rates[X])
 * - 동일 통화: amount 그대로 반환
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates
): number
```

### `lib/currency.ts`에 추가할 합계 계산 함수

```typescript
/**
 * 통화별 합계를 기준 통화로 환산하여 단일 합계 반환
 * @param totalsByCurrency - calcTotalsByCurrency()의 반환값
 * @param targetCurrency - 환산 목표 통화
 * @param rates - 환율 데이터
 * @returns 환산된 단일 { income, expense } 합계
 */
export function convertTotalsToCurrency(
  totalsByCurrency: Record<string, CurrencyTotals>,
  targetCurrency: CurrencyCode,
  rates: ExchangeRates
): CurrencyTotals
```

---

## 7. 클라이언트 훅 설계

### `hooks/use-exchange-rates.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import type { ExchangeRates } from '@/types/exchange-rate'

/**
 * 환율 데이터 fetch 훅
 * - queryKey: ['exchange-rates']
 * - staleTime: 10분 (600,000ms)
 * - refetchOnWindowFocus: false (환율은 실시간 불필요)
 * - enabled: 기본 true (호출 시점 제어 가능)
 *
 * @returns React Query 결과 (data: ExchangeRates | undefined)
 */
export function useExchangeRates(enabled?: boolean): UseQueryResult<ExchangeRates>
```

사용 패턴:
```typescript
const { data: rates, isLoading: isLoadingRates } = useExchangeRates()

// 환율 로드 완료 후 변환
if (rates) {
  const converted = convertCurrency(1000, 'USD', 'KRW', rates)
}
```

---

## 8. UI 변경 명세

### 8-1. Money 대시보드 (`components/money/summary-cards.tsx`)

#### 변경 내용
기존 3개 카드 (수입/지출/잔액) 상단에 "기준 통화 토글" 추가.

#### 기준 통화 토글 UI
- 위치: SummaryCards 컴포넌트 상단, 카드 그리드 바로 위
- 표시 조건: 거래 데이터에 2개 이상의 통화가 존재할 때만 표시
- 컴포넌트: shadcn/ui `ToggleGroup` (KRW / USD / CAD) 또는 기존 `CurrencySelect` 재사용
- 기본 선택: 없음 (= 현재 동작 유지, 통화별 분리 표시)
- 통화 선택 시: 기존 통화별 분리 표시 아래에 "환산 합계" 섹션 추가

#### 환산 합계 표시
```
[기존] 통화별 분리 표시:
  수입: ₩3,000,000       지출: ₩1,500,000       잔액: ₩1,500,000
  수입: $2,000.00         지출: $800.00           잔액: $1,200.00

[추가] 환산 합계 (기준: KRW 선택 시):
  ──────────────────────────────────────────────────
  환산 합계 (KRW 기준, 1 USD = ₩1,350.25)
  수입: ₩5,700,500       지출: ₩2,580,200       잔액: ₩3,120,300
```

- 환산 합계는 연한 배경색 + 점선 구분선으로 기존 데이터와 시각적 분리
- 환율 정보 표시: "1 USD = 1,350.25 KRW" 형태로 작은 텍스트
- 환율 로딩 중: 스켈레톤 표시
- 환율 로드 실패: 환산 합계 섹션 미표시 (기존 통화별 표시만 유지)

### 8-2. 홈 대시보드 Money 카드 (`components/dashboard/money-summary-card.tsx`)

#### 변경 내용
다중 통화 거래가 있을 때, 기존 통화별 표시 아래에 사용자 설정의 `default_currency` 기준 환산 합계 1줄 추가.

#### 표시 조건
- 거래 데이터에 2개 이상의 통화가 존재할 때만 환산 합계 표시
- 사용자 설정의 `default_currency` 사용 (Zustand `useSettingsStore`에서 읽기)
- 통화가 1개뿐이면 기존과 완전 동일 (변경 없음)

#### 환산 합계 표시
```
[기존] KRW
  수입 ₩3,000,000
  지출 ₩1,500,000
  +₩1,500,000

[기존] USD
  수입 $2,000
  지출 $800
  +$1,200

[추가] 환산 합계 (점선 구분 후)
  ≈ ₩5,700,500 (환산 합계)
```

- 환산 합계는 `text-xs text-muted-foreground` 스타일
- "approximately equal to" 기호(`≈`) 접두어로 추정치임을 표시
- 환율 로드 실패 시: 해당 줄 미표시

---

## 9. 시퀀스 흐름

### 시나리오 1: Money 대시보드 진입
```
사용자 → MoneyPage
  → useTransactions(month) → /api/transactions → Supabase → 거래 데이터
  → useExchangeRates() → /api/exchange-rates → frankfurter.app (캐시 miss 시) → 환율 데이터
  → SummaryCards에 transactions + rates 전달
  → 통화별 분리 표시 (기본)
```

### 시나리오 2: 기준 통화 토글 선택 (Money 대시보드)
```
사용자 → 토글에서 "KRW" 선택
  → SummaryCards의 useState 업데이트
  → convertTotalsToCurrency(totalsByCurrency, 'KRW', rates) 호출
  → 기존 통화별 표시 + 환산 합계 섹션 렌더링
```

### 시나리오 3: 홈 대시보드 진입
```
사용자 → Dashboard
  → MoneySummaryCard
    → useTransactions(currentMonth) (기존)
    → useExchangeRates() (신규)
    → useSettingsStore().defaultCurrency 읽기
    → currencies.length >= 2이면 convertTotalsToCurrency 호출
    → 기존 표시 + 환산 합계 1줄 추가
```

---

## 10. 파일 목록

### 신규 생성 파일
| 파일 | 역할 |
|------|------|
| `app/api/exchange-rates/route.ts` | 환율 프록시 API (frankfurter.app 호출 + 1시간 revalidate) |
| `types/exchange-rate.ts` | ExchangeRates, ExchangeRatesResponse 타입 정의 |
| `hooks/use-exchange-rates.ts` | React Query 환율 데이터 fetch 훅 |

### 수정 파일
| 파일 | 변경 내용 |
|------|-----------|
| `lib/currency.ts` | `convertCurrency()`, `convertTotalsToCurrency()` 함수 추가 |
| `components/money/summary-cards.tsx` | 기준 통화 토글 UI + 환산 합계 섹션 추가 |
| `components/dashboard/money-summary-card.tsx` | 다중 통화 시 환산 합계 1줄 추가 |
| `messages/ko.json` | `exchangeRates` 번역 키 추가 |
| `messages/en.json` | `exchangeRates` 번역 키 추가 |

---

## 11. i18n 키 추가

### `messages/ko.json`에 추가
```json
{
  "exchangeRates": {
    "baseCurrency": "기준 통화",
    "convertedTotal": "환산 합계",
    "convertedTotalDesc": "{currency} 기준",
    "rateInfo": "1 {from} = {rate} {to}",
    "approximate": "≈ {amount} (환산 합계)",
    "loadingRates": "환율 불러오는 중...",
    "rateUnavailable": "환율 정보를 불러올 수 없습니다",
    "staleRate": "환율 정보가 오래되었을 수 있습니다",
    "showConverted": "환산 합계 보기",
    "hideConverted": "환산 합계 숨기기"
  }
}
```

### `messages/en.json`에 추가
```json
{
  "exchangeRates": {
    "baseCurrency": "Base Currency",
    "convertedTotal": "Converted Total",
    "convertedTotalDesc": "Based on {currency}",
    "rateInfo": "1 {from} = {rate} {to}",
    "approximate": "≈ {amount} (converted)",
    "loadingRates": "Loading exchange rates...",
    "rateUnavailable": "Exchange rate unavailable",
    "staleRate": "Exchange rate may be outdated",
    "showConverted": "Show converted total",
    "hideConverted": "Hide converted total"
  }
}
```

---

## 12. 성능 설계

### 캐싱 전략 (2계층)
| 계층 | 위치 | TTL | 목적 |
|------|------|-----|------|
| L1 | Next.js Route Handler `revalidate` | 3,600초 (1시간) | 외부 API 호출 최소화 |
| L2 | React Query `staleTime` | 600,000ms (10분) | 클라이언트 refetch 최소화 |

### 번들 사이즈 영향
- 신규 코드 추가량: 약 200줄 (유틸 + 훅 + API + 타입)
- 외부 라이브러리 추가: 없음
- 기존 의존성 (`@tanstack/react-query`, `next-intl`, `shadcn/ui`)만 사용

### 네트워크 영향
- 환율 API 호출: 페이지당 최대 1회 (React Query 캐시 활용)
- 응답 크기: 약 100 bytes (JSON)
- frankfurter.app 평균 응답: 100-200ms

---

## 13. 에러 처리 전략

| 시나리오 | 처리 |
|----------|------|
| frankfurter.app 타임아웃 (5초) | fallback 환율 반환 |
| frankfurter.app 4xx/5xx | fallback 환율 반환 |
| 환율 데이터 없는 상태에서 변환 시도 | 변환 안 함 (기존 통화별 표시만) |
| 잘못된 통화 코드 | `convertCurrency`에서 0 반환 (방어 코드) |

---

## 14. 병렬 구현 가이드

이 기능은 다음과 같이 3개 트랙으로 병렬 구현 가능하다:

### 트랙 A: 백엔드 (의존성 없음)
1. `types/exchange-rate.ts` 생성
2. `app/api/exchange-rates/route.ts` 생성

### 트랙 B: 유틸 + 훅 (트랙 A의 타입에 의존)
1. `lib/currency.ts`에 `convertCurrency`, `convertTotalsToCurrency` 추가
2. `hooks/use-exchange-rates.ts` 생성

### 트랙 C: UI (트랙 A, B에 의존)
1. `messages/ko.json`, `messages/en.json` i18n 키 추가
2. `components/money/summary-cards.tsx` 수정
3. `components/dashboard/money-summary-card.tsx` 수정

**추천 순서**: 트랙 A와 트랙 B-1 (convertCurrency)은 타입 정의만 공유하므로 병렬 가능. 트랙 B-2와 트랙 C는 순차 진행.

---

## 변경 이력
| 날짜 | 변경 내용 | 이유 |
|------|-----------|------|
| 2026-02-24 | 최초 작성 | 환율 자동 변환 기능 설계 |
