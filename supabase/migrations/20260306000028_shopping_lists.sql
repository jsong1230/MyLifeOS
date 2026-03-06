-- 장보기 목록 (여러 목록 지원)
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '장보기 목록',
  budget NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'KRW',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 장보기 항목
CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT,             -- 개, kg, L 등
  estimated_price NUMERIC(12,2),
  actual_price NUMERIC(12,2),
  category TEXT,         -- 식품, 생활용품, 등
  is_checked BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_shopping_lists_user ON shopping_lists(user_id, created_at DESC);
CREATE INDEX idx_shopping_items_list ON shopping_items(list_id, sort_order);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shopping_lists: user isolation" ON shopping_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "shopping_items: user isolation" ON shopping_items FOR ALL USING (auth.uid() = user_id);
