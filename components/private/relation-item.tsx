'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { RELATIONSHIP_LABELS } from '@/types/relation'
import type { RelationshipType, RelationDecrypted } from '@/types/relation'

// 관계 유형별 배지 스타일 정의
const RELATIONSHIP_BADGE_META: Record<RelationshipType, { badgeClass: string }> = {
  family: { badgeClass: 'bg-rose-100 text-rose-700 border-rose-200' },
  friend: { badgeClass: 'bg-sky-100 text-sky-700 border-sky-200' },
  colleague: { badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
  other: { badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
}

// 마지막 만난 날짜를 "N일 전" 형식으로 변환하는 헬퍼
function formatDaysAgo(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  const diffMs = today.getTime() - target.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 0) return `${Math.abs(diffDays)}일 후`
  return `${diffDays.toLocaleString()}일 전`
}

interface RelationItemProps {
  relation: RelationDecrypted
  onEdit: (relation: RelationDecrypted) => void
  onDelete: (id: string) => void
}

// 개별 인간관계 항목 컴포넌트
export function RelationItem({ relation, onEdit, onDelete }: RelationItemProps) {
  const badgeMeta = RELATIONSHIP_BADGE_META[relation.relationship_type]

  return (
    <div className="flex items-start justify-between py-3 px-1 gap-3">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* 관계 유형 배지 */}
        <Badge
          variant="outline"
          className={cn('shrink-0 text-xs font-medium mt-0.5', badgeMeta.badgeClass)}
        >
          {RELATIONSHIP_LABELS[relation.relationship_type]}
        </Badge>

        {/* 이름 + 날짜 + 메모 */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{relation.name}</p>

          {/* 마지막 만난 날짜 — 입력된 경우에만 표시 */}
          {relation.last_met_at && (
            <p className="text-xs text-muted-foreground mt-0.5">
              마지막 만남: {formatDaysAgo(relation.last_met_at)}
              <span className="ml-1 text-muted-foreground/60">({relation.last_met_at})</span>
            </p>
          )}

          {/* 복호화된 메모 — 있는 경우에만 표시 */}
          {relation.memo && (
            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">
              {relation.memo}
            </p>
          )}
        </div>
      </div>

      {/* 수정/삭제 버튼 */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(relation)}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          aria-label={`${relation.name} 수정`}
        >
          수정
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(relation.id)}
          className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label={`${relation.name} 삭제`}
        >
          삭제
        </Button>
      </div>
    </div>
  )
}
