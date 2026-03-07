export type NotificationType = 'info' | 'warning' | 'reminder'

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  read_at: string | null
  created_at: string
}
