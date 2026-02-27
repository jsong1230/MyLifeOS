/** 로케일에 맞게 serving_size 단위를 변환 (영문 모드) */
export function localizeServingSize(serving: string, locale: string): string {
  if (locale !== 'en') return serving
  return serving
    .replace(/반마리/g, 'half')
    .replace(/(\d+)마리/g, '$1 whole')
    .replace(/(\d+)인분/g, '$1 serving')
    .replace(/(\d+)그릇/g, '$1 bowl')
    .replace(/(\d+)공기/g, '$1 cup')
    .replace(/(\d+)개/g, '$1 pc')
    .replace(/(\d+)접시/g, '$1 plate')
    .replace(/(\d+)조각/g, '$1 slice')
    .replace(/(\d+)장/g, '$1 sheet')
    .replace(/(\d+)토막/g, '$1 pc')
    .replace(/(\d+)잔/g, '$1 cup')
    .replace(/(\d+)코스/g, '$1 course')
}
