'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CreateShoppingItemInput } from '@/types/shopping'

interface ShoppingItemFormProps {
  listId: string
  onAdd: (input: CreateShoppingItemInput) => void
  isLoading?: boolean
}

const UNITS = ['개', 'kg', 'g', 'L', 'mL', '봉', '캔', '팩', '병']
const CATEGORIES = ['식품', '음료', '생활용품', '위생용품', '간식', '조미료', '유제품', '채소', '과일', '육류', '기타']

export function ShoppingItemForm({ listId, onAdd, isLoading }: ShoppingItemFormProps) {
  const t = useTranslations('shopping')
  const tc = useTranslations('common')

  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('')
  const [estimatedPrice, setEstimatedPrice] = useState('')
  const [category, setCategory] = useState('')
  const [expanded, setExpanded] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    onAdd({
      list_id: listId,
      name: name.trim(),
      quantity: quantity ? Number(quantity) : 1,
      unit: unit || undefined,
      estimated_price: estimatedPrice ? Number(estimatedPrice) : undefined,
      category: category || undefined,
    })

    setName('')
    setQuantity('1')
    setUnit('')
    setEstimatedPrice('')
    setCategory('')
    setExpanded(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (name.trim()) handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* 기본 입력줄 */}
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('item_name')}
          className="flex-1"
          aria-label={t('item_name')}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-xs text-muted-foreground"
        >
          {expanded ? tc('cancel') : tc('optional')}
        </Button>
        <Button
          type="submit"
          size="icon"
          disabled={!name.trim() || isLoading}
          aria-label={t('add_item')}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* 추가 옵션 (수량, 단위, 예상가격, 카테고리) */}
      {expanded && (
        <div className="grid grid-cols-2 gap-2 pl-1">
          <div className="flex gap-1">
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={t('quantity')}
              className="w-16 text-sm"
              aria-label={t('quantity')}
            />
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="flex-1 text-sm h-9" aria-label={t('unit')}>
                <SelectValue placeholder={t('unit')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{tc('none')}</SelectItem>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            type="number"
            min={0}
            value={estimatedPrice}
            onChange={(e) => setEstimatedPrice(e.target.value)}
            placeholder={t('estimated_price')}
            className="text-sm"
            aria-label={t('estimated_price')}
          />

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="col-span-2 text-sm h-9" aria-label={t('category')}>
              <SelectValue placeholder={t('category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{tc('none')}</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </form>
  )
}
