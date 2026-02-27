'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Investment, CreateInvestmentInput, UpdateInvestmentInput, InvestmentType } from '@/types/investment'

const ASSET_TYPES: InvestmentType[] = ['stock', 'etf', 'crypto', 'other']
const CURRENCIES = ['USD', 'KRW', 'CAD']

interface InvestmentFormProps {
  investment?: Investment
  onSubmit: (data: CreateInvestmentInput | UpdateInvestmentInput) => void
  onCancel: () => void
  isLoading?: boolean
}

export function InvestmentForm({ investment, onSubmit, onCancel, isLoading }: InvestmentFormProps) {
  const t = useTranslations('money.investments')
  const tc = useTranslations('common')
  const isEdit = Boolean(investment)

  const [ticker, setTicker] = useState(investment?.ticker ?? '')
  const [name, setName] = useState(investment?.name ?? '')
  const [assetType, setAssetType] = useState<InvestmentType>(investment?.asset_type ?? 'stock')
  const [currency, setCurrency] = useState(investment?.currency ?? 'USD')
  const [exchange, setExchange] = useState(investment?.exchange ?? '')
  const [note, setNote] = useState(investment?.note ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isEdit) {
      const input: UpdateInvestmentInput = {
        name: name.trim() || undefined,
        exchange: exchange.trim() || null,
        note: note.trim() || null,
      }
      onSubmit(input)
    } else {
      const input: CreateInvestmentInput = {
        ticker: ticker.toUpperCase().trim(),
        name: name.trim(),
        asset_type: assetType,
        currency,
        exchange: exchange.trim() || undefined,
        note: note.trim() || undefined,
      }
      onSubmit(input)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && (
        <div className="space-y-1.5">
          <Label htmlFor="ticker">{t('ticker')} *</Label>
          <Input
            id="ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="AAPL, BTC, 005930"
            required
            disabled={isLoading}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="inv-name">{t('name')} *</Label>
        <Input
          id="inv-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Apple Inc."
          required
          disabled={isLoading}
        />
      </div>

      {!isEdit && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="asset-type">{t('assetType')} *</Label>
            <Select value={assetType} onValueChange={(v) => setAssetType(v as InvestmentType)} disabled={isLoading}>
              <SelectTrigger id="asset-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`types.${type}` as Parameters<typeof t>[0])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="currency">{t('currency')} *</Label>
            <Select value={currency} onValueChange={setCurrency} disabled={isLoading}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="exchange">
          {t('exchange')} <span className="text-muted-foreground text-xs">({tc('optional')})</span>
        </Label>
        <Input
          id="exchange"
          value={exchange}
          onChange={(e) => setExchange(e.target.value)}
          placeholder="NASDAQ, TSX, Upbit"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inv-note">
          {tc('memo')} <span className="text-muted-foreground text-xs">({tc('optional')})</span>
        </Label>
        <Input
          id="inv-note"
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? tc('loading') : tc('save')}
        </Button>
      </div>
    </form>
  )
}
