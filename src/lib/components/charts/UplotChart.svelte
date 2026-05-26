<script>
  import uPlot from 'uplot'
  import 'uplot/dist/uPlot.min.css'
  import { untrack } from 'svelte'

  // `fill` makes the chart size to its parent container's height (use inside
  // a flex column with min-h-0 flex-1). When false, uPlot uses opts.height.
  let { opts, data, fill = false } = $props()

  let container
  /** @type {uPlot | null} */
  let chart = null
  /** @type {ResizeObserver | null} */
  let ro = null
  /** @type {MutationObserver | null} */
  let mo = null

  // Cached legend height — uPlot appends a sibling .u-legend div inside the
  // container; in fill mode we have to reserve room for it so the canvas
  // doesn't push it off the bottom. Estimate up front, refine after build.
  let legendH = 28

  function measureLegend() {
    const el = container?.querySelector(':scope > .u-legend')
    if (el) legendH = el.offsetHeight || legendH
  }

  function computeSize() {
    const width = container.clientWidth || 600
    const fallback = (untrack(() => opts).height) ?? 260
    if (!fill) return { width, height: fallback }
    const total = container.clientHeight || fallback
    return { width, height: Math.max(80, total - legendH) }
  }

  function rebuild() {
    if (!container) return
    if (chart) { chart.destroy(); chart = null }
    const currentOpts = untrack(() => opts)
    const currentData = untrack(() => data)
    const { width, height } = computeSize()
    const o = { ...currentOpts, width, height }
    chart = new uPlot(o, currentData, container)
    if (fill) {
      // Re-measure now that uPlot has appended .u-legend; if the actual
      // height differs from our estimate, resize once to take it up.
      requestAnimationFrame(() => {
        const before = legendH
        measureLegend()
        if (chart && legendH !== before) chart.setSize(computeSize())
      })
    }
  }

  // Mount-only effect: builds the chart once, sets up observers, tears down on unmount.
  // untrack() in rebuild() prevents this effect from re-running on data/opts changes.
  $effect(() => {
    rebuild()
    ro = new ResizeObserver(() => {
      if (chart && container) chart.setSize(computeSize())
    })
    ro.observe(container)
    // In fill mode also observe the parent so the chart picks up height changes
    // when the surrounding flex layout reflows (e.g. window resize, tab switch).
    if (fill && container.parentElement) ro.observe(container.parentElement)
    mo = new MutationObserver(() => rebuild())
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      ro?.disconnect()
      mo?.disconnect()
      chart?.destroy()
      chart = null
    }
  })

  // Cheap data swap path — runs on every data change without rebuilding the canvas.
  $effect(() => {
    if (chart) chart.setData(data)
  })

  // Opts swap path — opts changes usually mean theme/scale rebuild is needed.
  // Full rebuild because uPlot can't live-swap most options.
  $effect(() => {
    void opts
    if (chart) rebuild()
  })
</script>

<div bind:this={container} class={fill ? 'h-full w-full' : 'w-full'}></div>
