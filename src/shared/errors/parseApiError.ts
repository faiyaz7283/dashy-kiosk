import { ApiError } from './ApiError'

/**
 * Parse a failed fetch Response into a structured ApiError.
 *
 * Handles RFC 9457 Problem Details format (`{ type, title, status, detail, errors }`),
 * FastAPI's default error format (`{ detail: "..." }`), and
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
  let type: string | undefined
  let title: string | undefined
  let errors: Array<{ loc: string[]; msg: string; type: string }> | undefined

  try {
    const body = await response.json()
    // RFC 9457 Problem Details format
    detail = body.detail ?? body.message
    type = body.type
    title = body.title
    errors = body.errors
  } catch {
    // Response body is not valid JSON — use statusText only
  }

  return new ApiError(
    detail || response.statusText || 'Unknown error',
    response.status,
    detail,
    type,
    title,
    errors,
  )
}
