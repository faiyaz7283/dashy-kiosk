---
name: code-review-gate
description: Manual code review before running automated quality gates. Check for pattern violations, code quality, and AGENTS.md compliance.
---

# Code Review Gate

Perform a manual code review **before running automated quality gates** (lint/typecheck/test/build). This catches issues that automated tools miss.

## When to use

- After completing implementation
- After running `/self-review`
- Before running `/quality-gate`
- Before presenting code to the user

## Code Review Checklist

### 1. Re-read AGENTS.md Sections

Review the sections relevant to your change:

- [ ] **Section 7: Styling** — Tailwind only, no inline styles
- [ ] **Section 7c: No Hardcoded Values** — Use tokens, not magic numbers
- [ ] **Section 7d: Common Patterns** — When to extract components/hooks
- [ ] **Section 3a: Pre-Implementation Checklist** — Did you follow it?

Read detailed guides if needed:
- `docs/guides/styling.md` — Styling rules and examples
- `docs/guides/workflow.md` — Workflow rules and examples

### 2. Check for Pattern Violations

#### Duplicated Logic

```bash
# Search for similar patterns
grep -r "useMemo.*Map<" src/features/
grep -r "const.*=.*useMemo" src/features/ | sort
```

- [ ] If the same logic appears in 2+ places → Extract to shared hook
- [ ] Check `src/shared/hooks/` for existing utilities

#### Prop Drilling

```bash
# Search for handlers passed through multiple levels
grep -r "onMouseEnter.*onMouseEnter" src/
grep -r "onMouseMove.*onMouseMove" src/
grep -r "onMouseLeave.*onMouseLeave" src/
```

- [ ] Handlers should not pass through 3+ component levels
- [ ] If prop drilling found → Use Context API
- [ ] Check `src/features/calendar/hooks/useEventPopup.tsx` for Context example

#### Hardcoded Values

```bash
# Search for hardcoded dimensions
grep -r "h-\[[0-9]" src/ | grep -v test
grep -r "w-\[[0-9]" src/ | grep -v test
grep -r "top-\[[0-9]" src/ | grep -v test
grep -r "bottom-\[[0-9]" src/ | grep -v test

# Search for hardcoded colors
grep -r "bg-\[#" src/ | grep -v test
grep -r "text-\[#" src/ | grep -v test
```

- [ ] Shell dimensions should use `var(--shell-*)`
- [ ] Colors should use design tokens
- [ ] Spacing should use Tailwind scale

#### Inline Styles

```bash
# Search for inline styles
grep -r "style={{" src/ | grep -v test
```

- [ ] All styling should use Tailwind classes
- [ ] No inline `style="..."` with `var(--dt-*)`
- [ ] No `const styles` objects

### 3. Check for Code Quality

#### Shared Components/Hooks

```bash
# List existing shared utilities
ls src/shared/components/
ls src/shared/hooks/
ls src/features/calendar/components/
ls src/features/calendar/hooks/
```

- [ ] Are shared components/hooks used where appropriate?
- [ ] Are you reinventing existing utilities?
- [ ] Should any new code be extracted to shared?

#### Magic Numbers/Strings

```bash
# Search for magic numbers
grep -r "setTimeout.*[0-9]" src/ | grep -v test
grep -r "setInterval.*[0-9]" src/ | grep -v test
grep -r "slice(0, [0-9]" src/ | grep -v test
```

- [ ] Use named constants for magic numbers
- [ ] Use tokens for dimensions and spacing
- [ ] Use `ENDPOINTS` for API URLs and refresh intervals

#### DRY Principle

```bash
# Look for repeated patterns
grep -r "className.*flex.*items-center.*gap" src/ | sort
```

- [ ] Is the code DRY (Don't Repeat Yourself)?
- [ ] Are there opportunities to extract common patterns?
- [ ] Are there any TODO comments that should be addressed now?

#### Component Structure

```bash
# Check component organization
find src/features -name "*.tsx" | head -20
```

- [ ] One component per folder?
- [ ] Barrel exports (`index.ts`) present?
- [ ] Tests co-located with components?

### 4. Fix Violations

If violations are found, **fix them before proceeding to quality gates**.

Common fixes:
- **Duplicated logic** → Extract to shared hook in `src/shared/hooks/` or `src/features/{feature}/hooks/`
- **Duplicated markup** → Extract to shared component in `src/shared/components/` or `src/features/{feature}/components/`
- **Prop drilling (3+ levels)** → Use Context API (see `useEventPopup.tsx` for example)
- **Hardcoded values** → Use tokens from `src/theme/tokens.ts` or CSS custom properties
- **Inline styles** → Convert to Tailwind classes

### 5. Verify Fixes

After fixing violations:

```bash
# Re-run the checks
grep -r "h-\[[0-9]" src/ | grep -v test
grep -r "style={{" src/ | grep -v test
```

- [ ] All violations fixed
- [ ] No new violations introduced

## After Code Review

1. Run `/quality-gate` for automated checks
2. Present code to user

## Notes

- This is a **manual review** — automated tools can't catch everything
- Run after `/self-review`
- Run before `/quality-gate`
- If violations are found, they are part of the current phase — do not defer
- All commands run inside Docker containers via Makefile targets
