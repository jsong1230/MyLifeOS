CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  total_pages INTEGER,
  current_page INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'to_read',  -- 'to_read' | 'reading' | 'completed'
  started_at DATE,
  completed_at DATE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_books_user ON books(user_id, status);
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "books: user isolation" ON books FOR ALL USING (auth.uid() = user_id);
