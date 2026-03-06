// F-40 퀵 메모 타입 정의

export type MemoColor = 'default' | 'yellow' | 'green' | 'blue' | 'pink' | 'purple'

export interface QuickMemo {
  id: string
  user_id: string
  content_encrypted: string
  is_pinned: boolean
  color: MemoColor
  created_at: string
  updated_at: string
}

export interface CreateMemoInput {
  /** 평문 (클라이언트에서 암호화 후 전송) */
  content: string
  is_pinned?: boolean
  color?: MemoColor
}

export interface UpdateMemoInput {
  content?: string
  is_pinned?: boolean
  color?: MemoColor
}

/** 복호화된 메모 (클라이언트 사이드) */
export interface DecryptedMemo extends Omit<QuickMemo, 'content_encrypted'> {
  content: string
}
