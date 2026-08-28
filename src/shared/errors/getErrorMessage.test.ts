/**
 * Tests for getErrorMessage function.
 *
 * Validates error message mapping from ApiError to user-friendly strings.
 */

import { describe, it, expect } from 'vitest'
import { getErrorMessage } from './getErrorMessage'
import { ApiError } from './ApiError'

describe('getErrorMessage', () => {
  describe('validation errors (422)', () => {
    it('returns first field-specific error message', () => {
      const error = new ApiError(
        'Request validation failed',
        422,
        'Request validation failed',
        'https://dashy.local/errors/validation-error',
        'validation-error',
        [
          { loc: ['body', 'name'], msg: 'Field required', type: 'missing' },
          { loc: ['body', 'email'], msg: 'Invalid email', type: 'value_error' },
        ],
      )

      expect(getErrorMessage(error)).toBe('Field required')
    })

    it('falls back to title mapping when no errors array', () => {
      const error = new ApiError(
        'Request validation failed',
        422,
        'Request validation failed',
        'https://dashy.local/errors/validation-error',
        'validation-error',
      )

      expect(getErrorMessage(error)).toBe('Please check your input and try again')
    })
  })

  describe('conflict errors (409)', () => {
    it('returns "Already claimed" when detail contains "claimed"', () => {
      const error = new ApiError(
        'Instance is already claimed by another member',
        409,
        'Instance is already claimed by another member',
        'https://dashy.local/errors/conflict',
        'conflict',
      )

      expect(getErrorMessage(error)).toBe('Already claimed by another member')
    })

    it('returns "Already assigned" when detail contains "assigned"', () => {
      const error = new ApiError(
        'Instance is already assigned to another member',
        409,
        'Instance is already assigned to another member',
        'https://dashy.local/errors/conflict',
        'conflict',
      )

      expect(getErrorMessage(error)).toBe('Already assigned to another member')
    })

    it('returns generic conflict message when no keyword match', () => {
      const error = new ApiError(
        'Some other conflict',
        409,
        'Some other conflict',
        'https://dashy.local/errors/conflict',
        'conflict',
      )

      expect(getErrorMessage(error)).toBe('Conflict — this action cannot be completed')
    })
  })

  describe('not-found errors (404)', () => {
    it('returns "This chore no longer exists" for not-found title', () => {
      const error = new ApiError(
        'Master chore with id "xyz" not found',
        404,
        'Master chore with id "xyz" not found',
        'https://dashy.local/errors/not-found',
        'not-found',
      )

      expect(getErrorMessage(error)).toBe('This chore no longer exists')
    })

    it('returns generic 404 message when title is missing', () => {
      const error = new ApiError(
        'Resource not found',
        404,
        'Resource not found',
      )

      expect(getErrorMessage(error)).toBe('This resource no longer exists.')
    })
  })

  describe('status code fallbacks', () => {
    it('returns 400 message', () => {
      const error = new ApiError('Bad request', 400, 'Bad request')
      expect(getErrorMessage(error)).toBe('Invalid request. Please try again.')
    })

    it('returns 401 message', () => {
      const error = new ApiError('Unauthorized', 401, 'Unauthorized')
      expect(getErrorMessage(error)).toBe('Session expired. Please refresh the page.')
    })

    it('returns 403 message', () => {
      const error = new ApiError('Forbidden', 403, 'Forbidden')
      expect(getErrorMessage(error)).toBe(
        'You do not have permission to perform this action.',
      )
    })

    it('returns 429 message', () => {
      const error = new ApiError('Too many requests', 429, 'Too many requests')
      expect(getErrorMessage(error)).toBe('Too many requests. Please wait a moment.')
    })

    it('returns 500 message', () => {
      const error = new ApiError('Internal server error', 500, 'Internal server error')
      expect(getErrorMessage(error)).toBe('Something went wrong. Please try again.')
    })

    it('returns 502 message', () => {
      const error = new ApiError('Bad gateway', 502, 'Bad gateway')
      expect(getErrorMessage(error)).toBe(
        'Service temporarily unavailable. Please try again.',
      )
    })

    it('returns 503 message', () => {
      const error = new ApiError('Service unavailable', 503, 'Service unavailable')
      expect(getErrorMessage(error)).toBe(
        'Service temporarily unavailable. Please try again.',
      )
    })
  })

  describe('fallback chain', () => {
    it('uses detail field when no title or status match', () => {
      const error = new ApiError('Custom error', 418, 'Custom error detail')
      expect(getErrorMessage(error)).toBe('Custom error detail')
    })

    it('returns generic message when nothing else matches', () => {
      const error = new ApiError('', 418)
      expect(getErrorMessage(error)).toBe('Something went wrong. Please try again.')
    })
  })
})
