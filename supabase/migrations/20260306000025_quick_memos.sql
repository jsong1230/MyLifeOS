-- F-40 퀵 메모 테이블
-- 클라이언트 사이드 AES-GCM 암호화로 content 저장

CREATE TABLE quick_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_encrypted TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  color TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 사용자별 최신순 인덱스
CREATE INDEX idx_quick_memos_user ON quick_memos(user_id, created_at DESC);

-- RLS 활성화
ALTER TABLE quick_memos ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 접근 가능
CREATE POLICY "quick_memos: user isolation" ON quick_memos
  FOR ALL USING (auth.uid() = user_id);
