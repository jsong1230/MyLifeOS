export type InvestmentType = 'stock' | 'etf' | 'crypto' | 'other'
export type TradeType = 'buy' | 'sell'

export interface Investment {
  id: string
  user_id: string
  ticker: string
  name: string
  asset_type: InvestmentType
  shares: number
  avg_cost: number
  current_price: number | null
  currency: string
  exchange: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface InvestmentTransaction {
  id: string
  user_id: string
  investment_id: string
  type: TradeType
  price: number
  shares: number
  fee: number
  date: string
  note: string | null
  created_at: string
}

export interface InvestmentWithTransactions extends Investment {
  investment_transactions: InvestmentTransaction[]
}

export interface CreateInvestmentInput {
  ticker: string
  name: string
  asset_type: InvestmentType
  currency: string
  exchange?: string
  note?: string
}

export interface UpdateInvestmentInput {
  name?: string
  current_price?: number | null
  exchange?: string | null
  note?: string | null
}

export interface CreateTradeInput {
  type: TradeType
  price: number
  shares: number
  fee?: number
  date?: string
  note?: string
}
