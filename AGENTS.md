<!-- intent-skills:start -->

## Skill Loading

Before substantial work:

- Skill check: run `bunx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `bunx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Carpe Care — Agent Reference

## MCP Servers

Three MCPs are configured in `opencode.json`:

- **shadcn** (`npx shadcn@latest mcp`)
  - `list_items_in_registries` — list components/hooks from all configured registries
  - `search_items_in_registries` — fuzzy search by name or description
  - `view_items_in_registries` — read full source and metadata of an item
  - `get_item_examples_from_registries` — fetch usage demos and examples
  - `get_add_command_for_items` — generate the exact `npx shadcn add ...` command
  - `get_project_registries` — show which registries are active in `components.json`
  - `get_audit_checklist` — verify new components meet project conventions

- **supabase** (remote, read-only, `https://mcp.supabase.com/mcp?project_ref=otblessssxmgyroboxro&read_only=true&features=docs`)
  - `search_docs` — GraphQL search of Supabase docs (guides, API refs, troubleshooting)
  - `execute_sql` — run SQL directly on the connected project
  - `get_advisors` — run `supabase db advisors` equivalent on the schema
  - `apply_migration` — apply a migration file (creates a history entry; use with caution)

- **next-devtools** (`npx next-devtools-mcp@latest`)
  - `nextjs_index` — discover running Next.js dev servers and their available tools
  - `nextjs_call` — call a specific tool on a dev server (requires `bun dev` to be running)
  - Tools vary by Next.js version; common ones include `get_errors`, `get_routes`, `clear_caches`

## Project Type

Single-package Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui + Supabase (Postgres + Auth) + Drizzle ORM.

## Key Commands

| Command                                | Purpose                                     |
| -------------------------------------- | ------------------------------------------- |
| `bun dev`                              | Start dev server (http://localhost:3000)    |
| `bun run build`                        | Production build                            |
| `bun run lint`                         | ESLint check (`eslint`)                     |
| `npx shadcn add <component>`           | Add shadcn/ui component                     |
| `npx shadcn add @supabase/<component>` | Add Supabase UI component (custom registry) |
| `bunx drizzle-kit generate`            | Generate Drizzle migration                  |
| `bunx drizzle-kit migrate`             | Apply Drizzle migrations                    |
| `bunx drizzle-kit push`                | Push schema changes (dev only)              |
| `bunx drizzle-kit studio`              | Open Drizzle Studio                         |

**Package manager is bun** — `bun.lock` is the lockfile. `package-lock.json` exists but prefer bun.

## Pre-commit Hooks

Husky + lint-staged runs `prettier --write --ignore-unknown` on all staged files. No tests or lint run on commit.

## Architecture & Entry Points

- **App entry**: `src/app/page.tsx` (home), `src/app/layout.tsx` (root layout)
- **API routes**: `src/app/api/` (empty currently)
- **Path alias**: `@/*` → `./src/*`
- **Supabase clients**: `src/features/auth/`
  - `client.ts` — browser client (`createBrowserClient`)
  - `server.ts` — server client (`createServerClient` + cookies)
  - `middleware.ts` — session refresh middleware (used in route handlers/middleware, not Next.js root middleware)
- **Database connection**: `src/features/database/index.ts` — Drizzle + postgres-js client
- **shadcn/ui components**: `src/components/ui/` (currently `button`, `card`)
- **Global hooks**: `src/hooks/` — only for cross-cutting, app-wide React hooks. Feature-specific hooks stay in `src/features/{feature}/hooks.ts`.
- **Styling**: `src/app/globals.css` — Tailwind v4 theme with `@theme inline` and oklch color vars
- **No `src/db/schema.ts` yet** — `drizzle.config.ts` references it but file doesn't exist. Create it when adding tables.

## Feature Structure

Domain features are self-contained under `src/features/{feature}/`. Keep each feature's code inside its own directory rather than spreading it across `src/lib/` or `src/components/`.

Current features:

- `src/features/auth/` — Supabase auth clients + middleware
- `src/features/database/` — Drizzle connection + schema

A feature directory may contain:

- `components/` — feature-specific UI
- `actions.ts` — server actions
- `providers.ts` — React context/providers
- `hooks.ts` — feature-specific hooks
- `schema.ts` — Drizzle schema for that domain
- `lib/` or `utils.ts` — feature-internal helpers

Cross-feature imports are fine via `@/features/{feature}/...`, but keep the surface area narrow. Shared utilities that don't belong to a specific domain stay in `src/lib/` (e.g. `src/lib/utils.ts`).

## Database & Auth

- **Postgres**: Supabase-hosted (`otblessssxmgyroboxro`)
- **Migrations**: `database/migrations/` (currently empty). `.env` also configures goose (`GOOSE_MIGRATION_DIR`) — legacy setup, Drizzle Kit is the active migration tool.
- **Connection**: `DATABASE_URL` in `.env` points to Supabase direct connection by default.
- **Auth proxy**: `src/proxy.ts` is the Next.js 16 root proxy (formerly `middleware.ts`). It calls `updateSession` from `src/features/auth/middleware.ts` to refresh Supabase sessions and redirect unauthed users to `/auth/login`. `src/middleware.ts` is intentionally absent because Next.js 16 renamed the convention to `proxy.ts`.
- **Environment**: `.env` is gitignored but present locally. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are required for Supabase clients.

## shadcn/ui & Tailwind v4

- **Registry style**: `radix-maia` (from `components.json`)
- **Icons**: `lucide`
- **Tailwind v4 config**: `postcss.config.mjs` uses `@tailwindcss/postcss`. No `tailwind.config.ts` — theme is CSS-only in `globals.css` via `@theme inline`.
- **Registry alias**: `@supabase` → `https://supabase.com/ui/r/{name}.json` (for Supabase-specific UI components)

## Lint & Format

- **ESLint 9**: `eslint.config.mjs` extends `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`. Custom `globalIgnores` for `.next/`, `out/`, `build/`, `next-env.d.ts`.
- **Prettier**: `.prettierrc` is `{}` (defaults). Ignores `build/` and `coverage/`.

## Testing

No test framework configured currently. If adding tests, Jest or Vitest are common choices for Next.js 16. Verify React 19 compatibility before installing.

## Gotchas

- **Next.js 16**: App Router APIs differ from training data. Check `node_modules/next/dist/docs/` for current conventions.
- **No tests**: Don't try to run `bun test` — it won't work.
- **No `src/db/schema.ts`**: Drizzle config now points to `src/features/database/schema.ts`; no `src/db/schema.ts` is needed.
- **Middleware location**: Supabase auth middleware is in `src/features/auth/middleware.ts`, not `src/middleware.ts`. Next.js won't auto-run it.
- **Prettier on commit**: Only formatting, no lint or typecheck on pre-commit.
- **.env not in git**: Secrets are local-only.
