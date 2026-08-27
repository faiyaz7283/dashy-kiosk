# Chores Frontend Rewire — Implementation Tracker

**Status:** 🟢 Phase 2: Mockups (Complete)
**Created:** 2026-08-26
**Last Updated:** 2026-08-27
**Scope:** dashy-kiosk frontend only (backend timezone fix is separate dashy-api work)

---

## Overview

Rewire the chores frontend to match the redesigned backend architecture:
- **Backend entities:** MasterChore → ChoreAssociation → ChoreInstance
- **New paradigm:** `+` buttons create **associations** (pick from existing masters), not masters
- **Master CRUD:** Separate views for managing templates (Current Chores, Archived Chores)
- **Board:** Driven by associations, not claimed_by/assigned_to fields
- **Header:** Chores-specific header with 3-view toggle (Board, Manage Current, Manage Archived)
- **Bulk actions:** Context-aware per view (Pause/Archive for Current, Restore/Delete for Archived)

**Backend timezone issue (separate scope):** `recurrence_rule.time` and `due_time` are compared against UTC clock but users enter them in local time. Needs backend fix in `dashy-api` (convert local→UTC on input). Not in this plan.

---

## Phase Completion Criteria

**Each phase must pass ALL of the following before moving to the next:**

1. ✅ **Quality Gates** — All five must pass:
   - `/code-review-gate` (manual code review — MUST run before committing)
   - `make lint-kiosk` (oxlint)
   - `make typecheck-kiosk` (tsc --noEmit)
   - `make test-kiosk` (vitest)
   - `make build-kiosk` (vite build)
2. ✅ **Git Commit & Push** — Atomic commit with descriptive message, pushed to `development` branch
3. ✅ **Phase Summary** — Document what was built, tech stack usage, any deviations

**IMPORTANT:** `/code-review-gate` is mandatory before every commit. Do not skip it. This catches issues that automated tools miss (hardcoded values, prop drilling, code duplication, missing shared components).

**Session continuity:** This document tracks progress. When resuming work, read this file to understand current state and next steps.

---

## Phase 1: Foundation (Types + API + Parse Utilities)

**Status:** ✅ Complete
**Goal:** Align data layer with backend — no UI changes yet.

### 1.1 Rewrite `src/types/chores.ts`

**Status:** ✅ Complete

**Update enums/types to match backend:**
- `MasterChoreStatus`: `'active' | 'inactive' | 'archived'` (remove `pending_approval`, add `inactive`)
- `InstanceStatus`: `'active' | 'in_progress' | 'completed' | 'overdue' | 'missed' | 'archived'` (remove `open`, `claimed`, `assigned`, `completed_pending_signoff`, `expiring_soon`)
- Remove `ChoreFrequency` — replaced by `RecurrenceRule` interface

**Add new types:**
```typescript
/** Recurrence pattern configuration. */
export interface RecurrenceRule {
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  time: string  // HH:MM 24-hour format
  day_of_week?: number  // 0=Monday, 6=Sunday
  day_of_month?: number  // 1-31
  week_of_month?: number  // 1-5
  month?: number  // 1-12
}

/** Association between master chore and member/open pool. */
export interface ChoreAssociation {
  id: string
  master_chore_id: string
  member_id: string | null
  is_open_pool: boolean
  created_by: string
  created_at: string
  updated_at: string
  removed_at: string | null
}
```

**Update `MasterChore`:**
- Remove: `frequency: ChoreFrequency`, `approved_by: string | null`
- Add: `recurrence_rule: RecurrenceRule | null`, `end_date: string | null`, `max_occurrences: number | null`, `occurrence_count: number`, `conditions: any | null`, `is_collaborative: boolean`

**Update `ChoreInstance`:**
- Remove: `signoff_by: string | null`, `signed_off_at: string | null`
- Add: `association_id: string | null`

**Update `ChoresData`:**
- Add: `associations: ChoreAssociation[]`

**Update request types:**
- `CreateMasterChoreRequest`: replace `frequency` with `recurrence_rule`, remove `approved_by`, add `end_date`, `max_occurrences`, `conditions`, `is_collaborative`
- `UpdateMasterChoreRequest`: same changes
- Add: `CreateAssociationRequest` — `{ master_chore_id, member_id?, is_open_pool?, created_by }`

### 1.2 Rewrite `src/features/chores/api/choresApi.ts`

**Status:** ✅ Complete

**Changes:**
- Update `fetchChores()` return type to include `associations`
- Add `createAssociation(data: CreateAssociationRequest): Promise<ChoreAssociation>`
- Add `deleteAssociation(associationId: string): Promise<void>`
- Add `bulkUpdateMasterStatus(masterIds: string[], status: string): Promise<{updated_count: number}>`
- Remove `approveMasterChore()` — endpoint doesn't exist
- Remove `signoffInstance()` — endpoint doesn't exist
- Update `updateInstanceStatus()` — remove `isAdult` parameter
- Update `createMasterChore()` / `updateMasterChore()` — use `recurrence_rule` instead of `frequency`

### 1.3 Rewrite `src/features/chores/hooks/useChoreActions.ts`

**Status:** ✅ Complete

**Changes:**
- Remove: `approveMaster`, `signoffInstance`
- Add: `createAssociation`, `deleteAssociation`, `bulkUpdateMasterStatus`
- Update: `updateInstanceStatus` signature (remove `isAdult` param)

### 1.4 Add chores parse utilities

**Status:** ✅ Complete

**Note:** Reused existing `formatUtcTimeOfDay()` from `src/shared/date/timezone.ts` instead of creating a duplicate. Added to barrel export in `src/shared/date/index.ts`.

**New file:** `src/shared/date/chores.ts`

```typescript
/**
 * Format recurrence rule time (UTC) to configured timezone.
 * 
 * @param utcTime - HH:MM in UTC (e.g., "14:00")
 * @param timezone - IANA timezone (e.g., "America/New_York")
 * @returns Formatted time in local timezone (e.g., "10:00 AM")
 */
export function formatRecurrenceTime(utcTime: string, timezone: string): string
```

Reuse existing `convertUtcToTimezone()` from `src/shared/date/timezone.ts`.

### 1.5 Update `src/shared/utils/chores.ts`

**Status:** ✅ Complete

**Update for new enums:**
- `getStatusColor()` — update Record keys for new InstanceStatus values
- `getStatusLabel()` — update labels (e.g., "active" → "Active", "missed" → "Missed")
- `isOpenPoolInstance()` — logic stays the same (claimed_by === null && assigned_to === null)

**Add helpers:**
```typescript
/** Filter associations by member ID. */
export function getMemberAssociations(associations: ChoreAssociation[], memberId: string): ChoreAssociation[]

/** Filter for open pool associations. */
export function getOpenPoolAssociations(associations: ChoreAssociation[]): ChoreAssociation[]

/** Human-readable recurrence summary (e.g., "Weekly on Monday at 8:00 AM"). */
export function formatRecurrence(rule: RecurrenceRule | null, timezone?: string): string
```

### 1.6 Update existing tests

**Status:** ✅ Complete

- `src/features/chores/hooks/useChoresData.test.ts` — update mock data for new types
- `src/features/chores/components/ChoreCard.test.tsx` — update for new status values
- `src/features/chores/views/ChoresBoard.test.tsx` — update for associations in data
- `src/shared/utils/chores.test.ts` — update for new enum values, add tests for new helpers

### 1.7 Verification

**Status:** ✅ Complete

- [x] `make lint-kiosk` passes
- [x] `make typecheck-kiosk` passes
- [x] `make test-kiosk` passes (253/253)
- [x] `make build-kiosk` passes
- [x] Code review completed (no hardcoded values, proper tokenization, no duplication)
- [x] Git commit: `feat(chores): align types and API layer with backend redesign` (95db67c)
- [x] Git push to `development`

**Phase 1 completion summary:**

**What was built:**
- Rewrote `src/types/chores.ts` — new enums (`MasterChoreStatus`, `InstanceStatus`), `RecurrenceRule` interface, `ChoreAssociation` type, updated `MasterChore`/`ChoreInstance`/`ChoresData`/request types to match backend
- Rewrote `src/features/chores/api/choresApi.ts` — added `createAssociation`, `deleteAssociation`, `bulkUpdateMasterStatus`; removed `approveMasterChore`, `signoffInstance`; updated `updateInstanceStatus` (removed `isAdult` param)
- Rewrote `src/features/chores/hooks/useChoreActions.ts` — aligned with new API functions
- Updated `src/shared/utils/chores.ts` — new status color/label maps, added `getMemberAssociations`, `getOpenPoolAssociations`, `formatRecurrence` helpers
- Exported `formatUtcTimeOfDay` from `src/shared/date/index.ts` barrel (reused instead of duplicating)
- Updated CSS tokens (`src/index.css`) — replaced old chores status variables with new ones (active, in_progress, completed, overdue, missed, archived)
- Updated `src/theme/tokens.ts` — aligned chores color tokens with new CSS variables
- Updated `src/types/index.ts` barrel — removed `ChoreFrequency`, added `RecurrenceRule`, `ChoreAssociation`, `CreateAssociationRequest`
- Updated components with minimal changes to keep typecheck passing: `ChoreCard.tsx`, `ChoresBoard.tsx`, `ChoreEditModal.tsx`, `ChoreCreateModal.tsx`
- Updated all test files with new mock data and assertions

**Tech stack usage:**
- TypeScript: strict typing for all new types and interfaces
- Tailwind CSS: updated color tokens for new status values
- Temporal API: reused `formatUtcTimeOfDay` for recurrence time formatting
- vitest: 253 tests passing (39 in chores.test.ts alone)

**Deviations from plan:**
- Did not create `src/shared/date/chores.ts` — reused existing `formatUtcTimeOfDay()` to avoid duplication (DRY principle)
- Made minimal component updates (ChoreCard, ChoresBoard, ChoreEditModal, ChoreCreateModal) to keep typecheck passing — full UI rewire is Phase 3
- `bulkUpdateMasterStatus` uses query parameters (not JSON body) to match backend endpoint design

---

## Phase 2: Mockups (Design Approval Required)

**Status:** ✅ Complete (7/7 approved)
**Goal:** Design all new/changed UI as HTML mockups. **No implementation until approved.**

### Approved Mockups

| # | Mockup | File | Status | Notes |
|---|--------|------|--------|-------|
| 1 | Chores Board | `mockups/chores-board.html` | ✅ Approved | 3-column equal grid, hybrid metric cards (icon + shorthand), member color pills for headers |
| 2 | Association Picker Modal | `mockups/association-picker-modal.html` | ✅ Approved | 3-column header grid for true centering, no footer, scrollable list with section headers |
| 3 | Current Chores | `mockups/current-chores.html` | ✅ Approved | Active + Inactive cards only, labeled rows (Category, Tags, Frequency, Collab, Conditions) |
| 4 | Archived Chores | `mockups/archived-chores.html` | ✅ Approved | Archived cards only, same style as current (no grey/strikethrough), Restore + Delete actions |
| 5 | Header (Chores) | `mockups/header-chores.html` | ✅ Approved | 3-view toggle (Board/Manage Current/Manage Archived), context-aware bulk actions, no family pills |
| 6 | Master Chore Modal | `mockups/master-chore-modal.html` | ✅ Approved | Conditional recurrence fields, Due Date added, start_date deferred to future feature |

### Pending Review

_All mockups approved. No pending items._

### Design Decisions (Phase 2)

**Header Architecture:**
- Chores feature has its own header (`header-chores.html`), separate from calendar (`header-calendar.html`)
- No family pills in chores header — board columns show per-member metrics
- 3-view toggle: `Board | Manage Current | Manage Archived`
- Context-aware bulk actions per view (see table below)
- `Create Master` button always visible (primary action)

**View-Specific Button Visibility:**

| View | Select All | Bulk Actions | Create Master |
|------|-----------|--------------|---------------|
| Board | ❌ | ❌ | ✅ |
| Manage Current | ✅ | Pause Selected, Archive Selected | ✅ |
| Manage Archived | ✅ | Restore Selected, Delete Permanently | ✅ |

**Management View Split:**
- `current-chores.html` — Active + Inactive (paused) master chores only
- `archived-chores.html` — Archived master chores only
- Both are standalone views accessed via sidebar or header toggle
- No inline collapsible panel (original design changed)

**Card Design:**
- Labeled rows with fixed-width labels (`w-16 shrink-0`): Category, Tags, Frequency, Collab, Conditions
- Est. minutes + Difficulty dots on same row (space-between)
- Archived cards: same style as current (no opacity/strikethrough — separate view provides context)
- "Create Master" button in header, not in grid

**Metric Cards (Board):**
- Hybrid approach: Lucide icon + shorthand text label (Asn, Clm, Prog, Done, Over)
- `text-[8px]` labels, `text-sm` values, `text-center`, `leading-none` for compact uniform sizing
- Colors: Asn/Clm = muted, Prog = amber, Done = green, Over = red

**Modal Header Centering:**
- 3-column equal grid (`grid-cols-3`) for true centering
- Left: avatar circle or empty, Center: title text, Right: close button
- `whitespace-nowrap` on title to prevent wrapping

### 2.1 Mockup: Updated Chore Board

**Status:** ✅ Approved

**File:** `mockups/chores-board.html`

**Final design:**
- 3-column equal grid (`grid-cols-3`, `flex-1 min-w-0`) for member columns + open pool
- Column headers: member name as colored pill (`bg-{member} text-white border border-{member}/50`), `+` button as colored pill circle
- Open Pool uses gray pills
- Metric cards: 5-column grid of small cards, hybrid icon + shorthand labels
- Chore cards: `border-l-4 border-l-{member}`, status icon badge, category tag, frequency tag, difficulty dots, est. time, assignment text, action button (Start/Complete)
- No management bar or inline panel (moved to separate views)

### 2.2 Mockup: Association Picker Modal

**Status:** ✅ Approved

**File:** `mockups/association-picker-modal.html`

**Final design:**
- Centered modal with dark backdrop (`fixed inset-0 z-50 bg-black/50`)
- Header: 3-column equal grid — left: avatar circle, center: "Assign Chores to {Name}" plain text, right: close X button
- Toolbar: search input (flex-1) + count ("N available") + 3-button group toggle (All | Recurring | One-off) + sort dropdown
- No footer — modal closes via X button only
- Scrollable list with section headers ("RECURRING" / "ONE-OFF" uppercase tracking-wide)
- Each row: name + category tag + recurrence summary + difficulty dots + "Assign" button

### 2.3 Mockup: Current Chores (was Master Management)

**Status:** ✅ Approved

**File:** `mockups/current-chores.html` (renamed from `master-management.html`)

**Final design:**
- Standalone view (accessed via sidebar or header toggle)
- Shows only Active and Inactive (paused) master chores
- Grid of cards with labeled rows: Category, Tags, Frequency, Collab, Conditions
- Est. minutes + Difficulty on same row
- Card actions: Edit, Pause/Resume, Archive
- No header bar inside content area (app shell header provides controls)

### 2.4 Mockup: Archived Chores

**Status:** ✅ Approved

**File:** `mockups/archived-chores.html` (new)

**Final design:**
- Standalone view (accessed via sidebar or header toggle)
- Shows only Archived master chores
- Same card style as current-chores (no grey/strikethrough — separate view provides context)
- Card actions: Edit, Restore (no Archive button)

### 2.5 Mockup: Header (Chores)

**Status:** ✅ Approved

**File:** `mockups/header-chores.html` (new)

**Final design:**
- LEFT: Date + Clock + Weather (same as calendar header)
- CENTER: Empty (no family pills — board columns show per-member metrics)
- RIGHT: View Toggle (Board | Manage Current | Manage Archived) + Select All + Bulk Actions + Create Master
- Bulk actions context-aware per view (see table above)

### 2.6 Mockup: Master Create/Edit Modal

**Status:** ✅ Approved

**File:** `mockups/master-chore-modal.html`

**Design:**
- Modal title: "New Chore Template" or "Edit Chore Template"
- Fields:
  - Name (text input)
  - Category (combobox with create)
  - Tags (tag input with create)
  - Difficulty (slider 1-5)
  - Recurrence pattern:
    - Frequency dropdown: Once / Daily / Weekly / Monthly / Yearly
    - Conditional fields based on frequency:
      - Weekly: day of week picker
      - Monthly: day of month OR nth weekday
      - Yearly: month + day
    - Time (HH:MM input — displayed in configured timezone)
  - Est. minutes (number input)
  - Due time (HH:MM — optional deadline)
  - When overdue: dropdown (Disappear / Carry Over / Stay Visible / Convert to Open)
  - End date (date picker — optional)
  - Max occurrences (number — optional)
  - Collaborative toggle (allows multiple members to have instances simultaneously)
  - Conditions section: **deferred** — show "Coming soon" or omit for now
- Footer: Cancel / Save (Create)

### 2.7 Mockup: Instance Interaction

**Status:** ✅ Approved

**File:** `mockups/instance-interaction.html`

**Design:**
- Compact modal/popup showing:
  - Chore name + category tag
  - Recurrence summary (e.g., "Weekly on Monday at 8:00 AM")
  - Period: "Aug 25 – Aug 31"
  - Current status badge
  - Assigned to: member avatar + name (or "Open Pool")
  - Action button: "Start" (if active) / "Complete" (if in_progress)
  - Link: "View Template" → navigates to Master Management with that master highlighted
  - For open pool instances: "Claim" button (moves to member's column)

### 2.8 User Review & Iteration

**Status:** ✅ Complete (7/7 approved)

- [x] User reviews all mockups in browser
- [x] Iterate until all designs are approved (7/7 complete)
- [x] Mockup #1: Chores Board — approved
- [x] Mockup #2: Association Picker Modal — approved
- [x] Mockup #3: Current Chores — approved
- [x] Mockup #4: Archived Chores — approved
- [x] Mockup #5: Header (Chores) — approved
- [x] Mockup #6: Master Chore Modal — approved
- [x] Mockup #7: Instance Interaction — approved
- [x] Document approval date and any design decisions

**Phase 2 completion summary:**

**What was built:**
- 7 HTML mockups covering all new/changed UI for the chores frontend rewire
- All 7 approved for implementation

**Mockup files:**
| File | Purpose | Status |
|------|---------|--------|
| `mockups/chores-board.html` | Board view with 3-column grid, per-column metrics, member pills | ✅ Approved |
| `mockups/association-picker-modal.html` | Modal for assigning masters to members/pool | ✅ Approved |
| `mockups/current-chores.html` | Active + Inactive master chores management | ✅ Approved |
| `mockups/archived-chores.html` | Archived master chores management | ✅ Approved |
| `mockups/header-chores.html` | Chores-specific header with view toggle and bulk actions | ✅ Approved |
| `mockups/master-chore-modal.html` | Create/Edit master chore template form | ✅ Approved |
| `mockups/instance-interaction.html` | Instance popup with 5 state variants | ✅ Approved |
| `mockups/header-calendar.html` | Calendar-specific header (renamed from header.html) | ✅ Approved |

**Key design decisions:**
- Management view split into 2 standalone views (Current + Archived)
- Header: chores-specific with 3-view toggle (Board | Manage Current | Manage Archived)
- Bulk actions context-aware per view
- No family pills in chores header (board columns show per-member metrics)
- Per-column metrics: 5 compact cards (Asn, Clm, Prog, Done, Over) with Lucide icons
- Archived cards: same style as current (no grey/strikethrough)
- "Create Master" button in header, not in grid
- Instance interaction: 5 state variants (Active, In Progress, Overdue, Missed, Open Pool)

---

## Phase 3: Implementation

**Status:** 🟡 In Progress
**Goal:** Build from approved mockups. Each sub-phase verified independently.

### 3.1 Chores Board (`mockups/chores-board.html`)

**Status:** ✅ Complete
**Mockup:** `mockups/chores-board.html` (v4 approved)

**Scope:**
- Rewrite `ChoresBoard.tsx` — 3-column equal grid (`flex-1 min-w-0`), per-column metric cards (Asn/Clm/Prog/Done/Over), member name as colored pill header
- Rewrite `ChoreCard.tsx` — compact styling, action buttons (Start/Complete), status icon badge
- Update `src/shared/utils/chores.ts` — add `getColumnMetrics()` helper for per-column metric calculation
- Open Pool column: gray pills, 2-column metrics (Unclaimed/Overdue)
- Remove top metrics row (metrics now per-column)
- Update tests

**Files:**
- `src/features/chores/views/ChoresBoard.tsx` — rewrite
- `src/features/chores/components/ChoreCard.tsx` — rewrite
- `src/shared/utils/chores.ts` — add helper
- `src/features/chores/views/ChoresBoard.test.tsx` — update
- `src/features/chores/components/ChoreCard.test.tsx` — update

**Verification:**
- [x] `/code-review-gate` passed
- [x] `make lint-kiosk` passes
- [x] `make typecheck-kiosk` passes
- [x] `make test-kiosk` passes (264/264)
- [x] `make build-kiosk` passes
- [x] Git commit: `feat(chores): Phase 3.1 — rewrite board and card for association-driven layout` (83710c9)
- [x] Git push to `development`

**Phase 3.1 completion summary:**

**What was built:**
- Rewrote `ChoresBoard.tsx` — equal-width columns (`flex-1 min-w-0`), per-column metric cards (Asn/Clm/Prog/Done/Over), member name as colored pill, + button as colored pill circle, Open Pool uses gray pills
- Rewrote `ChoreCard.tsx` — compact styling (`text-xs` title, `text-[9px]` metadata, `w-1 h-1` dots), action buttons (Start/Complete), status icon badge, due time formatted via `formatUtcTimeOfDay`
- Added `getColumnMetrics()` helper to `src/shared/utils/chores.ts` for per-column metric calculation
- Added `paletteBorderOpacityClasses` map to `memberColors.ts` for `/50` opacity borders
- Updated tests: ChoresBoard (6 tests), ChoreCard (15 tests), chores utils (46 tests including 7 new `getColumnMetrics` tests)

**Tech stack usage:**
- TypeScript: strict typing for `ColumnMetrics` interface, component props
- Tailwind CSS: utility classes, dark mode (`dark:` variants), design tokens (`bg-chores-active`, `text-text-muted`)
- lucide-react: `User`, `Hand`, `Play`, `CheckCircle`, `AlertTriangle`, `Plus`, `Clock`, `Archive`
- React: `useMemo` for color map and data destructuring
- Shared hooks: `useConfig` for timezone
- Shared utils: `getColumnMetrics`, `getStatusLabel`, `isOpenPoolInstance`, `getMemberInstances`, palette utilities
- vitest: 264 tests passing (11 new/updated)

**Deviations:**
- None

**Code review signals:**
- ✅ No hardcoded values — all colors use design tokens
- ✅ No duplication — `getStatusLabel` imported from shared utils (removed local duplicate)
- ✅ No prop drilling — max 2 levels (Board → Column, Board → ChoreCard)
- ✅ Shared components/hooks used — `ContentCard`, `useConfig`, palette utilities
- ✅ Tailwind only — no inline styles or const styles objects

---

### 3.2 Association Picker Modal (`mockups/association-picker-modal.html`)

**Status:** ✅ Complete
**Mockup:** `mockups/association-picker-modal.html` (approved)

**Scope:**
- New `AssociationPickerModal.tsx` — 3-column header grid, search + filter toolbar, scrollable list with section headers
- Uses `createAssociation()` API
- Filters available masters (not yet associated to target member/pool)
- Opens from column `+` button (member or open pool)
- Extracted shared `DifficultyDots` component (used in ChoreCard, AssociationPickerModal, will be used in MasterChoreCard)
- Update tests

**Files:**
- `src/features/chores/components/AssociationPickerModal.tsx` — new
- `src/features/chores/components/AssociationPickerModal.test.tsx` — new
- `src/features/chores/components/DifficultyDots.tsx` — new (shared component)
- `src/features/chores/components/DifficultyDots.test.tsx` — new
- `src/features/chores/components/ChoreCard.tsx` — refactored to use DifficultyDots
- `src/features/chores/views/ChoresBoard.tsx` — wire `+` button to open modal

**Verification:**
- [x] `/code-review-gate` passed (extracted DifficultyDots to avoid duplication)
- [x] `make lint-kiosk` passed
- [x] `make typecheck-kiosk` passed
- [x] `make test-kiosk` passed (283/283)
- [x] `make build-kiosk` passed
- [x] Git commit: `feat(chores): Phase 3.2 — add association picker modal` (72476b3)
- [x] Git push to `development`

**Phase 3.2 completion summary:**

**What was built:**
- Association picker modal with 3-column header (avatar, title, close button)
- Search + filter toolbar (All/Recurring/One-off group toggle, sort dropdown)
- Scrollable list with section headers (Recurring, One-off)
- Filters available masters (excludes already-associated to target member/pool)
- Wired column `+` buttons to open modal (member or open pool)
- Extracted shared `DifficultyDots` component (sm/md size variants)
- 19 new tests (13 for modal, 6 for DifficultyDots)

**Tech stack usage:**
- React hooks: useState, useMemo, useRef, useEffect
- Tailwind: design tokens, dark mode, responsive layout
- Shared utilities: formatRecurrence, formatDifficulty, findFirstAdult, palette utilities
- API: createAssociation via useChoreActions hook

**Code review findings addressed:**
- Extracted DifficultyDots component (was duplicated in ChoreCard + AssociationPickerModal, will be used in MasterChoreCard)
- Fixed test assertions (count mismatch, multiple element matches)
- Fixed type imports (FamilyMember from @/types/family, not @/types/chores)
- Used findFirstAdult utility instead of non-existent is_adult property

---

### 3.3 Current Chores View (`mockups/current-chores.html`)

**Status:** ✅ Complete
**Mockup:** `mockups/current-chores.html` (approved)

**Scope:**
- New `CurrentChores.tsx` view — shows Active + Inactive master chores
- Card design: labeled rows (Category, Tags, Frequency, Collab, Conditions), Est. minutes + Difficulty
- Card actions: Edit, Pause/Resume, Archive
- No header bar inside content (app shell header provides controls)
- Update tests

**Files:**
- `src/features/chores/views/CurrentChores.tsx` — new
- `src/features/chores/views/CurrentChores.test.tsx` — new
- `src/features/chores/components/MasterChoreCard.tsx` — new (shared card for current/archived)
- `src/features/chores/components/MasterChoreCard.test.tsx` — new

**Verification:**
- [x] `/code-review-gate` passed
- [x] `make lint-kiosk` passed
- [x] `make typecheck-kiosk` passed
- [x] `make test-kiosk` passed (312/312)
- [x] `make build-kiosk` passed
- [x] Git commit: `feat(chores): Phase 3.3 — add current chores management view` (d409898)
- [x] Git push to `development`

**Phase 3.3 completion summary:**

**What was built:**
- MasterChoreCard component with checkbox, status badge, labeled rows, difficulty dots, stats, action buttons
- CurrentChores view with responsive grid (1/2/3 columns), filters to active+inactive only
- Support for both "current" and "archived" action variants (Pause/Resume vs Restore)
- 29 new tests (21 for MasterChoreCard, 8 for CurrentChores)

**Tech stack usage:**
- React hooks: useMemo, useState
- Tailwind: design tokens, dark mode, responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Shared utilities: formatRecurrence, formatDifficulty, DifficultyDots component
- Type-safe action variants for different view modes

**Code review findings addressed:**
- Extracted MasterChoreCard as shared component (reused in Phase 3.4 Archived Chores)
- Used static class maps for status badges (no dynamic Tailwind classes)
- Proper type handling for optional callbacks (onArchive, onRestore)

---

### 3.4 Archived Chores View (`mockups/archived-chores.html`)

**Status:** ✅ Complete
**Mockup:** `mockups/archived-chores.html` (approved)

**Scope:**
- New `ArchivedChores.tsx` view — shows Archived master chores only
- Same card style as CurrentChores (reuse `MasterChoreCard`)
- Card actions: Edit, Restore (no Archive button)
- Update tests

**Files:**
- `src/features/chores/views/ArchivedChores.tsx` — new
- `src/features/chores/views/ArchivedChores.test.tsx` — new
- `src/features/chores/components/MasterChoreCard.tsx` — made `onToggleStatus` optional

**Verification:**
- [x] `/code-review-gate` passed (MUST run before commit)
- [x] `make lint-kiosk` passed
- [x] `make typecheck-kiosk` passed
- [x] `make test-kiosk` passed (320 tests, 35 files)
- [x] `make build-kiosk` passed
- [x] Git commit: `feat(chores): add archived chores view` (`9e1314b`)
- [x] Git push to `development`

**Summary:**
- `ArchivedChores` view filters to `status === 'archived'` masters, reuses `MasterChoreCard` with `actionVariant="archived"` (Edit + Restore buttons)
- Made `onToggleStatus` optional in `MasterChoreCard` — only needed for "current" variant, eliminated noop pattern
- 8 new tests covering: loading/error/null states, archived-only filtering, active/inactive exclusion, empty state
- Code review: no violations found. Structural duplication with CurrentChores is acceptable (2 views, YAGNI)

---

### 3.5 Master Chore Modal (`mockups/master-chore-modal.html`)

**Status:** ✅ Complete
**Mockup:** `mockups/master-chore-modal.html` (approved)

**Scope:**
- New `MasterChoreModal.tsx` — create/edit master chore template
- Conditional recurrence fields based on frequency (Weekly: day-of-week, Monthly: day-of-month OR nth weekday, Yearly: month + day)
- Uses `createMasterChore()` / `updateMasterChore()` API
- Fields: Name, Category (combobox), Tags, Difficulty, Recurrence, Est. minutes, Due time, Expiration behavior, End date, Max occurrences, Collaborative toggle
- Conditions section: deferred (show "Coming soon" or omit)
- Update tests

**Files:**
- `src/features/chores/components/MasterChoreModal.tsx` — new
- `src/features/chores/components/MasterChoreModal.test.tsx` — new

**Verification:**
- [x] `/code-review-gate` passed (MUST run before commit)
- [x] `make lint-kiosk` passed
- [x] `make typecheck-kiosk` passed
- [x] `make test-kiosk` passed (345 tests, 36 files)
- [x] `make build-kiosk` passed
- [x] Git commit: `feat(chores): add master chore create/edit modal` (`27c4239`)
- [x] Git push to `development`

**Summary:**
- `MasterChoreModal` supports create/edit modes with full form: Name, Category (Combobox), Tags (TagInput), Difficulty (slider + dots), Recurrence Pattern (conditional fields per frequency), Est. minutes, Due time/date, Expiration behavior, End date, Max occurrences, Collaborative toggle
- Conditional recurrence: Weekly → day-of-week buttons, Monthly → day-of-month + nth weekday, Yearly → month + day
- Uses existing shared components: Combobox, TagInput, DifficultyDots
- ToggleSwitch built as internal component (boolean toggle for collaborative)
- `buildRecurrenceRule()` helper constructs RecurrenceRule from form state
- `formFromMaster()` helper populates form from existing master (edit mode)
- Conditions section shows "Coming soon" (deferred)
- 25 new tests covering: create/edit titles, form fields, conditional recurrence, edit mode pre-population
- Code review: no violations. Unused DifficultySlider import removed. Test type widened for mode override.

---

### 3.6 Instance Interaction (`mockups/instance-interaction.html`)

**Status:** ✅ Complete
**Mockup:** `mockups/instance-interaction.html` (approved)

**Scope:**
- New `InstanceInteraction.tsx` — popup/modal for instance details
- 5 state variants: Active, In Progress, Overdue, Missed, Open Pool
- Status transitions: active→in_progress→completed via `updateInstanceStatus()`
- Open pool: "Claim" button via `claimInstance()`
- "View Template" link → navigates to Current Chores with master highlighted
- Period display: single date (e.g., "Monday, Aug 25")
- Update tests

**Files:**
- `src/features/chores/components/InstanceInteraction.tsx` — new
- `src/features/chores/components/InstanceInteraction.test.tsx` — new
- `src/features/chores/views/ChoresBoard.tsx` — wire card click to open popup

**Verification:**
- [x] `/code-review-gate` passed (MUST run before commit)
- [x] `make lint-kiosk` passed
- [x] `make typecheck-kiosk` passed
- [x] `make test-kiosk` passed (371 tests, 37 files)
- [x] `make build-kiosk` passed
- [ ] Git commit: `feat(chores): add instance interaction popup`
- [ ] Git push to `development`

**Summary:**
- `InstanceInteraction` popup shows instance details with status-specific actions: Active→Start, In Progress→Complete, Overdue→Complete Now, Missed→disabled, Open Pool→Claim
- Status badge with colored dot + label (static class maps)
- Details: recurrence, period date (weekday + month + day), due time (color-coded for overdue/missed), assignment info (member avatar + name + context), est. time, started time (in_progress only)
- "View Template" link (callback prop — navigation wired in Phase 3.7)
- Close button (top-right corner) + overlay click to close
- Missed instances render with `opacity-75`
- ChoresBoard: card clicks now open InstanceInteraction popup internally (removed onChoreClick/onAddChore props — association picker still uses internal state)
- ChoresView/AppShell: removed unused onChoreClick/onAddChore prop chain
- 26 new tests covering all 5 status variants, open pool, assignment display, conditional rendering
- Code review: no violations. Unused formatUtcDate import removed. Test colorMap typed as PaletteKey.

---

### 3.7 Header + Shell Wiring (`mockups/header-chores.html`)

**Status:** ⬜ Not Started
**Mockup:** `mockups/header-chores.html` (approved)

**Scope:**
- New `HeaderChores.tsx` — chores-specific header component
  - LEFT: Date + Clock + Weather (same as calendar header)
  - CENTER: Empty (no family pills)
  - RIGHT: View Toggle (Board | Manage Current | Manage Archived) + Select All + Bulk Actions + Create Master
  - Context-aware bulk actions per view:
    - Board: Create Master only
    - Manage Current: Select All, Pause Selected, Archive Selected, Create Master
    - Manage Archived: Select All, Restore Selected, Delete Permanently, Create Master
- Selection state — shared between header and views (context or lifted to ChoresView)
- Update `AppShell.tsx` — add chores view state (board/current/archived), route to correct view + header
- Update `Sidebar.tsx` — change `+` behavior for chores to open Current Chores view
- Update `Header.tsx` — conditionally render `HeaderChores` when active feature is chores
- Rewrite `ChoresView.tsx` — compose new views based on active view state, manage selection
- Update tests

**Files:**
- `src/features/shell/HeaderChores.tsx` — new
- `src/features/shell/HeaderChores.test.tsx` — new
- `src/features/shell/AppShell.tsx` — update
- `src/features/shell/Sidebar.tsx` — update
- `src/features/shell/Header.tsx` — update
- `src/features/chores/views/ChoresView.tsx` — rewrite
- `src/features/chores/views/ChoresView.test.tsx` — update

**Verification:**
- [ ] `/code-review-gate` passed (MUST run before commit)
- [ ] `make lint-kiosk` passed
- [ ] `make typecheck-kiosk` passed
- [ ] `make test-kiosk` passed
- [ ] `make build-kiosk` passed
- [ ] Git commit: `feat(chores): add chores header and wire shell navigation`
- [ ] Git push to `development`

---

### 3.8 Cleanup

**Status:** ⬜ Not Started
**Mockup:** N/A (cleanup work)

**Scope:**
- Delete `ChoreCreateModal.tsx` (replaced by `AssociationPickerModal`)
- Delete `ChoreEditModal.tsx` (replaced by `InstanceInteraction`)
- Delete old test files for removed components
- Remove unused imports and types
- Final code quality audit (hardcoded values, duplication, tokenization)
- Update tests

**Files:**
- `src/features/chores/components/ChoreCreateModal.tsx` — delete
- `src/features/chores/components/ChoreEditModal.tsx` — delete
- `src/features/chores/components/ChoreCreateModal.test.tsx` — delete (if exists)
- `src/features/chores/components/ChoreEditModal.test.tsx` — delete (if exists)

**Verification:**
- [ ] `/code-review-gate` passed (MUST run before commit)
- [ ] `make lint-kiosk` passed
- [ ] `make typecheck-kiosk` passed
- [ ] `make test-kiosk` passed
- [ ] `make build-kiosk` passed
- [ ] Git commit: `refactor(chores): remove deprecated modals and clean up`
- [ ] Git push to `development`

---

**Phase 3 completion summary:** _[To be filled after completion]_

---

## Phase 4: Final Quality Gates & Verification

**Status:** ⬜ Not Started
**Goal:** End-to-end verification with real data.

### 4.1 Quality Gates

**Status:** ⬜ Not Started

- [ ] `make lint-kiosk` — oxlint passes
- [ ] `make typecheck-kiosk` — tsc --noEmit passes
- [ ] `make test-kiosk` — vitest passes (all existing + new tests)
- [ ] `make build-kiosk` — production build succeeds

### 4.2 Manual Verification

**Status:** ⬜ Not Started

- [ ] Start dev environment: `make dev-up`
- [ ] Verify `CHORES_USE_MOCK=false` in `env/.env.dev`
- [ ] Test full flow:
  1. Open chores board — should show columns for each member + open pool
  2. Click `+` on member column — association picker opens
  3. Select a master chore — creates association, instance appears in column
  4. Click instance card — instance interaction modal opens
  5. Click "Start" — status changes to in_progress
  6. Click "Complete" — status changes to completed, next instance auto-generated
  7. Click "Manage Current" in header — current chores view opens
  8. Click "Create Master" — master create modal opens
  9. Fill form and save — new master appears in current chores view
  10. Edit master — changes persist
  11. Pause master — status changes to inactive
  12. Click "Manage Archived" in header — archived chores view opens
  13. Select archived master — Restore button restores to current
  14. Return to board — paused master's instances no longer generate

### 4.3 Code Quality Audit

**Status:** ⬜ Not Started

Before declaring done, audit for:
- [ ] No hardcoded pixel/color values — all use tokens
- [ ] No code duplication — shared components/hooks used
- [ ] No prop drilling — Context API used if 3+ levels
- [ ] Proper tokenization — shell dimensions, layout values reference CSS custom properties
- [ ] No inline styles with `var(--dt-*)` — all Tailwind
- [ ] All public functions/components have JSDoc
- [ ] All new components have tests

### 4.4 Final Commit

**Status:** ⬜ Not Started

- [ ] Git commit: `feat(chores): complete frontend rewire for association-based architecture`
- [ ] Git push to `development`
- [ ] Update this document status to ✅ COMPLETE

**Phase 4 completion summary:** _[To be filled after completion]_

---

## Out of Scope (Separate Plans)

- **Backend timezone fix** — `recurrence_rule.time` and `due_time` need local→UTC conversion on input. Separate `dashy-api` work. Track in `dashy-api/docs/plans/` or create new plan.
- **Conditional chores UI** — backend supports it, but frontend UI for condition config is deferred.
- **Bulk association** — assign master to multiple members at once. Future feature.
- **SSE / real-time updates** — polling sufficient for v1.

---

## Files Changed (Summary)

| File | Action | Phase |
|------|--------|-------|
| `src/types/chores.ts` | Rewrite | 1 |
| `src/features/chores/api/choresApi.ts` | Rewrite | 1 |
| `src/features/chores/hooks/useChoreActions.ts` | Rewrite | 1 |
| `src/features/chores/hooks/useChoresData.ts` | Minor update | 1 |
| `src/shared/utils/chores.ts` | Update + add helpers | 1, 3.1 |
| `src/shared/date/index.ts` | Add export | 1 |
| `src/index.css` | Update chores tokens | 1 |
| `src/theme/tokens.ts` | Update chores tokens | 1 |
| All `*.test.*` files | Update | 1, 3 |
| **Mockups (Phase 2)** | | |
| `mockups/chores-board.html` | Update (approved) | 2 |
| `mockups/association-picker-modal.html` | New (approved) | 2 |
| `mockups/current-chores.html` | New (approved) | 2 |
| `mockups/archived-chores.html` | New (approved) | 2 |
| `mockups/header-chores.html` | New (approved) | 2 |
| `mockups/header-calendar.html` | Renamed from header.html | 2 |
| `mockups/master-chore-modal.html` | New (approved) | 2 |
| `mockups/instance-interaction.html` | New (approved) | 2 |
| **Phase 3.1 — Board + Card** | | |
| `src/features/chores/views/ChoresBoard.tsx` | Rewrite | 3.1 |
| `src/features/chores/components/ChoreCard.tsx` | Rewrite | 3.1 |
| **Phase 3.2 — Association Picker** | | |
| `src/features/chores/components/AssociationPickerModal.tsx` | New | 3.2 |
| **Phase 3.3 — Current Chores** | | |
| `src/features/chores/views/CurrentChores.tsx` | New | 3.3 |
| `src/features/chores/components/MasterChoreCard.tsx` | New | 3.3 |
| **Phase 3.4 — Archived Chores** | | |
| `src/features/chores/views/ArchivedChores.tsx` | New | 3.4 |
| **Phase 3.5 — Master Modal** | | |
| `src/features/chores/components/MasterChoreModal.tsx` | New | 3.5 |
| **Phase 3.6 — Instance Interaction** | | |
| `src/features/chores/components/InstanceInteraction.tsx` | New | 3.6 |
| **Phase 3.7 — Header + Shell Wiring** | | |
| `src/features/shell/HeaderChores.tsx` | New | 3.7 |
| `src/features/shell/AppShell.tsx` | Update | 3.7 |
| `src/features/shell/Sidebar.tsx` | Update | 3.7 |
| `src/features/shell/Header.tsx` | Update | 3.7 |
| `src/features/chores/views/ChoresView.tsx` | Rewrite | 3.7 |
| **Phase 3.8 — Cleanup** | | |
| `src/features/chores/components/ChoreCreateModal.tsx` | Delete | 3.8 |
| `src/features/chores/components/ChoreEditModal.tsx` | Delete | 3.8 |

---

## Session Notes

_Use this section to track decisions, blockers, and context across sessions._

### 2026-08-27 — Phase 2 Mockup Iteration

**Mockup approvals:**
- ✅ Chores Board (v4) — 3-column grid, hybrid metric cards, member color pills
- ✅ Association Picker Modal (v2) — 3-column header, no footer, scrollable list
- ✅ Current Chores — labeled rows, Active+Inactive only, standalone view
- ✅ Archived Chores — same style as current, Restore+Delete actions
- ✅ Header (Chores) — 3-view toggle, context-aware bulk actions, no family pills

**Key design decisions:**
- Management view split into 2 standalone views (Current + Archived) instead of inline panel
- Archived cards: no grey/strikethrough (separate view provides context)
- Header: chores-specific with view toggle, bulk actions, Create Master
- No family pills in chores header (board columns show per-member metrics)
- Bulk actions context-aware per view (Board/Manage Current/Manage Archived)
- "Create Master" button in header, not in grid
- Metric cards: hybrid icon + shorthand (Asn, Clm, Prog, Done, Over) at `text-[8px]`

**File renames:**
- `master-management.html` → `current-chores.html`
- `header.html` → `header-calendar.html`
- New: `archived-chores.html`, `header-chores.html`

**Master Chore Modal review (2026-08-27):**
- Verified all fields against backend `MasterChore` model
- Added conditional recurrence fields (Weekly: day-of-week, Monthly: day-of-month OR nth weekday, Yearly: month + day)
- Added Due Date field (backend has `due_date`)
- Backend gap documented: `start_date` missing from `RecurrenceRule` — deferred to future feature
- Review document: `docs/plans/MASTER-CHORE-MODAL-REVIEW.md`

**Pending:**
- All mockups approved. Phase 2 complete.

### Instance Interaction Mockup Updates (2026-08-27)

**Changes made:**
- Added `shadow-popup` CSS variable to theme
- Fixed period display: "Monday, Aug 25" instead of "Aug 25 – Aug 31" (backend uses single date)
- Added Due Time display (if master has `due_time` set)
- Added Overdue state popup (red badge, "Complete Now" button, shows "2h late")
- Added Missed state popup (grayed out, "Cannot Complete (Missed)" disabled button)
- Total: 5 state variants (Active, In Progress, Overdue, Missed, Open Pool)

**Backend alignment:**
- `period_start == period_end` for all frequencies (verified in `calculate_period()`)
- Overdue: status = `overdue`, past due_time but period still active
- Missed: status = `missed`, period ended without completion
- Open Pool: `claimed_by == null && assigned_to == null`

**Phase 2 completion summary:**

**What was built:**
- 7 HTML mockups covering all new/changed UI for the chores frontend rewire
- All mockups use Tailwind CDN v4, design tokens, dark mode support
- Design decisions documented in plan and memory

**Mockup files:**
| File | Purpose |
|------|---------|
| `mockups/chores-board.html` | Board view with 3-column grid, metric cards, member pills |
| `mockups/association-picker-modal.html` | Modal for assigning masters to members/pool |
| `mockups/current-chores.html` | Active + Inactive master chores management |
| `mockups/archived-chores.html` | Archived master chores management |
| `mockups/header-chores.html` | Chores-specific header with view toggle and bulk actions |
| `mockups/header-calendar.html` | Calendar-specific header (renamed from header.html) |
| `mockups/master-chore-modal.html` | Create/Edit master chore template form |
| `mockups/instance-interaction.html` | Instance popup with 5 state variants |

**Key design decisions:**
- Management view split into 2 standalone views (Current + Archived)
- Header: chores-specific with 3-view toggle (Board/Manage Current/Manage Archived)
- Bulk actions context-aware per view
- No family pills in chores header (board columns show per-member metrics)
- Metric cards: hybrid icon + shorthand (Asn, Clm, Prog, Done, Over)
- Archived cards: same style as current (no grey/strikethrough)
- Period display: single date (e.g., "Monday, Aug 25"), not range
- `start_date` backend gap deferred to future feature

**Tech stack usage:**
- HTML + Tailwind CDN v4 (`@tailwindcss/browser@4`)
- Design tokens via `tokens.css` shared across mockups
- Dark mode via `.dark` class on `<html>`
- Lucide SVG icons for all iconography

### 2026-08-26 — Initial Planning

- Backend redesign complete (9 phases, all committed)
- Frontend types/API completely stale — wrong enums, missing associations, removed fields
- User decisions:
  - Master CRUD → separate "Manage Chores" view (not modal on board)
  - Timezone fix → backend converts on input (separate dashy-api work)
  - Unassociated masters → don't show on board (only in management view)
  - Phased approach with mockup approval gate before implementation
- Backend timezone issue documented: `recurrence_rule.time` and `due_time` compared against UTC but users enter local time. Needs backend fix.

---

## References

- **Backend redesign plan:** `dashy-api/docs/plans/CHORES-REDESIGN.md`
- **Datetime standardization:** `docs/plans/DATETIME-STANDARDIZATION.md`
- **Backend API models:** `dashy-api/app/api/models/chores.py`
- **Backend domain models:** `dashy-api/app/domain/chores/models.py`
- **Frontend types (current):** `dashy-kiosk/src/types/chores.ts`
- **Frontend API (current):** `dashy-kiosk/src/features/chores/api/choresApi.ts`
