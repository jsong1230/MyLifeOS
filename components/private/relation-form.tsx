'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { getToday } from '@/lib/date-utils'
import type { RelationshipType, RelationDecrypted, CreateRelationInput } from '@/types/relation'

// 관계 유형 선택 버튼 스타일 정의
const RELATIONSHIP_TYPE_OPTIONS: {
  value: RelationshipType
  activeClass: string
  borderClass: string
}[] = [
  {
    value: 'family',
    activeClass: 'bg-rose-500 text-white border-rose-500',
    borderClass: 'border-rose-300 text-rose-600 hover:bg-rose-50',
  },
  {
    value: 'friend',
    activeClass: 'bg-sky-500 text-white border-sky-500',
    borderClass: 'border-sky-300 text-sky-600 hover:bg-sky-50',
  },
  {
    value: 'colleague',
    activeClass: 'bg-amber-500 text-white border-amber-500',
    borderClass: 'border-amber-300 text-amber-600 hover:bg-amber-50',
  },
  {
    value: 'other',
    activeClass: 'bg-slate-500 text-white border-slate-500',
    borderClass: 'border-slate-300 text-slate-600 hover:bg-slate-50',
  },
]

interface RelationFormProps {
  relation?: RelationDecrypted
  onSubmit: (data: CreateRelationInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

// sessionStorage에서 암호화 키 존재 여부 확인
function hasEncKey(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(sessionStorage.getItem('enc_key'))
}

// 인간관계 등록/수정 폼 컴포넌트
export function RelationForm({ relation, onSubmit, onCancel, isLoading = false }: RelationFormProps) {
  const t = useTranslations('private.relations')
  const tCommon = useTranslations('common')
  const tv = useTranslations('validation')

  const [name, setName] = useState(relation?.name ?? '')
  const [relationshipType, setRelationshipType] = useState<RelationshipType>(
    relation?.relationship_type ?? 'friend'
  )
  const [lastMetAt, setLastMetAt] = useState(relation?.last_met_at ?? '')
  const [memo, setMemo] = useState(relation?.memo ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 암호화 키 존재 여부
  const encKeyExists = hasEncKey()

  // 폼 검증
  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = tCommon('name')
    }

    if (lastMetAt !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(lastMetAt)) {
      newErrors.lastMetAt = tv('invalidDate')
    }

    // 메모 입력 시 암호화 키 필수
    if (memo.trim() !== '' && !encKeyExists) {
      newErrors.memo = t('pinLocked')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      name: name.trim(),
      relationship_type: relationshipType,
      last_met_at: lastMetAt !== '' ? lastMetAt : undefined,
      memo: memo.trim() !== '' ? memo.trim() : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 이름 입력 (필수) */}
      <div className="space-y-2">
        <Label htmlFor="relation-name">
          {tCommon('name')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="relation-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={tCommon('name')}
          disabled={isLoading}
          autoFocus
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* 관계 유형 4버튼 토글 */}
      <div className="space-y-2">
        <Label>{t('relationship')}</Label>
        <div className="flex gap-2">
          {RELATIONSHIP_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRelationshipType(option.value)}
              disabled={isLoading}
              className={cn(
                'flex-1 py-2 px-3 text-sm font-medium rounded-md border transition-colors',
                relationshipType === option.value ? option.activeClass : option.borderClass
              )}
            >
              {t(`types.${option.value}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 마지막 만난 날짜 (date input) */}
      <div className="space-y-2">
        <Label htmlFor="last-met-at">{t('lastContact')}</Label>
        <Input
          id="last-met-at"
          type="date"
          value={lastMetAt}
          onChange={(e) => setLastMetAt(e.target.value)}
          disabled={isLoading}
          max={getToday()}
        />
        {errors.lastMetAt && (
          <p className="text-xs text-destructive">{errors.lastMetAt}</p>
        )}
      </div>

      {/* 메모 textarea (선택, 저장 시 암호화) */}
      <div className="space-y-2">
        <Label htmlFor="relation-memo">
          {tCommon('memo')}
          <span className="text-xs text-muted-foreground ml-2">{t('encrypted')}</span>
        </Label>
        <textarea
          id="relation-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder={tCommon('memo')}
          disabled={isLoading}
          rows={4}
          className={cn(
            'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'placeholder:text-muted-foreground focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'resize-none disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
        {errors.memo && (
          <p className="text-xs text-destructive">{errors.memo}</p>
        )}
        {/* 암호화 키 없을 때 경고 메시지 */}
        {!encKeyExists && (
          <p className="text-xs text-muted-foreground">
            {t('pinLocked')}
          </p>
        )}
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {tCommon('cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? tCommon('saving') : relation ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  )
}
