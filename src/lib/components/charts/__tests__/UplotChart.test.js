import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/svelte'

// ResizeObserver and MutationObserver stubs are configured in src/test-setup.js

const ctor = vi.fn()
const setData = vi.fn()
const setSize = vi.fn()
const destroy = vi.fn()

vi.mock('uplot', () => {
  return {
    default: class MockUplot {
      constructor(opts, data, target) { ctor(opts, data, target); }
      setData = setData
      setSize = setSize
      destroy = destroy
    },
  }
})

import UplotChart from '../UplotChart.svelte'

describe('UplotChart', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('constructs uPlot on mount with the supplied opts and data', () => {
    const opts = { width: 500, height: 200, series: [{}, {}] }
    const data = [[1, 2, 3], [10, 20, 30]]
    render(UplotChart, { props: { opts, data } })
    expect(ctor).toHaveBeenCalledTimes(1)
    const [calledOpts, calledData] = ctor.mock.calls[0]
    expect(calledOpts.series).toEqual(opts.series)
    expect(calledData).toBe(data)
  })

  it('destroys uPlot on unmount', () => {
    const { unmount } = render(UplotChart, { props: { opts: { series: [{}] }, data: [[1]] } })
    unmount()
    expect(destroy).toHaveBeenCalledTimes(1)
  })
})
