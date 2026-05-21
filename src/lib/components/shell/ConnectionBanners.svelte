<script>
  import { _ } from 'svelte-i18n'
  let { wsConnected = true, evseConnected = true, error = false } = $props()
</script>

{#if !wsConnected}
  <div role="alert" class="bg-error/15 px-4 py-2 text-sm text-error">
    {$_('connection.lost')} — {$_('connection.lost_body')}
  </div>
{/if}
{#if !evseConnected}
  <div role="alert" class="bg-warning/15 px-4 py-2 text-sm text-warning">
    {$_('connection.evse_missing')} — {$_('connection.evse_missing_body')}
  </div>
{/if}
{#if error}
  <div role="alert" class="bg-error/15 px-4 py-2 text-sm text-error">
    {$_('connection.error')}
  </div>
{/if}
