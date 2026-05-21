import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/svelte'

vi.mock('svelte-i18n', () => {
  const t = (k) => k
  t.subscribe = (fn) => { fn(t); return () => {} }
  return { _: t }
})

import ConnectionBanners from '../ConnectionBanners.svelte'

describe('ConnectionBanners', () => {
  it('shows nothing when connected and healthy', () => {
    const { container } = render(ConnectionBanners, {
      props: { wsConnected: true, evseConnected: true, error: false },
    })
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(0)
  })

  it('shows the connection-lost banner when the websocket is down', () => {
    const { getAllByRole } = render(ConnectionBanners, {
      props: { wsConnected: false, evseConnected: true, error: false },
    })
    expect(getAllByRole('alert').length).toBeGreaterThan(0)
  })
})
