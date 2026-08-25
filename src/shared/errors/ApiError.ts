/**
 * Structured API error carrying HTTP status and parsed response body.
 *
 * Unlike plain `Error`, this preserves the status code and backend error
 * details so consumers can make decisions (retry, show specific message,
 * redirect on 401, etc.).
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

  /** Whether this error is worth retrying (server errors, network issues). */
  public readonly isRetryable: boolean

  /**
   * @param message - Human-readable error message.
   * @param status - HTTP status code (0 for network errors).
   * @param detail - Backend error detail from response body (FastAPI's `detail` field).
   */
  constructor(message: string, status: number, detail?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    // Retry on server errors (5xx), rate limits (429), and network failures (0)
    this.isRetryable = status >= 500 || status === 429 || status === 0
  }
}
