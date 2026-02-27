'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
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

const LISTBOX_ID = 'food-search-listbox'

function getOptionId(foodId: string | number) {
  return `food-option-${foodId}`
}

export function FoodSearchCombobox({
  value,
  onChange,
  onSelect,
  placeholder,
  disabled,
}: FoodSearchComboboxProps) {
  const t = useTranslations('health.meals')
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  // debounce: 타이핑 중 API 과다 호출 방지 (300ms)
  const [debouncedQuery, setDebouncedQuery] = useState(value)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: foods = [], isLoading } = useFoodSearch(debouncedQuery, locale)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    setQuery(value)
    setDebouncedQuery(value)
  }, [value])

  // 검색 결과 변경 시 selectedIndex 초기화
  useEffect(() => {
    setSelectedIndex(-1)
  }, [foods])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSelectedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    onChange(val)
    setOpen(val.length >= 1)
    setSelectedIndex(-1)
  }

  function handleSelect(food: FoodNutrition) {
    setQuery(food.name)
    onChange(food.name)
    onSelect(food)
    setOpen(false)
    setSelectedIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || foods.length === 0) {
      if (e.key === 'Escape') {
        setOpen(false)
        setSelectedIndex(-1)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % foods.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev <= 0 ? foods.length - 1 : prev - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < foods.length) {
          handleSelect(foods[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const activeDescendant =
    open && selectedIndex >= 0 && foods[selectedIndex]
      ? getOptionId(foods[selectedIndex].id)
      : undefined

  return (
    <div ref={containerRef} className="relative">
      <Input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? LISTBOX_ID : undefined}
        aria-activedescendant={activeDescendant}
        aria-autocomplete="list"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 1 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? t('foodNamePlaceholder')}
        disabled={disabled}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {isLoading ? (
            <div className="p-2 text-xs text-muted-foreground">{t('searchingFood')}</div>
          ) : foods.length > 0 ? (
            <ul
              id={LISTBOX_ID}
              role="listbox"
              aria-label={t('foodNamePlaceholder')}
              className="max-h-60 overflow-auto py-1"
            >
              {foods.map((food, index) => (
                <li
                  key={food.id}
                  id={getOptionId(food.id)}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={`flex flex-col px-3 py-2 cursor-pointer hover:bg-accent${index === selectedIndex ? ' bg-accent' : ''}`}
                  onClick={() => handleSelect(food)}
                >
                  <span className="text-sm font-medium">{food.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {food.calories > 0 ? `${food.calories} kcal` : ''} · {food.serving_size}
                  </span>
                </li>
              ))}
            </ul>
          ) : query.length >= 1 ? (
            <div className="p-2 text-xs text-muted-foreground">{t('noFoodResults')}</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
