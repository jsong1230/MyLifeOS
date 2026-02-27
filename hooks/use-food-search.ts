'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { FoodNutrition } from '@/types/food'

export function useFoodSearch(query: string, locale = 'ko') {
  return useQuery<FoodNutrition[]>({
    queryKey: ['food-search', query, locale],
    queryFn: async () => {
      if (query.length < 1) return []
      const res = await fetch(
        `/api/food-search?q=${encodeURIComponent(query)}&locale=${locale}`
      )
      if (!res.ok) return []
      const data = (await res.json()) as { foods: FoodNutrition[] }
      return data.foods ?? []
    },
    enabled: query.length >= 1,
    staleTime: 10 * 60 * 1000,         // 10분 — 같은 검색어 재요청 방지
    placeholderData: keepPreviousData,   // 새 검색 중 이전 결과 유지 (깜빡임 방지)
  })
}
