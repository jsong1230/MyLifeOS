import type { FoodNutrition } from '@/types/food'
import { searchKoreanFoods, getEnglishAlias, localizeServingSize } from '@/lib/korean-foods-db'
import { FOOD_EN_NAMES } from '@/lib/food-en-names'

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

function toFoodNutrition(
  item: import('@/lib/korean-foods-db').KoreanFoodEntry,
  locale = 'ko',
): FoodNutrition {
  const englishName = getEnglishAlias(item, FOOD_EN_NAMES)
  const name = locale === 'en' && englishName ? englishName : item.name
  return {
    id: item.id,
    name,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    serving_size: localizeServingSize(item.serving_size, locale),
    serving_size_g: item.serving_size_g,
    source: 'kr_internal',
  }
}

/**
 * 음식 검색 — 내장 DB + USDA 항상 병행 검색, 내장 DB 결과 우선 표시
 * - 한글 쿼리: 내장 DB 결과 먼저, 이어서 USDA 결과 (최대 10개)
 * - 영문 쿼리: 내장 DB(영어 별명 매칭) + USDA 병행, 내장 결과 먼저
 * - locale: 검색 결과 음식명/단위를 해당 언어로 표시
 */
export async function searchFoods(query: string, locale = 'ko'): Promise<FoodNutrition[]> {
  const localResults = searchKoreanFoods(query).map((item) => toFoodNutrition(item, locale))

  if (isKorean(query)) {
    // 한글 쿼리 → 내장 DB 결과로 충분하면 바로 반환
    if (localResults.length >= 5) return localResults
    // 부족하면 USDA도 병행
    const usdaResults = await searchFoodsUsda(query)
    return [...localResults, ...usdaResults].slice(0, 10)
  }

  // 영문 쿼리 → 내장 DB(영어 alias 포함) + USDA 항상 병행
  const usdaResults = await searchFoodsUsda(query)
  const localIds = new Set(localResults.map((r) => r.id))
  const merged = [
    ...localResults,
    ...usdaResults.filter((r) => !localIds.has(r.id)),
  ]
  return merged.slice(0, 10)
}
