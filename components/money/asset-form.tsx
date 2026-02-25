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
import { formatAmount } from '@/lib/currency'
import { ASSET_TYPE_LABEL, type Asset, type AssetType, type CreateAssetInput } from '@/types/asset'

interface AssetFormProps {
  asset?: Asset
  defaultMonth: string  // YYYY-MM
  onSubmit: (data: CreateAssetInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

// 콤마 제거 후 숫자로
function parseAmount(value: string): number {
  return Number(value.replace(/,/g, ''))
}

export function AssetForm({ asset, defaultMonth, onSubmit, onCancel, isLoading = false }: AssetFormProps) {
  const t = useTranslations('money.assets')
  const tc = useTranslations('common')
  const [assetType, setAssetType] = useState<AssetType>(asset?.asset_type ?? 'cash')
  const [amountDisplay, setAmountDisplay] = useState<string>(
    asset ? formatAmount(asset.amount, 'KRW') : ''
  )
  const [note, setNote] = useState<string>(asset?.note ?? '')
  const [amountError, setAmountError] = useState<string>('')

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    if (raw === '') {
      setAmountDisplay('')
      return
    }
    const num = parseInt(raw, 10)
    if (!isNaN(num)) {
      setAmountDisplay(formatAmount(num, 'KRW'))
    }
    setAmountError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseAmount(amountDisplay)
    if (!amountDisplay || isNaN(amount) || amount < 0) {
      setAmountError(t('amountError'))
      return
    }
    onSubmit({
      asset_type: assetType,
      amount,
      note: note.trim() || undefined,
      month: asset?.month ?? defaultMonth,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 자산 유형 */}
      <div className="space-y-1.5">
        <Label htmlFor="asset-type">{t('type')} <span className="text-destructive">*</span></Label>
        <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
          <SelectTrigger id="asset-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ASSET_TYPE_LABEL) as AssetType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {t(`types.${type}` as Parameters<typeof t>[0])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 금액 */}
      <div className="space-y-1.5">
        <Label htmlFor="asset-amount">{tc('amount')} <span className="text-destructive">*</span></Label>
        <Input
          id="asset-amount"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={amountDisplay}
          onChange={handleAmountChange}
          className={amountError ? 'border-destructive' : ''}
        />
        {amountError && <p className="text-xs text-destructive">{amountError}</p>}
      </div>

      {/* 메모 */}
      <div className="space-y-1.5">
        <Label htmlFor="asset-note">{tc('memo')} ({tc('optional')})</Label>
        <Input
          id="asset-note"
          type="text"
          placeholder={t('notePlaceholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
            {tc('cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? tc('saving') : asset ? tc('update') : tc('add')}
        </Button>
      </div>
    </form>
  )
}
