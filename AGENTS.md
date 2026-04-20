# Repository Guidelines

## Project Structure & Module Organization
The frontend lives in `src/` and uses the `@/` alias for imports. Put routed pages in `src/pages` or `src/screens`, reusable app components in `src/components`, shared shadcn primitives in `src/components/ui`, context providers in `src/context`, API wrappers in `src/services`, and shared types/utilities in `src/types` and `src/lib`. Static assets belong in `public/` or `src/assets/`. The backend is a separate TypeScript app in `server/`, with HTTP and socket handlers in `server/src` and Prisma schema/migrations in `server/prisma`.

## Build, Test, and Development Commands
Run frontend commands from the repo root:

- `npm run dev` starts Vite on `http://localhost:8080`.
- `npm run build` creates the production bundle in `dist/`.
- `npm run preview` serves the built frontend locally.
- `npm run lint` runs ESLint for all `ts` and `tsx` files.
- `npm run test` runs Vitest once; `npm run test:watch` stays interactive.

Run backend commands with the `server/` prefix:

- `npm --prefix server run dev` starts the Express server with `tsx watch`.
- `npm --prefix server run build` compiles the server.
- `npm --prefix server run db:migrate` applies Prisma migrations.
- `npm --prefix server run db:seed` seeds local data.

## Coding Style & Naming Conventions
Use TypeScript, 2-space indentation, and semicolons to match the existing codebase. Prefer PascalCase for React components and screen files (`TopNav.tsx`), camelCase for hooks/services/utilities (`authService.ts`, `use-mobile.tsx`), and descriptive route/page names. Reuse the `@/` alias instead of long relative imports. Keep shadcn UI wrappers in `src/components/ui` and app-specific styling in Tailwind utility classes.

## Testing Guidelines
Vitest is configured with `jsdom` and `src/test/setup.ts`. Place tests beside the feature or under `src/test/` using `*.test.ts` or `*.test.tsx`; `src/test/example.test.ts` is the naming reference. Cover changed UI states, service behavior, and auth/routing conditions. Playwright is configured in `playwright.config.ts`, but no root script exists yet, so add one with any new end-to-end coverage.

## Commit & Pull Request Guidelines
Recent history uses short action-led summaries such as `Added theme toggle and nav` and `Fixed home AI duplication and nav`. Keep commits focused, concise, and scoped to one change. Pull requests should include a brief summary, affected areas (`src/`, `server/`, Prisma), the commands you ran to verify the change, and screenshots or short recordings for visible UI updates. Mention any `.env` or migration changes explicitly.
