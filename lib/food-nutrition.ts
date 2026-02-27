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

function getNutrientValue(nutrients: UsdaNutrient[], nutrientId: number): number {
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

    return foods.map(
      (food): FoodNutrition => ({
        id: String(food.fdcId),
        name: food.description,
        calories: Math.round(getNutrientValue(food.foodNutrients, 1008)),
        protein: Math.round(getNutrientValue(food.foodNutrients, 1003) * 10) / 10,
        carbs: Math.round(getNutrientValue(food.foodNutrients, 1005) * 10) / 10,
        fat: Math.round(getNutrientValue(food.foodNutrients, 1004) * 10) / 10,
        serving_size: food.servingSize
          ? `${food.servingSize}${food.servingSizeUnit ?? 'g'}`
          : '100g',
        source: 'usda',
      })
    )
  } catch {
    return []
  }
}
