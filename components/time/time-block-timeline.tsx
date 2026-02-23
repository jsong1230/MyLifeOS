'use client'

import { useCallback, useRef, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TimeBlock } from '@/types/time-block'

// 타임라인 설정 상수
const TIMELINE_START_HOUR = 6   // 06:00 부터
const TIMELINE_END_HOUR = 24    // 24:00 까지
const HOUR_HEIGHT_PX = 60       // 1시간 = 60px

// HH:MM 문자열을 분(minute) 단위로 변환
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// 분(minute)을 HH:MM 문자열로 변환
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// 블록 위치/높이 계산 (px)
function calcBlockStyle(startTime: string, endTime: string) {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  const timelineStartMinutes = TIMELINE_START_HOUR * 60

  const top = ((startMinutes - timelineStartMinutes) / 60) * HOUR_HEIGHT_PX
  const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT_PX

  return { top: Math.max(0, top), height: Math.max(15, height) }
}

// 기본 블록 색상 (색상 미설정 시)
const DEFAULT_BLOCK_COLOR = '#3b82f6'

// 개별 블록 드래그 컴포넌트
interface DraggableBlockProps {
  block: TimeBlock
  onEdit: (block: TimeBlock) => void
  onDelete: (block: TimeBlock) => void
  isDragging: boolean
}

function DraggableBlock({ block, onEdit, onDelete, isDragging }: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: block.id,
    data: { block },
  })

  const { top, height } = calcBlockStyle(block.start_time, block.end_time)
  const blockColor = block.color ?? DEFAULT_BLOCK_COLOR

  const transformStyle = transform
    ? CSS.Translate.toString(transform)
    : undefined

  // 드래그 중 수직 이동량을 시간으로 환산하기 위한 표시용 시각
  const deltaMinutes = transform
    ? Math.round((transform.y / HOUR_HEIGHT_PX) * 60 / 15) * 15
    : 0

  const displayStart = deltaMinutes !== 0
    ? minutesToTime(Math.max(TIMELINE_START_HOUR * 60, timeToMinutes(block.start_time) + deltaMinutes))
    : block.start_time
  const displayEnd = deltaMinutes !== 0
    ? minutesToTime(Math.min(TIMELINE_END_HOUR * 60, timeToMinutes(block.end_time) + deltaMinutes))
    : block.end_time

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-1 right-1 rounded-md px-2 py-1 text-white text-xs overflow-hidden
        group cursor-grab active:cursor-grabbing select-none
        ${isDragging ? 'opacity-80 shadow-lg z-50 ring-2 ring-white/50' : 'hover:brightness-90 z-10'}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: blockColor,
        transform: transformStyle,
      }}
      {...listeners}
      {...attributes}
      title={`${block.title} (${block.start_time}~${block.end_time})`}
    >
      {/* 블록 내용 */}
      <div className="flex flex-col h-full">
        <span className="font-medium truncate leading-tight">{block.title}</span>
        <span className="opacity-80 text-[10px] leading-tight">
          {displayStart}~{displayEnd}
        </span>
      </div>

      {/* 호버 시 액션 버튼 */}
      <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5">
        <Button
          size="icon"
          variant="ghost"
          className="size-5 text-white hover:bg-white/20 hover:text-white"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(block)
          }}
          aria-label="시간 블록 수정"
        >
          <Pencil className="size-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-5 text-white hover:bg-white/20 hover:text-white"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(block)
          }}
          aria-label="시간 블록 삭제"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  )
}

// 타임라인 클릭으로 시각 계산 (새 블록 생성 위치)
function calcTimeFromY(y: number): string {
  const totalMinutes = (y / HOUR_HEIGHT_PX) * 60 + TIMELINE_START_HOUR * 60
  // 15분 단위로 스냅
  const snapped = Math.round(totalMinutes / 15) * 15
  const clamped = Math.max(TIMELINE_START_HOUR * 60, Math.min((TIMELINE_END_HOUR - 1) * 60, snapped))
  return minutesToTime(clamped)
}

interface TimeBlockTimelineProps {
  blocks: TimeBlock[]
  onEdit: (block: TimeBlock) => void
  onDelete: (block: TimeBlock) => void
  // 타임라인 클릭 시 해당 시각으로 새 블록 추가 다이얼로그 열기
  onAddAtTime?: (startTime: string) => void
  // 드래그 이동으로 시간 변경 시 콜백
  onMove?: (id: string, newStartTime: string, newEndTime: string) => void
}

// 24시간 타임라인 컴포넌트 (6시~24시)
export function TimeBlockTimeline({
  blocks,
  onEdit,
  onDelete,
  onAddAtTime,
  onMove,
}: TimeBlockTimelineProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // 드래그 센서: PointerSensor (클릭과 드래그 구분을 위해 activationConstraint 사용)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px 이상 움직여야 드래그로 인식
      },
    })
  )

  // 드래그 시작
  function handleDragStart(event: DragStartEvent) {
    setDraggingId(String(event.active.id))
  }

  // 드래그 종료 — 위치 업데이트
  function handleDragEnd(event: DragEndEvent) {
    setDraggingId(null)
    const { active, delta } = event

    if (!delta.y || Math.abs(delta.y) < 5) return

    const block = blocks.find((b) => b.id === active.id)
    if (!block || !onMove) return

    // 수직 이동량을 15분 단위로 스냅
    const deltaMinutes = Math.round((delta.y / HOUR_HEIGHT_PX) * 60 / 15) * 15
    if (deltaMinutes === 0) return

    const startMinutes = timeToMinutes(block.start_time)
    const endMinutes = timeToMinutes(block.end_time)
    const duration = endMinutes - startMinutes

    const newStartMinutes = Math.max(
      TIMELINE_START_HOUR * 60,
      Math.min(TIMELINE_END_HOUR * 60 - duration, startMinutes + deltaMinutes)
    )
    const newEndMinutes = newStartMinutes + duration

    onMove(block.id, minutesToTime(newStartMinutes), minutesToTime(newEndMinutes))
  }

  // 타임라인 빈 영역 클릭 — 해당 시각으로 블록 추가
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onAddAtTime) return
      // 블록 내부 클릭이면 무시
      if ((e.target as HTMLElement).closest('[data-block]')) return

      const rect = timelineRef.current?.getBoundingClientRect()
      if (!rect) return

      const y = e.clientY - rect.top
      const startTime = calcTimeFromY(y)
      onAddAtTime(startTime)
    },
    [onAddAtTime]
  )

  // 시간 눈금 레이블 생성 (6시~24시)
  const hourLabels = Array.from(
    { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
    (_, i) => TIMELINE_START_HOUR + i
  )

  const totalHeight = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT_PX

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-0 overflow-auto">
        {/* 시간 눈금 (왼쪽) */}
        <div className="w-12 shrink-0 relative" style={{ height: `${totalHeight}px` }}>
          {hourLabels.map((hour) => (
            <div
              key={hour}
              className="absolute right-2 text-xs text-muted-foreground"
              style={{ top: `${(hour - TIMELINE_START_HOUR) * HOUR_HEIGHT_PX - 8}px` }}
            >
              {hour < 24 ? `${String(hour).padStart(2, '0')}:00` : ''}
            </div>
          ))}
        </div>

        {/* 타임라인 본체 */}
        <div
          ref={timelineRef}
          className="flex-1 relative border-l border-border cursor-pointer"
          style={{ height: `${totalHeight}px` }}
          onClick={handleTimelineClick}
        >
          {/* 시간 눈금선 */}
          {hourLabels.map((hour) => (
            <div
              key={hour}
              className={`absolute left-0 right-0 border-t ${
                hour === TIMELINE_START_HOUR ? 'border-border' : 'border-border/50'
              }`}
              style={{ top: `${(hour - TIMELINE_START_HOUR) * HOUR_HEIGHT_PX}px` }}
            />
          ))}

          {/* 30분 보조선 */}
          {Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR }, (_, i) => (
            <div
              key={`half-${i}`}
              className="absolute left-0 right-0 border-t border-dashed border-border/30"
              style={{ top: `${(i + 0.5) * HOUR_HEIGHT_PX}px` }}
            />
          ))}

          {/* 시간 블록 렌더링 */}
          {blocks.map((block) => (
            <div key={block.id} data-block="true">
              <DraggableBlock
                block={block}
                onEdit={onEdit}
                onDelete={onDelete}
                isDragging={draggingId === block.id}
              />
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  )
}
