'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Bell, Info, AlertTriangle, Clock } from 'lucide-react'
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/use-notifications'
import type { AppNotification, NotificationType } from '@/types/notification'

function formatRelativeTime(createdAt: string, t: ReturnType<typeof useTranslations>): string {
  const diff = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)

  if (minutes < 1) return t('just_now')
  if (hours < 1) return t('minutes_ago', { n: minutes })
  if (hours < 24) return t('hours_ago', { n: hours })

  return new Date(createdAt).toLocaleDateString()
}

function typeIcon(type: NotificationType) {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
    case 'reminder':
      return <Clock className="w-4 h-4 text-blue-500 shrink-0" />
    default:
      return <Info className="w-4 h-4 text-muted-foreground shrink-0" />
  }
}

function NotificationItem({
  notification,
  onRead,
  t,
}: {
  notification: AppNotification
  onRead: (id: string) => void
  t: ReturnType<typeof useTranslations>
}) {
  const isUnread = notification.read_at === null

  return (
    <button
      className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-start gap-2.5 ${
        isUnread ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
      }`}
      onClick={() => {
        if (isUnread) onRead(notification.id)
      }}
    >
      <div className="mt-0.5">{typeIcon(notification.type as NotificationType)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-medium truncate">{notification.title}</p>
          {isUnread && (
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" aria-label={t('unread_badge', { count: 1 })} />
          )}
        </div>
        {notification.body && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{notification.body}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(notification.created_at, t)}
        </p>
      </div>
    </button>
  )
}

export function NotificationBell() {
  const t = useTranslations('notifications')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data } = useNotifications()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const notifications = data?.data ?? []
  const unreadCount = data?.unread_count ?? 0
  const displayCount = unreadCount > 9 ? '9+' : unreadCount > 0 ? String(unreadCount) : null

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleMarkRead(id: string) {
    markRead.mutate(id)
  }

  function handleMarkAllRead() {
    if (unreadCount > 0) markAllRead.mutate()
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Bell 버튼 */}
      <button
        type="button"
        aria-label={unreadCount > 0 ? t('unread_badge', { count: unreadCount }) : t('title')}
        className="relative p-1 rounded-md hover:bg-muted transition-colors"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        {displayCount && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {displayCount}
          </span>
        )}
      </button>

      {/* 드롭다운 패널 */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-background shadow-lg z-50 overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b">
            <h3 className="text-sm font-semibold">{t('title')}</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs text-primary hover:underline disabled:opacity-50"
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
              >
                {t('mark_all_read')}
              </button>
            )}
          </div>

          {/* 알림 목록 */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {t('empty')}
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={handleMarkRead}
                  t={t}
                />
              ))
            )}
          </div>

          {/* 전체 보기 링크 */}
          <div className="border-t px-3 py-2 text-center">
            <Link
              href="/notifications"
              className="text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              {t('view_all')}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
