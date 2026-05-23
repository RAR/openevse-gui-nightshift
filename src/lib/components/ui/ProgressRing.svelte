<script>
  let {
    fill = 0,
    color = 'var(--accent)',
    track = 'var(--surface-3)',
    size = 178,
    thickness = 15,
    /** Apply a slow opacity breath. Use for passive / fault states. */
    pulse = false,
    children,
  } = $props()

  let deg = $derived(Math.max(0, Math.min(1, fill)) * 360)
  let inner = $derived(size - thickness * 2)
</script>

<!-- Animation lives in src/app.css (.breathe + @keyframes breathe) so
     the Tailwind/Vite pipeline emits it; a scoped <style> block here
     was getting stripped. -->
<div
  class="grid place-items-center rounded-full"
  class:breathe={pulse}
  style="width:{size}px;height:{size}px;background:conic-gradient({color} {deg}deg, {track} {deg}deg);"
>
  <div
    class="grid place-items-center rounded-full bg-surface text-center"
    style="width:{inner}px;height:{inner}px;"
  >
    {@render children?.()}
  </div>
</div>
