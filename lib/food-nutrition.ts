import type { FoodNutrition } from '@/types/food'
import { searchKoreanFoods } from '@/lib/korean-foods-db'

const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1'

function getUsdaApiKey(): string {
  return process.env.USDA_API_KEY ?? 'DEMO_KEY'
}

/** 쿼리에 한글이 포함되어 있는지 판단 */
function isKorean(text: string): boolean {
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text)
}

interface UsdaNutrient {
  nutrientId: number
  value: number
}

interface UsdaFoodItem {
  fdcId: number
  description: string
  servingSize?: number
  servingSizeUnit?: string
  foodNutrients: UsdaNutrient[]
}

function getNutrientPer100g(nutrients: UsdaNutrient[], nutrientId: number): number {
  return nutrients.find((n) => n.nutrientId === nutrientId)?.value ?? 0
}

/** USDA FoodData Central API 검색 (영문 위주) */
async function searchFoodsUsda(query: string): Promise<FoodNutrition[]> {
  try {
    const url = new URL(`${USDA_API_BASE}/foods/search`)
    url.searchParams.set('api_key', getUsdaApiKey())
    url.searchParams.set('query', query)
    url.searchParams.set('pageSize', '10')
    url.searchParams.set('dataType', 'Survey (FNDDS),Foundation')

    const res = await fetch(url.toString(), { next: { revalidate: 300 } })
    if (!res.ok) return []

    const json = (await res.json()) as { foods?: UsdaFoodItem[] }
    const foods = json.foods ?? []

    return foods.map((food): FoodNutrition => {
      // USDA 영양소는 100g 기준 → 실제 서빙 사이즈로 환산
      const servingSizeG = food.servingSize && food.servingSize > 0 ? food.servingSize : 100
      const factor = servingSizeG / 100

      const per100g = {
        calories: getNutrientPer100g(food.foodNutrients, 1008),
        protein: getNutrientPer100g(food.foodNutrients, 1003),
        carbs:   getNutrientPer100g(food.foodNutrients, 1005),
        fat:     getNutrientPer100g(food.foodNutrients, 1004),
      }

      return {
        id: String(food.fdcId),
        name: food.description,
        calories: Math.round(per100g.calories * factor),
        protein:  Math.round(per100g.protein  * factor * 10) / 10,
        carbs:    Math.round(per100g.carbs    * factor * 10) / 10,
        fat:      Math.round(per100g.fat      * factor * 10) / 10,
        serving_size: `${Math.round(servingSizeG)}${food.servingSizeUnit ?? 'g'}`,
        serving_size_g: servingSizeG,
        source: 'usda',
      }
    })
  } catch {
    return []
  }
}

/**
 * 음식 검색 — 한글이면 내장 한식 DB 우선, 없으면 USDA fallback
 * 영문이면 USDA 우선, 결과 없으면 내장 DB도 검색
 */
export async function searchFoods(query: string): Promise<FoodNutrition[]> {
  if (isKorean(query)) {
    // 한글 쿼리 → 내장 한식 DB 먼저
    const korResults = searchKoreanFoods(query).map((item): FoodNutrition => ({
      id: item.id,
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      serving_size: item.serving_size,
      serving_size_g: item.serving_size_g,
      source: 'kr_internal',
    }))

    if (korResults.length > 0) return korResults

    // 한식 DB에 없으면 USDA fallback
    return searchFoodsUsda(query)
  }

  // 영문 쿼리 → USDA 먼저
  const usdaResults = await searchFoodsUsda(query)
  if (usdaResults.length > 0) return usdaResults

  // USDA에 없으면 내장 DB에서도 검색 (영어 별명)
  return searchKoreanFoods(query).map((item): FoodNutrition => ({
    id: item.id,
    name: item.name,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    serving_size: item.serving_size,
    serving_size_g: item.serving_size_g,
    source: 'kr_internal',
  }))
}
