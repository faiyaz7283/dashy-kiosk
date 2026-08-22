# Mockup Phase Plan — Dashy UI Redesign

**Created:** August 19, 2026
**Purpose:** Design every Dashy screen as static HTML + Tailwind mockups before writing any React code. Each section is mocked, reviewed, tweaked, and approved independently, then assembled for final sign-off.

---

## How This Works

1. **Each section** below produces one or more HTML mockup files in `mockups/`
2. **You review** each mockup in the browser — real rendered pages, not abstract designs
3. **You give feedback** — "darker sidebar," "bigger cards," "different spacing"
4. **We iterate** until that section is approved
5. **Move to next section** — building on approved decisions from previous sections
6. **Final integration** — all approved sections assembled together for final sign-off
7. **Then we code** — approved mockups translate directly to React + Tailwind + Catalyst

### Key Principle

Mockups use **real Tailwind classes** and **Dashy design tokens** (`--dt-*`). The approved mockup is ~80% of the final implementation — the remaining 20% is wiring React state, data fetching, and Catalyst's behavioral layer (keyboard nav, focus trapping, portals).

### Catalyst Components Reference

Catalyst provides the **design patterns** we adapt. We don't need to install Catalyst to mock — we replicate the visual patterns in plain HTML + Tailwind, then use the actual Catalyst React components during implementation.

**Source:** `/Users/admin/Downloads/TailwindPLUS/catalyst-ui-kit/typescript/`

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
| `stacked-layout.tsx` | Alternative layout reference |

### Design Token Reference

**CSS tokens:** `src/index.css` — 60+ `--dt-*` custom properties (light + dark)
**JS tokens:** `src/theme/tokens.ts` — spacing, layout dimensions, radii, typography, shadows
**Tailwind bridge:** `@theme` block in `src/index.css` maps CSS vars to utility classes

### Color Mapping (Catalyst zinc → Dashy tokens)

When adapting Catalyst patterns, replace the default zinc palette:

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

---

## Section 1: Layout Shell

**Goal:** Establish the overall app structure — the skeleton everything else sits inside.

**Catalyst reference:** `sidebar.tsx`, `sidebar-layout.tsx`, Catalyst demo `application-layout.tsx`

**Mockup files:**
- `mockups/01-layout-shell.html`

**What to mock:**
- Sidebar (expanded ~224px) with nav items, drag handle edge
- Sidebar (collapsed ~64px) showing icons only
- Main content area filling remaining space
- Header bar at top of content area
- Status bar at bottom of content area
- Content area between header and status bar
- Theme toggle button (light ↔ dark) in the mockup for testing both themes

**Design decisions to finalize:**
- Sidebar background color, border style, shadow
- Sidebar nav item styling (active state, hover state, icon + label layout)
- Header height, background, border
- Status bar height, background, content alignment
- Overall page background color
- Gap/border between sidebar and content area

**Review criteria:** ✅ Looks right in both light and dark themes

---

## Section 2: Dashboard Header

**Goal:** Design the top bar content — what sits inside the header from Section 1.

**Catalyst reference:** `navbar.tsx`, `button.tsx`, `badge.tsx`, `avatar.tsx`

**Mockup files:**
- `mockups/02-dashboard-header.html`

**What to mock:**
- Date display (clickable, showing current date)
- Live clock (HH:MM format)
- Weather widget (compact: icon + temperature + condition)
- Family pills (avatar circle + name + event count per member)
- Density badge (event count pill with density coloring)
- Header in compact mode (narrow viewport: smaller text, hidden elements)

**Design decisions to finalize:**
- Spacing between header elements
- Family pill shape (rounded, size, avatar treatment)
- Weather widget layout (icon left/right of temp?)
- Density badge colors and shape
- How elements hide/shrink at narrower widths

**Review criteria:** ✅ All elements legible, balanced spacing, graceful compaction

---

## Section 3: Calendar — Day View

**Goal:** Design the 24-hour timeline view with positioned events.

**Catalyst reference:** `card.tsx` pattern, `divider.tsx`

**Mockup files:**
- `mockups/03-day-view.html`

**What to mock:**
- Left time label column (hour marks: 12 AM, 1 AM, ... 11 PM)
- 24-hour grid with hour lines
- Event blocks positioned by time (colored by family member)
- All-day events section at top
- Current time indicator (red line)
- Empty state (no events)

**Design decisions to finalize:**
- Hour row height
- Time label styling (font size, color, alignment)
- Event block styling (rounded corners, padding, text truncation)
- All-day section height and separator
- Current time indicator style (line + dot?)
- Event overlap handling (side-by-side? stacked?)

**Review criteria:** ✅ Time labels align, events positioned correctly, readable at a glance

---

## Section 4: Calendar — Week View

**Goal:** Design the 8-day grid of day cards.

**Catalyst reference:** `card.tsx` pattern, `divider.tsx`, `badge.tsx`

**Mockup files:**
- `mockups/04-week-view.html`

**What to mock:**
- 8 day cards in a row (4 columns × 2 rows in landscape, 2 × 4 in portrait)
- Each day card: date header, weather icon, density bar, event list
- Today highlighted
- Day card with many events (overflow behavior)
- Day card with no events (empty state)

**Design decisions to finalize:**
- Day card header layout (date + day name + weather)
- Density bar style (height, colors, position)
- Event list within card (compact strips? colored dots?)
- Gap between cards
- Today highlighting method (border? background? accent?)
- Card internal padding and spacing

**Review criteria:** ✅ 8 cards fit comfortably, each card scannable, today stands out

---

## Section 5: Calendar — Month View

**Goal:** Design the traditional month grid with inline event strips.

**Catalyst reference:** `card.tsx` pattern, `badge.tsx`

**Mockup files:**
- `mockups/05-month-view.html`

**What to mock:**
- 7-column grid (Sun–Sat header + 5–6 week rows)
- Day cells with date number
- Inline event strips (colored bars with event title)
- Density sidebar or indicator
- Today highlighted
- Events overflowing the cell (e.g., "+3 more")
- Month/year header with navigation

**Design decisions to finalize:**
- Cell height and aspect ratio
- Event strip height, font size, truncation
- How many events shown before "+N more"
- Density indicator style and position
- Today cell highlighting
- Header row styling (day names)
- Month navigation layout

**Review criteria:** ✅ Full month visible, events readable, today obvious, no scrolling

---

## Section 6: Calendar — Year View

**Goal:** Design the 12 mini-calendar grid.

**Catalyst reference:** `card.tsx` pattern

**Mockup files:**
- `mockups/06-year-view.html`

**What to mock:**
- 12 mini month calendars (4×3 grid in landscape, 3×4 in portrait)
- Each mini month: month name, day grid, density bars
- DayIndicators (2px segmented micro-bars showing event density)
- Today highlighted across all months
- Year header with navigation

**Design decisions to finalize:**
- Mini month size and internal layout
- Day cell size within mini month
- Density bar/indicator style
- Month name header styling
- Grid gap between months
- Today highlighting in mini calendar

**Review criteria:** ✅ 12 months fit on screen, each readable, year-at-a-glance works

---

## Section 7: Calendar — Modals & Popups

**Goal:** Design all calendar interaction overlays.

**Catalyst reference:** `dialog.tsx`, `dropdown.tsx` (popover pattern)

**Mockup files:**
- `mockups/07-calendar-interactions.html`

**What to mock:**
- **EventModal** — full event detail (title, time, location, description, attendees list)
- **EventPopup** — hover preview (compact: title, time, location, density)
- **DatePicker** — month grid popup for jumping to a date
- Each overlay with backdrop/dimming
- Keyboard focus indicators (visual only)

**Design decisions to finalize:**
- Modal size, padding, internal layout
- Modal header (title + close button)
- Attendee list styling (avatar + name per row?)
- Popup size and positioning relative to trigger
- DatePicker day cell styling (selected, today, hover)
- Backdrop opacity and color
- Transition feel (fade? slide? scale?)

**Review criteria:** ✅ Overlays feel polished, backdrop clear, content scannable, close obvious

---

## Section 8: Chores — Board Layout

**Goal:** Design the chores feature top-level layout.

**Catalyst reference:** `sidebar.tsx` (section patterns), `heading.tsx`, `badge.tsx`

**Mockup files:**
- `mockups/08-chores-board.html`

**What to mock:**
- MetricsBar (stats row: active, completed, overdue, unclaimed counts)
- Column layout: MemberColumn(s) + OpenPoolColumn
- Column headers (member avatar + name, or "Open Pool" label)
- Scrollable column body with ChoreCards
- Add chore button (FAB or inline)

**Design decisions to finalize:**
- MetricsBar layout (horizontal row of stat cards? inline badges?)
- Column width (equal? flexible?)
- Column header styling
- Gap between columns
- Add button placement and style
- Empty column state

**Review criteria:** ✅ Board layout clear, columns distinct, metrics visible at a glance

---

## Section 9: Chores — Cards & Modal

**Goal:** Design individual chore cards and the create/edit form.

**Catalyst reference:** `card.tsx` pattern, `badge.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`, `fieldset.tsx`, `button.tsx`

**Mockup files:**
- `mockups/09-chores-cards.html`

**What to mock:**
- **ChoreCard** — name, status badge, category, tags, difficulty, assigned member
- Card states: open, claimed, in-progress, pending signoff, completed, overdue
- **ChoreModal** — full form with all fields:
  - Chore name (text input)
  - Category (select/dropdown)
  - Difficulty (select or slider)
  - Frequency (select: daily, weekly, etc.)
  - Tags (multi-select or chips)
  - Assigned member (select with member colors)
  - Description (textarea)
  - Save / Cancel buttons

**Design decisions to finalize:**
- Card shape, padding, border vs shadow
- Status badge colors and position on card
- Member color integration (left border? background tint?)
- Tag/chip styling
- Difficulty display (stars? dots? label?)
- Modal form layout (single column? two column?)
- Form field styling (labels, spacing, focus states)
- Save/Cancel button placement

**Review criteria:** ✅ Card states visually distinct, form clean and usable, member colors clear

---

## Section 10: Navigation & Status Bar

**Goal:** Design the navigation controls and bottom status bar.

**Catalyst reference:** `button.tsx`, `navbar.tsx`

**Mockup files:**
- `mockups/10-navigation.html`

**What to mock:**
- **ViewSwitcher** — Day/Week/Month/Year segmented toggle (active state)
- **Date navigation arrows** — left/right arrows for date navigation
- **StatusBar** — refresh countdowns, settings icon, theme toggle
- Sidebar nav items with active indicator
- Sidebar refresh and add buttons (collapsed and expanded states)

**Design decisions to finalize:**
- ViewSwitcher shape (segmented control? tabs? pill toggle?)
- Active view indicator style (background? underline? border?)
- Arrow button shape and hover state
- Status bar content layout (left: countdowns, right: settings/theme?)
- Status bar height and visual weight (subtle vs prominent)
- Sidebar active item indicator (Catalyst uses animated bar)

**Review criteria:** ✅ Controls intuitive, active state obvious, status bar unobtrusive

---

## Section 11: Responsive & Kiosk Behaviors

**Goal:** Verify all approved designs work across breakpoints and orientations.

**Mockup files:**
- `mockups/11-responsive-showcase.html`

**What to mock:**
- Full layout at key breakpoints:
  - **< 640px** — weather widget hidden, minimal header
  - **< 800px** — clock hidden
  - **< 1000px** — family pills hidden
  - **< 1300px** — compact labels (D/W/M/Y, "T" for Today)
  - **1920px+** — full layout, all elements visible
- Portrait orientation (1080×1920) — sidebar as overlay, stacked layout
- Landscape orientation (1920×1080) — standard layout
- Kiosk behaviors (visual representation):
  - Auto-hide chrome (header, sidebar, status bar fade when mouse away)
  - Cursor hiding (visual indicator only)

**Design decisions to finalize:**
- Breakpoint behavior for each component
- Portrait layout adjustments
- Auto-hide animation (fade? slide? opacity?)
- Mobile sidebar as dialog overlay (Catalyst pattern)

**Review criteria:** ✅ No broken layouts at any breakpoint, portrait usable, kiosk behaviors clear

---

## Section 12: Final Integration & Approval

**Goal:** Assemble all approved sections into a cohesive whole. Final review before implementation.

**Mockup files:**
- `mockups/12-final-integration.html`

**What to review:**
- **Cross-screen consistency** — do colors, spacing, typography match across all screens?
- **Theme verification** — every screen in both light and dark mode
- **Component reuse** — same Button, Badge, Card patterns used everywhere?
- **Visual hierarchy** — is it clear what's important on each screen?
- **Full flow** — navigate through all features as a user would
- **Edge cases** — empty states, error states, loading states

**Final checklist:**
- [ ] Layout shell matches approved Section 1
- [ ] Header matches approved Section 2
- [ ] All 4 calendar views match approved Sections 3–6
- [ ] Modals/popups match approved Section 7
- [ ] Chores board + cards + modal match approved Sections 8–9
- [ ] Navigation + status bar match approved Section 10
- [ ] Responsive behavior matches approved Section 11
- [ ] Light theme consistent across all screens
- [ ] Dark theme consistent across all screens
- [ ] Family member colors applied correctly everywhere
- [ ] No emojis — SVG icons only
- [ ] Full viewport — no page-level scrollbars

**Sign-off:** Once this section is approved, we move to implementation. The mockups become the design specification.

---

## Mockup File Structure

```
mockups/
├── tokens.css                    # Shared: all --dt-* tokens (light + dark)
├── 01-layout-shell.html
├── 02-dashboard-header.html
├── 03-day-view.html
├── 04-week-view.html
├── 05-month-view.html
├── 06-year-view.html
├── 07-calendar-interactions.html
├── 08-chores-board.html
├── 09-chores-cards.html
├── 10-navigation.html
├── 11-responsive-showcase.html
└── 12-final-integration.html
```

Each mockup:
- Links to `tokens.css` for design tokens
- Uses Tailwind CDN (`<script src="https://cdn.tailwindcss.com"></script>`)
- Includes a theme toggle button (light ↔ dark)
- Uses hardcoded mock data (family: Faiyaz, Trisha, Arya, Raya)
- Renders at 1920×1080 (landscape) by default
- Uses `@theme` values as Tailwind utilities where possible

---

## Mock Data Reference

All mockups use the same realistic data:

**Family members:**
- Faiyaz (blue: `--dt-member-faiyaz`)
- Trisha (pink: `--dt-member-trisha`)
- Arya (green: `--dt-member-arya`)
- Raya (yellow: `--dt-member-raya`)

**Sample events:** 5–8 events per day with varied times, locations, attendees

**Sample chores:** 3–5 per member with varied statuses, difficulties, categories

**Weather:** Realistic values (temperature, condition, humidity, wind)

---

## Workflow Rules

1. **One section at a time** — don't skip ahead
2. **Each section needs explicit approval** before moving to the next
3. **Approved = sticky** — decisions from approved sections carry forward
4. **Mockup ≠ final code** — but it's close. The Tailwind classes, colors, spacing, and layout transfer directly
5. **No React during mockup phase** — pure HTML + Tailwind + CSS
6. **Theme toggle in every mockup** — both light and dark must look good
7. **No emojis** — SVG icons only (use Lucide icon SVGs inline)
8. **Full viewport** — no page-level scrollbars in any mockup
