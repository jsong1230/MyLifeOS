/**
 * lib/currency.ts 단위 테스트
 * 테스트 대상: formatCurrency, formatAmount, formatCurrencyCompact,
 *              parseAmountInput, getCurrencySymbol, getCurrencyDecimals,
 *              calcTotalsByCurrency, convertCurrency, convertTotalsToCurrency
 */
import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatAmount,
  formatCurrencyCompact,
  parseAmountInput,
  getCurrencySymbol,
  getCurrencyDecimals,
  calcTotalsByCurrency,
  convertCurrency,
  convertTotalsToCurrency,
  type TxForTotals,
  type CurrencyTotals,
} from '@/lib/currency'
import type { ExchangeRates } from '@/types/exchange-rate'

// ─────────────────────────────────────────────
// 공통 Mock 환율 데이터
// ─────────────────────────────────────────────
const mockRates: ExchangeRates = {
  base: 'USD',
  date: '2024-01-01',
  rates: { KRW: 1350, CAD: 1.36, USD: 1 },
}

// ─────────────────────────────────────────────
// formatCurrency
// ─────────────────────────────────────────────
describe('formatCurrency', () => {
  describe('KRW', () => {
    it('양수 금액에 ₩ 기호와 천 단위 구분자를 붙여 반환한다', () => {
      expect(formatCurrency(1_234_567, 'KRW')).toBe('₩1,234,567')
    })

    it('음수 금액에 마이너스 부호와 ₩ 기호를 붙여 반환한다', () => {
      expect(formatCurrency(-50_000, 'KRW')).toBe('-₩50,000')
    })

    it('0원을 ₩0으로 반환한다', () => {
      expect(formatCurrency(0, 'KRW')).toBe('₩0')
    })

    it('1,000 미만 금액도 ₩ 기호와 함께 반환한다', () => {
      expect(formatCurrency(500, 'KRW')).toBe('₩500')
    })

    it('기본값(currency 생략)은 KRW로 처리한다', () => {
      expect(formatCurrency(10_000)).toBe('₩10,000')
    })
  })

  describe('CAD', () => {
    it('양수 금액에 CA$ 기호와 소수점 2자리를 붙여 반환한다', () => {
      expect(formatCurrency(1_234.56, 'CAD')).toBe('CA$1,234.56')
    })

    it('정수 CAD 금액에 .00을 붙여 반환한다', () => {
      expect(formatCurrency(100, 'CAD')).toBe('CA$100.00')
    })

    it('음수 CAD 금액에 마이너스 부호와 CA$ 기호를 붙여 반환한다', () => {
      expect(formatCurrency(-99.99, 'CAD')).toBe('-CA$99.99')
    })
  })

  describe('USD', () => {
    it('양수 금액에 $ 기호와 소수점 2자리를 붙여 반환한다', () => {
      expect(formatCurrency(9_999.99, 'USD')).toBe('$9,999.99')
    })

    it('정수 USD 금액에 .00을 붙여 반환한다', () => {
      expect(formatCurrency(1_000, 'USD')).toBe('$1,000.00')
    })

    it('음수 USD 금액에 마이너스 부호와 $ 기호를 붙여 반환한다', () => {
      expect(formatCurrency(-12.5, 'USD')).toBe('-$12.50')
    })

    it('0 USD를 $0.00으로 반환한다', () => {
      expect(formatCurrency(0, 'USD')).toBe('$0.00')
    })
  })
})

// ─────────────────────────────────────────────
// formatAmount
// ─────────────────────────────────────────────
describe('formatAmount', () => {
  it('KRW 금액을 기호 없이 천 단위 구분자만 붙여 반환한다', () => {
    expect(formatAmount(1_234_567, 'KRW')).toBe('1,234,567')
  })

  it('CAD 금액을 기호 없이 소수점 2자리로 반환한다', () => {
    expect(formatAmount(1_234.56, 'CAD')).toBe('1,234.56')
  })

  it('USD 금액을 기호 없이 소수점 2자리로 반환한다', () => {
    expect(formatAmount(9_999.99, 'USD')).toBe('9,999.99')
  })

  it('기본값(currency 생략)은 KRW로 처리하여 기호 없이 반환한다', () => {
    expect(formatAmount(50_000)).toBe('50,000')
  })

  it('0을 기호 없이 반환한다 (KRW)', () => {
    expect(formatAmount(0, 'KRW')).toBe('0')
  })

  it('정수 USD 금액에 소수점을 붙여 반환한다', () => {
    expect(formatAmount(100, 'USD')).toBe('100.00')
  })
})

// ─────────────────────────────────────────────
// formatCurrencyCompact
// ─────────────────────────────────────────────
describe('formatCurrencyCompact', () => {
  describe('KRW + ko 로케일', () => {
    it('1억 이상 금액을 N.N억으로 축약한다', () => {
      expect(formatCurrencyCompact(120_000_000, 'KRW', 'ko')).toBe('1.2억')
    })

    it('정확히 1억을 1.0억으로 반환한다', () => {
      expect(formatCurrencyCompact(100_000_000, 'KRW', 'ko')).toBe('1.0억')
    })

    it('1만 이상 1억 미만 금액을 N만으로 축약한다', () => {
      expect(formatCurrencyCompact(3_450_000, 'KRW', 'ko')).toBe('345만')
    })

    it('정확히 1만을 1만으로 반환한다', () => {
      expect(formatCurrencyCompact(10_000, 'KRW', 'ko')).toBe('1만')
    })

    it('1만 미만 금액을 그대로 반환한다', () => {
      expect(formatCurrencyCompact(1_234, 'KRW', 'ko')).toBe('1,234')
    })

    it('음수 억 단위 금액에 마이너스 부호를 붙여 반환한다', () => {
      expect(formatCurrencyCompact(-200_000_000, 'KRW', 'ko')).toBe('-2.0억')
    })

    it('음수 만 단위 금액에 마이너스 부호를 붙여 반환한다', () => {
      expect(formatCurrencyCompact(-50_000, 'KRW', 'ko')).toBe('-5만')
    })
  })

  describe('KRW + en 로케일', () => {
    it('1M 이상 금액을 N.NM으로 축약한다', () => {
      expect(formatCurrencyCompact(120_000_000, 'KRW', 'en')).toBe('120.0M')
    })

    it('1K 이상 1M 미만 금액을 N.NK로 축약한다', () => {
      expect(formatCurrencyCompact(34_500, 'KRW', 'en')).toBe('34.5K')
    })

    it('1K 미만 금액을 그대로 반환한다', () => {
      expect(formatCurrencyCompact(999, 'KRW', 'en')).toBe('999')
    })

    it('음수 KRW en 금액에 마이너스 부호를 붙여 반환한다', () => {
      expect(formatCurrencyCompact(-2_000_000, 'KRW', 'en')).toBe('-2.0M')
    })
  })

  describe('USD', () => {
    it('1M 이상 USD 금액을 N.NM으로 축약한다', () => {
      expect(formatCurrencyCompact(1_200_000, 'USD', 'ko')).toBe('1.2M')
    })

    it('1K 이상 1M 미만 USD 금액을 N.NK로 축약한다', () => {
      expect(formatCurrencyCompact(345_000, 'USD', 'ko')).toBe('345.0K')
    })

    it('1K 미만 USD 금액을 소수점 2자리로 반환한다', () => {
      expect(formatCurrencyCompact(123.45, 'USD', 'ko')).toBe('123.45')
    })

    it('음수 USD 금액에 마이너스 부호를 붙여 반환한다', () => {
      expect(formatCurrencyCompact(-5_000, 'USD', 'ko')).toBe('-5.0K')
    })
  })

  describe('CAD', () => {
    it('1M 이상 CAD 금액을 N.NM으로 축약한다', () => {
      expect(formatCurrencyCompact(2_500_000, 'CAD', 'en')).toBe('2.5M')
    })

    it('1K 이상 1M 미만 CAD 금액을 N.NK로 축약한다', () => {
      expect(formatCurrencyCompact(1_500, 'CAD', 'en')).toBe('1.5K')
    })

    it('1K 미만 CAD 금액을 소수점 2자리로 반환한다', () => {
      expect(formatCurrencyCompact(99.9, 'CAD', 'en')).toBe('99.90')
    })

    it('음수 CAD K 단위 금액에 마이너스 부호를 붙여 반환한다', () => {
      expect(formatCurrencyCompact(-3_000, 'CAD', 'en')).toBe('-3.0K')
    })
  })
})

// ─────────────────────────────────────────────
// parseAmountInput
// ─────────────────────────────────────────────
describe('parseAmountInput', () => {
  describe('KRW', () => {
    it('정수 문자열을 정수로 파싱한다', () => {
      expect(parseAmountInput('1234567', 'KRW')).toBe(1_234_567)
    })

    it('쉼표가 포함된 문자열을 정수로 파싱한다', () => {
      expect(parseAmountInput('1,234,567', 'KRW')).toBe(1_234_567)
    })

    it('소수점이 포함된 입력을 반올림하여 정수로 반환한다', () => {
      expect(parseAmountInput('1234.9', 'KRW')).toBe(1_235)
    })

    it('빈 문자열 입력에 0을 반환한다', () => {
      expect(parseAmountInput('', 'KRW')).toBe(0)
    })

    it('숫자가 아닌 문자만 포함된 입력에 0을 반환한다', () => {
      expect(parseAmountInput('abc', 'KRW')).toBe(0)
    })

    it('특수문자가 섞인 입력에서 숫자만 파싱한다', () => {
      expect(parseAmountInput('₩50,000', 'KRW')).toBe(50_000)
    })

    it('기본값(currency 생략)은 KRW로 처리하여 정수를 반환한다', () => {
      expect(parseAmountInput('9999')).toBe(9_999)
    })
  })

  describe('CAD', () => {
    it('소수점 2자리 문자열을 소수점 2자리로 파싱한다', () => {
      expect(parseAmountInput('1234.56', 'CAD')).toBe(1_234.56)
    })

    it('쉼표가 포함된 CAD 문자열을 소수점 2자리로 파싱한다', () => {
      expect(parseAmountInput('1,234.56', 'CAD')).toBe(1_234.56)
    })

    it('정수 문자열을 소수점 없이 반환한다', () => {
      expect(parseAmountInput('100', 'CAD')).toBe(100)
    })

    it('빈 문자열 입력에 0을 반환한다 (CAD)', () => {
      expect(parseAmountInput('', 'CAD')).toBe(0)
    })

    it('잘못된 입력(문자열만)에 0을 반환한다 (CAD)', () => {
      expect(parseAmountInput('not-a-number', 'CAD')).toBe(0)
    })
  })

  describe('USD', () => {
    it('소수점 3자리 이상 입력을 소수점 2자리로 반올림한다', () => {
      expect(parseAmountInput('9.999', 'USD')).toBe(10)
    })

    it('달러 기호가 포함된 입력에서 숫자를 파싱한다', () => {
      expect(parseAmountInput('$99.99', 'USD')).toBe(99.99)
    })

    it('빈 문자열 입력에 0을 반환한다 (USD)', () => {
      expect(parseAmountInput('', 'USD')).toBe(0)
    })
  })
})

// ─────────────────────────────────────────────
// getCurrencySymbol
// ─────────────────────────────────────────────
describe('getCurrencySymbol', () => {
  it('KRW의 기호로 ₩을 반환한다', () => {
    expect(getCurrencySymbol('KRW')).toBe('₩')
  })

  it('CAD의 기호로 CA$를 반환한다', () => {
    expect(getCurrencySymbol('CAD')).toBe('CA$')
  })

  it('USD의 기호로 $를 반환한다', () => {
    expect(getCurrencySymbol('USD')).toBe('$')
  })
})

// ─────────────────────────────────────────────
// getCurrencyDecimals
// ─────────────────────────────────────────────
describe('getCurrencyDecimals', () => {
  it('KRW의 소수점 자리 수로 0을 반환한다', () => {
    expect(getCurrencyDecimals('KRW')).toBe(0)
  })

  it('CAD의 소수점 자리 수로 2를 반환한다', () => {
    expect(getCurrencyDecimals('CAD')).toBe(2)
  })

  it('USD의 소수점 자리 수로 2를 반환한다', () => {
    expect(getCurrencyDecimals('USD')).toBe(2)
  })
})

// ─────────────────────────────────────────────
// calcTotalsByCurrency
// ─────────────────────────────────────────────
describe('calcTotalsByCurrency', () => {
  it('빈 배열을 받으면 빈 객체를 반환한다', () => {
    expect(calcTotalsByCurrency([])).toEqual({})
  })

  it('KRW 수입 거래만 있는 경우 KRW income 합계를 반환한다', () => {
    const txs: TxForTotals[] = [
      { type: 'income', amount: 3_000_000, currency: 'KRW' },
      { type: 'income', amount: 500_000, currency: 'KRW' },
    ]
    expect(calcTotalsByCurrency(txs)).toEqual({
      KRW: { income: 3_500_000, expense: 0 },
    })
  })

  it('KRW 수입과 지출이 혼합된 경우 각각 합산한다', () => {
    const txs: TxForTotals[] = [
      { type: 'income', amount: 5_000_000, currency: 'KRW' },
      { type: 'expense', amount: 200_000, currency: 'KRW' },
      { type: 'expense', amount: 100_000, currency: 'KRW' },
    ]
    expect(calcTotalsByCurrency(txs)).toEqual({
      KRW: { income: 5_000_000, expense: 300_000 },
    })
  })

  it('KRW + USD + CAD 혼합 거래의 통화별 합계를 각각 반환한다', () => {
    const txs: TxForTotals[] = [
      { type: 'income', amount: 6_500_000, currency: 'KRW' },
      { type: 'expense', amount: 300_000, currency: 'KRW' },
      { type: 'expense', amount: 12.99, currency: 'USD' },
      { type: 'income', amount: 500, currency: 'CAD' },
    ]
    const result = calcTotalsByCurrency(txs)
    expect(result.KRW).toEqual({ income: 6_500_000, expense: 300_000 })
    expect(result.USD).toEqual({ income: 0, expense: 12.99 })
    expect(result.CAD).toEqual({ income: 500, expense: 0 })
  })

  it('currency가 null인 거래는 KRW로 기본 처리한다', () => {
    const txs: TxForTotals[] = [
      { type: 'income', amount: 100_000, currency: null },
    ]
    expect(calcTotalsByCurrency(txs)).toEqual({
      KRW: { income: 100_000, expense: 0 },
    })
  })

  it('currency가 undefined인 거래는 KRW로 기본 처리한다', () => {
    const txs: TxForTotals[] = [
      { type: 'expense', amount: 50_000, currency: undefined },
    ]
    expect(calcTotalsByCurrency(txs)).toEqual({
      KRW: { income: 0, expense: 50_000 },
    })
  })

  it('currency 필드가 없는 거래는 KRW로 기본 처리한다', () => {
    const txs: TxForTotals[] = [
      { type: 'income', amount: 200_000 },
    ]
    expect(calcTotalsByCurrency(txs)).toEqual({
      KRW: { income: 200_000, expense: 0 },
    })
  })

  it('같은 통화 내에서 income과 expense를 분리하여 집계한다', () => {
    const txs: TxForTotals[] = [
      { type: 'income', amount: 1_000, currency: 'USD' },
      { type: 'expense', amount: 250.5, currency: 'USD' },
      { type: 'income', amount: 500, currency: 'USD' },
      { type: 'expense', amount: 100, currency: 'USD' },
    ]
    const result = calcTotalsByCurrency(txs)
    expect(result.USD.income).toBe(1_500)
    expect(result.USD.expense).toBeCloseTo(350.5, 2)
  })
})

// ─────────────────────────────────────────────
// convertCurrency
// ─────────────────────────────────────────────
describe('convertCurrency', () => {
  it('같은 통화(KRW→KRW) 변환 시 동일 금액을 그대로 반환한다', () => {
    expect(convertCurrency(100_000, 'KRW', 'KRW', mockRates)).toBe(100_000)
  })

  it('KRW → USD 변환 시 rates[KRW]로 나눠 환산한다', () => {
    // 1_350_000 KRW / 1350 = 1000.00 USD
    expect(convertCurrency(1_350_000, 'KRW', 'USD', mockRates)).toBe(1_000)
  })

  it('USD → KRW 변환 시 rates[KRW]를 곱해 환산한다', () => {
    // 100 USD * 1350 = 135000 KRW
    expect(convertCurrency(100, 'USD', 'KRW', mockRates)).toBe(135_000)
  })

  it('CAD → KRW 변환 시 USD 경유로 정확히 환산한다', () => {
    // 1 CAD → 1/1.36 USD → (1/1.36)*1350 KRW ≈ 992.65 KRW
    const result = convertCurrency(1, 'CAD', 'KRW', mockRates)
    expect(result).toBeCloseTo(992.65, 2)
  })

  it('KRW → CAD 변환 시 USD 경유로 정확히 환산한다', () => {
    // 1350 KRW → 1 USD → 1.36 CAD
    const result = convertCurrency(1_350, 'KRW', 'CAD', mockRates)
    expect(result).toBeCloseTo(1.36, 2)
  })

  it('USD → CAD 변환 시 rates[CAD]를 곱해 환산한다', () => {
    // 100 USD * 1.36 = 136.00 CAD
    expect(convertCurrency(100, 'USD', 'CAD', mockRates)).toBe(136)
  })

  it('환율 데이터에 없는 통화 변환 시 0을 반환한다', () => {
    const ratesWithoutCAD: ExchangeRates = {
      base: 'USD',
      date: '2024-01-01',
      rates: { KRW: 1350, USD: 1 }, // CAD 없음
    }
    expect(convertCurrency(100, 'CAD', 'KRW', ratesWithoutCAD)).toBe(0)
  })

  it('변환 결과를 소수점 2자리로 반올림하여 반환한다', () => {
    // 1000 KRW / 1350 = 0.740740... USD → 0.74
    const result = convertCurrency(1_000, 'KRW', 'USD', mockRates)
    expect(result).toBe(0.74)
  })
})

// ─────────────────────────────────────────────
// convertTotalsToCurrency
// ─────────────────────────────────────────────
describe('convertTotalsToCurrency', () => {
  it('단일 통화(KRW) 합계를 KRW 기준으로 변환 시 동일 값을 반환한다', () => {
    const totals: Record<string, CurrencyTotals> = {
      KRW: { income: 5_000_000, expense: 300_000 },
    }
    const result = convertTotalsToCurrency(totals, 'KRW', mockRates)
    expect(result.income).toBe(5_000_000)
    expect(result.expense).toBe(300_000)
  })

  it('복수 통화(KRW + USD) 합계를 KRW 기준으로 합산하여 반환한다', () => {
    const totals: Record<string, CurrencyTotals> = {
      KRW: { income: 1_350_000, expense: 0 },
      USD: { income: 100, expense: 0 },
      // 1_350_000 KRW = 1_350_000 KRW (변환 불필요)
      // 100 USD * 1350 = 135_000 KRW
    }
    const result = convertTotalsToCurrency(totals, 'KRW', mockRates)
    expect(result.income).toBeCloseTo(1_350_000 + 135_000, 0)
    expect(result.expense).toBe(0)
  })

  it('income과 expense 각각 정확히 변환하여 반환한다', () => {
    const totals: Record<string, CurrencyTotals> = {
      USD: { income: 1_000, expense: 500 },
    }
    // 1000 USD * 1350 = 1_350_000 KRW (income)
    // 500 USD * 1350 = 675_000 KRW (expense)
    const result = convertTotalsToCurrency(totals, 'KRW', mockRates)
    expect(result.income).toBe(1_350_000)
    expect(result.expense).toBe(675_000)
  })

  it('빈 totals({})를 입력하면 income=0, expense=0을 반환한다', () => {
    const result = convertTotalsToCurrency({}, 'KRW', mockRates)
    expect(result.income).toBe(0)
    expect(result.expense).toBe(0)
  })
})
