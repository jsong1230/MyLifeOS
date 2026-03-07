export type WidgetKey = 'time' | 'money' | 'health' | 'private' | 'books'

export interface WidgetConfig {
  key: WidgetKey
  visible: boolean
  order: number
}

export const DEFAULT_LAYOUT: WidgetConfig[] = [
  { key: 'time',    visible: true, order: 0 },
  { key: 'money',   visible: true, order: 1 },
  { key: 'health',  visible: true, order: 2 },
  { key: 'private', visible: true, order: 3 },
  { key: 'books',   visible: true, order: 4 },
]
