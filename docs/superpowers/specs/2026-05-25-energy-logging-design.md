# Energy Logging + Temperature Throttle — Design

**Status:** Draft for implementation
**Date:** 2026-05-25
**Branch:** `feat/energy-logging`
**Depends on:** OpenEVSE firmware PR
[#1083](https://github.com/OpenEVSE/openevse_esp32_firmware/pull/1083) (energy logger +
temp throttle endpoints + claim client). Mock dev can proceed without it; real-device
verification requires the firmware merged and flashed.

## Goal

Bring v3 to parity with chris1howell's v2 GUI work
([PR #318](https://github.com/OpenEVSE/openevse-gui-v2/pull/318)): live + historical
energy charts, temperature throttle config, and a live throttle indicator — built on a
proper charting library (uPlot) and styled to match the v3 visual language.

## Non-goals

- Editing or replacing v3's existing `History` page (per-session log list) — energy
  charts are a separate concern and live under Monitoring.
- Energy cost calculation in charts — already covered by Dashboard energy cost work.
- Exporting CSV / download links — v2 PR has a "View JSON" link; defer until asked.

## Architecture

A new "Energy" tab is added as a fourth tab inside the existing **Monitoring** screen
(alongside Data / Safety / Manager). The tab hosts a sub-switcher for **Live / Daily /
Monthly / Annual** views, each rendered through a single shared uPlot chart wrapper.

Temperature throttle configuration (toggle + 40–80 °C setpoint slider) is added inline
to the existing **Settings → Safety** page.

A small **ThrottleBadge** is rendered on the **Dashboard** when the temp-throttle EvseClient
holds a claim — derived from `claims_target_store`, no new status field needed.

```
┌───────────────────────────────────────────────────────────────┐
│ Monitoring screen                                             │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Tabs: [Data] [Safety] [Manager] [Energy]                │   │
│ └─────────────────────────────────────────────────────────┘   │
│   ↓ Energy tab                                                │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Sub: [Live] [Daily] [Monthly] [Annual]                  │   │
│ │                                                          │   │
│ │   ┌───────────────────────────────────────────────┐     │   │
│ │   │  UplotChart (theme-aware, responsive)         │     │   │
│ │   └───────────────────────────────────────────────┘     │   │
│ │   [← Older]                              [Current →]    │   │
│ └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## File structure

### New

- `src/lib/components/charts/UplotChart.svelte`
  Generic uPlot wrapper. Props: `data` (uPlot `AlignedData`), `opts` (uPlot `Options`).
  Responsibilities: ResizeObserver → `setSize`; theme change → re-read CSS vars and
  rebuild axes/series colors; clean teardown in `$effect` cleanup. No business logic.

- `src/lib/components/charts/chartTheme.js`
  Pure helper: reads `getComputedStyle(document.documentElement)` for theme CSS vars
  (`--accent`, `--charging`, `--warning`, `--text-dim`, `--border`, etc.) and returns
  an object `{ stroke, fill, grid, axisText, ... }` consumed by chart-builder helpers.
  Reads vars lazily so tests can stub.

- `src/lib/components/charts/EnergyLiveChart.svelte`
  Wraps `UplotChart` for the live raw-samples view. Builds uPlot options with:
  - Left axis: current (A), domain `[0, max_current_hard + 5]`
  - Right axis: temperature (°C), domain `[-20, 80]`
  - Optional energy fill (Wh) along the bottom — translucent area
  - Smoothed lines (`spline` factor or `paths: stepped`), crosshair, tooltip
  - X-axis: time, formatted via Luxon by user's `time_zone`

- `src/lib/components/charts/EnergySummaryChart.svelte`
  Wraps `UplotChart` for daily / monthly / annual. Bar-style (uPlot `bars` paths plugin)
  showing kWh per bucket. One series, accent color.

- `src/lib/components/monitoring/EnergyTab.svelte`
  Tab body. Holds sub-tab state (`live | daily | monthly | annual`), wires the right
  data store to the right chart component, owns the "← Older / Current →" nav for Live.

- `src/lib/components/dashboard/ThrottleBadge.svelte`
  Pill showing `Throttled · X A` when active. Hidden otherwise. Reads
  `claims_target_store` for client id `0x0D` and pulls effective charge current from its
  claim entry. Tooltip-on-tap shows current temp vs setpoint.

- `src/lib/stores/energy.js`
  Factory `createEnergyStore()` returning `{ subscribe, loadRaw(before?), loadDaily(),
  loadMonthly(), loadAnnual() }`. All fetches via `serialQueue.add(...)` and `httpAPI`.
  Internal state shape: `{ raw: { samples, historical, noOlder }, daily, monthly, annual,
  loading: { raw, daily, monthly, annual }, error: { ... } }`.

- `mock/energy.js`
  Ported verbatim from v2 PR #318 — same `/api/energy/raw` (with `?before=` empty-response
  shape), and stubs for `/daily`, `/monthly`, `/annual`.

- Tests:
  - `src/lib/stores/__tests__/energy.test.js`
  - `src/lib/components/monitoring/__tests__/EnergyTab.test.js`
  - `src/lib/components/dashboard/__tests__/ThrottleBadge.test.js`
  - `src/lib/components/charts/__tests__/UplotChart.test.js` (smoke render, no canvas
    assertions — jsdom doesn't render canvas)
  - `src/lib/components/charts/__tests__/chartTheme.test.js` (pure helper)

### Modified

- `src/routes/Monitoring.svelte` — add `EnergyTab` as 4th tab; add `monitoring.tab.energy`
  to the tabs array.
- `src/routes/Dashboard.svelte` — render `<ThrottleBadge>` near the PowerRing when
  applicable. Should be unobtrusive when inactive (returns `null`).
- `src/routes/settings/Safety.svelte` — new `ConfigSection title={config.safety.temp_throttle}`
  containing toggle + slider; slider only visible when toggle is on.
- `src/lib/vars.js` — add `EvseClient_OpenEVSE_TempThrottle = 0x0D` to the `EvseClients`
  map. (Verify the existing claims-detection helpers can pick it up automatically; if
  they're keyed off the list, no further change needed.)
- `src/lib/i18n/{en,es,fr,hu}.json` — new keys:
  - `monitoring.tab.energy`
  - `monitoring.energy.{live,daily,monthly,annual,older,current,no_older,historical,latest_samples,loading,error,no_samples}`
  - `monitoring.energy.axis.{current,temperature,energy}`
  - `config.safety.temp_throttle{,_enable,_setpoint,_desc}`
  - `dashboard.throttle.{active,detail}`
- `package.json` — add `"uplot": "^1.6.32"` to dependencies.
- `vite.config.js` — add `uplot` to `manualChunks` as a `charts` chunk so the main
  bundle stays slim for users not visiting Energy.

## Data flow

### Live view

1. `EnergyTab` mounts with `view = 'live'`.
2. Calls `energy_store.loadRaw()` → `serialQueue.add(() => httpAPI('GET',
   '/energy/raw'))`. On success, store sets `raw = { samples, historical: false,
   noOlder: false }`.
3. `EnergyLiveChart` `$derived`s its data from `$energy_store.raw.samples`.
4. While tab is visible and `raw.historical === false`, an interval (60 s) re-calls
   `loadRaw()` so the chart stays current.
5. "← Older" button calls `loadRaw(oldestTs)`. Server returns `{ samples: [...] }` or
   empty. Empty → `noOlder = true`; non-empty → `samples` replaced + `historical = true`.
6. "Current →" calls `loadRaw()` with no arg, snapping back.

### Summary views

Each tab activation calls the matching `load*()` once per session, caches in the store,
and re-renders. No polling — these are rollups that change on the day boundary.

### Throttle config

Read: `$config_store.temp_throttle_enabled`, `.temp_throttle_setpoint`.
Write: existing `createConfigForm().saveField(...)` path, same as every other Safety
toggle. The slider commits on `onchange` (release), not on `oninput` (drag) — avoids
spamming the device's single-threaded HTTP server. Mirrors the existing `Slider` usage
elsewhere.

### Throttle indicator

`ThrottleBadge` derives `active` from
`$claims_target_store.find(c => c.client === 0x0D)`. When present, shows pill with the
claim's `charge_current`. When absent, returns nothing.

## uPlot theming

uPlot accepts plain JS objects for series, axes, and grid styling — no built-in
"theme" concept. The `chartTheme.js` helper resolves the current CSS vars and returns
a flat object the chart-builders use to construct uPlot options.

Theme reactivity:
1. `UplotChart.svelte` registers a `MutationObserver` on `<html>` for `data-theme`
   attribute changes.
2. On change, re-reads vars, rebuilds `opts.axes` / `opts.series` color fields, and
   calls `chart.setSize(chart.bbox)` plus a manual re-init (uPlot doesn't support live
   option swaps — destroy + recreate).

This is OK because theme changes are infrequent and the chart is small (under a
few-hundred samples).

## "Better looking" — concrete deltas vs the v2 chart

| Aspect          | v2 (chris's PR)                     | v3 here                                                                |
|---|---|---|
| Lines           | hard polylines, no smoothing         | spline interpolation (`paths: uPlot.paths.spline()`)                   |
| Fill            | none                                 | translucent fill under amps (low-opacity accent gradient)              |
| Crosshair       | none                                 | uPlot built-in cursor with vertical guide                              |
| Tooltip         | none                                 | sticky tooltip showing ts, A, °C at hover/touch                        |
| Axes labels     | "A" / "°C" small text                | proper unit labels + tick formatting via Luxon                         |
| Colors          | fixed `rgb(54,162,235)` / `red`     | theme tokens — auto light/dark, accent + charging + warning            |
| Legend          | none                                 | legend pills under chart (uPlot's built-in legend, styled)             |
| Loading/error   | inline text in chart area            | skeleton placeholder matching `Card` aesthetic                         |
| Empty state     | text                                 | icon + message styled like other empty states                          |
| Responsive      | fixed viewBox                        | ResizeObserver + uPlot `setSize` — DPI-aware                           |

## Error handling

- Network/HTTP error on any `/api/energy/*` → store records `error[view] = true`;
  chart component shows error state with retry button.
- Throttle save failure → existing config-form error toast (already wired in
  `createConfigForm`).
- Claim store empty / not yet loaded → badge stays hidden (no error UI for "not yet").

## Testing

- **Store** (`stores/energy.js`): mock `httpAPI`, assert `loadRaw()` populates samples,
  `loadRaw(123)` adds `?before=123`, empty response sets `noOlder`, error sets `error`.
  Verify all calls flow through `serialQueue` (mock the queue, assert one-at-a-time).
- **Tab** (`EnergyTab`): switch sub-tabs, assert correct store method called and correct
  chart component rendered. Loading + error + empty states.
- **Throttle config** (`routes/settings/Safety.svelte`): toggle on → setpoint slider
  appears; slider commit calls `saveField('temp_throttle_setpoint', n)`; toggle off →
  slider hidden.
- **Throttle badge**: claim present → renders with correct current; claim absent →
  renders nothing.
- **Chart wrapper**: smoke test that it mounts and unmounts without throwing in jsdom
  (canvas is mocked). Theme helper has unit tests for var resolution + dark/light.

Existing test coverage `src/lib/**/*.js` only — `.svelte` component tests stay outside
coverage but are still valuable for behavior verification.

## Bundle / performance

- uPlot: ~45 kB raw, ~14 kB gzipped.
- Moved to its own `charts` manual chunk so the main bundle (loaded on every screen)
  doesn't pay for it.
- Live chart redraws cheap (uPlot is canvas; setData is O(n)).
- Summary charts redraw on tab activation only.

## Migration / rollout

- All new — no schema/data migration.
- Firmware PR #1083 must land + be flashed before the Live tab returns real data and
  the throttle badge can ever activate on real hardware. Dev/mock works standalone.
- Visible immediately on first load after deploy. No feature flag; the Energy tab simply
  shows "no samples recorded yet" until the device has data.

## Open questions

None blocking. Decisions locked:
- Chart lib: **uPlot**.
- Placement: **Monitoring → Energy tab** (4th tab; keeps BottomNav at 5).
- Throttle indicator: **Dashboard badge**.
- Scope: **everything** (live + summary + throttle).
