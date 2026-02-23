// ─── 인간관계 메모 (relations) ───────────────────────────────
export type RelationshipType = 'family' | 'friend' | 'colleague' | 'other'

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  family: '가족',
  friend: '친구',
  colleague: '동료',
  other: '기타',
}

export interface Relation {
  id: string
  user_id: string
  name: string               // 인물 이름
  relationship_type: RelationshipType
  last_met_at?: string | null // DATE (마지막 만난 날)
  memo_encrypted?: string | null  // AES-256 암호화된 메모
  created_at: string
  updated_at: string
}

export interface CreateRelationInput {
  name: string
  relationship_type: RelationshipType
  last_met_at?: string       // YYYY-MM-DD
  memo?: string              // 평문 (저장 전 클라이언트에서 암호화)
}

export interface UpdateRelationInput {
  name?: string
  relationship_type?: RelationshipType
  last_met_at?: string | null
  memo?: string | null       // 평문 (null이면 메모 삭제)
}

// 클라이언트에서 복호화된 인간관계 메모 (UI 표시용)
export interface RelationDecrypted extends Omit<Relation, 'memo_encrypted'> {
  memo?: string | null
}
