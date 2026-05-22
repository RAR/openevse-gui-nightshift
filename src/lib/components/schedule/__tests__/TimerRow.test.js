import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'

vi.mock('svelte-i18n', () => {
  const t = (k) => k
  t.subscribe = (fn) => { fn(t); return () => {} }
  return { _: t }
})

import TimerRow from '../TimerRow.svelte'

const timer = { id: 2, state: 'active', time: '07:30', days: ['monday', 'wednesday'] }

describe('TimerRow', () => {
  it('shows the active state badge', () => {
    const { getByText } = render(TimerRow, { props: { timer } })
    expect(getByText('schedule.active')).toBeInTheDocument()
  })
  it('shows the disabled state badge', () => {
    const { getByText } = render(TimerRow, {
      props: { timer: { ...timer, state: 'disabled' } },
    })
    expect(getByText('schedule.disabled')).toBeInTheDocument()
  })
  it('fires onedit when the card body is clicked', async () => {
    const onedit = vi.fn()
    const { getAllByRole } = render(TimerRow, { props: { timer, onedit } })
    await fireEvent.click(getAllByRole('button')[0]) // the card body button
    expect(onedit).toHaveBeenCalledOnce()
  })
  it('fires ondelete from the delete icon button', async () => {
    const ondelete = vi.fn()
    const { getByLabelText } = render(TimerRow, { props: { timer, ondelete } })
    await fireEvent.click(getByLabelText('schedule.delete'))
    expect(ondelete).toHaveBeenCalledOnce()
  })
})
