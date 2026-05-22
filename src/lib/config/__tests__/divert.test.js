// src/lib/config/__tests__/divert.test.js
import { describe, it, expect } from 'vitest'
import { DIVERT_PRESETS, matchPreset, presetValues } from '../divert.js'

describe('DIVERT_PRESETS', () => {
  it('has the three named presets', () => {
    expect(DIVERT_PRESETS.map((p) => p.id)).toEqual(['default', 'no_waste', 'no_import'])
  })
})

describe('matchPreset', () => {
  it('returns the preset id when the config matches a preset', () => {
    expect(matchPreset({
      divert_attack_smoothing_time: 20, divert_decay_smoothing_time: 600,
      divert_min_charge_time: 600, divert_PV_ratio: 1.1,
    })).toBe('default')
    expect(matchPreset({
      divert_attack_smoothing_time: 300, divert_decay_smoothing_time: 20,
      divert_min_charge_time: 600, divert_PV_ratio: 1.1,
    })).toBe('no_import')
  })
  it('matches even when values are numeric strings', () => {
    expect(matchPreset({
      divert_attack_smoothing_time: '20', divert_decay_smoothing_time: '600',
      divert_min_charge_time: '600', divert_PV_ratio: '0.5',
    })).toBe('no_waste')
  })
  it('returns "custom" when nothing matches or config is missing', () => {
    expect(matchPreset({ divert_PV_ratio: 2 })).toBe('custom')
    expect(matchPreset(undefined)).toBe('custom')
  })
})

describe('presetValues', () => {
  it('returns the four params for a known preset', () => {
    expect(presetValues('no_import')).toEqual({
      divert_attack_smoothing_time: 300, divert_decay_smoothing_time: 20,
      divert_min_charge_time: 600, divert_PV_ratio: 1.1,
    })
  })
  it('returns null for an unknown id', () => {
    expect(presetValues('custom')).toBe(null)
  })
})
