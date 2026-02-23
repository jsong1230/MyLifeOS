// ─── 감정 태그 (10개) ────────────────────────────────────────
export type EmotionType =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'anxious'
  | 'excited'
  | 'calm'
  | 'tired'
  | 'lonely'
  | 'grateful'
  | 'proud'

export const EMOTION_LABELS: Record<EmotionType, string> = {
  happy: '행복',
  sad: '슬픔',
  angry: '분노',
  anxious: '불안',
  excited: '설렘',
  calm: '평온',
  tired: '피로',
  lonely: '외로움',
  grateful: '감사',
  proud: '자랑스러움',
}

export const EMOTION_ICONS: Record<EmotionType, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  anxious: '😰',
  excited: '🤩',
  calm: '😌',
  tired: '😴',
  lonely: '😔',
  grateful: '🙏',
  proud: '😤',
}

// ─── 일기 (diaries) ──────────────────────────────────────────
export interface DiaryEntry {
  id: string
  user_id: string
  date: string             // DATE (ISO string, per user unique)
  content_encrypted: string   // AES-256 암호화된 본문
  emotion_tags: EmotionType[] // 선택한 감정 태그 목록
  created_at: string
  updated_at: string
}

export interface CreateDiaryInput {
  date?: string            // 기본값: 오늘
  content: string          // 평문 (저장 전 클라이언트에서 암호화)
  emotion_tags: EmotionType[]
}

export interface UpdateDiaryInput {
  content?: string         // 평문 (저장 전 클라이언트에서 암호화)
  emotion_tags?: EmotionType[]
  date?: string
}

// 클라이언트에서 복호화된 일기 (UI 표시용)
export interface DiaryEntryDecrypted extends Omit<DiaryEntry, 'content_encrypted'> {
  content: string
}
