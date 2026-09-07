# Dashy Kiosk Project Skills

This directory contains ECC skills for the Dashy Kiosk (React + TypeScript frontend) submodule.

## Directory Structure

```
.agents/
  skills/
    <feature-name>/          # e.g., responsive-layout/, component-patterns/, ux-review/
      SKILL.md
      (supporting files)
  README.md                  # This file
```

## Naming Convention

Kiosk skills use simple feature names focused on frontend patterns. No suffixes are needed—the `.agents/` location makes it clear these are frontend-specific skills.

## Current Skills

Migrated from the legacy `.qwen/skills/` directory (ECC-formatted, `origin: community`):

- `add-api-contract/` — Wiring up a new API endpoint on the frontend
- `add-component/` — Creating a new React component
- `add-domain-utility/` — Adding domain logic utilities
- `add-feature/` — Scaffolding a new feature module
- `add-frontend-test/` — Adding component/hook tests
- `add-hook/` — Creating a new reusable React hook
- `add-shared-utility/` — Adding shared utility functions
- `add-svg-icon/` — Adding a new SVG icon component
- `add-theme-token/` — Adding a new design token
- `code-review-gate/` — Manual code review checklist
- `mockup/` — Creating/updating Tailwind HTML mockups
- `pre-implementation-checklist/` — Mandatory pre-coding compliance check
- `quality-gate/` — Running lint/typecheck/test/build gate
- `self-review/` — Self-review checklist before presenting code

## Related Skills

For orchestrator-level skills (deployments, multi-module coordination), see `dashy/.agents/skills/`.
For backend skills (API patterns, database patterns), see `dashy-api/.agents/skills/`.

## Skill Format

Each skill is a directory containing:

```
skill-name/
  SKILL.md                   # Markdown with usage instructions
  (optional) examples/       # React/TypeScript code examples
  (optional) templates/      # Component or hook templates
```

## Discovery

Skills are auto-discovered by ECC harnesses:
- **Claude Code:** Native discovery via `.agents/skills/`
- **Kimi Code:** Native discovery via `.agents/skills/`
- **Qwen Code:** Via settings configuration

Invoke skills using your harness's native syntax (e.g., `/skill:<name>` in Kimi Code).

## Adding a New Skill

1. Create a directory under `skills/` with your skill name
2. Add a `SKILL.md` file with:
   - Clear description of the frontend pattern or workflow
   - When to use it (e.g., "When building a new feature view", "When styling responsive layouts")
   - Step-by-step usage instructions with code examples
   - Links to relevant sections in `AGENTS.md` and the guides (styling, error handling, workflow, datetime)
3. Add React/TypeScript code examples demonstrating the pattern
4. The skill is immediately discoverable by all harnesses

## Guidelines

- Focus on **frontend and UI concerns only**
- Document React 19 patterns (hooks, server/client boundaries, Suspense, error boundaries)
- Document TypeScript patterns (type safety, prop drilling prevention, shared types)
- Document Tailwind usage (utility classes, design tokens, responsive patterns)
- Document component architecture (one component per folder, barrel exports, testing)
- Include code examples—reference actual components in `src/features/` when helpful
- Make skills reusable across different views and components
- For orchestrator concerns (deployments, CI/CD), add skills to `dashy/.agents/skills/`

## Frontend-Specific AGENTS.md Sections

Before creating a skill, review the comprehensive guides:
- **[Styling Guide](docs/guides/styling.md)** — Tailwind rules, design tokens, hardcoded values
- **[Error Handling Guide](docs/guides/error-handling.md)** — ApiError, useQuery errors, Error Boundary
- **[Workflow Guide](docs/guides/workflow.md)** — Pre-implementation checklist, self-review, code review gate
- **[Date/Time Guide](docs/guides/datetime.md)** — UTC wire format, timezone conversion, Temporal API

Skills should extend and exemplify these guidelines, not duplicate them.

## Pre-Implementation and Quality Gate

All frontend work requires:
1. **Pre-implementation checklist** — Check AGENTS.md compliance before coding
2. **Self-review** — Review your own code against standards before presenting
3. **Quality gate** — Code review + lint + typecheck + tests + build all pass

These are documented in AGENTS.md sections 3a, 4a, and 4b and are non-negotiable workflows.
