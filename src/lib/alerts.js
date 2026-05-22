import { get } from 'svelte/store'
import { _ } from 'svelte-i18n'
import { uistates_store } from './stores/uistates.js'

/**
 * Surface the global AlertBox for a failed device write.
 * Shared by every screen so the write-failure experience is identical.
 */
export function showWriteError() {
  const t = get(_)
  uistates_store.setObject('alertbox', {
    title: t('alert.write_failed_title'),
    body: t('alert.write_failed_body'),
    visible: true,
    button: true,
    closable: true,
    component: undefined,
    action: () => uistates_store.resetAlertBox(),
  })
}
