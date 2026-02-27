'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CreateTradeInput, TradeType } from '@/types/investment'

interface TradeFormProps {
  investmentName: string
  currency: string
  onSubmit: (data: CreateTradeInput) => void
  onCancel: () => void
  isLoading?: boolean
}

export function TradeForm({ investmentName, currency, onSubmit, onCancel, isLoading }: TradeFormProps) {
  const t = useTranslations('money.investments')
  const tc = useTranslations('common')

  const today = new Date().toISOString().slice(0, 10)

  const [tradeType, setTradeType] = useState<TradeType>('buy')
  const [price, setPrice] = useState('')
  const [shares, setShares] = useState('')
  const [fee, setFee] = useState('0')
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')

  const priceNum = parseFloat(price)
  const sharesNum = parseFloat(shares)
  const total = !isNaN(priceNum) && !isNaN(sharesNum) ? priceNum * sharesNum : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isNaN(priceNum) || priceNum <= 0) return
    if (isNaN(sharesNum) || sharesNum <= 0) return

    const input: CreateTradeInput = {
      type: tradeType,
      price: priceNum,
      shares: sharesNum,
      fee: parseFloat(fee) || 0,
      date,
      note: note.trim() || undefined,
    }
    onSubmit(input)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 종목명 표시 */}
      <p className="text-sm text-muted-foreground">{investmentName}</p>

      {/* 매수/매도 탭 */}
      <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as TradeType)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy" disabled={isLoading}>
            {t('buy')}
          </TabsTrigger>
          <TabsTrigger value="sell" disabled={isLoading}>
            {t('sell')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 거래 날짜 */}
      <div className="space-y-1.5">
        <Label htmlFor="trade-date">{tc('date')} *</Label>
        <Input
          id="trade-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {/* 거래단가 */}
      <div className="space-y-1.5">
        <Label htmlFor="trade-price">
          {t('tradePrice')} ({currency}) *
        </Label>
        <Input
          id="trade-price"
          type="number"
          min="0"
          step="any"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          required
          disabled={isLoading}
        />
      </div>

      {/* 거래수량 */}
      <div className="space-y-1.5">
        <Label htmlFor="trade-shares">{t('tradeShares')} *</Label>
        <Input
          id="trade-shares"
          type="number"
          min="0"
          step="any"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          placeholder="0"
          required
          disabled={isLoading}
        />
      </div>

      {/* 합계 미리보기 */}
      {total != null && (
        <p className="text-sm text-muted-foreground">
          합계: {new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          }).format(total)}
        </p>
      )}

      {/* 수수료 */}
      <div className="space-y-1.5">
        <Label htmlFor="trade-fee">
          {t('fee')} ({currency}) <span className="text-muted-foreground text-xs">({tc('optional')})</span>
        </Label>
        <Input
          id="trade-fee"
          type="number"
          min="0"
          step="any"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          placeholder="0"
          disabled={isLoading}
        />
      </div>

      {/* 메모 */}
      <div className="space-y-1.5">
        <Label htmlFor="trade-note">
          {tc('memo')} <span className="text-muted-foreground text-xs">({tc('optional')})</span>
        </Label>
        <Input
          id="trade-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="메모"
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {tc('cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !price || !shares}
          className={tradeType === 'sell' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
        >
          {isLoading ? tc('loading') : (tradeType === 'buy' ? t('buy') : t('sell'))}
        </Button>
      </div>
    </form>
  )
}
