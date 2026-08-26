---
name: add-frontend-test
description: Workflow for adding frontend tests following Dashy's "test the code, not the browser" philosophy.
---

# Add Frontend Test

Write frontend tests that verify code logic — not user interactions.

## Philosophy

**Test the code, not the browser.** If a human can verify it by looking at the kiosk, don't automate it in a test.

## What to test

| Category | What | Example |
|----------|------|---------|
| **Pure functions** | Utils, formatters, date math, error parsing | `formatDifficulty(3)` returns `'Medium'` |
| **Hooks** | Data fetching, state management, localStorage, side effects | `useFamilyData()` returns members after fetch |
| **Component rendering** | Correct output given props — text, data, CSS classes, ARIA | `<ChoreCard />` renders chore name, category, difficulty |
| **CSS enforcement** | Tailwind classes applied correctly | `expect(el).toHaveClass('bg-primary')` |

## What NOT to test

- ❌ User interaction flows (click → verify DOM change → click again)
- ❌ Integration tests rendering multiple features
- ❌ Form filling, dropdown interactions, hover popups
- ❌ Full-app smoke tests
- ❌ `userEvent` or `fireEvent` — interactions are verified manually
- ❌ `waitFor` unless testing async data fetching in hooks

## Test file conventions

- **Co-locate**: `ComponentName.test.tsx` lives next to `ComponentName.tsx`
- **File pattern**: `*.test.ts` (logic) or `*.test.tsx` (rendering)
- **Use `describe`/`it` blocks** (not `test`)
- **No snapshot tests** — explicit assertions only
- **No `userEvent` or `fireEvent`** — these simulate user interactions
- **CSS assertions encouraged**: `toHaveClass`, `toHaveStyle`, `toHaveAttribute`

## Steps

### 1. Determine what you're testing

- **Pure function with no React?** → Unit test (`.test.ts`)
- **Hook with state/fetch?** → Hook test (`.test.ts`)
- **Component rendering?** → Render test (`.test.tsx`)

### 2. Create the test file

Co-locate next to the source:

```
src/shared/utils/density.ts
src/shared/utils/density.test.ts    ← co-located

src/features/calendar/components/EventCard/EventCard.tsx
src/features/calendar/components/EventCard/EventCard.test.tsx    ← co-located
```

### 3. Write unit tests (pure functions)

```typescript
import { describe, it, expect } from 'vitest'
import { formatDifficulty } from './chores'

describe('formatDifficulty', () => {
  it('returns "Easy" for level 1', () => {
    expect(formatDifficulty(1)).toBe('Easy')
  })

  it('clamps level below 1', () => {
    expect(formatDifficulty(0)).toBe('Easy')
  })

  it('clamps level above 5', () => {
    expect(formatDifficulty(6)).toBe('Very Hard')
  })
})
```

### 4. Write hook tests

Use `renderHook` and `act` from Testing Library:

```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { useUiScale } from './useUiScale'

describe('useUiScale', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a positive scale factor', () => {
    const { result } = renderHook(() => useUiScale())
    expect(result.current.scaleFactor).toBeGreaterThan(0)
  })

  it('updates scale when viewport changes', () => {
    const { result } = renderHook(() => useUiScale())
    const initialScale = result.current.scaleFactor

    act(() => {
      window.innerWidth = 800
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current.scaleFactor).not.toBe(initialScale)
  })
})
```

For data hooks with React Query, use the test utility wrapper:

```typescript
import { createTestQueryClient, createQueryClientWrapper } from '@/test/setup'

describe('useFamilyData', () => {
  let queryClient: QueryClient
  beforeEach(() => { queryClient = createTestQueryClient() })
  afterEach(() => { queryClient.clear() })

  it('returns members after fetch', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMembers),
    } as Response)

    const { result } = renderHook(() => useFamilyData(), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.members).toEqual(mockMembers)
  })
})
```

### 5. Write component render tests

Verify correct output — right text, right classes, right data. No interaction simulation.

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ChoreCard } from './ChoreCard'

describe('ChoreCard', () => {
  it('renders chore name', () => {
    render(<ChoreCard instance={mockInstance} masterChore={mockMasterChore} categories={mockCategories} colorMap={mockColorMap} />)
    expect(screen.getByText('Wipe Counter')).toBeInTheDocument()
  })

  it('renders category name', () => {
    render(<ChoreCard instance={mockInstance} masterChore={mockMasterChore} categories={mockCategories} colorMap={mockColorMap} />)
    expect(screen.getByText('Kitchen')).toBeInTheDocument()
  })

  it('renders completion status', () => {
    const completedInstance = { ...mockInstance, completed_by: 'trisha', status: 'completed' as const }
    render(<ChoreCard instance={completedInstance} masterChore={mockMasterChore} categories={mockCategories} colorMap={mockColorMap} />)
    expect(screen.getByText('Completed by trisha')).toBeInTheDocument()
  })
})
```

### 6. Write CSS enforcement tests (for shared components)

```typescript
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ContentCard } from './ContentCard'

describe('ContentCard', () => {
  it('applies correct layout classes', () => {
    const { container } = render(<ContentCard>Content</ContentCard>)
    const outer = container.firstElementChild
    expect(outer).toHaveClass('flex', 'h-full', 'w-full', 'flex-col', 'p-2')
  })

  it('applies card styling to inner wrapper', () => {
    const { container } = render(<ContentCard>Content</ContentCard>)
    const inner = container.querySelector('[class*="bg-white"]')
    expect(inner).toHaveClass('bg-white', 'shadow-xs', 'ring-1', 'ring-border')
  })
})
```

### 7. Run tests

```bash
make test-kiosk
```

## Mock data patterns

Define mock data at the top of each test file. No shared fixture files.

### CalendarEvent

```typescript
const mockEvent: CalendarEvent = {
  id: '1',
  title: 'Team Standup',
  start: Temporal.PlainDateTime.from('2026-08-04T09:00:00'),
  end: Temporal.PlainDateTime.from('2026-08-04T09:30:00'),
  all_day: false,
  members: ['faiyaz'],
}
```

### FamilyMember

```typescript
const mockMember: FamilyMember = {
  name: 'Faiyaz',
  key: 'faiyaz',
  calendar_id: 'faiyaz@gmail.com',
  color: '#4A90E2',
  initial: 'F',
}
```

## Checklist

- [ ] No `userEvent` or `fireEvent` in the test
- [ ] No `waitFor` unless testing async data fetching
- [ ] No interaction simulation (click, hover, type, navigate)
- [ ] Tests verify output (text, classes, attributes), not behavior flows
- [ ] Co-located with source file
- [ ] `make test-kiosk` passes
