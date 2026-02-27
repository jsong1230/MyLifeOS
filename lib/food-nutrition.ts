import type { FoodNutrition } from '@/types/food'

const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1'

function getApiKey(): string {
  return process.env.USDA_API_KEY ?? 'DEMO_KEY'
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

export async function searchFoods(query: string): Promise<FoodNutrition[]> {
  try {
    const url = new URL(`${USDA_API_BASE}/foods/search`)
    url.searchParams.set('api_key', getApiKey())
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
        // 1인분(servingSizeG) 기준 영양소
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
