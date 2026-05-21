# OpenEVSE GUI v3 — Dashboard Screen

**Date:** 2026-05-21
**Status:** Approved design
**Repo:** `/home/rar/openevse-gui-v3`
**Builds on:** the v3 foundation (`2026-05-21-openevse-gui-v3-foundation-design.md`), now merged to `main`.

## Summary

The Dashboard is v3's core screen — the `/` route, currently a placeholder. It
combines a live charging view with the controls a user routinely touches. It
replaces v2's "Main" screen, merging v2's separate persistent status strip and
control screen into one coherent screen.

This is the second of five v3 plans (foundation, then the four primary screens).
It depends only on the merged foundation; it adds the Dashboard route plus the UI
primitives that the foundation deliberately deferred to their first consumer.

## Goals

- A single screen that shows charging status at a glance and carries the
  controls used routinely: charge mode, charge rate, charge limit.
- Graceful, distinct presentation for every EVSE state — starting, idle,
  connected/not-charging, charging, error.
- Reuse v2's proven control logic (mode via override, rate via override,
  limit via limit store) and the ported data layer — no new device API surface.
- Every piece independently testable; only the route talks to stores.

## Non-Goals (deferred)

- The Schedule, Monitoring, and History screens (their own plans).
- Claim-tag *removal* UX for non-manual clients — claims are shown read-only.
- The admin / system-limit variant of the limit control.
- Vehicle SoC/range limits beyond what the device already reports (soc/range
  limit types appear only when the device reports battery data, as in v2).

## Visual Design

Approved via mockups. Aurora theme (dark default / light), brand teal accent.

### Charging state (the reference layout)

Top to bottom inside the route content area:

1. **Status line** — e.g. "● Charging · Car connected", accent-colored.
2. **Power ring** — large ring; center shows live power in kW and the EVSE max
   below it ("of 11.5 kW max"). Fill = power vs max.
3. **Stat chips** — three primary chips (session kWh, elapsed, current) plus a
   thin secondary row (voltage, temperature, pilot).
4. **Charge mode** — a three-segment control: Auto / On / Off. This is the
   start/stop control; there is no separate Start/Stop button.
5. **Charge rate** — an amps slider with the current value shown.
6. **Charge limit** — a card: "None set / + Set limit", or, when a limit is
   active, the target plus time/energy remaining and a clear control.

Eco (solar divert) and Shaper toggles appear as a small row above Charge Mode
**only when** `config.divert_enabled` / `config.current_shaper_enabled` are set.

### Other states

Same layout; the ring center and status line carry the meaning.

- **Starting** — ring dim, center "Starting…". Pre-data / EVSE state 0.
- **Idle (no car)** — ring is an empty track, center "Ready / Plug in your car".
  The three live chips collapse to a one-line last-session summary. Mode still
  settable.
- **Connected, not charging** — amber. Ring center explains why: "Mode is Off",
  or "Waiting · <time>" when a schedule event is pending, else "Not charging".
  The active mode segment renders amber.
- **Error / fault** — ring goes red with the fault name; all controls dimmed and
  disabled. The shell's error banner fires in parallel.

## Architecture

### Components

```
src/routes/Dashboard.svelte          composes the screen; the only store-aware unit
src/lib/components/dashboard/
  StatusLine.svelte                  status line for the current display state
  PowerRing.svelte                   ring + center content
  StatChips.svelte                   3 primary chips + secondary row, or summary line
  ModeSelector.svelte                Auto / On / Off segmented control
  ChargeRate.svelte                  amps slider + read-only "who set this" tag
  ChargeLimitCard.svelte             limit summary card + set/clear entry
  ChargeLimitModal.svelte            limit type/value picker
  EcoShaperToggles.svelte            conditional Eco + Shaper toggles
src/lib/components/ui/   (new primitives, built in this plan)
  ProgressRing.svelte                themed ring, takes a 0–1 fill + center slot
  StatChip.svelte                    value + label tile
  SegmentedControl.svelte            n-option single-select control
  Slider.svelte                      themed range input
  Toggle.svelte                      on/off switch
  Select.svelte                      themed dropdown
  Card.svelte                        surface container
src/lib/dashboard/state.js           pure helpers (see Data Flow)
```

Every dashboard component receives plain props and emits callbacks; it does not
read stores. `Dashboard.svelte` alone subscribes to stores, derives a
view-model, passes data down, and handles action callbacks. This keeps each
component understandable and testable in isolation.

### Data flow

**Stores read by `Dashboard.svelte`:**
- `status_store` — `state`, `amp`, `voltage`, `power`, `pilot`, `temp`,
  `session_energy`, `session_elapsed`, `max_current`.
- `config_store` — `max_current_soft`, `divert_enabled`,
  `current_shaper_enabled`.
- `claims_target_store` — which client owns the charge claim.
- `override_store` — manual override state.
- `limit_store` — the active charge limit.
- `plan_store` — pending scheduled event (for the "Waiting · <time>" reason).
- `uistates_store` — `mode`, `elapsed` tick.

**Display-state derivation** — a pure function in `src/lib/dashboard/state.js`
maps the raw EVSE `state` code to one display state:

| EVSE `state` | Display state | Ring |
|---|---|---|
| 0 | `starting` | dim, "Starting…" |
| 1 | `idle` | empty track, "Ready" |
| 2, 254, 255 | `connected` | empty, "Paused" + reason |
| 3 | `charging` | filled, live kW |
| 4–11 | `error` | red, fault name |

**Ring math** (pure, in `state.js`, unit-tested): while charging, fill =
`power / (max_current_soft × voltage)` clamped to 0–1. When a limit is active,
fill = limit progress instead — `elapsed / target` for a time limit,
`session_energy / target` for an energy limit.

**Reason text** for the `connected` state: if `plan_store` has a pending event,
"Waiting · <time>"; else if mode is Off, "Mode is Off"; else "Not charging".

**Field interpretation** (temperature ÷10, current scaling, state descriptions)
reuses the already-ported helpers in `src/lib/utils.js` rather than re-deriving.

### Controls

All writes go through `serialQueue`, reusing v2's proven logic:

- **Mode (Auto/On/Off):** Auto clears `override_store`; On uploads override
  `{state:"active"}`; Off uploads `{state:"disabled"}`. While a write is in
  flight the control is disabled to prevent overlapping commands. If a
  higher-priority claim (RFID/OCPP/limit client) owns the EVSE, the affected
  segments are disabled — the Dashboard reflects the claims system, not fights
  it.
- **Charge rate:** amps slider, 6 → `max_current_soft`. On change, uploads
  `charge_current` to `override_store`; selecting the max clears that override.
  A small read-only tag shows when a non-manual client set the rate. The slider
  is disabled when Eco mode owns the current.
- **Charge limit:** the card opens `ChargeLimitModal`; type is none / time /
  energy (soc / range only when the device reports battery data). Set →
  `limit_store.upload`; clear → `limit_store.remove`.
- **Eco / Shaper:** rendered only when enabled in config; toggles post to
  `/divertmode` and `/shaper` respectively.

## Error Handling

- A failed control write reverts the control to the store's actual value and
  surfaces the global `AlertBox`. The UI never shows a state the device did not
  confirm.
- The `error` display state dims and disables all controls; the shell's error
  banner fires in parallel.
- Stores undefined at first paint resolve to the `starting` display state; all
  store reads use optional chaining.

## Testing

- **`src/lib/dashboard/state.js`** — pure functions (display-state mapping, ring
  fill, limit progress, reason text) unit-tested across every EVSE state code
  and boundary values.
- **Each component** — render tests: correct content per display state,
  callbacks fire on interaction, disabled states honored.
- **`Dashboard.svelte`** — integration test with mocked stores: each display
  state renders the expected composition; a mode click invokes the correct
  store method.
- Vitest + `@testing-library/svelte`, coverage scoped to `src/lib` as
  established by the foundation.

## Open Questions

None. All design decisions for this screen are resolved.
