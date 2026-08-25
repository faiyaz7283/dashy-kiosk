---
name: pre-implementation-checklist
description: Run this checklist before writing any implementation code to catch violations early. Preventive, not detective.
---

# Pre-Implementation Checklist

Run this checklist **before writing any implementation code**. This is preventive — catch violations before they happen.

## When to use

- Before starting any new feature implementation
- Before adding new components or hooks
- Before modifying existing code with architectural implications
- After planning, before coding

## Checklist

### 1. AGENTS.md Compliance

- [ ] Read relevant sections of AGENTS.md (sections 7, 7c, 7d for styling/patterns)
- [ ] Read detailed guides if needed:
  - `docs/guides/styling.md` — Tailwind rules, hardcoded values, common patterns
  - `docs/guides/workflow.md` — Workflow rules

### 2. Duplication Check

- [ ] Search for existing components/hooks that do similar things:
  ```bash
  grep -r "function.*ComponentName" src/
  grep -r "useCustomHook" src/shared/hooks/
  ```
- [ ] If duplicating logic → Extract to shared hook instead
- [ ] If duplicating markup → Extract to shared component instead

### 3. Prop Drilling Check

- [ ] Will props pass through 3+ component levels?
  - YES → Use Context API (see `docs/guides/styling.md` section 7d)
  - NO → Continue

### 4. Hardcoded Values Check

- [ ] Am I about to hardcode any of these?
  - Pixel values (e.g., `h-[57px]`, `w-[224px]`)
  - Colors (e.g., `bg-blue-500`, `#3b82f6`)
  - Spacing (e.g., `p-[16px]`)
  - Shell dimensions (header height, sidebar width)
- [ ] If YES → Use tokens or CSS custom properties instead:
  - Shell dimensions → `var(--shell-*)` (see `src/index.css`)
  - Colors → Design tokens (`bg-primary`, `text-text-muted`)
  - Spacing → Tailwind scale (`p-4`, `gap-6`)

### 5. Testing Check

- [ ] Does this change need tests?
  - New component → Need render test at minimum
  - New hook → Need unit test
  - New feature → Need integration test
- [ ] Plan test coverage before coding

### 6. Pattern Decision Tree

Use this decision tree when implementing:

```
1. Am I writing the same markup in 2+ places?
   YES → Extract to shared component
   NO  → Continue

2. Am I writing the same logic/state in 2+ components?
   YES → Extract to shared hook
   NO  → Continue

3. Am I passing props through 3+ component levels?
   YES → Use Context API
   NO  → Continue

4. Am I hardcoding a value that should be a token?
   YES → Use token or CSS custom property
   NO  → Continue

5. Am I using inline styles instead of Tailwind?
   YES → Convert to Tailwind classes
   NO  → Implementation is correct
```

## Example Violations Caught

### Violation 1: Duplicated logic

```tsx
// BAD: Same forecast map logic in WeekView and MonthView
const forecastByDate = useMemo(() => {
  const map = new Map<string, DailyForecast>()
  for (const day of forecast) {
    map.set(day.date, day)
  }
  return map
}, [forecast])

// GOOD: Extract to shared hook
const forecastByDate = useForecastMap(forecast)
```

### Violation 2: Prop drilling through 3 levels

```tsx
// BAD: Passing handlers through View → DayCard → EventCard
<DayCard onMouseEnter={...} onMouseMove={...} onMouseLeave={...} />
  <EventCard onMouseEnter={...} onMouseMove={...} onMouseLeave={...} />

// GOOD: Use Context API
<EventPopupProvider>
  <DayCard />  // No handler props
    <EventCard />  // Gets handlers from context
</EventPopupProvider>
```

### Violation 3: Duplicated markup

```tsx
// BAD: Same weather badge markup in WeekView and MonthView
<div className="flex items-center gap-1 text-xs text-text-muted">
  <WeatherIcon condition={forecast.condition} size="sm" />
  <span>{Math.round(forecast.high)}°</span>
  <span>{Math.round(forecast.low)}°</span>
</div>

// GOOD: Extract to shared component
<DayWeatherBadge forecast={forecast} isToday={isToday} />
```

## Enforcement

If you skip this checklist and violations are found later, they are part of the current phase — do not defer to a separate "cleanup phase."

## Notes

- This checklist is **mandatory** before writing code
- Run `/self-review` after coding to catch anything missed
- Run `/code-review-gate` before quality gates
- All commands run inside Docker containers via Makefile targets
