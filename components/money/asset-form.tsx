'use client'

import { useState } from 'react'
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
import { ASSET_TYPE_LABEL, type Asset, type AssetType, type CreateAssetInput } from '@/types/asset'

interface AssetFormProps {
  asset?: Asset
  defaultMonth: string  // YYYY-MM
  onSubmit: (data: CreateAssetInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

// 숫자를 천 단위 콤마 포맷으로
function formatAmount(value: string): string {
  const num = parseInt(value.replace(/[^0-9]/g, ''), 10)
  if (isNaN(num)) return ''
  return num.toLocaleString('ko-KR')
}

// 콤마 제거 후 숫자로
function parseAmount(value: string): number {
  return Number(value.replace(/,/g, ''))
}

export function AssetForm({ asset, defaultMonth, onSubmit, onCancel, isLoading = false }: AssetFormProps) {
  const [assetType, setAssetType] = useState<AssetType>(asset?.asset_type ?? 'cash')
  const [amountDisplay, setAmountDisplay] = useState<string>(
    asset ? formatAmount(String(asset.amount)) : ''
  )
  const [note, setNote] = useState<string>(asset?.note ?? '')
  const [amountError, setAmountError] = useState<string>('')

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    if (raw === '') {
      setAmountDisplay('')
      return
    }
    setAmountDisplay(formatAmount(raw))
    setAmountError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseAmount(amountDisplay)
    if (!amountDisplay || isNaN(amount) || amount < 0) {
      setAmountError('금액을 올바르게 입력해주세요')
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
        <Label htmlFor="asset-type">자산 유형 <span className="text-destructive">*</span></Label>
        <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
          <SelectTrigger id="asset-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(ASSET_TYPE_LABEL) as [AssetType, string][]).map(([type, label]) => (
              <SelectItem key={type} value={type}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 금액 */}
      <div className="space-y-1.5">
        <Label htmlFor="asset-amount">금액 <span className="text-destructive">*</span></Label>
        <div className="relative">
          <Input
            id="asset-amount"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amountDisplay}
            onChange={handleAmountChange}
            className={amountError ? 'border-destructive pr-8' : 'pr-8'}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">원</span>
        </div>
        {amountError && <p className="text-xs text-destructive">{amountError}</p>}
      </div>

      {/* 메모 */}
      <div className="space-y-1.5">
        <Label htmlFor="asset-note">메모 (선택)</Label>
        <Input
          id="asset-note"
          type="text"
          placeholder="예: 국민은행 정기예금"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
            취소
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? '저장 중...' : asset ? '수정하기' : '추가하기'}
        </Button>
      </div>
    </form>
  )
}
