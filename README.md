# Dashy Kiosk

Frontend for the Dashy Family Calendar Dashboard — a wall-mounted kiosk display for family schedules and weather.

## Overview

Dashy Kiosk is a React + Vite single-page application designed for full-viewport display on a Raspberry Pi kiosk. It shows family calendar events, weather data, and time — all scaled fluidly to fit any display.

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 4 + CSS Custom Properties
- **Date/Time:** Temporal API (`@js-temporal/polyfill` for build/test, native in Chromium 151+)
- **Icons:** Lucide React (UI icons), Custom SVG (weather/data visualizations)
- **Package Manager:** pnpm
- **Testing:** Vitest + React Testing Library
- **Linting:** ESLint + Prettier
- **Deployment:** Docker (Vite build → nginx)

## Development

This repo is designed to run as part of the Dashy orchestrator (docker compose). See the [main dashy repo](https://github.com/faiyaz7283/dashy) for full setup instructions.

### Quick Start

```bash
# From the orchestrator repo (dashy/)
make dev-up

# Frontend: https://dashy.local
```

### Standalone Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm run dev
```

### Code Quality

```bash
make lint        # ESLint
make format      # Prettier
make typecheck   # TypeScript type check
make test        # Run vitest
make build       # Production build
```

## Architecture

```
src/
├── main.tsx              # Entry point
├── App.tsx               # Root component
├── index.css             # Global styles
├── temporal.d.ts         # Global Temporal type declarations
├── domain/               # Domain types, utilities (calendar, family, weather)
├── features/             # Feature modules (weather, calendar, navigation, dashboard, kiosk)
├── shared/
│   ├── components/       # Shared UI components
│   ├── hooks/            # Shared React hooks
│   ├── services/         # API client and service layer
│   ├── config/           # App configuration
│   ├── date/             # Temporal-based date utilities (parse, format, calendar)
│   └── utils/            # General-purpose pure utilities
├── test/                 # Test setup and utilities
├── theme/                # Design tokens, theming system (dark/light/auto mode), scaling
├── types/                # TypeScript type definitions
└── docs/                 # Documentation
```

**Key patterns:**
- **Fluid full-viewport layout** — scales to any display via `useUiScale`
- **Feature-based organization** — each feature is self-contained
- **Domain-driven** — domain types separate from UI concerns
- **Temporal API for all date/time** — immutable, timezone-safe `PlainDate`, `PlainDateTime`, `PlainTime`; no legacy `Date` objects. CalendarEvent is a discriminated union (`AllDayCalendarEvent` | `TimedCalendarEvent`) with type guards
- **Date infrastructure** — `shared/date/` module handles parsing API responses (`parse.ts`), display formatting (`format.ts`), and calendar utilities like `today()`, `getWeekDays()`, `getMonthGridDates()` (`calendar.ts`)
- **Theming system** — CSS custom properties enable dark/light/auto modes; auto mode switches based on sunrise/sunset from weather API
- **Icon architecture** — Lucide React for UI chrome, custom SVG for data visualizations

## Design Principles

- **Fluid scaling** — fills the visible window on any display, no scrollbars
- **Floating layers** — modals portal to `document.body` with scale factor
- **Configurable** — family members, colors, API URLs from environment
- **No hardcoded viewport assumptions** — responsive to any screen size
- **Temporal over Date** — all date/time uses the Temporal API; no legacy `Date` objects, no timezone ambiguity, no mutable date state
- **Theming support** — dark/light/auto mode with CSS custom properties; auto mode uses sunrise/sunset times from weather data
- **Icon strategy** — Lucide React for UI icons (consistent, themeable), custom SVG for weather/data visualizations (specialized, data-driven)

## Deployment

This repo deploys as a Docker container via the orchestrator:

```bash
# From orchestrator repo
make deploy  # Deploys to Raspberry Pi via GitHub Actions
```

## Related Repos

- **[dashy](https://github.com/faiyaz7283/dashy)** — Orchestrator repo (compose, docs, deployment)
- **[dashy-api](https://github.com/faiyaz7283/dashy-api)** — Backend API

## License

MIT
