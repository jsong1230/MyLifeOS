export type WidgetKey = 'time' | 'money' | 'health' | 'private' | 'books' | 'insights'

export interface WidgetConfig {
  key: WidgetKey
  visible: boolean
  order: number
}

export const DEFAULT_LAYOUT: WidgetConfig[] = [
  { key: 'insights', visible: true, order: 0 },
  { key: 'time',     visible: true, order: 1 },
  { key: 'money',    visible: true, order: 2 },
  { key: 'health',   visible: true, order: 3 },
  { key: 'private',  visible: true, order: 4 },
  { key: 'books',    visible: true, order: 5 },
]
