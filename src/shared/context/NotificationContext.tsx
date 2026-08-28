/**
 * Notification context and provider.
 *
 * Provides a global notification system for user feedback on actions.
 * Notifications are displayed as toasts that auto-dismiss after a configurable
 * duration. Multiple notifications stack vertically.
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { NotificationToast } from '@/shared/components/NotificationToast'

/** Notification severity levels. */
export type NotificationType = 'success' | 'error' | 'warning' | 'danger'

/** A notification to display. */
export interface Notification {
  /** Unique identifier. */
  id: string
  /** Severity level. */
  type: NotificationType
  /** Short title. */
  title: string
  /** Optional detail message. */
  message?: string
  /** Whether to auto-dismiss. Defaults to true for non-danger. */
  autoDismiss?: boolean
  /** Duration in ms before auto-dismiss. Defaults vary by type. */
  duration?: number
}

/** Default durations per notification type (ms). */
const DEFAULT_DURATIONS: Record<NotificationType, number> = {
  success: 5000,
  error: 8000,
  warning: 6000,
  danger: 0, // No auto-dismiss for danger
}

/** Default auto-dismiss per type. */
const DEFAULT_AUTO_DISMISS: Record<NotificationType, boolean> = {
  success: true,
  error: true,
  warning: true,
  danger: false,
}

/** API returned by useNotifications. */
export interface UseNotificationsResult {
  /** Currently active notifications. */
  notifications: Notification[]
  /** Add a new notification. */
  addNotification: (notification: Omit<Notification, 'id'>) => void
  /** Remove a notification by ID. */
  removeNotification: (id: string) => void
  /** Clear all notifications. */
  clearAll: () => void
}

const NotificationContext = createContext<UseNotificationsResult | null>(null)

/** Counter for generating unique IDs. */
let nextId = 0

/**
 * Provider that manages notification state and renders the toast container.
 *
 * Wraps the app and provides notification context to all descendants.
 * Toasts are rendered in a portal at the top-right of the viewport.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = `notification-${++nextId}`
      const type = notification.type
      const autoDismiss = notification.autoDismiss ?? DEFAULT_AUTO_DISMISS[type]
      const duration = notification.duration ?? DEFAULT_DURATIONS[type]

      const fullNotification: Notification = {
        ...notification,
        id,
        autoDismiss,
        duration,
      }

      setNotifications((prev) => [...prev, fullNotification])

      if (autoDismiss && duration > 0) {
        const timer = setTimeout(() => {
          removeNotification(id)
        }, duration)
        timersRef.current.set(id, timer)
      }
    },
    [removeNotification],
  )

  const clearAll = useCallback(() => {
    setNotifications([])
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current.clear()
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-3">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

/**
 * Hook to access the notification system.
 *
 * @returns Notification API for adding/removing notifications.
 * @throws If used outside NotificationProvider.
 */
export function useNotifications(): UseNotificationsResult {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
