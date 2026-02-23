# F-30 정기 지출 DB 스키마

## 테이블: public.recurring_expenses

### 컬럼

| 컬럼명       | 타입             | 제약                                   | 설명                        |
| ------------ | ---------------- | -------------------------------------- | --------------------------- |
| id           | UUID             | PK, DEFAULT gen_random_uuid()          | 고유 식별자                 |
| user_id      | UUID             | NOT NULL, FK → users(id) ON DELETE CASCADE | 소유 사용자              |
| name         | TEXT             | NOT NULL                               | 서비스/항목 이름            |
| amount       | DECIMAL(12, 2)   | NOT NULL, CHECK (amount > 0)           | 결제 금액 (원화)            |
| billing_day  | INTEGER          | NOT NULL, CHECK (1 ~ 31)               | 매월 결제일                 |
| cycle        | TEXT             | NOT NULL, DEFAULT 'monthly', CHECK IN ('monthly','yearly') | 결제 주기 |
| category_id  | UUID             | FK → categories(id) ON DELETE SET NULL | 지출 카테고리 (선택사항)    |
| is_active    | BOOLEAN          | NOT NULL, DEFAULT TRUE                 | 활성 여부                   |
| created_at   | TIMESTAMPTZ      | NOT NULL, DEFAULT NOW()                | 생성 시각                   |
| updated_at   | TIMESTAMPTZ      | NOT NULL, DEFAULT NOW()                | 수정 시각 (트리거 자동 갱신)|

### RLS (Row Level Security)

```sql
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_expenses_owner_all" ON public.recurring_expenses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

모든 CRUD 작업에 대해 소유 사용자만 접근 허용

### 인덱스

```sql
CREATE INDEX idx_recurring_expenses_user_id ON public.recurring_expenses(user_id);
```

### 트리거

```sql
CREATE TRIGGER set_recurring_expenses_updated_at
  BEFORE UPDATE ON public.recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

`updated_at` 컬럼을 UPDATE 시 자동으로 현재 시각으로 갱신

### 마이그레이션 파일

`docs/migrations/006_phase6_extras.sql`

---

## 연관 타입

```typescript
export type RecurringCycle = 'monthly' | 'yearly'

export interface RecurringExpense {
  id: string
  user_id: string
  name: string
  amount: number
  billing_day: number        // 매월 결제일 (1-31)
  cycle: RecurringCycle
  category_id?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
```
