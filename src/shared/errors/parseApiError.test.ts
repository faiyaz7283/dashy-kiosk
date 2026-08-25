/**
 * Tests for parseApiError function.
 *
 * Validates parsing of failed Response objects into structured ApiError.
 */

import { describe, it, expect, vi } from 'vitest'
import { parseApiError } from './parseApiError'
import { ApiError } from './ApiError'

describe('parseApiError', () => {
  it('parses FastAPI detail field from JSON body', async () => {
    const response = new Response(JSON.stringify({ detail: 'Item not found' }), {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'application/json' },
    })

    const error = await parseApiError(response)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('Item not found')
    expect(error.status).toBe(404)
    expect(error.detail).toBe('Item not found')
  })

  it('parses message field from JSON body', async () => {
    const response = new Response(JSON.stringify({ message: 'Custom error message' }), {
      status: 400,
      statusText: 'Bad Request',
      headers: { 'Content-Type': 'application/json' },
    })

    const error = await parseApiError(response)

    expect(error.message).toBe('Custom error message')
    expect(error.detail).toBe('Custom error message')
  })

  it('prefers detail over message when both present', async () => {
    const response = new Response(
      JSON.stringify({ detail: 'Detail message', message: 'Message field' }),
      {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'Content-Type': 'application/json' },
      },
    )

    const error = await parseApiError(response)

    expect(error.message).toBe('Detail message')
    expect(error.detail).toBe('Detail message')
  })

  it('falls back to statusText when body is not JSON', async () => {
    const response = new Response('Plain text error', {
      status: 500,
      statusText: 'Internal Server Error',
    })

    const error = await parseApiError(response)

    expect(error.message).toBe('Internal Server Error')
    expect(error.status).toBe(500)
    expect(error.detail).toBeUndefined()
  })

  it('falls back to statusText when JSON has no detail/message', async () => {
    const response = new Response(JSON.stringify({ other: 'field' }), {
      status: 403,
      statusText: 'Forbidden',
      headers: { 'Content-Type': 'application/json' },
    })

    const error = await parseApiError(response)

    expect(error.message).toBe('Forbidden')
    expect(error.detail).toBeUndefined()
  })

  it('handles empty response body', async () => {
    const response = new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    })

    const error = await parseApiError(response)

    expect(error.message).toBe('Internal Server Error')
    expect(error.status).toBe(500)
  })

  it('returns Unknown error when statusText is empty', async () => {
    const response = new Response(null, {
      status: 500,
      statusText: '',
    })

    const error = await parseApiError(response)

    expect(error.message).toBe('Unknown error')
  })

  it('never throws — always returns ApiError', async () => {
    // Mock a response that throws on json()
    const response = {
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: vi.fn(() => {
        throw new Error('Parse error')
      }),
    } as unknown as Response

    const error = await parseApiError(response)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('Server Error')
  })
})
