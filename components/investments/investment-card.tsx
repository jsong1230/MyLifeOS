'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, TrendingUp, Check, X } from 'lucide-react'
import type { Investment } from '@/types/investment'

interface InvestmentCardProps {
  investment: Investment
  onEdit: (investment: Investment) => void
  onDelete: (investment: Investment) => void
  onTrade: (investment: Investment) => void
  onUpdatePrice: (id: string, price: number | null) => void
  isUpdating?: boolean
}

export function InvestmentCard({
  investment,
  onEdit,
  onDelete,
  onTrade,
  onUpdatePrice,
  isUpdating,
}: InvestmentCardProps) {
  const t = useTranslations('money.investments')
  const locale = useLocale()
  const [editingPrice, setEditingPrice] = useState(false)
  const [priceInput, setPriceInput] = useState('')

  const shares = Number(investment.shares)
  const avgCost = Number(investment.avg_cost)
  const currentPrice = investment.current_price != null ? Number(investment.current_price) : null

  const invested = shares * avgCost
  const portfolioValue = currentPrice != null ? shares * currentPrice : null
  const pnl = portfolioValue != null ? portfolioValue - invested : null
  const returnRate = pnl != null && invested > 0 ? (pnl / invested) * 100 : null

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: investment.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount)
  }

  function formatShares(n: number): string {
    // 소수점 최대 6자리까지
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }).format(n)
  }

  function getBadgeVariant(type: string) {
    switch (type) {
      case 'stock': return 'default'
      case 'etf': return 'secondary'
      case 'crypto': return 'outline'
      default: return 'outline'
    }
  }

  function handlePriceEditStart() {
    setPriceInput(currentPrice != null ? String(currentPrice) : '')
    setEditingPrice(true)
  }

  function handlePriceSave() {
    const parsed = parseFloat(priceInput)
    if (priceInput === '') {
      onUpdatePrice(investment.id, null)
    } else if (!isNaN(parsed) && parsed >= 0) {
      onUpdatePrice(investment.id, parsed)
    }
    setEditingPrice(false)
  }

  function handlePriceCancel() {
    setEditingPrice(false)
    setPriceInput('')
  }

  const isPositive = pnl != null && pnl >= 0

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* 헤더: 티커 + 이름 + 배지 + 액션 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base">{investment.ticker}</span>
              <Badge variant={getBadgeVariant(investment.asset_type)} className="text-xs shrink-0">
                {t(`types.${investment.asset_type}` as Parameters<typeof t>[0])}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{investment.name}</p>
            {investment.exchange && (
              <p className="text-xs text-muted-foreground">{investment.exchange}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onTrade(investment)}
              title={t('trade')}
            >
              <TrendingUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(investment)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(investment)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* 수량/단가 정보 */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">{t('shares')}</p>
            <p className="text-sm font-medium">{formatShares(shares)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('avgCost')}</p>
            <p className="text-sm font-medium">{formatAmount(avgCost)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('currentPrice')}</p>
            {editingPrice ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="h-6 text-xs px-1 w-16"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePriceSave()
                    if (e.key === 'Escape') handlePriceCancel()
                  }}
                />
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handlePriceSave} disabled={isUpdating}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handlePriceCancel}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePriceEditStart}
                className="text-sm font-medium hover:underline focus:outline-none"
                title={t('updatePrice')}
              >
                {currentPrice != null ? formatAmount(currentPrice) : (
                  <span className="text-xs text-muted-foreground">{t('priceNotSet')}</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 평가손익 */}
        {pnl != null && returnRate != null && (
          <div className="flex items-center justify-between pt-1 border-t">
            <span className="text-xs text-muted-foreground">{t('unrealizedPnl')}</span>
            <div className="text-right">
              <span className={`text-sm font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isPositive ? '+' : ''}{formatAmount(pnl)}
              </span>
              <span className={`text-xs ml-1.5 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ({isPositive ? '+' : ''}{returnRate.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}

        {/* 메모 */}
        {investment.note && (
          <p className="text-xs text-muted-foreground border-t pt-1">{investment.note}</p>
        )}
      </CardContent>
    </Card>
  )
}
