---
name: self-review
description: Run this checklist before presenting code to the user. Self-review against AGENTS.md rules to catch violations before they're seen.
---

# Self-Review Checklist

Run this checklist **before presenting code to the user**. This is your responsibility — do not wait for the user to catch violations.

## When to use

- After completing implementation
- Before presenting code to the user
- Before running quality gates
- After making significant changes

## Checklist

### 1. Re-read Relevant AGENTS.md Sections

- [ ] Section 7: Styling (Tailwind only)
- [ ] Section 7c: No Hardcoded Values
- [ ] Section 7d: Common Patterns (when to extract)
- [ ] Read detailed guides if needed:
  - `docs/guides/styling.md`
  - `docs/guides/workflow.md`

### 2. Search for Duplicated Logic

```bash
# Search for similar patterns across views
grep -r "useMemo.*forecast" src/features/calendar/views/
grep -r "const.*Map<" src/features/
```

- [ ] If the same logic appears in 2+ places → Extract to shared hook/component

### 3. Verify No Prop Drilling

```bash
# Search for handlers passed through intermediate components
grep -r "onMouseEnter.*onMouseEnter" src/
grep -r "onMouseMove.*onMouseMove" src/
```

- [ ] Handlers should not pass through 3+ component levels
- [ ] If prop drilling found → Use Context API

### 4. Verify No Hardcoded Values

```bash
# Search for hardcoded pixel values
grep -r "h-\[[0-9]" src/
grep -r "w-\[[0-9]" src/
grep -r "top-\[[0-9]" src/
grep -r "bottom-\[[0-9]" src/
grep -r "left-\[[0-9]" src/
grep -r "right-\[[0-9]" src/

# Search for hardcoded colors
grep -r "color=\"#" src/
grep -r "bg-\[#" src/
grep -r "text-\[#" src/
grep -r "border-\[#" src/
```

- [ ] If hardcoded values found → Use tokens or CSS custom properties

### 5. Verify Shared Components/Hooks Are Used

```bash
# Check for existing shared utilities
ls src/shared/components/
ls src/shared/hooks/
ls src/features/calendar/components/
ls src/features/calendar/hooks/
```

- [ ] Don't reinvent existing utilities
- [ ] Use shared components/hooks where appropriate

### 6. Verify Tests Exist

```bash
# Check for test files
find src -name "*.test.tsx" -o -name "*.test.ts" | grep -E "(Component|Hook)"
```

- [ ] New components need at minimum a render test
- [ ] New hooks need unit tests
- [ ] Tests should be co-located with implementation

### 7. Check for Inline Styles

```bash
# Search for inline styles
grep -r "style={{" src/
grep -r "style={{" src/ | grep -v "test"
```

- [ ] All styling should use Tailwind classes
- [ ] No inline `style="..."` with `var(--dt-*)`
- [ ] No `const styles` objects

### 8. Check for Magic Numbers/Strings

```bash
# Search for magic numbers
grep -r "setTimeout.*[0-9]" src/ | grep -v "test"
grep -r "setInterval.*[0-9]" src/ | grep -v "test"
```

- [ ] Use named constants for magic numbers
- [ ] Use tokens for dimensions and spacing

## If Violations Found

**Fix them before presenting the code.** Do not present code with known violations.

Common fixes:
- Duplicated logic → Extract to shared hook
- Duplicated markup → Extract to shared component
- Prop drilling → Use Context API
- Hardcoded values → Use tokens
- Inline styles → Convert to Tailwind

## After Self-Review

1. Run `/quality-gate` (which includes code review + automated checks)
2. Present code to user

## Notes

- This checklist is **mandatory** before presenting code
- Run after `/pre-implementation-checklist` (if you ran it)
- Run before `/quality-gate`
- All commands run inside Docker containers via Makefile targets
