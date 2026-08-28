/**
 * Tests for ApiError class.
 *
 * Validates structured error creation and isRetryable logic.
 */

import { describe, it, expect } from 'vitest'
import { ApiError } from './ApiError'

describe('ApiError', () => {
  it('creates error with message and status', () => {
    const error = new ApiError('Not found', 404)

    expect(error.message).toBe('Not found')
    expect(error.status).toBe(404)
    expect(error.name).toBe('ApiError')
    expect(error instanceof Error).toBe(true)
  })

  it('includes optional detail field', () => {
    const error = new ApiError('Validation failed', 400, 'Email is required')

    expect(error.detail).toBe('Email is required')
  })

  it('includes RFC 9457 fields (type, title, errors)', () => {
    const errors = [
      { loc: ['body', 'email'], msg: 'Field required', type: 'missing' },
    ]
    const error = new ApiError(
      'Request validation failed',
      422,
      'Request validation failed',
      'https://dashy.local/errors/validation-error',
      'validation-error',
      errors,
    )

    expect(error.type).toBe('https://dashy.local/errors/validation-error')
    expect(error.title).toBe('validation-error')
    expect(error.errors).toEqual(errors)
  })

  it('marks 5xx errors as retryable', () => {
    expect(new ApiError('Server error', 500).isRetryable).toBe(true)
    expect(new ApiError('Bad gateway', 502).isRetryable).toBe(true)
    expect(new ApiError('Service unavailable', 503).isRetryable).toBe(true)
  })

  it('marks 429 rate limit as retryable', () => {
    expect(new ApiError('Rate limited', 429).isRetryable).toBe(true)
  })

  it('marks network errors (status 0) as retryable', () => {
    expect(new ApiError('Network error', 0).isRetryable).toBe(true)
  })

  it('marks 4xx client errors as non-retryable', () => {
    expect(new ApiError('Bad request', 400).isRetryable).toBe(false)
    expect(new ApiError('Unauthorized', 401).isRetryable).toBe(false)
    expect(new ApiError('Forbidden', 403).isRetryable).toBe(false)
    expect(new ApiError('Not found', 404).isRetryable).toBe(false)
    expect(new ApiError('Validation error', 422).isRetryable).toBe(false)
  })
})
