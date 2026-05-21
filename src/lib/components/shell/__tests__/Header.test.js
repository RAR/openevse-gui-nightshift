import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/svelte'

vi.mock('svelte-i18n', () => {
  const t = (k) => k
  t.subscribe = (fn) => { fn(t); return () => {} }
  return { _: t }
})

import Header from '../Header.svelte'

describe('Header', () => {
  it('shows the device name', () => {
    const { getByText } = render(Header, { props: { deviceName: 'Garage EVSE', connected: true } })
    expect(getByText('Garage EVSE')).toBeInTheDocument()
  })

  it('marks the status dot disconnected when not connected', () => {
    const { getByLabelText } = render(Header, { props: { deviceName: 'X', connected: false } })
    expect(getByLabelText('disconnected')).toBeInTheDocument()
  })
})
