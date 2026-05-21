<script>
  import GearMark from '../../../assets/GearMark.svelte'
  let { deviceName = 'OpenEVSE', connected = true } = $props()
</script>

<header class="flex items-center justify-between px-4 py-3">
  <div class="flex items-center gap-2">
    <GearMark size={26} class="text-accent" />
    <span class="text-sm font-semibold text-text">{deviceName}</span>
  </div>
  <span
    aria-label={connected ? 'connected' : 'disconnected'}
    class="h-2.5 w-2.5 rounded-full {connected ? 'bg-accent' : 'bg-error'}"
  ></span>
</header>
