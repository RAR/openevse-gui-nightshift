<script>
  import { onMount, onDestroy } from 'svelte'
  import { DateTime } from 'luxon'
  import { uistates_store } from '../stores/uistates.js'
  import { status_store } from '../stores/status.js'
  import { JSONTryParse } from '../utils.js'

  let socket
  let timerId
  let lastmsg
  let ping_cnt = 0

  // Exponential backoff: doubles on each failed reconnect attempt, capped at
  // RECONNECT_MAX. Reset to RECONNECT_MIN after a successful open. Keeps the
  // tab from tight-looping reconnect attempts while offline.
  const RECONNECT_MIN = 1000
  const RECONNECT_MAX = 30000
  let reconnectDelay = RECONNECT_MIN
  let reconnectTimer

  onMount(() => {
    connect2socket()
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      document.addEventListener('visibilitychange', handleVisibility)
    }
  })
  onDestroy(() => {
    if (socket) socket.close()
    cancelKeepAlive()
    cancelReconnect()
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  })

  function connect2socket() {
    const proto = location.protocol === 'https:' ? 'wss://' : 'ws://'
    const s = new globalThis.WebSocket(proto + window.location.host + '/ws')
    socket = s
    s.addEventListener('open', () => {
      $uistates_store.ws_connected = true
      reconnectDelay = RECONNECT_MIN
      keepAlive(s)
    })
    s.addEventListener('message', (e) => {
      lastmsg = DateTime.now().toUnixInteger()
      if (parseMessage(e.data.toString())) ping_cnt = 0
    })
    s.addEventListener('error', () => {
      lastmsg = DateTime.now().toUnixInteger()
      $uistates_store.ws_connected = false
      cancelKeepAlive()
    })
    s.addEventListener('close', () => {
      lastmsg = DateTime.now().toUnixInteger()
      cancelKeepAlive()
      $uistates_store.ws_connected = false
      scheduleReconnect()
    })
  }

  function scheduleReconnect() {
    cancelReconnect()
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect2socket()
    }, reconnectDelay)
    reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX)
  }

  function cancelReconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  // Network came back — drop any pending backoff and try immediately. If we
  // already have a healthy socket this is a no-op (close handler ignored).
  function handleOnline() {
    reconnectDelay = RECONNECT_MIN
    if (!socket || socket.readyState === socket.CLOSED) {
      cancelReconnect()
      connect2socket()
    }
  }

  // Page returned to foreground — iOS pauses everything in background and the
  // socket may be silently dead. Probe with a ping; close() forces a fresh
  // connect via the existing close handler.
  function handleVisibility() {
    if (document.visibilityState !== 'visible') return
    reconnectDelay = RECONNECT_MIN
    if (!socket || socket.readyState !== socket.OPEN) {
      cancelReconnect()
      if (socket) try { socket.close() } catch { /* already closed */ }
      else connect2socket()
    }
  }

  function parseMessage(msg) {
    const jsondata = JSONTryParse(msg)
    if (!jsondata) return false
    lastmsg = DateTime.now().toUnixInteger()
    if (!jsondata.pong) {
      status_store.update((cur) => ({ ...(cur || {}), ...jsondata }))
    }
    return true
  }

  function keepAlive(s) {
    const now = DateTime.now().toUnixInteger()
    const timing = now - lastmsg
    if ((!ping_cnt && timing >= 5) || (ping_cnt && ping_cnt <= 3)) {
      if (s && s.readyState === s.OPEN) {
        s.send('{"ping": 1}')
        ping_cnt += 1
      }
    } else if (ping_cnt > 3 && timing >= 5) {
      ping_cnt = 0
      $uistates_store.ws_connected = false
      s.close()
      lastmsg = DateTime.now().toUnixInteger()
      cancelKeepAlive()
      return
    }
    timerId = setTimeout(() => keepAlive(s), ping_cnt ? 1000 : 5000)
  }

  function cancelKeepAlive() {
    if (timerId) clearTimeout(timerId)
  }
</script>
