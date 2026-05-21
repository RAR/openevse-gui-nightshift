import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../stores/uistates.js', () => ({
  uistates_store: { update: vi.fn((fn) => fn({ has_fetched: true })) },
}))
vi.mock('svelte/store', async () => {
  const actual = await vi.importActual('svelte/store')
  return { ...actual, get: vi.fn(() => ({ has_fetched: true })) }
})

import { httpAPI } from '../httpAPI.js'

describe('httpAPI', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('GETs JSON and returns the parsed body', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ ok: 1 }) }),
    )
    const res = await httpAPI('GET', '/status')
    expect(res).toEqual({ ok: 1 })
  })

  it('returns the string "error" when fetch rejects', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('network')))
    const res = await httpAPI('GET', '/status')
    expect(res).toBe('error')
  })
})
