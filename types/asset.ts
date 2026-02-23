export type AssetType = 'cash' | 'deposit' | 'investment' | 'other'

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  cash: '현금',
  deposit: '예금/적금',
  investment: '투자',
  other: '기타',
}

export interface Asset {
  id: string
  user_id: string
  asset_type: AssetType
  amount: number
  note?: string | null
  month: string        // YYYY-MM
  created_at: string
  updated_at: string
}

export interface CreateAssetInput {
  asset_type: AssetType
  amount: number
  note?: string
  month: string        // YYYY-MM
}

export interface UpdateAssetInput {
  asset_type?: AssetType
  amount?: number
  note?: string | null
}

// 월별 자산 합계 (트렌드 차트용)
export interface AssetMonthlyTotal {
  month: string    // YYYY-MM
  total: number
}
