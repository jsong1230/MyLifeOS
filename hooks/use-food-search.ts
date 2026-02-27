'use client'

import { useQuery } from '@tanstack/react-query'
import type { FoodNutrition } from '@/types/food'

export function useFoodSearch(query: string) {
  return useQuery<FoodNutrition[]>({
    queryKey: ['food-search', query],
    queryFn: async () => {
      if (query.length < 1) return []
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`)
      if (!res.ok) return []
      const data = (await res.json()) as { foods: FoodNutrition[] }
      return data.foods ?? []
    },
    enabled: query.length >= 1,
    staleTime: 5 * 60 * 1000,
  })
}
