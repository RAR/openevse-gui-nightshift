// src/lib/config/__tests__/wifi.test.js
import { describe, it, expect } from 'vitest'
import { normalizeNetworks, signalIcon, isSecured } from '../wifi.js'

describe('normalizeNetworks', () => {
  it('dedupes by SSID keeping the strongest signal, sorts by signal', () => {
    const out = normalizeNetworks([
      { ssid: 'A', rssi: -70 },
      { ssid: 'B', rssi: -50 },
      { ssid: 'A', rssi: -55 },
    ])
    expect(out.map((n) => n.ssid)).toEqual(['B', 'A'])
    expect(out.find((n) => n.ssid === 'A').rssi).toBe(-55)
  })
  it('drops entries with no SSID and tolerates non-arrays', () => {
    expect(normalizeNetworks([{ rssi: -40 }, { ssid: '' }])).toEqual([])
    expect(normalizeNetworks(undefined)).toEqual([])
    expect(normalizeNetworks('error')).toEqual([])
  })
})

describe('signalIcon', () => {
  it('maps RSSI to a strength icon', () => {
    expect(signalIcon(-50)).toBe('mdi:wifi-strength-4')
    expect(signalIcon(-60)).toBe('mdi:wifi-strength-3')
    expect(signalIcon(-70)).toBe('mdi:wifi-strength-2')
    expect(signalIcon(-90)).toBe('mdi:wifi-strength-1')
    expect(signalIcon(undefined)).toBe('mdi:wifi-strength-outline')
  })
})

describe('isSecured', () => {
  it('treats open/none/0 as unsecured, everything else as secured', () => {
    expect(isSecured({ encryption: 'open' })).toBe(false)
    expect(isSecured({ encryption: 'none' })).toBe(false)
    expect(isSecured({ encryption: 0 })).toBe(false)
    expect(isSecured({ encryption: 'wpa2' })).toBe(true)
    expect(isSecured({ encryption: 3 })).toBe(true)
  })
  it('assumes secured when encryption is unknown', () => {
    expect(isSecured({})).toBe(true)
  })
})
