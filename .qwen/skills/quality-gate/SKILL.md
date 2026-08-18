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

## Steps

Run all four commands in sequence from the orchestrator root. All must pass.

### 1. Lint

```bash
make lint-kiosk
```

Checks ESLint rules across all source files. To auto-fix issues, exec into the container:

```bash
docker compose -f compose/docker-compose.dev.yml exec kiosk pnpm lint --fix
```

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
make test-kiosk  # Or: docker compose exec kiosk pnpm vitest run src/path/to/file.test.ts
```

### 4. Build

```bash
make build-kiosk
```

Produces the production bundle via Vite. Catches build-time errors, missing imports, and bundle issues.

## Passing criteria

All four steps must complete with exit code 0. If any step fails, fix the issues before declaring the task complete.

## Notes

- All commands run inside Docker containers via Makefile targets — never run pnpm directly on the host.
- The orchestrator's `make lint-kiosk`, `make typecheck-kiosk`, etc. targets run these commands inside the Docker container.
- Coverage targets: 80% for utils/hooks, 70% for components.
