<script>
  import uPlot from 'uplot'
  import 'uplot/dist/uPlot.min.css'
  import { untrack } from 'svelte'

  let { opts, data } = $props()

  let container
  /** @type {uPlot | null} */
  let chart = null
  /** @type {ResizeObserver | null} */
  let ro = null
  /** @type {MutationObserver | null} */
  let mo = null

  function rebuild() {
    if (!container) return
    if (chart) { chart.destroy(); chart = null }
    const currentOpts = untrack(() => opts)
    const currentData = untrack(() => data)
    const width = container.clientWidth || 600
    const o = { ...currentOpts, width, height: currentOpts.height ?? 260 }
    chart = new uPlot(o, currentData, container)
  }

  // Mount-only effect: builds the chart once, sets up observers, tears down on unmount.
  // untrack() in rebuild() prevents this effect from re-running on data/opts changes.
  $effect(() => {
    rebuild()
    ro = new ResizeObserver(() => {
      if (chart && container) chart.setSize({ width: container.clientWidth, height: chart.height })
    })
    ro.observe(container)
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
    // Touch opts to subscribe; rebuild() does the work.
    void opts
    if (chart) rebuild()
  })
</script>

<div bind:this={container} class="w-full"></div>
