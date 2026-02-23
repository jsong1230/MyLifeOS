# TimeBlockTimeline

`components/time/time-block-timeline.tsx`

24시간 타임라인 뷰에서 시간 블록을 시각적으로 배치하고 드래그로 이동할 수 있는 컴포넌트입니다.

## 사용법

```tsx
import { TimeBlockTimeline } from '@/components/time/time-block-timeline'

<TimeBlockTimeline
  blocks={blocks}
  onEdit={handleOpenEdit}
  onDelete={handleDeleteRequest}
  onAddAtTime={handleOpenCreate}
  onMove={handleMove}
/>
```

## Props

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `blocks` | `TimeBlock[]` | O | 표시할 시간 블록 배열 |
| `onEdit` | `(block: TimeBlock) => void` | O | 블록 수정 버튼 클릭 시 콜백 |
| `onDelete` | `(block: TimeBlock) => void` | O | 블록 삭제 버튼 클릭 시 콜백 |
| `onAddAtTime` | `(startTime: string) => void` | - | 타임라인 빈 영역 클릭 시 해당 시각(HH:MM) 전달 |
| `onMove` | `(id: string, newStartTime: string, newEndTime: string) => void` | - | 드래그 이동 후 새 시각 전달 |

## 타임라인 사양

- 표시 범위: 06:00 ~ 24:00 (총 18시간)
- 1시간 = 60px 높이
- 블록 배치: 절대 위치(absolute) `top = (startHour - 6) * 60px`, `height = durationMinutes * 1px`
- 드래그 스냅: 15분 단위
- 타임라인 클릭 스냅: 15분 단위

## 블록 인터랙션

- **호버**: 수정/삭제 버튼 표시
- **드래그**: @dnd-kit/core `useDraggable` — 5px 이상 이동 시 드래그로 인식 (클릭과 구분)
- **드래그 피드백**: 드래그 중 이동 후 시각 실시간 표시

## 색상

블록에 `color` 필드(HEX)가 있으면 해당 색상 적용, 없으면 `#3b82f6`(파랑) 기본값 사용.

## 의존성

- `@dnd-kit/core` — 드래그 앤 드롭
- `@dnd-kit/utilities` — CSS transform 유틸
- `lucide-react` — Pencil, Trash2 아이콘
