export interface FoodNutrition {
  id: string
  name: string
  calories: number      // 1인분 기준 kcal
  protein: number       // g
  carbs: number         // g
  fat: number           // g
  serving_size: string  // "100g" 등
  source: 'usda' | 'manual'
}

export interface FoodSearchResult {
  foods: FoodNutrition[]
}
