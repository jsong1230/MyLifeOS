# TimeBlockForm

`components/time/time-block-form.tsx`

시간 블록 생성 및 수정을 위한 폼 컴포넌트입니다.

## 사용법

```tsx
import { TimeBlockForm } from '@/components/time/time-block-form'

// 생성 모드
<TimeBlockForm
  defaultDate="2026-02-23"
  todos={todos}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isLoading={false}
/>

// 수정 모드 (block prop 전달)
<TimeBlockForm
  block={existingBlock}
  todos={todos}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isLoading={false}
/>
```

## Props

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `block` | `TimeBlock` | - | 수정 모드: 기존 블록 데이터 |
| `defaultDate` | `string` | - | 생성 모드 기본 날짜 (YYYY-MM-DD) |
| `todos` | `Todo[]` | - | 할일 연결 드롭다운 목록 (빈 배열이면 항목 미표시) |
| `onSubmit` | `(data: CreateTimeBlockInput \| UpdateTimeBlockInput) => void` | O | 폼 제출 콜백 |
| `onCancel` | `() => void` | - | 취소 버튼 클릭 콜백 |
| `isLoading` | `boolean` | - | 저장 중 로딩 상태 |

## 필드

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| 제목 | text input | O | 최대 200자 |
| 날짜 | date input | - | YYYY-MM-DD |
| 시작 시각 | time input | O | HH:MM |
| 종료 시각 | time input | O | HH:MM, 시작 시각 이후여야 함 |
| 색상 | 색상 버튼 | - | 6가지 프리셋 (파랑/초록/주황/빨강/보라/분홍) |
| 할일 연결 | Select | - | todos prop이 있을 때만 표시 |

## 색상 프리셋

| 색상 | HEX |
|------|-----|
| 파랑 | `#3b82f6` |
| 초록 | `#22c55e` |
| 주황 | `#f59e0b` |
| 빨강 | `#ef4444` |
| 보라 | `#a855f7` |
| 분홍 | `#ec4899` |

## 유효성 검사

- 종료 시각 <= 시작 시각이면 인라인 에러 메시지 표시 + 제출 버튼 비활성화
- 제목이 비어 있으면 제출 버튼 비활성화
