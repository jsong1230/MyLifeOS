'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CategoryBadge } from './category-badge'
import type { Category } from '@/types/category'

// 카테고리 타입별 섹션 레이블
const SECTION_LABELS: Record<Category['type'], string> = {
  expense: '지출',
  income: '수입',
  both: '공통',
}

interface CategoryListProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
}

// 카테고리 목록 컴포넌트
// 수입/지출/공통 섹션으로 그룹화하여 표시
// 시스템 카테고리: 수정/삭제 버튼 숨김
// 사용자 카테고리: 수정/삭제 버튼 표시
export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  // 타입별로 그룹화
  const grouped = categories.reduce<Record<Category['type'], Category[]>>(
    (acc, category) => {
      acc[category.type].push(category)
      return acc
    },
    { expense: [], income: [], both: [] }
  )

  // 섹션 순서: 지출 → 수입 → 공통
  const sectionOrder: Category['type'][] = ['expense', 'income', 'both']

  // 표시할 섹션만 필터링 (항목이 있는 섹션만)
  const visibleSections = sectionOrder.filter(
    (type) => grouped[type].length > 0
  )

  if (categories.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        카테고리가 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {visibleSections.map((sectionType, sectionIndex) => (
        <section key={sectionType} aria-label={`${SECTION_LABELS[sectionType]} 카테고리`}>
          {/* 섹션 구분선 (첫 섹션 제외) */}
          {sectionIndex > 0 && <Separator className="mb-6" />}

          {/* 섹션 제목 */}
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {SECTION_LABELS[sectionType]}
          </h3>

          {/* 카테고리 목록 */}
          <ul className="space-y-1" role="list">
            {grouped[sectionType].map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
              >
                {/* 카테고리 배지 */}
                <CategoryBadge category={category} size="md" />

                {/* 시스템 카테고리 레이블 */}
                {category.is_system ? (
                  <span className="text-xs text-muted-foreground">기본</span>
                ) : (
                  /* 사용자 카테고리: 수정/삭제 버튼 */
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => onEdit(category)}
                      aria-label={`${category.name} 카테고리 수정`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(category.id)}
                      aria-label={`${category.name} 카테고리 삭제`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
