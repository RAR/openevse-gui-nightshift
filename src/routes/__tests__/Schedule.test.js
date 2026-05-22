import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'

vi.mock('svelte-i18n', () => {
  const t = (k) => k
  t.subscribe = (fn) => { fn(t); return () => {} }
  return { _: t }
})
vi.mock('../../lib/api/httpAPI.js', () => ({ httpAPI: vi.fn(() => Promise.resolve({})) }))

import { schedule_store } from '../../lib/stores/schedule.js'
import Schedule from '../Schedule.svelte'

describe('Schedule', () => {
  beforeEach(() => {
    schedule_store.set([])
  })

  it('shows the empty state when there are no timers', () => {
    const { getByText } = render(Schedule)
    expect(getByText('schedule.empty')).toBeInTheDocument()
  })

  it('renders a row per timer from the store', () => {
    schedule_store.set([
      { id: 1, state: 'active', time: '07:00', days: ['monday'] },
      { id: 2, state: 'active', time: '19:00', days: ['friday'] },
    ])
    const { getAllByLabelText } = render(Schedule)
    expect(getAllByLabelText('schedule.delete')).toHaveLength(2)
  })

  it('opens the editor when New timer is clicked', async () => {
    const { getByText, queryByRole, getByRole } = render(Schedule)
    expect(queryByRole('dialog')).not.toBeInTheDocument()
    await fireEvent.click(getByText('+ schedule.new'))
    expect(getByRole('dialog')).toBeInTheDocument()
  })
})
