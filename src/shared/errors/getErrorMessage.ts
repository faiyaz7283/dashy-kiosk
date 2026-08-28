/**
 * Error message mapping — converts API errors to user-friendly messages.
 *
 * Maps RFC 9457 error types and HTTP status codes to concise, actionable
 * messages for the toast notification system.
 */

import type { ApiError } from './ApiError'

/** Conflict sub-type keywords extracted from the error detail. */
const CONFLICT_KEYWORDS = [
  { keyword: 'claimed', message: 'Already claimed by another member' },
  { keyword: 'assigned', message: 'Already assigned to another member' },
] as const

/**
 * Get a user-friendly error message from an ApiError.
 *
 * Priority:
 * 1. RFC 9457 `title` → mapped message (e.g., "not-found" → "This chore no longer exists")
 * 2. HTTP status code → generic mapped message
 * 3. `detail` field as fallback
 * 4. "Something went wrong" as last resort
 *
 * For 422 validation errors, returns the first field-specific error message.
 * For 409 conflict errors, inspects `detail` for sub-type keywords.
 *
 * @param error - The parsed API error.
 * @returns A concise user-friendly error message.
 */
export function getErrorMessage(error: ApiError): string {
  // Validation errors — show first field-specific message
  if (error.status === 422 && error.errors?.length) {
    return error.errors[0]!.msg
  }

  // Conflict — inspect detail for sub-type
  if (error.status === 409) {
    const detail = (error.detail ?? '').toLowerCase()
    for (const { keyword, message } of CONFLICT_KEYWORDS) {
      if (detail.includes(keyword)) return message
    }
    return 'Conflict — this action cannot be completed'
  }

  // RFC 9457 title-based mapping
  if (error.title) {
    const mapped = TITLE_MESSAGES[error.title]
    if (mapped) return mapped
  }

  // Status code fallback
  const statusMessage = STATUS_MESSAGES[error.status]
  if (statusMessage) return statusMessage

  // Detail as last resort
  if (error.detail) return error.detail

  return 'Something went wrong. Please try again.'
}

/** RFC 9457 title → user message. */
const TITLE_MESSAGES: Record<string, string> = {
  'not-found': 'This chore no longer exists',
  conflict: 'This action conflicts with existing data',
  'validation-error': 'Please check your input and try again',
  'bad-request': 'Invalid request. Please try again.',
  'internal-error': 'Something went wrong. Please try again.',
}

/** HTTP status code → user message. */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please try again.',
  401: 'Session expired. Please refresh the page.',
  403: 'You do not have permission to perform this action.',
  404: 'This resource no longer exists.',
  409: 'Conflict — this action cannot be completed.',
  422: 'Please check your input and try again.',
  429: 'Too many requests. Please wait a moment.',
  500: 'Something went wrong. Please try again.',
  502: 'Service temporarily unavailable. Please try again.',
  503: 'Service temporarily unavailable. Please try again.',
}
