'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ShoppingItem } from '@/types/shopping'

interface ShoppingItemRowProps {
  item: ShoppingItem
  onCheck: (itemId: string, checked: boolean) => void
  onPriceChange: (itemId: string, actualPrice: number | null) => void
  onDelete: (itemId: string) => void
}

export function ShoppingItemRow({ item, onCheck, onPriceChange, onDelete }: ShoppingItemRowProps) {
  const t = useTranslations('shopping')
  const [priceInput, setPriceInput] = useState(
    item.actual_price !== null ? String(item.actual_price) : ''
  )
  const [isPriceEditing, setIsPriceEditing] = useState(false)

  function handleCheck(checked: boolean) {
    onCheck(item.id, checked)
  }

  function handlePriceBlur() {
    setIsPriceEditing(false)
    const val = priceInput === '' ? null : Number(priceInput)
    if (!isNaN(val ?? 0)) {
      onPriceChange(item.id, val)
    }
  }

  return (
    <div className={cn(
      'flex items-center gap-3 py-2 px-1 rounded-md hover:bg-muted/40 group',
      item.is_checked && 'opacity-60'
    )}>
      <Checkbox
        checked={item.is_checked}
        onCheckedChange={(val) => handleCheck(val === true)}
        aria-label={item.name}
      />

      {/* 이름 + 수량 + 단위 */}
      <div className="flex-1 min-w-0">
        <span className={cn(
          'text-sm font-medium',
          item.is_checked && 'line-through text-muted-foreground'
        )}>
          {item.name}
        </span>
        {(item.quantity > 1 || item.unit) && (
          <span className="ml-2 text-xs text-muted-foreground">
            {item.quantity}{item.unit ? ` ${item.unit}` : ''}
          </span>
        )}
        {item.category && (
          <span className="ml-2 text-xs text-muted-foreground/60">· {item.category}</span>
        )}
      </div>

      {/* 실제 가격 입력 */}
      <div className="shrink-0">
        {item.is_checked || isPriceEditing ? (
          <Input
            type="number"
            min={0}
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onBlur={handlePriceBlur}
            onFocus={() => setIsPriceEditing(true)}
            placeholder={t('actual_price')}
            className="h-7 w-28 text-xs"
            autoFocus={isPriceEditing && priceInput === ''}
          />
        ) : (
          <button
            onClick={() => setIsPriceEditing(true)}
            className="text-xs text-muted-foreground hover:text-foreground px-1"
          >
            {item.actual_price !== null
              ? item.actual_price.toLocaleString()
              : item.estimated_price !== null
                ? `~${item.estimated_price.toLocaleString()}`
                : '-'}
          </button>
        )}
      </div>

      {/* 삭제 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(item.id)}
        aria-label={t('delete')}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}
