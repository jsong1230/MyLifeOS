# 건강 대시보드 컴포넌트

## 개요

F-15 건강 대시보드 구현. 오늘 칼로리 섭취, 이번 주 음주 현황, 최근 7일 수면 현황을 카드 형태로 표시합니다.

## 파일 구조

```
app/(dashboard)/health/page.tsx       # 대시보드 페이지 (진입점)
components/health/
  calorie-card.tsx                    # 오늘 칼로리 섭취 카드
  drink-weekly-card.tsx               # 이번 주 음주 카드
  sleep-weekly-card.tsx               # 최근 7일 수면 카드
hooks/
  use-meals.ts                        # 식사 기록 조회 훅
  use-drinks.ts                       # 음주 기록 조회 훅
  use-sleep.ts                        # 수면 기록 조회 훅
```

---

## CalorieCard

**파일**: `components/health/calorie-card.tsx`

오늘 날짜의 식사 기록을 받아 총 칼로리와 식사 유형별 분포를 표시합니다.

### Props

| Prop    | 타입        | 설명                        |
|---------|-------------|----------------------------|
| `meals` | `MealLog[]` | 오늘 식사 기록 배열          |
| `date`  | `string`    | 기준 날짜 (YYYY-MM-DD 형식) |

### 동작

- 총 칼로리 = `meals[].calories` 합산
- 식사 유형(아침/점심/저녁/간식)별 칼로리 미니 바 시각화 (div 기반, 색상 구분)
- 데이터 없음: "오늘 식사 기록이 없습니다" 표시

### 색상 구분

| 유형   | 색상     |
|--------|---------|
| 아침   | 파란색  |
| 점심   | 초록색  |
| 저녁   | 주황색  |
| 간식   | 보라색  |

---

## DrinkWeeklyCard

**파일**: `components/health/drink-weekly-card.tsx`

이번 주 음주 횟수와 총 섭취량을 표시합니다.

### Props

| Prop               | 타입                                         | 설명                         |
|--------------------|----------------------------------------------|------------------------------|
| `summary`          | `{ count: number; total_ml: number }`        | 음주 요약 (횟수, 총량)        |
| `weekLabel`        | `string`                                     | 주간 범위 레이블             |
| `totalDrinkCount`  | `number` (optional)                          | 총 잔 수 (WHO 경고 판단용)   |

### 동작

- `count === 0`: "이번주 음주 없음" 초록 배지 표시
- `totalDrinkCount > 14` (WHO 남성 기준): 주황 경고 배지 표시
- 총 섭취량: ml → 1000ml 이상이면 L로 자동 변환

---

## SleepWeeklyCard

**파일**: `components/health/sleep-weekly-card.tsx`

최근 7일의 수면 기록을 바탕으로 평균 수면 시간, 평균 수면 질, 일별 바 차트를 표시합니다.

### Props

| Prop      | 타입                                              | 설명                        |
|-----------|---------------------------------------------------|----------------------------|
| `summary` | `{ avg_hours: number; avg_quality: number }`      | 주간 수면 요약              |
| `logs`    | `SleepLog[]`                                      | 7일 수면 기록 배열          |

### 동작

- 평균 수면 시간 색상: 7h+ 초록 / 5~7h 주황 / 5h 미만 빨강
- 평균 수면 질: 별점(1-5)으로 표시
- 일별 미니 바 차트: div 기반, 날짜별 수면 시간 비율로 높이 계산
- 데이터 없음: "이번 주 수면 기록이 없습니다" 표시

---

## 페이지 (HealthPage)

**파일**: `app/(dashboard)/health/page.tsx`

### 기능

- `useMeals(today)`, `useDrinks(weekStart)`, `useSleep(weekStart)` 병렬 조회
- 주간 시작일: 월요일 기준 (`getWeekStart()`)
- 로딩 중: 각 카드 위치에 skeleton 표시
- 카드 하단: 해당 상세 페이지 바로가기 링크

### 레이아웃

- 모바일(375px~): 1열
- md(768px~): 2열
- lg(1024px~): 3열

---

## 의존성

- `@tanstack/react-query` — 서버 상태 캐싱
- `shadcn/ui` — Card, Badge, Separator
- `lucide-react` — 아이콘
- `types/health.ts` — MealLog, DrinkLog, SleepLog
