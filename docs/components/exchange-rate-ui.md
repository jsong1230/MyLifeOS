# 환율 자동 변환 UI 컴포넌트 문서

## 개요

복수 통화(KRW/CAD/USD) 거래가 있을 때 기준 통화를 선택해 환산 합계를 표시하는 UI 기능.
`SummaryCards`와 `MoneySummaryCard` 두 컴포넌트에 적용되었습니다.

---

## 변경된 파일

| 파일 | 역할 |
|------|------|
| `components/money/summary-cards.tsx` | 금전 관리 페이지 수입/지출/잔액 요약 카드 |
| `components/dashboard/money-summary-card.tsx` | 대시보드 금전 요약 카드 |
| `messages/ko.json` | 한국어 번역 키 (`exchangeRates` 섹션) |
| `messages/en.json` | 영어 번역 키 (`exchangeRates` 섹션) |

---

## SummaryCards

### 위치
`components/money/summary-cards.tsx`

### Props

| 이름 | 타입 | 설명 |
|------|------|------|
| `transactions` | `Transaction[]` | 이번 달 거래 목록 |

### 기능

1. **통화별 분리 표시** (기존 유지): 각 카드(수입/지출/잔액)에 통화별로 금액 표시
2. **기준 통화 토글** (신규): 2개 이상 통화가 있을 때만 카드 상단에 버튼 그룹 표시
   - 선택 가능한 통화: `KRW`, `CAD`, `USD`
   - 같은 버튼 재클릭 시 토글 해제 (null 상태로 복귀)
3. **환산 합계 표시** (신규): 기준 통화 선택 + 환율 로딩 완료 시 각 카드 하단에 점선 구분선 + `≈ 환산금액` 1줄 추가
4. **로딩/stale 상태 처리**: 환율 로딩 중이거나 stale 환율이면 각각 안내 텍스트 표시

### 상태

```typescript
const [baseCurrency, setBaseCurrency] = useState<CurrencyCode | null>(null)
```

### 환율 훅 사용 조건

```typescript
// 2개 이상 통화가 있을 때만 환율 API 호출
const { data: rates, isLoading: isLoadingRates } = useExchangeRates(hasMultipleCurrencies)
```

---

## MoneySummaryCard

### 위치
`components/dashboard/money-summary-card.tsx`

### 기능

1. **통화별 수입/지출/잔액 표시** (기존 유지)
2. **환산 합계 섹션** (신규): 2개 이상 통화 + rates 존재 시 카드 하단에 추가
   - 기준 통화: `useSettingsStore().defaultCurrency` (없으면 `KRW`)
   - `≈ 환산잔액` 표시
   - 환율 정보: `1 USD = ₩1,350` 형태 (stale이면 `*` 표시)

### 의존성

| 훅/스토어 | 사용 목적 |
|-----------|-----------|
| `useExchangeRates(enabled)` | 환율 데이터 fetch (2개 이상 통화 시 활성화) |
| `useSettingsStore` | 기본 통화 설정 읽기 |

---

## 번역 키 (`exchangeRates`)

| 키 | 한국어 | 영어 |
|----|--------|------|
| `baseCurrency` | 기준 통화 | Base Currency |
| `convertedTotal` | 환산 합계 | Converted Total |
| `convertedTotalDesc` | `{currency}` 기준 | Based on `{currency}` |
| `rateInfo` | 1 `{from}` = `{rate}` `{to}` | 1 `{from}` = `{rate}` `{to}` |
| `approximate` | ≈ `{amount}` | ≈ `{amount}` |
| `loadingRates` | 환율 불러오는 중... | Loading exchange rates... |
| `staleRate` | 환율 정보가 오래되었을 수 있습니다 | Exchange rate may be outdated |
| `showConverted` | 환산 합계 보기 | Show converted total |
| `hideConverted` | 환산 합계 숨기기 | Hide converted total |

---

## 의존 모듈

- `hooks/use-exchange-rates.ts` — `useExchangeRates()` 훅
- `lib/currency.ts` — `convertCurrency()`, `convertTotalsToCurrency()` 함수
- `types/exchange-rate.ts` — `ExchangeRates` 타입
- `store/settings.store.ts` — `useSettingsStore` (기본 통화 설정)

---

## 환산 로직 요약

환율은 **base=USD** 기준으로 저장됨:
- `X → Y` 환산: `amount * (rates[Y] / rates[X])`
- `X → USD` 환산: `amount / rates[X]`
- `USD → Y` 환산: `amount * rates[Y]`

`convertTotalsToCurrency()` 함수가 통화별 합계를 기준 통화로 환산하여 단일 수입/지출 합계를 반환.
