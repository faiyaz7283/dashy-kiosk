/**
 * Notification toast component.
 *
 * Displays a single notification with icon, title, optional message,
 * and close button. Uses HeadlessUI Transition for enter/leave animations.
 * Styled per severity type with appropriate colors and icons.
 */

import { Transition } from '@headlessui/react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'
import type { Notification, NotificationType } from '@/shared/context/NotificationContext'

/** Icon and color configuration per notification type. */
const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; bg: string; border: string; text: string; iconColor: string }> = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    iconColor: 'text-green-400',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-400',
  },
  danger: {
    icon: AlertTriangle,
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-900 dark:text-red-100',
    iconColor: 'text-red-500',
  },
}

/** Props for the NotificationToast component. */
interface NotificationToastProps {
  /** The notification to display. */
  notification: Notification
  /** Callback when the close button is clicked. */
  onClose: () => void
}

/**
 * Renders a single notification toast with animation.
 *
 * @param props - Notification data and close handler.
 * @returns Animated toast element.
 */
export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const config = TYPE_CONFIG[notification.type]
  const Icon = config.icon

  return (
    <Transition
      appear
      show
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-x-full opacity-0"
      enterTo="translate-x-0 opacity-100"
      leave="transform ease-in duration-200 transition"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className={`pointer-events-auto flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg ${config.bg} ${config.border}`}
        role="alert"
      >
        <Icon className={`h-5 w-5 flex-shrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.text}`}>{notification.title}</p>
          {notification.message && (
            <p className={`mt-1 text-sm ${config.text} opacity-80`}>{notification.message}</p>
          )}
        </div>
        <button
          type="button"
          className={`flex-shrink-0 rounded-md p-1 ${config.text} opacity-60 hover:opacity-100 transition-opacity`}
          onClick={onClose}
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Transition>
  )
}
