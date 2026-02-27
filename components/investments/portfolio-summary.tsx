'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Investment } from '@/types/investment'

interface PortfolioSummaryProps {
  investments: Investment[]
}

export function PortfolioSummary({ investments }: PortfolioSummaryProps) {
  const t = useTranslations('money.investments')
  const locale = useLocale()

  // 통화별로 그룹화
  const currencyGroups = new Map<string, { invested: number; value: number; hasPrice: boolean }>()

  for (const inv of investments) {
    const shares = Number(inv.shares)
    const avgCost = Number(inv.avg_cost)
    const currentPrice = inv.current_price != null ? Number(inv.current_price) : null
    const invested = shares * avgCost
    const value = currentPrice != null ? shares * currentPrice : 0
    const hasPrice = currentPrice != null

    const existing = currencyGroups.get(inv.currency) ?? { invested: 0, value: 0, hasPrice: false }
    currencyGroups.set(inv.currency, {
      invested: existing.invested + invested,
      value: existing.value + value,
      hasPrice: existing.hasPrice || hasPrice,
    })
  }

  const totalInvestedByCurrency = Array.from(currencyGroups.entries())
  const missingPriceCount = investments.filter((inv) => inv.current_price == null).length

  function formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  function formatPercent(rate: number): string {
    const sign = rate >= 0 ? '+' : ''
    return `${sign}${rate.toFixed(2)}%`
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {totalInvestedByCurrency.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">{t('noItems')}</p>
        ) : (
          totalInvestedByCurrency.map(([currency, { invested, value, hasPrice }]) => {
            const pnl = value - invested
            const returnRate = invested > 0 ? (pnl / invested) * 100 : 0
            const isPositive = pnl >= 0

            return (
              <div key={currency} className="space-y-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase">{currency}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{t('totalInvested')}</p>
                    <p className="text-sm font-semibold">{formatAmount(invested, currency)}</p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{t('portfolioValue')}</p>
                    {hasPrice ? (
                      <p className="text-sm font-semibold">{formatAmount(value, currency)}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">{t('priceNotSet')}</p>
                    )}
                  </div>
                  {hasPrice && (
                    <>
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">{t('unrealizedPnl')}</p>
                        <p className={`text-sm font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatAmount(pnl, currency)}
                        </p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">{t('returnRate')}</p>
                        <p className={`text-sm font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatPercent(returnRate)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}

        {missingPriceCount > 0 && (
          <p className="text-xs text-muted-foreground">
            * {missingPriceCount}개 종목 {t('priceNotSet')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
