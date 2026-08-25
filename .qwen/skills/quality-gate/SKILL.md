---
name: quality-gate
description: Run the frontend quality gate — lint, typecheck, test, build — all four must pass before declaring any change complete.
---

# Frontend Quality Gate

Run the full frontend quality gate to verify correctness of any change.

## When to use

- After completing any frontend code change
- Before declaring a task complete
- Before committing or pushing changes
- After running `/code-review-gate`

## Steps

Run all four commands in sequence from the orchestrator root. All must pass.

### 1. Lint

```bash
make lint-kiosk-v2
```

Checks oxlint rules across all source files. oxlint has 865+ built-in rules covering ESLint core, TypeScript, React hooks, and JSDoc/TSDoc.

To auto-fix issues:

```bash
make format-kiosk-v2
```

This runs oxfmt (30x faster than Prettier, 100% Prettier conformance).

### 2. Type check

```bash
make typecheck-kiosk-v2
```

Runs the TypeScript compiler in check-only mode (`tsc --noEmit`). Catches type errors without producing output files.

### 3. Test

```bash
make test-kiosk-v2
```

Runs the Vitest test suite. Includes coverage reporting.

Run a specific test file:

```bash
# From orchestrator root
docker compose -f compose/docker-compose.dev-v2.yml exec kiosk-v2 pnpm vitest run src/path/to/file.test.ts
```

### 4. Build

```bash
make build-kiosk-v2
```

Produces the production bundle via Vite. Catches build-time errors, missing imports, and bundle issues.

## Passing criteria

All four steps must complete with exit code 0. If any step fails, fix the issues before declaring the task complete.

## Notes

- All commands run inside Docker containers via Makefile targets — never run pnpm directly on the host.
- The orchestrator's `make lint-kiosk-v2`, `make typecheck-kiosk-v2`, etc. targets run these commands inside the Docker container.
- Coverage targets: 80% for utils/hooks, 70% for components.
- Uses oxlint (not ESLint) and oxfmt (not Prettier) — see AGENTS.md section 1 for tech stack.
- Future: When `vite-plus` reaches stable version, migrate to unified toolchain.
