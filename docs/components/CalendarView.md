# CalendarView

`components/time/calendar-view.tsx`

캘린더 메인 컴포넌트. 월간/주간/일간 뷰를 전환하며 할일을 날짜별로 시각화합니다.

## Props

| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `todos` | `Todo[]` | 필수 | 표시할 할일 목록 |
| `onAddTodo` | `(date: string) => void` | 선택 | 할일 추가 버튼 클릭 시 콜백 (YYYY-MM-DD 전달) |
| `onSelectDate` | `(date: string) => void` | 선택 | 날짜 클릭 시 콜백 (YYYY-MM-DD 전달) |

## 사용 예시

```tsx
import { CalendarView } from '@/components/time/calendar-view'

<CalendarView
  todos={todos}
  onAddTodo={(date) => openDialog(date)}
  onSelectDate={(date) => setSelectedDate(date)}
/>
```

## 내부 구조

### 상단 컨트롤
- `< YYYY년 MM월 >` 이전/다음 달 네비게이션
- `오늘` 버튼: 현재 날짜로 이동
- `+ 추가` 버튼: 선택된 날짜로 할일 추가 다이얼로그 열기
- 뷰 전환 탭: **월간 | 주간 | 일간**

### 월간 뷰 (MonthView)
- 42칸 고정 그리드 (6주)
- 요일 헤더: 일(빨강) ~ 토(파랑)
- 날짜 셀: 할일 최대 2개 미리보기 + `+N개` 오버플로우 표시
- 오늘 날짜: `bg-primary` 파란 원
- 선택된 날짜: `ring-2 ring-primary`
- 이전/다음 달 날짜: `opacity-40` 흐릿하게

### 주간 뷰 (WeekView)
- 선택된 날짜 기준 해당 주 7일
- 요일 + 날짜 헤더 + 해당일 할일 전체 표시

### 일간 뷰 (DayView)
- 선택된 날짜의 할일 전체 목록
- 빈 상태: 아이콘 + 메시지 + 추가 버튼

## 할일 색상 규칙
| 상태 | 색상 |
|------|------|
| 완료 (`completed`) | 초록 (`bg-green-100 text-green-700`) |
| 기한 초과 | 빨강 (`bg-red-100 text-red-700`) |
| 미완료 | 파랑 (`bg-blue-100 text-blue-700`) |

## 내부 상태 (useCalendar 훅)
내부적으로 `useCalendar` 훅을 사용하여 독립적인 상태를 유지합니다.
페이지에서 `onSelectDate` 콜백으로 선택된 날짜를 수신하여 외부 상태와 연동합니다.

## 의존성
- `@/hooks/use-calendar` — 캘린더 상태 관리
- `@/components/ui/button`, `badge` — shadcn/ui
- `lucide-react` — ChevronLeft, ChevronRight, Plus, Calendar 아이콘
