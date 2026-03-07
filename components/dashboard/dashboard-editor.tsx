'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DEFAULT_LAYOUT } from '@/types/dashboard-layout'
import type { WidgetConfig, WidgetKey } from '@/types/dashboard-layout'

interface SortableItemProps {
  config: WidgetConfig
  label: string
  onToggleVisible: (key: WidgetKey) => void
}

function SortableItem({ config, label, onToggleVisible }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: config.key })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-3 select-none"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground focus:outline-none"
        aria-label="drag to reorder"
        type="button"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <span className={`flex-1 text-sm font-medium ${config.visible ? '' : 'text-muted-foreground line-through'}`}>
        {label}
      </span>

      <button
        type="button"
        onClick={() => onToggleVisible(config.key)}
        className="text-muted-foreground hover:text-foreground focus:outline-none"
        aria-label={config.visible ? 'hide widget' : 'show widget'}
      >
        {config.visible ? (
          <Eye className="h-5 w-5" />
        ) : (
          <EyeOff className="h-5 w-5" />
        )}
      </button>
    </div>
  )
}

interface DashboardEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialLayout: WidgetConfig[]
  onSave: (layout: WidgetConfig[]) => void
  isSaving: boolean
}

export function DashboardEditor({
  open,
  onOpenChange,
  initialLayout,
  onSave,
  isSaving,
}: DashboardEditorProps) {
  const t = useTranslations('dashboard')
  const [items, setItems] = useState<WidgetConfig[]>(initialLayout)

  // initialLayout이 바뀌면 내부 상태 동기화
  const [prevInitial, setPrevInitial] = useState(initialLayout)
  if (prevInitial !== initialLayout) {
    setPrevInitial(initialLayout)
    setItems(initialLayout)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.key === active.id)
        const newIndex = prev.findIndex((i) => i.key === over.id)
        const reordered = arrayMove(prev, oldIndex, newIndex)
        return reordered.map((item, idx) => ({ ...item, order: idx }))
      })
    }
  }

  function handleToggleVisible(key: WidgetKey) {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, visible: !item.visible } : item
      )
    )
  }

  function handleReset() {
    setItems(DEFAULT_LAYOUT)
  }

  function handleSave() {
    onSave(items)
  }

  const widgetLabels: Record<WidgetKey, string> = {
    insights: t('widget_insights'),
    time:     t('widget_time'),
    money:    t('widget_money'),
    health:   t('widget_health'),
    private:  t('widget_private'),
    books:    t('widget_books'),
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('edit')}</DialogTitle>
        </DialogHeader>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2 py-2">
              {items.map((config) => (
                <SortableItem
                  key={config.key}
                  config={config}
                  label={widgetLabels[config.key]}
                  onToggleVisible={handleToggleVisible}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={handleReset} type="button">
            {t('reset_layout')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving} size="sm" type="button">
            {t('save_layout')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
