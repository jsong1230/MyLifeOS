# F-11 지출 현황 대시보드 컴포넌트 문서

## 개요

이번달 수입/지출/잔액 요약, 카테고리별 지출 파이 차트, 예산 대비 지출 바 차트를 표시하는 금전 관리 대시보드입니다.

---

## 파일 구성

| 파일 | 역할 |
|------|------|
| `hooks/use-transactions.ts` | 거래 목록 조회/CUD mutation 훅 |
| `hooks/use-budgets.ts` | 예산 현황 조회/CUD mutation 훅 |
| `components/money/summary-cards.tsx` | 수입/지출/잔액 요약 카드 |
| `components/money/expense-pie-chart.tsx` | 카테고리별 지출 비율 파이 차트 |
| `components/money/expense-bar-chart.tsx` | 예산 대비 지출 바 차트 |
| `app/(dashboard)/money/page.tsx` | 대시보드 페이지 통합 |

---

## SummaryCards

### 역할
이번달 총 수입, 총 지출, 잔액(수입-지출) 3개 카드를 표시합니다.

### Props

```typescript
interface SummaryCardsProps {
  transactions: Transaction[]
}
```

### 동작
- `type === 'income'` 합산 → 수입 (파란색)
- `type === 'expense'` 합산 → 지출 (빨간색)
- 잔액 = 수입 - 지출, 양수 = 초록, 음수 = 빨강 + `-` 접두어
- 금액 포맷: `toLocaleString('ko-KR') + '원'`

---

## ExpensePieChart

### 역할
카테고리별 지출 비율을 Recharts PieChart로 시각화합니다.

### Props

```typescript
interface ExpensePieChartProps {
  transactions: Transaction[]
}
```

### 동작
- `type === 'expense'` 거래만 집계
- `category_id` 기준 그루핑, 미분류는 `'unknown'` 키로 집계
- 슬라이스 색상: `category.color` 우선, 없으면 기본 팔레트 순환
- 5% 미만 슬라이스는 내부 라벨 생략
- 지출 내역 없음: `"이번달 지출 내역이 없습니다"` 메시지 표시

### 기본 색상 팔레트
`indigo`, `amber`, `emerald`, `red`, `violet`, `pink`, `teal`, `orange`, `blue`, `lime` (10색 순환)

---

## ExpenseBarChart

### 역할
카테고리별 예산(회색)과 실제 지출(달성률 기반 색상)을 그룹 바 차트로 표시합니다.

### Props

```typescript
interface ExpenseBarChartProps {
  budgets: BudgetStatus[]
}
```

### 지출 바 색상 규칙

| 달성률 | 색상 |
|--------|------|
| 80% 미만 | 파랑 (`#3b82f6`) |
| 80% ~ 100% | 주황 (`#f97316`) |
| 100% 초과 | 빨강 (`#ef4444`) |

### 동작
- 예산 없음: `"설정된 예산이 없습니다"` 메시지 표시
- Y축: 1만원 이상이면 `N만` 형식으로 축약

---

## useTransactions

```typescript
// 조회
useTransactions(filter?: TransactionFilter): UseQueryResult<Transaction[]>

// 생성
useCreateTransaction(): UseMutationResult<Transaction, Error, CreateTransactionInput>

// 수정
useUpdateTransaction(): UseMutationResult<Transaction, Error, { id: string; input: UpdateTransactionInput }>

// 삭제
useDeleteTransaction(): UseMutationResult<void, Error, string>
```

### TransactionFilter

```typescript
interface TransactionFilter {
  type?: 'income' | 'expense'
  category_id?: string
  date_from?: string   // YYYY-MM-DD
  date_to?: string     // YYYY-MM-DD
  month?: string       // YYYY-MM
  is_favorite?: boolean
}
```

---

## useBudgets

```typescript
// 조회
useBudgets(month?: string): UseQueryResult<BudgetStatus[]>

// 생성/수정 (upsert)
useUpsertBudget(): UseMutationResult<Budget, Error, CreateBudgetInput>

// 삭제
useDeleteBudget(): UseMutationResult<void, Error, string>

// 금액 수정
useUpdateBudget(): UseMutationResult<Budget, Error, { id: string; input: UpdateBudgetInput }>
```

---

## MoneyPage 레이아웃

```
┌─────────────────────────────────────┐
│  지출 현황        < 2026년 02월 >   │
├─────────────────────────────────────┤
│  [수입]    [지출]    [잔액]         │  ← SummaryCards (3열)
├──────────────────┬──────────────────┤
│  카테고리별      │  예산 대비       │  ← lg:grid-cols-2
│  지출 비율 (Pie) │  지출 현황 (Bar) │
└──────────────────┴──────────────────┘
```

- 모바일: 세로 스택 (`grid-cols-1`)
- 데스크탑(lg): 2열 그리드 (`lg:grid-cols-2`)
- 로딩 중: 스켈레톤 카드 표시 (`animate-pulse`)
- 에러: destructive 색상 경고 배너 표시
