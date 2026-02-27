'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { useFoodSearch } from '@/hooks/use-food-search'
import type { FoodNutrition } from '@/types/food'

interface FoodSearchComboboxProps {
  value: string
  onChange: (value: string) => void
  onSelect: (food: FoodNutrition) => void
  placeholder?: string
  disabled?: boolean
}

export function FoodSearchCombobox({
  value,
  onChange,
  onSelect,
  placeholder,
  disabled,
}: FoodSearchComboboxProps) {
  const t = useTranslations('health.meals')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: foods = [], isLoading } = useFoodSearch(query)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    onChange(val)
    setOpen(val.length >= 2)
  }

  function handleSelect(food: FoodNutrition) {
    setQuery(food.name)
    onChange(food.name)
    onSelect(food)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 2 && setOpen(true)}
        placeholder={placeholder ?? t('foodNamePlaceholder')}
        disabled={disabled}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {isLoading ? (
            <div className="p-2 text-xs text-muted-foreground">{t('searchingFood')}</div>
          ) : foods.length > 0 ? (
            <ul className="max-h-60 overflow-auto py-1">
              {foods.map((food) => (
                <li
                  key={food.id}
                  role="option"
                  className="flex flex-col px-3 py-2 cursor-pointer hover:bg-accent"
                  onClick={() => handleSelect(food)}
                >
                  <span className="text-sm font-medium">{food.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {food.calories > 0 ? `${food.calories} kcal` : ''} · {food.serving_size}
                  </span>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 ? (
            <div className="p-2 text-xs text-muted-foreground">{t('noFoodResults')}</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
