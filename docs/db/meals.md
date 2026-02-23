# F-12 식사 기록 DB 스키마 확정본

## 테이블: `public.meal_logs`

### 컬럼 정의

| 컬럼명       | 타입            | NOT NULL | 기본값              | 설명                                             |
|-------------|-----------------|----------|---------------------|--------------------------------------------------|
| `id`        | UUID            | Yes      | `gen_random_uuid()` | 기본키                                            |
| `user_id`   | UUID            | Yes      |                     | 외래키 → `public.users(id)` ON DELETE CASCADE     |
| `meal_type` | TEXT            | Yes      |                     | 식사 유형: `breakfast`, `lunch`, `dinner`, `snack` |
| `food_name` | TEXT            | Yes      |                     | 음식명                                            |
| `calories`  | DECIMAL(8, 2)   | No       | NULL                | 칼로리 (kcal)                                    |
| `protein`   | DECIMAL(8, 2)   | No       | NULL                | 단백질 (g)                                        |
| `carbs`     | DECIMAL(8, 2)   | No       | NULL                | 탄수화물 (g)                                      |
| `fat`       | DECIMAL(8, 2)   | No       | NULL                | 지방 (g)                                          |
| `date`      | DATE            | Yes      | `CURRENT_DATE`      | 식사 날짜                                         |
| `created_at`| TIMESTAMPTZ     | Yes      | `NOW()`             | 생성 시각                                         |
| `updated_at`| TIMESTAMPTZ     | Yes      | `NOW()`             | 수정 시각 (트리거 자동 갱신)                       |

### 제약 조건

```sql
CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'))
```

### Row Level Security (RLS)

```sql
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_logs_owner_all" ON public.meal_logs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- 로그인한 사용자는 자신의 기록만 SELECT / INSERT / UPDATE / DELETE 가능

### 인덱스

```sql
-- 사용자별 날짜 조회 최적화 (날짜별 식사 목록 GET 쿼리)
CREATE INDEX idx_meal_logs_user_date ON public.meal_logs(user_id, date DESC);

-- user_id 단독 인덱스
CREATE INDEX idx_meal_logs_user_id ON public.meal_logs(user_id);
```

### 트리거

```sql
-- updated_at 자동 갱신 (update_updated_at 함수 의존)
CREATE TRIGGER set_meal_logs_updated_at
  BEFORE UPDATE ON public.meal_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 마이그레이션 파일

- `docs/migrations/005_health_meals.sql`

### TypeScript 타입 매핑

```typescript
// types/health.ts
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealLog {
  id: string
  user_id: string
  meal_type: MealType
  food_name: string
  calories?: number | null
  protein?: number | null
  carbs?: number | null
  fat?: number | null
  date: string          // DATE → ISO string (YYYY-MM-DD)
  created_at: string
  updated_at: string
}
```
