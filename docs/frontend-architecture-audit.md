# Frontend Architecture Audit

**Date:** August 19, 2026  
**Purpose:** Comprehensive audit of the dashy-kiosk frontend to identify redundancies, inconsistencies, and areas for reorganization

---

## Executive Summary

The dashy-kiosk frontend has a **solid foundation** with clean domain separation, good TypeScript usage, and a comprehensive design token system. However, it suffers from **inconsistent styling approaches**, a **monolithic AppShell component**, and **missing UI primitives**, making it feel disconnected and hard to maintain.

**Key Issues:**
- Three different styling approaches used inconsistently (inline styles, const styles objects, Tailwind)
- Dual token system creates confusion (CSS vars + JS token objects)
- AppShell is a 280+ line god component managing everything
- Only 2 shared components exist despite many reusable patterns
- Portal/viewport clamping logic repeated 5 times
- Hover patterns inconsistent (CSS vs React state)

**What's Working Well:**
- Clean domain/feature/shared separation
- TypeScript throughout with strict types
- Temporal API for date handling (modern, type-safe)
- Feature-based organization (correct pattern)
- No external state management (appropriate for this scale)
- Proper barrel exports and type discrimination

---

## 1. Project Structure

```
src/
├── App.tsx                          # Root component (ErrorBoundary > AppShell)
├── main.tsx                         # Entry point (StrictMode > ErrorBoundary > ThemeProvider > App)
├── index.css                        # Tailwind v4 + CSS custom properties + hover utilities
├── temporal.d.ts                    # Global Temporal API type declarations
│
├── docs/
│   └── event-architecture-analysis.md  # Handoff doc (partially outdated)
│
├── domain/                          # Pure business logic
│   ├── calendar/
│   │   ├── types.ts                 # CalendarEvent, CalendarView, Attendee, WeekCalendar
│   │   ├── utils.ts                 # getEventsForDate, getTimedEventsForDate, etc.
│   │   └── density.ts              # getDensityInfo (header badge computation)
│   ├── chores/
│   │   ├── types.ts                # ChoresData, ChoreInstance, MasterChore, etc.
│   │   └── utils.ts                # getStatusColor, getStatusLabel, formatDifficulty
│   ├── family/
│   │   └── types.ts                # FamilyMember
│   └── weather/
│       ├── types.ts                # WeatherResponse, WeatherCurrent, DailyForecast
│       └── utils.ts                # getWeatherForDate
│
├── features/                        # Feature modules
│   ├── calendar/
│   │   ├── components/             # DateDisplay, DatePicker, DayCard, DayIndicator,
│   │   │                           # EventItem, EventModal, EventPopup (7 components)
│   │   ├── hooks/                  # useCalendarEvents, useEventInteraction
│   │   └── views/                  # DayView, WeekGrid, MonthView, YearView (4 views)
│   │
│   ├── chores/
│   │   ├── components/             # ChoreBoard, ChoreCard, ChoreModal, MemberColumn,
│   │   │                           # MetricsBar, OpenPoolColumn (6 components)
│   │   ├── hooks/                  # useChores, useChoreActions
│   │   └── views/                  # ChoresView (1 view)
│   │
│   ├── dashboard/
│   │   ├── AppShell/               # Layout orchestrator (280+ lines, monolithic)
│   │   ├── Clock/                  # Live clock display
│   │   ├── DensityBadge/           # Density-colored pill badge
│   │   ├── FamilyPills/            # Inline family member pills
│   │   ├── Header/                 # Top header bar
│   │   └── hooks/                  # useSidebar
│   │
│   ├── kiosk/
│   │   ├── components/             # StickyArea (1 component)
│   │   └── hooks/                  # useEdgeProximity, useIdleCursor, useOrientation,
│   │                               # useUiScale, useViewportWidth (5 hooks)
│   │
│   ├── navigation/
│   │   ├── Sidebar/                # Draggable sidebar with nav items
│   │   ├── SideNav/                # Fixed-position arrow buttons (confusing name)
│   │   ├── StatusBar/              # Bottom bar with refresh countdowns
│   │   └── ViewSwitcher/           # Day/Week/Month/Year toggle
│   │
│   └── weather/
│       ├── components/
│       │   ├── WeatherWidget/      # Compact current weather + WeatherIcon (15 conditions)
│       │   └── WeatherTooltip/     # Detailed forecast popup + 11 custom SVG icons
│       └── hooks/                  # useWeatherTooltip
│
├── shared/                          # Cross-feature utilities
│   ├── api/
│   │   └── endpoints.ts            # Endpoint registry (URLs, methods, refresh intervals)
│   ├── components/
│   │   ├── ErrorBoundary/          # Class-based error boundary + fallback UI
│   │   └── LoadingSkeleton/        # Animated loading placeholder
│   ├── config/
│   │   └── navigation.ts           # NAV_ITEMS array (Calendar, Chores)
│   ├── date/
│   │   ├── calendar.ts             # today(), now(), getWeekDays(), getMonthGridDates()
│   │   ├── format.ts               # formatHeaderDate(), formatTime(), formatDateTime()
│   │   ├── parse.ts                # parseEventStart(), parseCalendarEvent()
│   │   └── index.ts                # Barrel export
│   ├── hooks/
│   │   ├── useApi.ts               # Generic data fetching (loading, error, refetch)
│   │   └── useViewNavigation.ts    # Calendar view state + date navigation
│   ├── services/
│   │   └── api.ts                  # Fetch functions with retry + caching
│   └── utils/
│       ├── density.ts              # getRelativeDensity, getAbsoluteDensity
│       ├── memberColors.ts         # getMemberColorPalette
│       └── recurrence.ts           # formatRecurrenceRule (RRULE -> human-readable)
│
├── theme/                           # Design system
│   ├── tokens.ts                   # Design tokens (colors, spacing, layout, radii, etc.)
│   ├── config.ts                   # Semantic theme config (calendar, density thresholds)
│   ├── ThemeContext.tsx            # Theme provider (auto/light/dark mode)
│   ├── ThemeToggle.tsx             # Three-state toggle button
│   └── index.ts                    # Barrel export
│
└── types/
    └── index.ts                    # Global type barrel (re-exports from domain)
```

---

## 2. Component Inventory

**Total: ~50 components** across features and shared.

### Dashboard (Layout Orchestration)

| Component | File | Purpose |
|-----------|------|---------|
| AppShell | `features/dashboard/AppShell/AppShell.tsx` | Master layout: data fetching, kiosk hooks, view routing, sidebar/header/status bar composition |
| Header | `features/dashboard/Header/Header.tsx` | Top bar: date title, clock, weather widget, children slot for controls |
| Clock | `features/dashboard/Clock/Clock.tsx` | Live time display, updates every second via Temporal |
| DensityBadge | `features/dashboard/DensityBadge/DensityBadge.tsx` | Pill badge showing event count with density coloring |
| FamilyPills | `features/dashboard/FamilyPills/FamilyPills.tsx` | Inline member pills with avatar initials and event counts |

### Calendar

| Component | File | Purpose |
|-----------|------|---------|
| DayView | `features/calendar/views/DayView/DayView.tsx` | 24-hour timeline with positioned event blocks, current time indicator |
| WeekGrid | `features/calendar/views/WeekGrid/WeekGrid.tsx` | 8-day grid of DayCards (landscape: 4 cols, portrait: 2 cols) |
| MonthView | `features/calendar/views/MonthView/MonthView.tsx` | Traditional month grid with inline event strips, density sidebar |
| YearView | `features/calendar/views/YearView/YearView.tsx` | 12 mini-calendars (4x3 or 3x4), density bars, DayIndicators |
| DayCard | `features/calendar/components/DayCard/DayCard.tsx` | Week view card: day header, weather, density bar, event list |
| DayIndicator | `features/calendar/components/DayIndicator/DayIndicator.tsx` | 2px segmented micro-bar for year view day cells |
| EventItem | `features/calendar/components/EventItem/EventItem.tsx` | Unified event renderer with 3 variants: card, strip, block |
| EventPopup | `features/calendar/components/EventPopup/EventPopup.tsx` | Portaled hover popup showing event preview |
| EventModal | `features/calendar/components/EventModal/EventModal.tsx` | Portaled detail modal with full event info + attendees |
| DateDisplay | `features/calendar/components/DateDisplay/DateDisplay.tsx` | Clickable date trigger button for the header |
| DatePicker | `features/calendar/components/DatePicker/DatePicker.tsx` | Portaled month-grid calendar popup |

### Chores

| Component | File | Purpose |
|-----------|------|---------|
| ChoresView | `features/chores/views/ChoresView/ChoresView.tsx` | Top-level view: data fetching, modal state, board composition |
| ChoreBoard | `features/chores/components/ChoreBoard/ChoreBoard.tsx` | Board layout: MetricsBar + columns |
| ChoreCard | `features/chores/components/ChoreCard/ChoreCard.tsx` | Instance card: name, status, category, tags, difficulty, attribution |
| ChoreModal | `features/chores/components/ChoreModal/ChoreModal.tsx` | Portaled create/edit form for master chores (14 useState calls) |
| MemberColumn | `features/chores/components/MemberColumn/MemberColumn.tsx` | Member's chore column with header + scrollable cards |
| MetricsBar | `features/chores/components/MetricsBar/MetricsBar.tsx` | Stats row: active, completed, overdue, unclaimed |
| OpenPoolColumn | `features/chores/components/OpenPoolColumn/OpenPoolColumn.tsx` | Unclaimed/unassigned chores column |

### Navigation

| Component | File | Purpose |
|-----------|------|---------|
| Sidebar | `features/navigation/Sidebar/Sidebar.tsx` | Draggable sidebar with nav items, refresh/add buttons |
| SideNav | `features/navigation/SideNav/SideNav.tsx` | Fixed left/right arrow buttons for date navigation (confusing name) |
| StatusBar | `features/navigation/StatusBar/StatusBar.tsx` | Bottom bar: refresh countdowns, settings, theme toggle |
| ViewSwitcher | `features/navigation/ViewSwitcher/ViewSwitcher.tsx` | Segmented Day/Week/Month/Year toggle |

### Weather

| Component | File | Purpose |
|-----------|------|---------|
| WeatherWidget | `features/weather/components/WeatherWidget/WeatherWidget.tsx` | Compact current weather for header |
| WeatherIcon | `features/weather/components/WeatherWidget/WeatherIcon.tsx` | 15-condition SVG icon with day/night variants |
| WeatherTooltip | `features/weather/components/WeatherTooltip/WeatherTooltip.tsx` | Portaled detailed forecast popup |
| TempChart | `features/weather/components/WeatherTooltip/icons/TempChart.tsx` | SVG hourly temperature chart |
| 10 other icons | `features/weather/components/WeatherTooltip/icons/` | ThermometerIcon, FeelsLikeFaceIcon, HumidityIcon, WindIcon, UVIcon, PrecipIcon, PressureIcon, SunriseIcon, SunsetIcon, MoonIcon |

### Kiosk

| Component | File | Purpose |
|-----------|------|---------|
| StickyArea | `features/kiosk/components/StickyArea/StickyArea.tsx` | Sticky header wrapper with auto-hide transition |

### Shared

| Component | File | Purpose |
|-----------|------|---------|
| ErrorBoundary | `shared/components/ErrorBoundary/ErrorBoundary.tsx` | Class-based error boundary |
| ErrorFallback | `shared/components/ErrorBoundary/ErrorFallback.tsx` | Default error fallback UI |
| LoadingSkeleton | `shared/components/LoadingSkeleton/LoadingSkeleton.tsx` | Animated layout-shaped loading placeholder |
| ThemeToggle | `theme/ThemeToggle.tsx` | Light/dark/auto cycle button |

---

## 3. Styling Approaches (The Biggest Inconsistency)

### Three Different Patterns Used Simultaneously

#### Pattern A: Inline Styles with Token Objects (~80% of components)

Most components use inline `React.CSSProperties` objects referencing theme tokens:

```tsx
import { colors, spacing, radii } from '@/theme/tokens'

<div style={{ 
  background: colors.white, 
  padding: `${spacing.md}px`,
  borderRadius: `${radii['2xl']}px` 
}}>
```

**Used by:** DayView, MonthView, YearView, EventItem, EventPopup, EventModal, FamilyPills, Header, DensityBadge, ViewSwitcher, SideNav, StickyArea, DateDisplay, DatePicker, WeatherTooltip, DayCard, DayIndicator, WeatherWidget, ErrorFallback, LoadingSkeleton, Clock

#### Pattern B: Tailwind Utility Classes (~20% of components)

Some components use Tailwind classes, often mixed with inline styles:

```tsx
<div className="flex flex-col relative transition-all duration-250 border-r w-16"
     style={{ backgroundColor: 'var(--dt-bg)' }}>
```

**Used by:** Sidebar (heavy Tailwind), StatusBar (mixed), ThemeToggle

#### Pattern C: `const styles` Objects (Chores Feature Only)

The chores feature uses a `const styles: Record<string, React.CSSProperties>` pattern at the bottom of each component:

```tsx
const styles: Record<string, React.CSSProperties> = {
  card: { 
    borderRadius: `${radii.lg}px`,
    padding: `${spacing.md}px`,
    background: colors.bgHover,
  },
  header: { ... },
}

export function ChoreCard() {
  return <div style={styles.card}>...</div>
}
```

**Used by:** ChoreCard, ChoreBoard, ChoreModal, MemberColumn, MetricsBar, OpenPoolColumn, ChoresView

### Why This Hurts

- When adding a new component, you don't know which pattern to use
- Agents don't know which pattern to use
- Everything feels inconsistent
- Code review becomes subjective ("should this be Tailwind or inline?")

### Industry Standard (2024-2025)

Modern React projects pick **ONE** approach:
- **Tailwind-only** (most popular) — utility-first CSS
- **CSS Modules** — scoped CSS files
- **Styled Components/Emotion** — CSS-in-JS
- **Inline styles with tokens** — what you're mostly doing

**Recommendation:** Standardize on **Tailwind** for layout/spacing, with CSS custom properties for theme colors. This is the modern standard and you already have Tailwind installed.

---

## 4. Design Token System

### Three Layers (Dual System Creates Confusion)

#### Layer 1: CSS Custom Properties (`index.css`)

All visual values defined as `--dt-*` variables in `:root` and `[data-theme='dark']`:

```css
:root {
  --dt-primary: #4f46e5;
  --dt-bg: #f9fafb;
  --dt-text-primary: #1f2937;
  /* 60+ variables */
}

[data-theme='dark'] {
  --dt-primary: #6366f1;
  --dt-bg: #0f172a;
  /* dark mode variants */
}
```

This is the **single source of truth** for colors and shadows, enabling runtime theme switching.

#### Layer 2: JavaScript Token Objects (`theme/tokens.ts`)

Exports `colors`, `densityColors`, `densityBarColors`, `spacing`, `layout`, `radii`, `typography`, `shadows`, `transitions`, `zIndices`:

```typescript
export const colors = {
  primary: 'var(--dt-primary)',  // references CSS var
  bg: 'var(--dt-bg)',
  textPrimary: 'var(--dt-text-primary)',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 48,
}
```

**Problem:** Color values reference CSS variables (good), but spacing/layout/radii/typography are hardcoded numbers. The `shadows` object contains **hardcoded shadow strings** that duplicate the CSS custom properties `--dt-shadow-*` and do NOT adapt to dark mode.

#### Layer 3: Semantic Config (`theme/config.ts`)

Exports `themeConfig` composing tokens with semantic settings: calendar grid dimensions, density thresholds, date format locale.

### Tailwind Bridge (`index.css` `@theme` block)

CSS custom properties are mapped to Tailwind utility classes:

```css
@theme {
  --color-primary: var(--dt-primary);
  --color-bg: var(--dt-bg);
  /* ... */
}
```

This enables both `bg-primary` and `var(--dt-primary)` to work.

### Consumption Pattern

Components import from `@/theme/tokens` and use token values in inline styles:

```tsx
import { colors, spacing, radii } from '@/theme/tokens'

<div style={{ 
  background: colors.white, 
  padding: `${spacing.md}px` 
}}>
```

Some components use CSS vars directly:

```tsx
<div style={{ 
  backgroundColor: 'var(--dt-bg)',
  color: 'var(--dt-text-primary)' 
}}>
```

### The Problem

- Some components use `colors.primary` (JS object)
- Others use `var(--dt-primary)` directly (CSS var)
- Both work, but it's inconsistent
- The JS objects add unnecessary indirection

### Industry Standard

Pick one:
- **CSS vars only** — simpler, works with Tailwind, runtime theme switching
- **JS token objects** — type-safe, but requires build step for theme switching

**Recommendation:** Use **CSS custom properties directly** with Tailwind. The Tailwind `@theme` block already bridges them. Drop the JS token objects for colors/spacing.

---

## 5. The God Component: AppShell

`AppShell.tsx` is **280+ lines** and manages:

### Data Fetching
- Weather data (via `useApi`)
- Calendar events (via `useCalendarEvents`)
- Family members (via `useApi`)
- Backend readiness check (`waitForBackend`)

### Kiosk Hooks
- `useEdgeProximity` (3 instances: top, left, bottom)
- `useViewportWidth` (responsive breakpoints)
- `useUiScale` (CSS zoom for wide monitors)
- `useIdleCursor` (hide cursor after inactivity)
- `useOrientation` (landscape/portrait detection)

### State Management
- `backendReady`, `elapsed` — startup state
- `activeFeature` — which feature is active (calendar/chores)
- `showCreateChore` — modal trigger
- All view navigation state (via `useViewNavigation`)
- Sidebar state (via `useSidebar`)

### Layout Composition
- Header (with children slot for controls)
- Sidebar (draggable, collapsible)
- Main content area
- Status bar
- SideNav arrows (calendar only)

### View Routing
- DayView
- WeekGrid
- MonthView
- YearView
- ChoresView

### Responsive Breakpoints
```typescript
const vw = useViewportWidth()
const headerCompact = vw < 1300
const showPills = vw >= 1000
const showClock = vw >= 800
const showWeather = vw >= 640
const showDate = vw >= 500
```

### Why This Hurts

- Everything is coupled together
- Changing one thing risks breaking others
- Hard to test (too many dependencies)
- Hard to understand (too many responsibilities)
- Hard to reuse (can't extract parts)

### Industry Standard

Split into smaller containers:
- **`DashboardLayout`** — layout composition (header, sidebar, main, status bar)
- **`DataProviders`** — data fetching context (weather, calendar, family)
- **`KioskProviders`** — kiosk-specific hooks (edge proximity, viewport, scale)
- **`FeatureRouter`** — view switching (calendar/chores, day/week/month/year)

---

## 6. Redundancies & Duplicated Code

### A. Sidebar Width Constants Duplicated

`layout.sidebarFull` (224) and `layout.sidebarCollapsed` (64) are defined in `tokens.ts`, but `Sidebar.tsx` re-declares them locally:

```typescript
const SIDEBAR_FULL = 224 // w-56 = 14rem = 224px
const SIDEBAR_COLLAPSED = 64 // w-16 = 4rem = 64px
```

### B. Month Names Duplicated

Full and abbreviated month name arrays are defined in both `DateDisplay.tsx` and `DatePicker.tsx`.

### C. Date Formatting Duplicated

`WeatherTooltip.tsx` has its own local `formatDate()` and `formatTime()` functions that duplicate logic from `shared/date/format.ts` and `shared/date/calendar.ts`.

### D. MemberColumn and OpenPoolColumn Near-Clones

These two components have **nearly identical structure**:
- Header with title + badge
- Scrollable card list
- Empty state message

The only difference is the header content. They share identical `styles.column`, `styles.cardList`, and `styles.emptyText` objects.

**Recommendation:** Merge into a single parameterized `ChoreColumn` component.

### E. Portal + Viewport Clamping Repeated 5 Times

`createPortal` to `document.body` is used in 5 components:
- `EventPopup`
- `EventModal`
- `DatePicker`
- `WeatherTooltip`
- `ChoreModal`

Each independently handles:
- Portal creation
- Viewport clamping (keeping popup within visible area)
- `useUiScale` zoom factor

**Recommendation:** Extract a shared `FloatingLayer` or `Portal` component with built-in viewport clamping.

### F. Error State Rendering Duplicated

Both `AppShell.tsx` and `ChoresView.tsx` have inline "centered error message" rendering with similar patterns:

```tsx
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
  <div style={{ fontSize: '18px', color: '#dc2626' }}>
    Error: {error}
  </div>
</div>
```

**Recommendation:** Extract an `ErrorMessage` component.

### G. Separator Dividers Repeated 4x

Inline style repeated 4 times in `AppShell.tsx`:

```tsx
<div style={{
  width: '1px',
  height: '24px',
  background: colors.border,
  margin: '0 4px',
}} />
```

**Recommendation:** Extract a `Separator` component.

### H. Shadows Broken for Dark Mode

The `shadows` export in `tokens.ts` contains **hardcoded shadow strings** that do NOT adapt to dark mode:

```typescript
export const shadows = {
  cardHover: '0 4px 12px rgba(0,0,0,0.08)',  // light mode only
  popup: '0 8px 24px rgba(0,0,0,0.15)',       // light mode only
}
```

Even though CSS custom properties `--dt-shadow-*` exist with proper dark-mode variants, components using `shadows.cardHover` from tokens will get the light-mode shadow in dark mode.

**Recommendation:** Remove `shadows` from `tokens.ts` and use CSS custom properties directly.

---

## 7. Hover Patterns Inconsistent

### Three Different Approaches

| Pattern | Used By | Approach |
|---------|---------|----------|
| CSS utility classes | DayCard, Sidebar | `className="hover-lift"` |
| React state | ChoreCard | `const [hovered, setHovered] = useState(false)` |
| Inline event handlers | Various | `onMouseEnter={() => setHovered(true)}` |

### Example: React State Pattern

```tsx
const [hovered, setHovered] = useState(false)

<div
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
  style={{
    transform: hovered ? 'scale(1.01)' : 'scale(1)',
  }}
>
```

### Example: CSS Utility Pattern

```tsx
<div className="hover-lift">
```

With CSS defined in `index.css`:

```css
.hover-lift {
  transition: box-shadow 0.15s, transform 0.1s;
}
.hover-lift:hover {
  box-shadow: var(--dt-shadow-card-hover) !important;
  transform: translateY(-1px) !important;
}
```

### Industry Standard

Use **CSS for hover states** (Tailwind `hover:` utilities), not React state. React state for hover is an anti-pattern — it causes unnecessary re-renders.

**Recommendation:** Use Tailwind `hover:` utilities or CSS classes for all hover states.

---

## 8. Naming Confusion

### Sidebar vs SideNav

- **`Sidebar`** — Left navigation panel (draggable, collapsible, shows nav items)
- **`SideNav`** — Fixed-position left/right arrow buttons for calendar navigation

**Problem:** Similar names, different purposes. `SideNav` is only used for calendar navigation arrows, not actual navigation.

**Recommendation:** Rename `SideNav` → `DateNavigationArrows` or `CalendarNavArrows`.

---

## 9. Missing Component Library

### What You Have

Only **2 shared components**:
- `ErrorBoundary`
- `LoadingSkeleton`

### What's Missing

Many reusable patterns are scattered across features:

| Pattern | Current Location | Count |
|---------|------------------|-------|
| Buttons (icon, action, nav) | Sidebar, StatusBar, Header, ViewSwitcher | 10+ instances |
| Badges (status, density, count) | ChoreCard, DensityBadge, DayCard | 5+ instances |
| Cards (event, chore, day) | EventItem, ChoreCard, DayCard | 3 instances |
| Separators | AppShell | 4 instances |
| Tooltips/Popups | WeatherTooltip, EventPopup | 2 instances |
| Modals | EventModal, ChoreModal | 2 instances |

### Industry Standard

Extract a `shared/components/ui/` library with primitives:

```
shared/components/ui/
├── Button/
│   ├── Button.tsx
│   ├── IconButton.tsx
│   └── index.ts
├── Badge/
│   ├── Badge.tsx
│   ├── StatusBadge.tsx
│   └── index.ts
├── Card/
│   ├── Card.tsx
│   └── index.ts
├── Separator/
│   ├── Separator.tsx
│   └── index.ts
├── Modal/
│   ├── Modal.tsx
│   └── index.ts
├── Popup/
│   ├── Popup.tsx
│   └── index.ts
└── Tooltip/
    ├── Tooltip.tsx
    └── index.ts
```

---

## 10. API Integration

### Architecture

```
Endpoint Registry (shared/api/endpoints.ts)
 ↓
API Service Layer (shared/services/api.ts) — fetchWithRetry, postWithRetry
 ↓
useApi Hook (shared/hooks/useApi.ts) — generic data fetching with auto-refresh
 ↓
Feature Hooks (useCalendarEvents, useChores) — domain-specific wrappers
 ↓
AppShell / ChoresView — consume hooks, pass data as props
```

### Key Patterns

1. **Endpoint Registry**: All URLs, methods, refresh intervals, and cache TTLs centralized in `endpoints.ts`
2. **Retry with Backoff**: `fetchWithRetry` (5 retries, exponential backoff starting at 2s), `postWithRetry`/`putWithRetry`/`deleteWithRetry` (3 retries)
3. **Client-side Caching**: Calendar events cached in-memory by date range key with configurable TTL
4. **Auto-refresh**: Both `useApi` and `useCalendarEvents` support interval-based refetching with faster retry on error
5. **Backend Wait**: `waitForBackend()` polls health endpoint indefinitely during startup
6. **Temporal Parsing**: API wire-format strings are parsed to Temporal types at the boundary (`parse.ts`), so the rest of the app works with type-safe Temporal objects

### Endpoints

| Key | URL | Method | Refresh | Cache |
|-----|-----|--------|---------|-------|
| health | `/health` | GET | none | none |
| calendar | `/api/v1/calendar` | GET | 2 min | 2 min |
| weather | `/api/v1/weather` | GET | 10 min | none |
| family | `/api/v1/family` | GET | none (fetch once) | none |
| chores | `/api/v1/chores` | GET | 2 min | 1 min |

### Assessment

**This is well-designed.** Clean separation of concerns, proper error handling, good caching strategy. No changes needed.

---

## 11. State Management

### No External State Management

No Redux, Zustand, Jotai, etc. State is managed entirely with React primitives.

### State Locations

1. **AppShell** (monolithic coordinator):
   - `backendReady`, `elapsed` — startup state
   - `activeFeature` — which feature is active
   - `showCreateChore` — modal trigger
   - All data fetching orchestrated here

2. **useViewNavigation** (shared hook):
   - `currentView` (CalendarView) — persisted to localStorage
   - `currentDate` (Temporal.PlainDate)

3. **useCalendarEvents** (calendar hook):
   - `events`, `loading`, `error`, `lastRefresh`

4. **useApi** (generic hook):
   - `data`, `loading`, `error`, `lastRefresh`

5. **useChores** (chores hook):
   - Wraps useApi for chores data

6. **useEventInteraction** (calendar hook):
   - `popupState` (hover popup position/content)
   - `selectedEvent` (modal target)

7. **Kiosk hooks**: Each manages its own local state

### Data Flow

Strictly top-down via props. AppShell fetches all data and passes it down. No context providers for data (only for theme). No global store.

### Assessment

**This is appropriate for the scale.** The app is not complex enough to need external state management. The hook-based approach is clean and testable.

**Issue:** AppShell owns too much state. Splitting it into providers would help.

---

## 12. Icon Usage

### Lucide React (UI Icons)

Used for navigation and UI chrome:
- `Calendar`, `CheckSquare` — sidebar nav items
- `RefreshCw`, `Plus` — sidebar action buttons
- `Settings`, `Sun` — status bar
- `ChevronLeft`, `ChevronRight`, `ChevronsLeft`, `ChevronsRight` — date picker navigation
- `ChevronDown` — date display dropdown
- `MapPin`, `Repeat` — event popup/modal
- `Droplet`, `Wind` — day view weather row
- `Monitor`, `Moon`, `Sun` — theme toggle
- `X` — chore modal close
- `Calendar` — date display trigger

### Custom Inline SVGs (Weather Icons)

- **WeatherIcon** (`WeatherWidget/WeatherIcon.tsx`): 15 weather conditions, each a hand-crafted inline SVG with day/night variants. No emoji.
- **Weather Tooltip Icons** (11 files in `WeatherTooltip/icons/`): ThermometerIcon, FeelsLikeFaceIcon, HumidityIcon, WindIcon, UVIcon, PrecipIcon, PressureIcon, SunriseIcon, SunsetIcon, MoonIcon, TempChart — all custom inline SVGs.

### Text Characters (Navigation Arrows)

`SideNav` uses Unicode characters `‹` and `›` (single left/right angle quotes) for the navigation arrows instead of Lucide chevron icons.

### Assessment

**Mixed but acceptable.** Lucide for UI chrome, custom SVGs for domain-specific illustrations (weather). No emoji in components (see exception below).

**Exception:** The `UnifiedContent` component inside `WeatherTooltip.tsx` uses emoji for the large condition display (sun/cloud/rain emoji), contradicting the "no emoji" rule in AGENTS.md.

---

## 13. Layout & Scaling System

### CSS Zoom Scaling (`useUiScale`)

- **Design baseline**: 1920px (`layout.designWidth`)
- **Scale factor**: `max(1, viewportWidth / 1920)`
- Applied as CSS `zoom` on the app root div
- On 1080p-class displays (the Pi kiosk target): scale = 1 (unchanged)
- On wider monitors: everything scales up uniformly
- CSS `zoom` is used instead of `transform: scale` because zoom reflows layout, keeping sticky/fixed positioning working

### Height Compensation

```tsx
height: `calc(100vh / ${uiScale})`
```

Since CSS zoom makes 100vh evaluate in zoomed pixels, the app divides by the scale factor to fill exactly the visible height.

### Progressive Header Compaction (`useViewportWidth`)

The header adapts to narrow viewports by progressively hiding elements:
- `< 500px`: hide date display
- `< 640px`: hide weather widget
- `< 800px`: hide clock
- `< 1000px`: hide family pills
- `< 1300px`: compact labels (D/W/M/Y instead of Day/Week/Month/Year, "T" instead of "Today")

### Auto-Hide Chrome (`useEdgeProximity`)

Three instances watch the top, left, and bottom screen edges:
- Header auto-hides after 3 seconds of mouse away from top edge
- Sidebar auto-hides after 3 seconds of mouse away from left edge
- Status bar auto-hides after 3 seconds of mouse away from bottom edge
- Moving within 60px of the edge re-shows the chrome immediately

### Cursor Hiding (`useIdleCursor`)

Mouse cursor hides after 2 seconds of inactivity (kiosk wall-mounted display use case).

### Orientation Awareness (`useOrientation`)

Detects landscape vs portrait and adjusts grid layouts:
- Week grid: 4 columns landscape, 2 columns portrait
- Year grid: 4x3 landscape, 3x4 portrait
- Sidebar default state: collapsed in landscape, hidden in portrait

### Sidebar Drag Resize

The sidebar supports mouse/touch drag to resize between collapsed (64px) and full (224px) states, with snap-to-state on release.

### Assessment

**This is well-designed.** The scaling system is sophisticated and handles the kiosk use case well. The progressive header compaction is a nice touch.

**Minor issue:** `useViewportWidth` and `useUiScale` both listen to window resize independently. They could be combined into a single hook.

---

## 14. Minor Issues

### A. Weather Tooltip Uses Emoji

The `UnifiedContent` component inside `WeatherTooltip.tsx` uses emoji for the large condition display (sun/cloud/rain emoji), contradicting the "no emoji" rule in AGENTS.md.

### B. Stale Architecture Doc

The `docs/event-architecture-analysis.md` describes problems that have since been partially fixed (EventItem was created, useEventInteraction was extracted, types were updated). The doc should be updated or removed.

### C. Multiple Resize Listeners

Both `useViewportWidth` and `useUiScale` add independent `resize` event listeners. They could be combined into a single hook returning both values, reducing the number of resize handlers.

### D. ChoreModal Form State

`ChoreModal.tsx` has 14 `useState` calls for form fields. This is a candidate for `useReducer` or a form library (React Hook Form), though it works fine as-is.

---

## 15. Industry Standard Comparison (2024-2025)

| Concern | Your Project | Industry Standard |
|---------|--------------|-------------------|
| **Styling** | Mixed (inline + Tailwind + const styles) | **Tailwind-only** or CSS Modules |
| **Design tokens** | Dual system (CSS vars + JS objects) | **CSS custom properties** with Tailwind bridge |
| **Component library** | 2 shared components | **UI primitive library** (Button, Badge, Card, etc.) |
| **Layout orchestration** | Monolithic AppShell | **Split into providers/containers** |
| **Hover states** | Mixed (CSS + React state) | **CSS-only** (Tailwind `hover:` utilities) |
| **Portal/floating UI** | Repeated 5x | **Shared FloatingLayer component** |
| **Form state** | 14 useState calls | **useReducer or form library** (React Hook Form) |
| **Naming** | Confusing (Sidebar vs SideNav) | **Descriptive names** (DateNavigationArrows) |

---

## 16. Finalized UI Stack Decision

After evaluating the current inconsistencies and industry standards (2024-2025), the following stack has been selected to standardize the Dashy frontend:

### The Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHY UI STACK                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tailwind CSS v4 (already installed)                        │
│  ├── Utility classes replace ALL inline styles              │
│  ├── @theme block bridges CSS vars → bg-primary, etc.      │
│  └── hover:/focus:/active: replace React hover state        │
│                                                             │
│  Headless UI (needs install: @headlessui/react)             │
│  ├── Dialog → EventModal, ChoreModal                        │
│  ├── Popover → EventPopup, WeatherTooltip, DatePicker       │
│  ├── Dropdown → sidebar menus, header menus                 │
│  └── Handles portals, keyboard nav, focus trapping          │
│                                                             │
│  Catalyst Components (from Tailwind Plus)                   │
│  ├── Button, Badge, Avatar, Divider → shared/components/ui/ │
│  ├── Sidebar + SidebarLayout → replace AppShell god component│
│  ├── Dialog → modals with built-in transitions              │
│  ├── Form primitives → ChoreModal form cleanup              │
│  └── Adapted to use Dashy color tokens (not default zinc)   │
│                                                             │
│  motion + clsx (small deps, needed by Catalyst)             │
│  ├── motion → animated layout transitions                   │
│  └── clsx → conditional class name composition              │
│                                                             │
│  lucide-react (already installed — keep as-is)              │
│  └── UI icons (navigation, actions, status)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### What Each Tool Does

| Tool | Purpose | Why It's Needed |
|------|---------|-----------------|
| **Tailwind CSS v4** | Utility-first styling | Replaces all inline styles, `const styles` objects, and custom CSS hover classes. Single source of truth for visual styling. |
| **CSS Custom Properties** | Design tokens | `--dt-*` variables in `:root` and `[data-theme='dark']` enable runtime theme switching. The `@theme` block bridges them to Tailwind utilities (`bg-primary`, `text-text-primary`, etc.). |
| **Headless UI** | Accessible behavior | Handles the hard parts: portal rendering, viewport detection, keyboard navigation, focus trapping, ARIA attributes. You bring the styles (Tailwind), it provides the behavior. |
| **Catalyst UI Kit** | Pre-built component patterns | 27 production-ready React components (Button, Badge, Dialog, Sidebar, etc.) built by the Tailwind team. Copy-paste and adapt to Dashy's token system. |
| **motion** | Animation library | Required by Catalyst for animated layout transitions (e.g., sidebar current-page indicator, modal enter/exit). |
| **clsx** | Class name utility | Required by Catalyst for conditional class composition (`clsx(className, isActive && 'bg-primary')`). |
| **lucide-react** | Icon library | Already installed. UI icons for navigation, actions, status indicators. Keep as-is. |

### What Gets Eliminated

| Current Problem | Gone Because |
|-----------------|--------------|
| **3 different styling patterns** (inline styles, `const styles` objects, Tailwind) | Everything becomes Tailwind utility classes. One pattern, one mental model. |
| **`tokens.ts` JS objects** (spacing, radii, shadows, typography) | Tailwind has built-in spacing/sizing scales (`p-3`, `rounded-lg`, `text-sm`). Shadows are defined in `@theme` and referenced as CSS vars. Colors already bridge via `@theme`. Most of `tokens.ts` becomes unnecessary. |
| **6 custom CSS hover classes** (`.hover-lift`, `.hover-bg`, `.hover-arrow`, `.hover-date-trigger`, `.hover-picker-btn`, `.hover-picker-month`) | Replaced with Tailwind `hover:` utilities or `@utility` blocks. No more `!important` overrides fighting inline styles. |
| **React `useState` for hover states** (ChoreCard, etc.) | `hover:scale-[1.01]` and `data-hover:bg-bg-hover` — pure CSS, zero JS, no unnecessary re-renders. |
| **Portal + viewport clamping logic × 5** (EventPopup, EventModal, DatePicker, WeatherTooltip, ChoreModal) | Headless UI's Dialog, Popover, and FloatingPortal handle portal rendering, viewport detection, and keyboard navigation out of the box. |
| **Separator dividers × 4** (inline in AppShell) | `<Divider />` component from Catalyst. |
| **AppShell god component** (280+ lines managing everything) | Catalyst's `SidebarLayout` pattern decomposes it into: `DashboardLayout` (layout composition), `DataProviders` (data fetching context), `KioskProviders` (kiosk hooks), `FeatureRouter` (view switching). |
| **Missing UI primitives** (Button, Badge, Card, Modal, Popup, Tooltip, Separator) | Catalyst provides Button, Badge, Avatar, Divider, Dialog, Dropdown, Input, Select, etc. Adapted to Dashy's token system and placed in `shared/components/ui/`. |
| **Broken dark mode shadows** (`shadows` export in `tokens.ts` with hardcoded light-mode values) | CSS custom properties (`--dt-shadow-*`) with proper dark-mode variants, referenced via Tailwind's `@theme` block. Shadows just work in both themes. |
| **Inconsistent shadow usage** (some use `shadows.cardHover` from tokens, others use `var(--dt-shadow-*)` directly) | All shadows use Tailwind utilities (`shadow-card`, `shadow-popup`) or CSS vars. One pattern. |
| **Duplicated date formatting** (WeatherTooltip has its own `formatDate()` and `formatTime()`) | Consolidated into `shared/date/format.ts`. All components use the same utilities. |
| **Duplicated month names** (DateDisplay and DatePicker both define month arrays) | Consolidated into a single shared utility. |
| **Duplicated sidebar width constants** (Sidebar re-declares `SIDEBAR_FULL` and `SIDEBAR_COLLAPSED` locally) | Use `layout.sidebarFull` and `layout.sidebarCollapsed` from tokens, or Tailwind's width utilities. |
| **Near-clone components** (MemberColumn and OpenPoolColumn) | Merged into a single parameterized `ChoreColumn` component. |
| **Confusing naming** (Sidebar vs SideNav) | `SideNav` renamed to `DateNavigationArrows` or `CalendarNavArrows`. |

### How They Work Together

1. **Tailwind CSS** provides the utility classes for all visual styling: layout (`flex`, `grid`, `gap-*`), spacing (`p-*`, `m-*`), colors (`bg-primary`, `text-text-primary`), typography (`text-sm`, `font-semibold`), effects (`shadow-card`, `rounded-lg`), and states (`hover:`, `focus:`, `active:`).

2. **CSS Custom Properties** (`--dt-*`) remain the single source of truth for colors and shadows, enabling runtime theme switching. The `@theme` block in `index.css` bridges them to Tailwind utilities so you can write `bg-primary` instead of `bg-[var(--dt-primary)]`.

3. **Headless UI** provides the behavioral layer for interactive components: modals (Dialog), popups (Popover), dropdowns (Dropdown), listboxes (Listbox), comboboxes (Combobox). It handles portal rendering, viewport detection, keyboard navigation, focus trapping, and ARIA attributes. You style them with Tailwind.

4. **Catalyst Components** are pre-built React components that compose Headless UI + Tailwind. You copy them into `shared/components/ui/` and adapt them to use Dashy's color tokens instead of the default zinc palette. They provide the design patterns; you customize the colors.

5. **motion** and **clsx** are small dependencies required by Catalyst for animations and conditional class composition.

6. **lucide-react** continues to provide UI icons. Custom SVGs remain for domain-specific illustrations (weather icons).

### Migration Strategy

The migration is **incremental** — each phase can be deployed independently:

1. **Install dependencies**: `make add-kiosk PACKAGE=@headlessui/react`, `make add-kiosk PACKAGE=motion`, `make add-kiosk PACKAGE=clsx`
2. **Copy Catalyst components** from `/Users/admin/Downloads/TailwindPLUS/catalyst-ui-kit/typescript/` into `shared/components/ui/` and adapt colors
3. **Convert components to Tailwind** systematically (feature by feature or component by component)
4. **Replace custom hover classes** with Tailwind `hover:` utilities
5. **Replace portal logic** with Headless UI Dialog/Popover
6. **Break up AppShell** using Catalyst's SidebarLayout pattern
7. **Remove `tokens.ts`** (keep only what's still needed, like `layout` constants)
8. **Consolidate utilities** (date formatting, month names, sidebar constants)

### Research & Inspiration Resources

The following Tailwind Plus downloads are available for reference when stuck or exploring design patterns:

- **Templates** (13 full app examples): `/Users/admin/Downloads/TailwindPLUS/tailwind-plus-*` — see how Catalyst components compose into real apps
- **Marketing UI Blocks**: `/Users/admin/Downloads/TailwindPLUS/marketing-v4/react/` — section patterns (stats, bento grids, headers)
- **Catalyst Demo App**: `/Users/admin/Downloads/TailwindPLUS/catalyst-ui-kit/demo/typescript/` — full working example of Catalyst in action

---

## 17. Proposed Reorganization Plan

Based on industry standards, here's the recommended approach:

### Phase 1: Standardize Styling (Biggest Impact)

1. **Pick Tailwind as the single styling approach**
2. **Remove JS token objects** — use CSS custom properties directly with Tailwind
3. **Convert all components to Tailwind** — systematic migration
4. **Remove hover utility classes** — use Tailwind `hover:` utilities instead

**Impact:** Eliminates the biggest source of inconsistency. Makes the codebase feel cohesive.

### Phase 2: Extract UI Component Library

1. Create `shared/components/ui/` with primitives:
   - `Button`, `IconButton`
   - `Badge`, `StatusBadge`
   - `Card`
   - `Separator`
   - `Modal`, `Popup` (shared portal logic)
   - `Tooltip`
2. **Refactor existing components** to use the UI library

**Impact:** Reduces duplication, makes components easier to build, ensures consistency.

### Phase 3: Break Up AppShell

1. Extract `DashboardLayout` — layout composition
2. Extract `DataProviders` — data fetching context
3. Extract `KioskProviders` — kiosk hooks
4. Extract `FeatureRouter` — view switching

**Impact:** Makes the codebase easier to understand, test, and maintain.

### Phase 4: Eliminate Redundancies

1. Merge `MemberColumn` and `OpenPoolColumn` into parameterized `ChoreColumn`
2. Extract shared `FloatingLayer` for portal + viewport clamping
3. Consolidate date formatting utilities
4. Fix shadow tokens for dark mode
5. Rename `SideNav` → `DateNavigationArrows`

**Impact:** Reduces code duplication, fixes bugs, improves clarity.

### Phase 5: Update Skills

1. Update all kiosk-related skills to reflect new conventions
2. Document the new patterns in AGENTS.md

**Impact:** Ensures future development follows the new standards.

---

## 18. Next Steps

This is a significant reorganization. The recommended approach:

1. **Enter plan mode** to design the detailed implementation plan
2. **Map out exact file changes** and migration order
3. **Define testing strategy** for each phase
4. **Execute incrementally** — each phase should be independently deployable
5. **Update skills** to reflect new conventions

**Estimated effort:** 2-3 days of focused work (can be split across multiple sessions)

**Risk level:** Medium — systematic migration with testing at each step minimizes risk

---

## Conclusion

The dashy-kiosk frontend has a **solid foundation** but suffers from **inconsistencies** that make it feel disconnected and hard to maintain. The main issues are:

1. **Three different styling approaches** used inconsistently
2. **Dual token system** creating confusion
3. **Monolithic AppShell** managing too much
4. **Missing UI component library** leading to duplication
5. **Portal/floating UI logic repeated 5 times**

The recommended reorganization follows **industry standards (2024-2025)** and will make the codebase:
- **More cohesive** — single styling approach
- **Easier to maintain** — shared UI primitives
- **Easier to understand** — smaller, focused components
- **Easier to extend** — clear patterns and conventions

The reorganization is **incremental** — each phase can be deployed independently, minimizing risk.
