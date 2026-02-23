# EmotionCalendar

`components/private/emotion-calendar.tsx`

## 개요

월간 캘린더 그리드로 각 날짜에 해당일의 첫 번째 감정 아이콘을 표시하는 Client Component.
감정 아이콘 클릭 시 해당 날짜의 일기 페이지(`/private/diary?date=YYYY-MM-DD`)로 이동한다.

## Props

| 이름      | 타입              | 설명                                         |
|-----------|-------------------|----------------------------------------------|
| `year`    | `number`          | 표시할 연도 (4자리)                          |
| `month`   | `number`          | 표시할 월 (1~12)                             |
| `diaries` | `DiaryListItem[]` | `useDiaryList` 훅의 반환 데이터 (월별 목록) |

```ts
interface DiaryListItem {
  id: string
  date: string            // 'YYYY-MM-DD'
  emotion_tags: EmotionType[]
}
```

## 동작

### 캘린더 그리드
- 7열(일~토) × 최대 6행 구조
- `buildCalendarDays(year, month)` 함수로 순수 JS Date를 이용해 그리드 셀 배열 생성
- 이전 달 / 다음 달 날짜로 빈 칸 채움 (항상 7의 배수 셀 수 유지)

### 날짜 셀 표시 규칙

| 조건                       | 스타일                                       |
|----------------------------|----------------------------------------------|
| 오늘 날짜                  | 날짜 숫자에 primary 원형 배경 + bold         |
| 이전/다음 달 날짜           | 날짜 숫자 및 감정 아이콘 흐리게 (`opacity`) |
| 감정 태그 있는 날짜        | 첫 번째 감정 아이콘(`EMOTION_ICONS`) 표시   |
| 감정 태그 없는 날짜        | 날짜 숫자만 표시 (빈 상태)                   |

### 클릭 이동
- `emotion_tags` 배열의 **첫 번째** 항목 아이콘만 표시
- 감정 아이콘이 있는 날짜에 한해 `<button>` 렌더링
- 클릭 시 `useRouter().push('/private/diary?date=YYYY-MM-DD')` 호출

## 사용 예시

```tsx
import { EmotionCalendar } from '@/components/private/emotion-calendar'
import { useDiaryList } from '@/hooks/use-diaries'

function Page() {
  const { data } = useDiaryList(2026, 2)
  return (
    <EmotionCalendar
      year={2026}
      month={2}
      diaries={data ?? []}
    />
  )
}
```

## 접근성

- 요일 헤더: 스크린 리더 가독 텍스트
- 감정 아이콘 버튼: `aria-label="YYYY-MM-DD 일기 보기 - {감정 레이블}"` 제공
- 감정 아이콘 이모지: `aria-hidden="true"` (장식 목적)
- 키보드 포커스 스타일: `focus-visible:ring-2` 적용

## 관련 파일

- `types/diary.ts` — `EmotionType`, `EMOTION_ICONS`, `EMOTION_LABELS`
- `hooks/use-diaries.ts` — `useDiaryList(year, month)`
- `app/(dashboard)/private/emotion/page.tsx` — 이 컴포넌트를 사용하는 페이지
