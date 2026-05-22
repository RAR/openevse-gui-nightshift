import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// iconify-icon registers a custom element that fetches icons asynchronously.
// In jsdom, its render timers can fire after a test file has torn down its
// document, producing unhandled `ReferenceError: document is not defined`
// errors that fail the run. Tests only need the bare <iconify-icon> tag —
// stub the module so no custom element / timers are registered.
vi.mock('iconify-icon', () => ({}))
