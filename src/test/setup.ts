import '@testing-library/jest-dom'
import { Temporal } from '@js-temporal/polyfill'

// Expose Temporal globally for tests (Node.js doesn't have it yet, but Chromium 144+ does)
;(globalThis as any).Temporal = Temporal
