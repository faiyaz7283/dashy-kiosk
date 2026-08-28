/**
 * Error notification helper — shows toast notifications for API errors.
 *
 * Wraps `useNotifications` with a `showApiError` convenience function
 * that extracts a user-friendly message from an `ApiError` and displays
 * it as a danger toast.
 */

import { useNotifications } from '@/shared/context/NotificationContext'
import { getErrorMessage } from '@/shared/errors/getErrorMessage'
import type { ApiError } from '@/shared/errors/ApiError'

/**
 * Hook providing error notification helpers.
 *
 * @returns Object with `showApiError` function.
 */
export function useErrorNotifications() {
  const { addNotification } = useNotifications()

  /**
   * Show a danger toast for an API error.
   *
   * Extracts a user-friendly message via `getErrorMessage` and
   * displays it with 8-second auto-dismiss.
   *
   * @param error - The parsed API error to display.
   */
  const showApiError = (error: ApiError) => {
    addNotification({
      type: 'danger',
      title: 'Error',
      message: getErrorMessage(error),
    })
  }

  return { showApiError }
}
