'use client'

import { useState, useEffect } from 'react'
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
import { cn } from '@/lib/utils'
import type { Category, CategoryType, CreateCategoryInput, UpdateCategoryInput } from '@/types/category'

// 기본 색상 팔레트
const PRESET_COLORS = [
  '#FF6B6B', '#FF8E72', '#FFA940', '#FFCC00',
  '#47CF73', '#4ECDC4', '#45B7D1', '#6C5CE7',
  '#DDA0DD', '#B0B0B0',
]

interface CategoryFormProps {
  // 수정 모드일 때 기존 카테고리 전달
  category?: Category
  onSubmit: (data: CreateCategoryInput | UpdateCategoryInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

// 카테고리 생성/수정 폼 컴포넌트
// 시스템 카테고리는 모든 필드 읽기 전용으로 표시
export function CategoryForm({ category, onSubmit, onCancel, isLoading = false }: CategoryFormProps) {
  const t = useTranslations('money.categories')
  const tc = useTranslations('common')

  const isSystemCategory = category?.is_system ?? false
  const isEditMode = !!category

  // 카테고리 타입 옵션 (번역 포함)
  const CATEGORY_TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
    { value: 'expense', label: t('expense') },
    { value: 'income', label: t('income') },
    { value: 'both', label: t('both') },
  ]

  // 폼 상태
  const [name, setName] = useState(category?.name ?? '')
  const [type, setType] = useState<CategoryType>(category?.type ?? 'expense')
  const [icon, setIcon] = useState(category?.icon ?? '')
  const [color, setColor] = useState(category?.color ?? '#4ECDC4')
  const [nameError, setNameError] = useState('')

  // category prop 변경 시 폼 초기화
  useEffect(() => {
    setName(category?.name ?? '')
    setType(category?.type ?? 'expense')
    setIcon(category?.icon ?? '')
    setColor(category?.color ?? '#4ECDC4')
    setNameError('')
  }, [category])

  // 폼 제출 처리
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // 이름 유효성 검사
    if (!name.trim()) {
      setNameError(t('nameRequired'))
      return
    }

    if (isEditMode) {
      // 수정 모드: 변경된 필드만 전달
      const updateData: UpdateCategoryInput = {
        name: name.trim(),
        type,
        icon: icon || null,
        color: color || null,
      }
      onSubmit(updateData)
    } else {
      // 생성 모드
      const createData: CreateCategoryInput = {
        name: name.trim(),
        type,
        icon: icon || undefined,
        color: color || undefined,
      }
      onSubmit(createData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 시스템 카테고리 안내 */}
      {isSystemCategory && (
        <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          {t('systemNotEditable')}
        </div>
      )}

      {/* 이름 */}
      <div className="space-y-1.5">
        <Label htmlFor="category-name">
          {t('nameLabel')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (nameError) setNameError('')
          }}
          placeholder={t('nameLabel')}
          disabled={isSystemCategory || isLoading}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? 'name-error' : undefined}
          maxLength={50}
        />
        {nameError && (
          <p id="name-error" className="text-xs text-destructive">
            {nameError}
          </p>
        )}
      </div>

      {/* 카테고리 타입 */}
      <div className="space-y-1.5">
        <Label htmlFor="category-type">{t('typeLabel')}</Label>
        {isSystemCategory ? (
          <Input
            id="category-type"
            value={CATEGORY_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type}
            disabled
            readOnly
          />
        ) : (
          <Select
            value={type}
            onValueChange={(value) => setType(value as CategoryType)}
            disabled={isLoading}
          >
            <SelectTrigger id="category-type">
              <SelectValue placeholder={t('typeLabel')} />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 이모지 아이콘 */}
      <div className="space-y-1.5">
        <Label htmlFor="category-icon">{t('iconLabel')}</Label>
        <div className="flex items-center gap-2">
          {/* 미리보기 */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-xl"
            style={{ backgroundColor: `${color}33`, borderColor: `${color}66` }}
            aria-hidden="true"
          >
            {icon || '?'}
          </div>
          <Input
            id="category-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="이모지 입력 (예: 🍚)"
            disabled={isSystemCategory || isLoading}
            maxLength={8}
          />
        </div>
      </div>

      {/* 색상 */}
      <div className="space-y-1.5">
        <Label htmlFor="category-color">{t('colorLabel')}</Label>
        <div className="space-y-2">
          {/* 직접 입력 */}
          <div className="flex items-center gap-2">
            <input
              id="category-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={isSystemCategory || isLoading}
              className={cn(
                'h-9 w-12 cursor-pointer rounded-md border border-input p-1',
                (isSystemCategory || isLoading) && 'cursor-not-allowed opacity-50'
              )}
              aria-label="색상 선택"
            />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#000000"
              disabled={isSystemCategory || isLoading}
              pattern="^#[0-9A-Fa-f]{6}$"
              maxLength={7}
              className="font-mono"
              aria-label="HEX 색상 코드"
            />
          </div>

          {/* 프리셋 색상 팔레트 */}
          {!isSystemCategory && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="색상 프리셋">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className={cn(
                    'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                    color === presetColor ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => setColor(presetColor)}
                  disabled={isLoading}
                  aria-label={`색상 ${presetColor}`}
                  aria-pressed={color === presetColor}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 버튼 영역 */}
      {!isSystemCategory && (
        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {tc('cancel')}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? tc('saving') : isEditMode ? tc('update') : tc('add')}
          </Button>
        </div>
      )}

      {/* 시스템 카테고리: 닫기 버튼만 */}
      {isSystemCategory && onCancel && (
        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {tc('close')}
          </Button>
        </div>
      )}
    </form>
  )
}
