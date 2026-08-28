/**
 * Structured API error carrying HTTP status and parsed response body.
 *
 * Unlike plain `Error`, this preserves the status code and backend error
 * details so consumers can make decisions (retry, show specific message,
 * redirect on 401, etc.).
 *
 * Supports RFC 9457 Problem Details format with optional validation errors.
 *
 * @example
 * ```ts
 * const response = await fetch(url)
 * if (!response.ok) throw await parseApiError(response)
 *
 * // Later, in error handling:
 * catch (error) {
 *   if (error instanceof ApiError) {
 *     if (error.status === 401) redirect('/login')
 *     if (error.status === 409) showToast('Already claimed')
 *     if (error.status === 422 && error.errors) showValidationErrors(error.errors)
 *     if (!error.isRetryable) showToast(error.message)
 *   }
 * }
 * ```
 */
export class ApiError extends Error {
  /** HTTP status code (0 for network errors). */
  public readonly status: number

  /** Backend error detail from response body (FastAPI's `detail` field). */
  public readonly detail: string | undefined

  /** RFC 9457 error type URI (e.g., "https://dashy.local/errors/validation-error"). */
  public readonly type: string | undefined

  /** RFC 9457 error title (e.g., "validation-error", "not-found", "conflict"). */
  public readonly title: string | undefined

  /** Validation errors array (only present for 422 responses). */
  public readonly errors: Array<{
    loc: string[]
    msg: string
    type: string
  }> | undefined

  /** Whether this error is worth retrying (server errors, network issues). */
  public readonly isRetryable: boolean

  /**
   * @param message - Human-readable error message.
   * @param status - HTTP status code (0 for network errors).
   * @param detail - Backend error detail from response body.
   * @param type - RFC 9457 error type URI.
   * @param title - RFC 9457 error title.
   * @param errors - Validation errors array (for 422 responses).
   */
  constructor(
    message: string,
    status: number,
    detail?: string,
    type?: string,
    title?: string,
    errors?: Array<{ loc: string[]; msg: string; type: string }>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    this.type = type
    this.title = title
    this.errors = errors
    // Retry on server errors (5xx), rate limits (429), and network failures (0)
    this.isRetryable = status >= 500 || status === 429 || status === 0
  }
}
