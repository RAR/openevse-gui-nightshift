import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// iconify-icon registers a custom element that fetches icons asynchronously.
// In jsdom, its render timers can fire after a test file has torn down its
// document, producing unhandled `ReferenceError: document is not defined`
// errors that fail the run. Tests only need the bare <iconify-icon> tag —
// stub the module so no custom element / timers are registered.
vi.mock('iconify-icon', () => ({}))

// jsdom doesn't implement these browser APIs that uPlot (transitively imported
// by chart components) and other libs touch at module-load time.
if (typeof globalThis.matchMedia !== 'function') {
  globalThis.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
if (typeof globalThis.ResizeObserver !== 'function') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
if (typeof globalThis.MutationObserver !== 'function') {
  globalThis.MutationObserver = class {
    observe() {}
    disconnect() {}
    takeRecords() { return [] }
  }
}
