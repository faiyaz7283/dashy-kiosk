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

  it('parses RFC 9457 Problem Details format', async () => {
    const responseBody = {
      type: 'https://dashy.local/errors/validation-error',
      title: 'validation-error',
      status: 422,
      detail: 'Request validation failed',
      errors: [
        { loc: ['body', 'name'], msg: 'Field required', type: 'missing' },
        { loc: ['body', 'email'], msg: 'Invalid email', type: 'value_error' },
      ],
    }
    const response = new Response(JSON.stringify(responseBody), {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: { 'Content-Type': 'application/json' },
    })

    const error = await parseApiError(response)

    expect(error.message).toBe('Request validation failed')
    expect(error.status).toBe(422)
    expect(error.detail).toBe('Request validation failed')
    expect(error.type).toBe('https://dashy.local/errors/validation-error')
    expect(error.title).toBe('validation-error')
    expect(error.errors).toEqual([
      { loc: ['body', 'name'], msg: 'Field required', type: 'missing' },
      { loc: ['body', 'email'], msg: 'Invalid email', type: 'value_error' },
    ])
  })

  it('parses RFC 9457 conflict error', async () => {
    const responseBody = {
      type: 'https://dashy.local/errors/conflict',
      title: 'conflict',
      status: 409,
      detail: 'Instance is already claimed by another member',
    }
    const response = new Response(JSON.stringify(responseBody), {
      status: 409,
      statusText: 'Conflict',
      headers: { 'Content-Type': 'application/json' },
    })

    const error = await parseApiError(response)

    expect(error.message).toBe('Instance is already claimed by another member')
    expect(error.status).toBe(409)
    expect(error.type).toBe('https://dashy.local/errors/conflict')
    expect(error.title).toBe('conflict')
    expect(error.errors).toBeUndefined()
  })

  it('parses RFC 9457 not-found error', async () => {
    const responseBody = {
      type: 'https://dashy.local/errors/not-found',
      title: 'not-found',
      status: 404,
      detail: 'Master chore with id "xyz" not found',
    }
    const response = new Response(JSON.stringify(responseBody), {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'application/json' },
    })

    const error = await parseApiError(response)

    expect(error.message).toBe('Master chore with id "xyz" not found')
    expect(error.status).toBe(404)
    expect(error.type).toBe('https://dashy.local/errors/not-found')
    expect(error.title).toBe('not-found')
  })
})
