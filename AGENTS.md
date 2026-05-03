## What this project is

**clair.** is a French accounting dashboard that ingests **FEC** files (Fichier d'Écritures Comptables, the DGFiP-mandated journal-export format) and produces a clear view of revenue, expenses, cash, and margins for SMB owners.

- All user-facing copy is in **French**. Keep it that way.
- The FEC parser, analytics, and persisted store live in `apps/web/lib/fec/`. Domain types are in `apps/web/lib/fec/types.ts` — read them before touching anything FEC-related.

## Stack

- **pnpm** 9.15.9 workspace + **Turborepo** 2.8 (`pnpm-workspace.yaml`, `turbo.json`)
- **Next.js 16** with Turbopack (`apps/web`)
- **React 19**, **TypeScript 5.9**
- **Tailwind CSS v4** + **shadcn/ui** (style: `base-nova`, in `packages/ui`)
- **@base-ui/react**, **recharts**, **lucide-react**, **sonner**, **next-themes**, **zod**, **date-fns**
- Lint: **oxlint** · Format: **oxfmt** (Rust-based, **not** eslint/prettier)
- Node **>=20**

## Layout

```
apps/web/                    Next.js app (App Router)
  app/                       Routes: /, /upload, /dashboard/{insights,charges,clients,...}
  components/fec/            FEC-specific UI (charts, KPI cards, dropzone, sidebar)
  lib/fec/                   Parser, analytics, in-browser store, types, formatters
packages/ui/                 Shared shadcn component library (@workspace/ui)
packages/typescript-config/  Shared tsconfig presets (@workspace/typescript-config)
.agents/skills/              Skill definitions (Convex, Vercel, shadcn, Better Auth, …)
.claude/  ->  .agents/       Symlink — Claude Code reads skills from here
```

## Commands

Run from the repo root unless stated otherwise.

| Task                    | Command          |
| ----------------------- | ---------------- |
| Install                 | `pnpm install`   |
| Dev server (web)        | `pnpm dev`       |
| Build                   | `pnpm build`     |
| Lint (oxlint)           | `pnpm lint`      |
| Format check (oxfmt)    | `pnpm format`    |
| Typecheck               | `pnpm typecheck` |
| Lint + format           | `pnpm quality`   |
| **Autofix + full gate** | `pnpm fix`       |

### `pnpm fix` is the contract

After editing files, run **`pnpm fix`** (script: `./fix.sh`). It:

1. Diffs changed files against `origin/main` (and unstaged + untracked).
2. Runs `oxlint --fix` and `oxfmt --write` on **only** those files.
3. Runs `pnpm quality` and `pnpm typecheck` on the whole repo.
4. Exits non-zero if anything still fails.

Do **not** run `prettier`, `eslint`, or full-repo `oxlint .` as a substitute — `fix.sh` is the canonical gate.

## Code conventions

- **No braces for single-instruction `if`/`else`.** This is a project preference enforced by review, not by the linter.
  ```ts
  if (cond) doThing()
  else doOther()
  ```
- **No semicolons**, double quotes, 2-space indent, `printWidth: 80`, trailing commas `es5`. Set in `.oxfmtrc.json`.
- **Imports are auto-sorted** by oxfmt (`sortImports: true`). Don't fight the order.
- **Tailwind classes are auto-sorted** in `cn()` and `cva()` calls. Compose with `cn` from `@workspace/ui/lib/utils`.
- **Components in `packages/ui`** are shadcn primitives — keep them generic. Domain components (FEC-aware) live in `apps/web/components/fec/`.
- **Server vs client**: `apps/web` uses RSC by default. Add `"use client"` only when you need state, effects, or browser APIs (the FEC store under `lib/fec/store.tsx` is client-side because the file lives in localStorage).
- Aliases: `@/…` resolves to `apps/web/*`; shared UI is `@workspace/ui/components/*`, utils `@workspace/ui/lib/utils`.

## React-specific guidance

When writing or refactoring React components, **invoke these skills** (they're configured in `.agents/skills/`):

- `vercel-react-best-practices` — performance patterns (RSC boundaries, memoization, data fetching).
- `vercel-composition-patterns` — compound components, render props, scalable APIs.

For UI work, prefer `shadcn` skill helpers to add/inspect components rather than hand-rolling them.

## MCP servers configured (`.mcp.json`)

- **convex** — Convex deployments (data, logs, env, run functions). Not currently wired into the app, but available.
- **shadcn** — Search/add components, view registry items.
- **vercel** — Deploy, list projects, fetch runtime/build logs, manage toolbar threads.

## Git & PRs

- **Never** add `Co-Authored-By` trailers to commits or PR descriptions.
- **Never** add "Generated with Claude Code" or similar attribution.
- Match the existing terse commit style (see `git log`).
- Don't push or open PRs without explicit user instruction.

## Things to be careful about

- **`FEC_2024.csv`** at the repo root is real-looking sample data. Don't commit edits to it; don't ship it to third-party services.
- The FEC store persists to **`localStorage`** under `clair.fec.dashboard.v1`. Schema changes need a key bump or migration in `apps/web/lib/fec/store.tsx`.
- All monetary formatting goes through `apps/web/lib/fec/format.ts` — don't reinvent `Intl.NumberFormat` calls inline.
- **Default to `formatEuroCompact` when displaying a monetary number in the UI** (KPI cards, charts, dashboard tiles). Only fall back to `formatEuro` / `formatEuroExact` when the user needs exact precision — e.g. an invoice line, an account balance, an écriture detail.
- Dashboard analytics in `apps/web/lib/fec/analytics.ts` is the single source of derived numbers — KPIs, charts, and tables all read from `DashboardData`. Add new metrics there, not in components.
