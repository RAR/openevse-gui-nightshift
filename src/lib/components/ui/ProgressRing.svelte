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

<!-- Three-layer stack so the pulse only animates the ring, not the
     text on top. @keyframes breathe lives in src/app.css. -->
<div
  class="relative grid place-items-center"
  style="width:{size}px;height:{size}px;"
>
  <!-- Ring (conic-gradient circle) — this is what breathes. -->
  <div
    class="absolute inset-0 rounded-full"
    style="
      background:conic-gradient({color} {deg}deg, {track} {deg}deg);
      transform-origin:center;
      {pulse ? 'animation: breathe 2.2s ease-in-out infinite;' : ''}
    "
  ></div>
  <!-- Inner disc + content — sits on top of the ring; stays static. -->
  <div
    class="relative grid place-items-center rounded-full bg-surface text-center"
    style="width:{inner}px;height:{inner}px;"
  >
    {@render children?.()}
  </div>
</div>
