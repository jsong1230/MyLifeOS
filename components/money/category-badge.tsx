'use client'

import { cn } from '@/lib/utils'
import type { Category } from '@/types/category'

interface CategoryBadgeProps {
  category?: Category | null
  size?: 'sm' | 'md'
  className?: string
}

// 카테고리 배지 컴포넌트 — 이모지 아이콘 + 이름 표시
// category가 없으면 '미분류' 표시
export function CategoryBadge({ category, size = 'md', className }: CategoryBadgeProps) {
  const isSmall = size === 'sm'

  // 카테고리 없을 때 미분류 배지
  if (!category) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium',
          isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
          'bg-muted text-muted-foreground',
          className
        )}
      >
        <span aria-hidden="true">📂</span>
        <span>미분류</span>
      </span>
    )
  }

  // color를 배경색으로 사용하되 명도에 따라 텍스트 색상 조정
  const bgColor = category.color ?? '#B0B0B0'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
      style={{
        backgroundColor: `${bgColor}33`,   // 20% 불투명도 배경
        color: bgColor,
        border: `1px solid ${bgColor}66`,  // 40% 불투명도 테두리
      }}
      title={category.name}
    >
      {category.icon && (
        <span aria-hidden="true">{category.icon}</span>
      )}
      <span>{category.name}</span>
    </span>
  )
}
