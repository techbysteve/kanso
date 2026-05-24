# Repository Guidelines

## Project Structure & Module Organization

This is a small Next.js App Router project. Route files live in `app/`, with
`app/layout.tsx` defining shared page chrome, `app/page.tsx` defining the home
route, and `app/globals.css` holding Tailwind/global styles. Reusable React
components live in `components/`; generated shadcn/ui primitives belong in
`components/ui/`. Shared utilities go in `lib/`, hooks in `hooks/`, static
assets in `public/`, and design/reference material in `DESIGN.md`, `PLAN.md`,
and `design_specs/`.

## Build, Test, and Development Commands

Use Bun for dependency management because the repository includes `bun.lock`.

- `bun install`: install dependencies.
- `bun run dev`: start the local Next dev server with Turbopack.
- `bun run build`: create a production Next build.
- `bun run start`: serve the production build.
- `bun run lint`: run ESLint with Next core-web-vitals and TypeScript rules.
- `bun run typecheck`: run `tsc --noEmit`.
- `bun run format`: format TypeScript and TSX files with Prettier.

### Naming Conventions
- **Components:** PascalCase (e.g., `ArticleCard`, `Header`, `ThemeToggle`)
- **Functions/variables:** camelCase (e.g., `fetchArticles`, `handleClick`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_MOBILE_WIDTH`)
- **Files:** kebab-case for components (e.g., `article-card.tsx`, `theme-toggle.tsx`)
- **Server Actions:** camelCase (e.g., `extractArticle`, `createTag`)

### Component Organization
- **Location:**
  - Feature components → `src/components/blocks/`
  - UI components (shadcn) → `src/components/ui/`
  - Server actions → `src/lib/actions.ts`
  - API utilities → `src/lib/api-fetch.ts`
  - Types → `src/lib/types.ts`
  - Routes → `src/lib/routes.ts`
- **Server Components:** Default for data fetching (no "use client" directive)
- **Client Components:** Only for interactivity (modals, toggles, forms) - add `"use client"` at top
- **Separation:** For server actions with forms, separate the form input component from the parent to use `useFormStatus` correctly

## Testing Guidelines

No test framework is currently configured. Until one is added, validate changes
with `bun run lint`, `bun run typecheck`, and, for UI work, `bun run build`.
When adding tests, place them near the code they cover or under a future
`tests/` directory, and use clear names such as `button.test.tsx` or
`utils.test.ts`.

## Commit & Pull Request Guidelines

Git history currently uses Conventional Commits, for example
`feat: initial commit`. Continue with concise messages such as `fix: correct
theme toggle state` or `chore: update lint config`. Pull requests should include
a short summary, the validation commands run, linked issues when applicable, and
screenshots or screen recordings for visible UI changes.

## Security & Configuration Tips

Do not commit secrets, local environment files, `.next/`, or `node_modules/`.
Keep generated shadcn/ui files scoped to `components/ui/`, and review config
changes in `next.config.mjs`, `eslint.config.mjs`, and `components.json`
carefully because they affect the whole app.
