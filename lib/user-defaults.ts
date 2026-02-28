import type { SupabaseClient } from '@supabase/supabase-js'
import type { CurrencyCode } from '@/lib/currency'

/**
 * 사용자의 기본 통화를 조회 (user_settings 테이블)
 * 설정 없으면 'KRW' 반환
 */
export async function getUserDefaultCurrency(
  supabase: SupabaseClient,
  userId: string
): Promise<CurrencyCode> {
  const { data } = await supabase
    .from('user_settings')
    .select('default_currency')
    .eq('user_id', userId)
    .maybeSingle()

  return (data?.default_currency as CurrencyCode) ?? 'KRW'
}
