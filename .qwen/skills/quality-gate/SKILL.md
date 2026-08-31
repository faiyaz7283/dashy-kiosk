---
name: quality-gate
description: Run the frontend quality gate — code review, lint, typecheck, test, build — all must pass before declaring any change complete.
---

# Frontend Quality Gate

Run the full frontend quality gate to verify correctness of any change. This includes a manual code review step followed by automated checks.

## When to use

- After completing any frontend code change
- Before declaring a task complete
- Before committing or pushing changes
- After running `/self-review`

## Steps

Run all steps in sequence from the orchestrator root. All must pass.

### 0. Code Review Gate

**First, invoke the `/code-review-gate` skill.** This performs a manual code review that catches issues automated tools miss — pattern violations, duplicated logic, prop drilling, hardcoded values, inline styles, and code quality issues.

Do not proceed to automated checks until the code review gate passes.

### 1. Lint

```bash
make lint-kiosk
```

Checks oxlint rules across all source files. oxlint has 865+ built-in rules covering ESLint core, TypeScript, React hooks, and JSDoc/TSDoc.

To auto-fix issues:

```bash
make format-kiosk
```

This runs oxfmt (30x faster than Prettier, 100% Prettier conformance).

### 2. Type check

```bash
make typecheck-kiosk
```

Runs the TypeScript compiler in check-only mode (`tsc --noEmit`). Catches type errors without producing output files.

### 3. Test

```bash
make test-kiosk
```

Runs the Vitest test suite. Includes coverage reporting.

Run a specific test file:

```bash
# From orchestrator root
docker compose -f compose/docker-compose.dev.yml exec kiosk pnpm vitest run src/path/to/file.test.ts
```

### 4. Build

```bash
make build-kiosk
```

Produces the production bundle via Vite. Catches build-time errors, missing imports, and bundle issues.

## Passing criteria

All steps (code review + four automated checks) must pass. If any step fails, fix the issues before declaring the task complete.

## Notes

- All commands run inside Docker containers via Makefile targets — never run pnpm directly on the host.
- The orchestrator's `make lint-kiosk`, `make typecheck-kiosk`, etc. targets run these commands inside the Docker container.
- Coverage targets: 80% for utils/hooks, 70% for components.
- Uses oxlint (not ESLint) and oxfmt (not Prettier) — see AGENTS.md section 1 for tech stack.
- Future: When `vite-plus` reaches stable version, migrate to unified toolchain.
