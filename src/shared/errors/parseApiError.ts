import { ApiError } from './ApiError'

/**
 * Parse a failed fetch Response into a structured ApiError.
 *
 * Handles FastAPI's default error format (`{ detail: "..." }`) and
 * common alternatives (`{ message: "..." }`). Falls back to
 * `response.statusText` if the body is not JSON or has no recognized fields.
 *
 * Always returns an `ApiError` — never throws.
 *
 * @param response - The failed fetch Response (non-ok status).
 * @returns Structured ApiError with status code and parsed detail.
 *
 * @example
 * ```ts
 * const response = await fetch(url)
 * if (!response.ok) throw await parseApiError(response)
 * ```
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  let detail: string | undefined

  try {
    const body = await response.json()
    detail = body.detail ?? body.message
  } catch {
    // Response body is not valid JSON — use statusText only
  }

  return new ApiError(
    detail || response.statusText || 'Unknown error',
    response.status,
    detail,
  )
}
