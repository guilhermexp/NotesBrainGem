# Repository Guidelines

## Project Structure & Module Organization
- Entry point: `index.html` and `index.tsx` (registers `<gdm-live-audio>`).
- Source code in `src/`:
  - `components/` (Lit web components; UI, panels, visualization in `components/visualization/`).
  - `services/` (state, audio, analysis orchestration; core app logic).
  - `utils/` (helpers, system instruction builder, config, YouTube parsing).
  - `styles/` (Tailwind entry `src/styles/index.css`).
  - `types/` (shared TypeScript types).
- Static assets in `public/`.

## Build, Test, and Development Commands
- `npm ci` – install exact dependencies.
- `npm run dev` – start Vite dev server.
- `npm run build` – production build to `dist/`.
- `npm run preview` – preview the production build locally.
Prerequisites: Node 18+ and an `.env.local` with `GEMINI_API_KEY=<your_google_api_key>`.

## Coding Style & Naming Conventions
- Language: TypeScript with Lit web components.
- Indentation: 2 spaces; max line length ~100 chars.
- Components: kebab-case tags prefixed with `gdm-` (e.g., `<gdm-assistant-view>`). File names match component name (e.g., `assistant-view.ts`).
- Avoid `any`; prefer explicit types from `src/types/`.
- Styling: Tailwind CSS (utility-first) via `src/styles/index.css`. Keep component-scoped styles minimal.
- Imports: Prefer relative paths within `src/`; alias `@/*` maps to repo root when needed.

## Testing Guidelines
- No test suite is configured yet. When adding tests:
  - Unit tests: prefer Vitest. Name files `*.test.ts` colocated with source.
  - E2E: prefer Playwright with basic smoke flows (load, analyze, chat).
  - Ensure tests run headless in CI and do not require real API keys (mock Google GenAI calls).

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Keep PRs focused and small; include:
  - Purpose and scope, linked issues, and screenshots/GIFs for UI changes.
  - Steps to validate (dev server or preview, key interactions).
  - Notes on performance, accessibility, and breaking changes.

## Security & Configuration Tips
- Never commit secrets. Use `.env.local` (gitignored). Access keys via `process.env.API_KEY` only.
- Keep third-party import versions pinned (see `index.html` import map and `package.json`).
- When adding networked features, guard failures and surface errors via `StateService`.
