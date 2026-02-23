# F-32 감정 통계 컴포넌트 문서

## 개요

월별 감정 기록을 시각화하는 통계 컴포넌트 세트.
`/private/emotion/stats` 페이지에서 `EmotionTop3` → `EmotionPieChart` → `EmotionHeatmap` 순서로 배치된다.

---

## 파일 목록

| 파일 | 역할 |
|------|------|
| `app/api/diaries/emotion-stats/route.ts` | 감정 통계 API Route (GET) |
| `hooks/use-emotion-stats.ts` | 감정 통계 React Query 훅 |
| `components/private/emotion-top3.tsx` | TOP 3 감정 하이라이트 카드 |
| `components/private/emotion-pie-chart.tsx` | 월별 감정 분포 도넛 차트 |
| `components/private/emotion-heatmap.tsx` | 요일별 감정 패턴 히트맵 |
| `app/(dashboard)/private/emotion/stats/page.tsx` | 감정 통계 페이지 |

---

## API

### GET `/api/diaries/emotion-stats`

**쿼리 파라미터**

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| year | Y | 연도 (숫자) |
| month | Y | 월 (1~12) |

**응답 200**

```json
{
  "success": true,
  "data": {
    "emotion_counts": { "happy": 5, "calm": 3, "tired": 2 },
    "weekday_map": {
      "0": ["happy"],
      "1": ["calm", "calm"],
      "2": [],
      "3": ["tired"],
      "4": [],
      "5": ["happy", "happy", "happy", "happy"],
      "6": ["calm"]
    },
    "top3": ["happy", "calm", "tired"]
  }
}
```

---

## useEmotionStats 훅

```ts
import { useEmotionStats } from '@/hooks/use-emotion-stats'

const { data, isLoading, error } = useEmotionStats(year, month)
// data: EmotionStatsData | undefined
```

React Query 캐시 키: `['diaries', 'emotion-stats', year, month]`

---

## EmotionTop3

**Props**

| prop | 타입 | 설명 |
|------|------|------|
| stats | EmotionStatsData | 감정 통계 데이터 |

**동작**
- `stats.top3`에서 최대 3개 감정을 카드로 표시
- 1위: 황금 배지, 2위: 회색 배지, 3위: 동색 배지
- 감정 이모지 + 한국어 이름 + 횟수 표시
- `top3`가 빈 배열이면 안내 메시지 표시

```tsx
<EmotionTop3 stats={stats} />
```

---

## EmotionPieChart

**Props**

| prop | 타입 | 설명 |
|------|------|------|
| stats | EmotionStatsData | 감정 통계 데이터 |

**동작**
- Recharts `PieChart` + `Pie`(innerRadius 도넛 형태)
- `emotion_counts`에서 횟수 > 0인 감정만 렌더링
- 각 Slice에 `EMOTION_COLORS` 기반 고유 색상
- 커스텀 Legend: 감정 이모지 + 한국어 이름
- 커스텀 Tooltip: 감정 이모지 + 이름 + 횟수

```tsx
<EmotionPieChart stats={stats} />
```

---

## EmotionHeatmap

**Props**

| prop | 타입 | 설명 |
|------|------|------|
| year | number | 표시할 연도 |
| month | number | 표시할 월 (1~12) |
| stats | EmotionStatsData | 감정 통계 데이터 |

**동작**
- Tailwind CSS만으로 7열 × N행 캘린더 그리드 구현 (외부 라이브러리 없음)
- 각 날짜 셀에 해당 날짜의 요일 기반 대표 감정 이모지 표시
  - 대표 감정: `weekday_map`에서 해당 요일에 가장 빈번한 감정
- 오늘 날짜는 primary 색상 원형 배지로 강조
- 이전/다음 달 날짜는 흐리게 표시 (감정 미표시)

```tsx
<EmotionHeatmap year={2026} month={2} stats={stats} />
```

---

## 인수조건 충족 여부

| AC | 내용 | 충족 여부 |
|----|------|-----------|
| AC-01 | 월별 감정 분포 도넛/파이 차트 표시 | EmotionPieChart |
| AC-02 | 요일별 감정 패턴 히트맵 표시 | EmotionHeatmap |
| AC-03 | 가장 빈번한 감정 TOP 3 하이라이트 | EmotionTop3 |

---

## 페이지 구조

```
/private/emotion          ← 감정 캘린더 (기존, 우상단 BarChart2 아이콘으로 통계 페이지 이동)
/private/emotion/stats    ← 감정 통계 (신규)
```
