# Nessi Docs

Documentation and user journey visualization app for the [Nessi](https://nessifishingsupply.com) fishing marketplace. Renders structured journey data as interactive flow visualizations for the product team to review and test against.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `pnpm dev`          | Start development server         |
| `pnpm build`        | Production build (static export) |
| `pnpm lint`         | ESLint                           |
| `pnpm lint:styles`  | Stylelint for SCSS               |
| `pnpm typecheck`    | TypeScript type checking         |
| `pnpm format`       | Prettier (write)                 |
| `pnpm format:check` | Prettier (verify)                |

## Stack

- **Next.js 16** (App Router, fully static SSG)
- **SCSS Modules** with Nessi design tokens
- **react-icons** for UI icons
- **DM Sans / DM Serif Display** via `next/font`

## Architecture

The app is a three-panel layout — sidebar navigation, main content area, and a context-sensitive detail panel — all driven by a shared selection context (`DocsProvider`).

### Data

All structured data lives in `src/data/` and is barrel-exported from `src/data/index.ts`. Journey definitions are TypeScript modules in `src/data/journeys/canvas/`.

Journey data originates in `nessi-web-app/docs/journeys/` and is synced here.

### Pages

Journeys, API map, data model, lifecycles, coverage, features, permissions, config reference, errors, changelog, and onboarding.
