---
name: mockup
description: Create a static HTML + Tailwind CDN mockup for design exploration before implementing in React. Follows the mockup-first workflow with Catalyst UI patterns and Dashy design tokens.
---

# Mockup-First Workflow

Dashy uses a mockup-first approach: build static HTML mockups using Tailwind CDN + Dashy design tokens, get approval, then implement as React components with Catalyst patterns.

**Plan document:** `docs/mockup-phase-plan.md` — contains the full section-by-section mockup plan, color mapping table, and workflow rules.

## When to Use

- New UI feature or page
- Redesigning an existing component's layout
- Exploring responsive behavior (landscape vs portrait)
- Testing visual ideas before committing to React structure

## When NOT to Use

- Bug fixes to existing components
- Backend-only changes
- Refactoring without visual changes
- Small tweaks that are obvious in code

## Sticky Conventions (All Agents Must Follow)

These rules apply to every mockup and carry forward to implementation:

1. **One section at a time** — follow `docs/mockup-phase-plan.md` order, don't skip ahead
2. **Each section needs explicit approval** before moving to the next
3. **Approved decisions are sticky** — they carry forward to subsequent sections
4. **Theme toggle in every mockup** — both light and dark must look good
5. **No emojis** — SVG icons only (use Lucide icon SVGs inline)
6. **Full viewport** — no page-level scrollbars in any mockup
7. **Mockup ≠ final code** — but Tailwind classes, colors, spacing transfer directly
8. **No React during mockup phase** — pure HTML + Tailwind + CSS

## Reference Paths (Don't Search — Use These)

| Resource | Path |
|----------|------|
| **Mockup plan** | `docs/mockup-phase-plan.md` |
| **Design tokens (CSS)** | `src/index.css` — 60+ `--dt-*` custom properties |
| **Design tokens (JS)** | `src/theme/tokens.ts` — spacing, layout, radii, typography, shadows |
| **Catalyst components** | `/Users/admin/Downloads/TailwindPLUS/catalyst-ui-kit/typescript/` |
| **Catalyst demo app** | `/Users/admin/Downloads/TailwindPLUS/catalyst-ui-kit/demo/typescript/` |
| **Templates (inspiration)** | `/Users/admin/Downloads/TailwindPLUS/tailwind-plus-*` |
| **Marketing blocks (inspiration)** | `/Users/admin/Downloads/TailwindPLUS/marketing-v4/react/` |
| **Audit document** | `docs/frontend-architecture-audit.md` (Section 16: Finalized UI Stack) |

## Catalyst → Dashy Color Mapping

When adapting Catalyst component patterns, replace the default zinc palette:

| Catalyst (zinc) | Dashy Token | Tailwind Utility |
|-----------------|-------------|-----------------|
| `text-zinc-950` | `--dt-text-primary` | `text-text-primary` |
| `text-zinc-600` | `--dt-text-secondary` | `text-text-secondary` |
| `text-zinc-500` | `--dt-text-muted` | `text-text-muted` |
| `text-zinc-400` | `--dt-text-faint` | `text-text-faint` |
| `text-zinc-300` | `--dt-text-disabled` | `text-text-disabled` |
| `bg-white` | `--dt-white` | `bg-bg` (surface) |
| `bg-zinc-50` | `--dt-bg` | `bg-bg` |
| `bg-zinc-100` | `--dt-bg-hover` | `bg-bg-hover` |
| `border-zinc-200` | `--dt-border` | `border-border` |
| `border-zinc-100` | `--dt-border-light` | `border-border-light` |
| `ring-zinc-200` | `--dt-primary-ring` | `ring-primary-ring` |
| `accent-indigo-600` | `--dt-primary` | `accent-primary` |

## Catalyst Component Mapping

| Catalyst Component | Dashy Usage |
|-------------------|-------------|
| `sidebar.tsx` | Navigation sidebar with animated current-page indicator |
| `sidebar-layout.tsx` | Overall app layout (fixed sidebar + mobile dialog) |
| `button.tsx` | All clickable actions (refresh, add, nav arrows) |
| `badge.tsx` | Density badges, status indicators |
| `avatar.tsx` | Family member pills, user avatar |
| `dialog.tsx` | EventModal, ChoreModal |
| `divider.tsx` | Section separators |
| `dropdown.tsx` | Header menus, sidebar menus |
| `navbar.tsx` | Top header bar |
| `input.tsx`, `select.tsx`, `fieldset.tsx` | ChoreModal form |
| `heading.tsx`, `text.tsx` | Typography patterns |
| `switch.tsx`, `checkbox.tsx` | Toggle controls |

## Steps

### 1. Check the plan

Read `docs/mockup-phase-plan.md` to see which section we're on and what's approved.

### 2. Create the mockup file

Location: `mockups/<NN>-<feature-name>.html` (e.g., `mockups/01-layout-shell.html`)

**CRITICAL: Use Tailwind utility classes throughout. No inline `style="..."` with `var(--dt-*)`.** The approved mockup classes transfer directly to React implementation.

Use this template:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashy — [Feature Name]</title>
    <!-- Tailwind v4 browser CDN — matches project's tailwindcss@^4.3.3 -->
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <style type="text/tailwindcss">
        @theme {
            --font-sans: 'Inter', system-ui, sans-serif;
            --color-primary: var(--dt-primary);
            --color-primary-hover: var(--dt-primary-hover);
            --color-primary-light: var(--dt-primary-light);
            --color-primary-light-hover: var(--dt-primary-light-hover);
            --color-primary-ring: var(--dt-primary-ring);
            --color-bg: var(--dt-bg);
            --color-bg-hover: var(--dt-bg-hover);
            --color-white: var(--dt-white);
            --color-text-primary: var(--dt-text-primary);
            --color-text-secondary: var(--dt-text-secondary);
            --color-text-muted: var(--dt-text-muted);
            --color-text-faint: var(--dt-text-faint);
            --color-text-disabled: var(--dt-text-disabled);
            --color-border: var(--dt-border);
            --color-border-light: var(--dt-border-light);
            --color-border-dark: var(--dt-border-dark);
            --color-success: var(--dt-success);
            --color-danger: var(--dt-danger);
            --color-warning: var(--dt-warning);
            --color-faiyaz: var(--dt-member-faiyaz);
            --color-trisha: var(--dt-member-trisha);
            --color-arya: var(--dt-member-arya);
            --color-raya: var(--dt-member-raya);
            --shadow-view-btn: var(--dt-shadow-view-btn);
            --shadow-sidebar: var(--dt-shadow-sidebar);
        }

        @custom-variant dark (&:where(.dark, .dark *));
    </style>
    <link rel="stylesheet" href="tokens.css">
    <style>
        /* Minimal mockup-only styles (transitions, positioning) — no colors or spacing here */
    </style>
</head>
<body class="bg-bg text-text-primary font-sans">
    <!-- Theme toggle for testing both themes — toggles .dark class on <html> -->
    <button class="fixed top-2 right-2 z-[9999] px-3 py-1 text-xs bg-bg-hover text-text-primary border border-border rounded-md cursor-pointer hover:bg-border"
            onclick="document.documentElement.classList.toggle('dark')">
        Toggle Theme
    </button>

    <!-- Mockup content here — use Tailwind classes only -->
</body>
</html>
```

### 3. Create shared tokens.css (once)

Location: `mockups/tokens.css`

Copy all `--dt-*` custom properties from `src/index.css` (both `:root` and `[data-theme='dark']` blocks) plus the Tailwind utility mappings that the CDN can't handle. This file is shared across all mockups.

### 4. Use hardcoded mock data

Do NOT connect to any API. Use inline data:
- Family members: Faiyaz, Trisha, Arya, Raya
- Member colors: Faiyaz=#3b82f6, Trisha=#ec4899, Arya=#22c55e, Raya=#f59e0b
- Sample calendar events with times, titles, locations
- Weather data with realistic values
- Sample chores with varied statuses

### 5. Consider both orientations

Dashy runs on a Pi: landscape (1920×1080) or portrait (1080×1920). If orientation-sensitive, use CSS media queries:
```css
@media (orientation: portrait) { /* portrait layout */ }
@media (orientation: landscape) { /* landscape layout */ }
```

### 6. Present for review

Open the mockup in a browser. Wait for explicit approval before moving to the next section.

### 7. After approval — implement in React

Once approved, translate the mockup into React components:
- Component folder: `src/features/<feature>/components/<ComponentName>/`
- Tailwind utility classes (same classes from the mockup)
- Catalyst patterns from `/Users/admin/Downloads/TailwindPLUS/catalyst-ui-kit/typescript/`
- Adapt Catalyst colors using the mapping table above
- SVG icons only, no emojis

## Key Design Constraints

- **Full viewport layout** — fills the visible window on any display, no page-level scrollbars
- **Both themes** — every mockup must look good in light AND dark mode
- **No emojis** — use SVG icons throughout (Lucide icons)
- **Family color coding** — events and indicators use member colors
- **Fluid scaling** — design for 1920px base width, scales via `useUiScale`
- **Tailwind CDN for mockups** — real Tailwind utility classes that transfer to implementation
