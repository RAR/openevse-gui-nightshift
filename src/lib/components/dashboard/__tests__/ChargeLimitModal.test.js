import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'

vi.mock('svelte-i18n', () => {
  const t = (k) => k
  t.subscribe = (fn) => { fn(t); return () => {} }
  return { _: t }
})

import ChargeLimitModal from '../ChargeLimitModal.svelte'

describe('ChargeLimitModal', () => {
  it('renders nothing when closed', () => {
    const { queryByRole } = render(ChargeLimitModal, { props: { open: false } })
    expect(queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('saves an energy limit with the chosen value', async () => {
    const onsave = vi.fn()
    const { getByRole, getByText } = render(ChargeLimitModal, {
      props: { open: true, onsave },
    })
    // default type is energy; set the energy slider then save
    const slider = getByRole('slider')
    slider.value = '10'
    await fireEvent.change(slider)
    await fireEvent.click(getByText('dashboard.limit.save'))
    expect(onsave).toHaveBeenCalledWith({ type: 'energy', value: 10000, auto_release: true })
  })
})
