import { describe, it, expect, vi, beforeEach } from 'vitest'
import { get } from 'svelte/store'

vi.mock('svelte-i18n', () => {
  const t = (k) => k
  t.subscribe = (fn) => { fn(t); return () => {} }
  return { _: t }
})

import { uistates_store } from '../stores/uistates.js'
import { showWriteError } from '../alerts.js'

describe('showWriteError', () => {
  beforeEach(() => {
    uistates_store.resetAlertBox()
  })

  it('makes the global alert visible with the write-error message', () => {
    showWriteError()
    const alert = get(uistates_store).alertbox
    expect(alert.visible).toBe(true)
    expect(alert.title).toBe('alert.write_failed_title')
    expect(alert.body).toBe('alert.write_failed_body')
  })

  it('gives the alert a reset action that clears it', () => {
    showWriteError()
    const alert = get(uistates_store).alertbox
    expect(alert.action).toBeTypeOf('function')
    alert.action()
    expect(get(uistates_store).alertbox.visible).toBe(false)
  })
})
