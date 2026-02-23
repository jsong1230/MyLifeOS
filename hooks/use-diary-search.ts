'use client'

import { useQuery } from '@tanstack/react-query'
import type { DiarySearchItem } from '@/app/api/diaries/search/route'

// 검색용 일기 목록 조회 훅
// 클라이언트에서 복호화 후 키워드 매칭을 위해 content_encrypted 포함
export function useDiarySearch(months = 12) {
  return useQuery<DiarySearchItem[]>({
    queryKey: ['diaries', 'search', months],
    queryFn: async () => {
      const res = await fetch(`/api/diaries/search?months=${months}`)
      const json = await res.json() as { success: boolean; data: DiarySearchItem[]; error?: string }
      if (!json.success) throw new Error(json.error ?? '검색 데이터 조회 실패')
      return json.data
    },
    // 검색 데이터는 5분간 캐시 유지 (staleTime 설정)
    staleTime: 5 * 60 * 1000,
  })
}
