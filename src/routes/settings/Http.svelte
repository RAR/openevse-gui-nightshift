<!-- src/routes/settings/Http.svelte -->
<script>
  import { _, locales } from 'svelte-i18n'
  import { config_store } from '../../lib/stores/config.js'
  import { LOCALE_NAMES } from '../../lib/i18n/locales.js'
  import { createConfigForm } from '../../lib/config/configForm.svelte.js'
  import ConfigPage from '../../lib/components/config/ConfigPage.svelte'
  import ConfigSection from '../../lib/components/config/ConfigSection.svelte'
  import FormField from '../../lib/components/config/FormField.svelte'
  import TextInput from '../../lib/components/ui/TextInput.svelte'
  import PasswordInput from '../../lib/components/ui/PasswordInput.svelte'
  import Select from '../../lib/components/ui/Select.svelte'
  import Toggle from '../../lib/components/ui/Toggle.svelte'

  const form = createConfigForm()
  const ss = form.saveState

  // Auth has no config flag — it is "on" when both credentials are set.
  let authOn = $state(false)
  $effect(() => {
    authOn = !!($config_store?.www_username && $config_store?.www_password)
  })

  function toggleAuth(next) {
    authOn = next
    // Turning auth off clears both credentials; turning it on only reveals
    // the fields — the user then fills and saves them per-field.
    if (!next) form.saveFields({ www_username: '', www_password: '' })
  }

  let langOptions = $derived(
    ($locales ?? ['en']).map((l) => ({ value: l, label: LOCALE_NAMES[l] ?? l })),
  )
</script>

<ConfigPage title={$_('config.pages.http')}>
  <ConfigSection title={$_('config.http.auth')}>
    <FormField label={$_('config.http.auth')}>
      <Toggle checked={authOn} label={$_('config.http.auth')} onchange={toggleAuth} />
    </FormField>
    {#if authOn}
      <FormField label={$_('config.http.username')} status={$ss.www_username ?? 'idle'}>
        <TextInput
          value={$config_store?.www_username ?? ''}
          maxlength={15}
          revert={form.revert}
          onchange={(v) => form.saveField('www_username', v)}
        />
      </FormField>
      <FormField label={$_('config.http.password')} status={$ss.www_password ?? 'idle'}>
        <PasswordInput
          value={$config_store?.www_password ?? ''}
          maxlength={15}
          revert={form.revert}
          onchange={(v) => form.saveField('www_password', v)}
        />
      </FormField>
    {/if}
  </ConfigSection>

  <ConfigSection>
    <FormField label={$_('config.http.lang')} status={$ss.lang ?? 'idle'}>
      <Select
        options={langOptions}
        value={$config_store?.lang ?? 'en'}
        onchange={(v) => form.saveField('lang', v)}
      />
    </FormField>
  </ConfigSection>
</ConfigPage>
