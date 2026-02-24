'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { RelationItem } from './relation-item'
import type { RelationshipType, RelationDecrypted } from '@/types/relation'

// 필터 탭 목록 — 'all'은 전체 보기
type FilterTab = 'all' | RelationshipType

const FILTER_TAB_VALUES: FilterTab[] = ['all', 'family', 'friend', 'colleague', 'other']

interface RelationListProps {
  relations: RelationDecrypted[]
  onEdit: (relation: RelationDecrypted) => void
  onDelete: (id: string) => void
}

// 인간관계 목록 컴포넌트 — 관계 유형별 필터 탭 포함
export function RelationList({ relations, onEdit, onDelete }: RelationListProps) {
  const t = useTranslations('private.relations')
  const tCommon = useTranslations('common')

  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  // 선택된 탭에 따라 필터링
  const filteredRelations = activeTab === 'all'
    ? relations
    : relations.filter((r) => r.relationship_type === activeTab)

  function getTabLabel(tab: FilterTab): string {
    if (tab === 'all') return tCommon('all')
    return t(`types.${tab}`)
  }

  return (
    <div className="space-y-0">
      {/* 관계 유형별 필터 탭 */}
      <div className="flex gap-1 pb-3 overflow-x-auto">
        {FILTER_TAB_VALUES.map((tab) => {
          const count = tab === 'all'
            ? relations.length
            : relations.filter((r) => r.relationship_type === tab).length

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors whitespace-nowrap',
                activeTab === tab
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {getTabLabel(tab)}
              {count > 0 && (
                <span className="ml-1 opacity-70">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 빈 상태 */}
      {filteredRelations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">{t('noData')}</p>
          {activeTab !== 'all' && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('noRelationsOfType', { type: t(`types.${activeTab as RelationshipType}`) })}
            </p>
          )}
        </div>
      ) : (
        /* 인간관계 목록 */
        <div className="divide-y divide-border">
          {filteredRelations.map((relation) => (
            <RelationItem
              key={relation.id}
              relation={relation}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
