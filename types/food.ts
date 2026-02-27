export interface FoodNutrition {
  id: string
  name: string
  calories: number      // 1인분(serving_size_g) 기준 kcal
  protein: number       // 1인분 기준 g
  carbs: number         // 1인분 기준 g
  fat: number           // 1인분 기준 g
  serving_size: string  // 표시용 문자열 (예: "150g", "1 cup")
  serving_size_g: number // 1인분 그램 수 (계산 기준)
  source: 'usda' | 'manual'
}

export interface FoodSearchResult {
  foods: FoodNutrition[]
}
