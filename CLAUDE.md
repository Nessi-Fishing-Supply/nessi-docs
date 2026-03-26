# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nessi Docs is the documentation and user journey visualization app for the Nessi fishing marketplace. It renders structured journey data as interactive flow visualizations for the product team to review and test against.

Deployed at `docs.nessifishingsupply.com` (planned).

## Relationship to nessi-web-app

This app is a **rendering layer** over journey data that lives in `nessi-web-app/docs/journeys/*.json`. The source of truth for all journey data is the main app repo. JSON files are synced to `src/data/journeys/` in this repo.

### Cross-repo workflow

- Journey JSON is authored in `nessi-web-app/docs/journeys/`
- Copied to `nessi-docs/src/data/journeys/` (manual or via GitHub Action)
- This app reads the JSON at build time and renders static pages

## Commands

- **Dev server:** `pnpm dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Lint styles:** `pnpm lint:styles`
- **Type check:** `pnpm typecheck`
- **Format:** `pnpm format` (write) / `pnpm format:check` (verify)

Package manager is **pnpm** (v10.13.1). Do not use npm or yarn.

## Architecture

### Stack

- Next.js 16 (App Router), fully static (SSG)
- SCSS Modules with Nessi design tokens (copied from nessi-web-app)
- No database, no auth, no API routes
- react-icons for UI icons

### Key Directories

- `src/app/` — Pages (journeys, api-map, data-model, lifecycles, coverage, features, permissions, config, errors, changelog, onboarding)
- `src/data/` — All structured data modules (barrel-exported from `src/data/index.ts`)
- `src/data/journeys/canvas/` — Journey definitions as TypeScript (source of truth, not JSON)
- `src/types/` — TypeScript types for each data domain (journey, api-contract, data-model, lifecycle, feature, permission, config-ref, docs-context)
- `src/features/` — Feature-scoped components (journeys, search)
- `src/components/layout/` — Shell layout components (app-shell, sidebar, topbar, detail-panel, device-gate)
- `src/providers/` — React context providers
- `src/styles/` — Nessi design tokens (variables, mixins, globals)

### Journey Data Schema

Journey JSON files follow the schema in `nessi-web-app/docs/journeys/schema.json`. Key concepts:

- **Journey** — A complete user flow (e.g., "Shop Invite Acceptance")
- **Flow** — A sub-flow within a journey (e.g., "Owner Sends Invite", "Accept as New User")
- **Step** — An individual action with a `layer` (client/server/database/background/email/external)
- **Branch** — A decision point that splits the flow
- **ErrorCase** — Known error conditions at a step

### App Shell Architecture

The app uses a three-panel layout managed by `AppShell`:

- **Sidebar** — Navigation across all doc pages and journeys
- **Main content** — Page-specific visualization (canvas, tables, etc.)
- **Detail panel** — Context-sensitive inspector that reacts to selection

Selection state flows through `DocsProvider` (React context in `src/providers/docs-provider.tsx`). The `SelectedItem` union type (`src/types/docs-context.ts`) determines which detail panel renders — each variant (step, api, entity, lifecycle-state, coverage, feature, role, config-enum) has a corresponding panel component in `src/components/layout/detail-panel/panels/`.

### Data Layer

Journey data has migrated from JSON files to **TypeScript modules** in `src/data/journeys/canvas/`. Each journey is a `.ts` file exporting a `Journey` object with typed nodes and edges. The old JSON files in `src/data/journeys/*.json` are no longer the source of truth.

All data modules (journeys, api-contracts, data-model, lifecycles, features, permissions, config-reference, changelog, onboarding, entity-relationships, cross-links) are barrel-exported from `src/data/index.ts`.

### Fonts

DM Sans (body/UI) and DM Serif Display (headings), loaded via `next/font/google` with CSS variables `--font-dm-sans` and `--font-dm-serif`.

### Styling

Same conventions as nessi-web-app: SCSS Modules, CSS custom properties from design tokens, mobile-first with `@include breakpoint()`, kebab-case file names. The `sassOptions.includePaths` in `next.config.mjs` includes `src/styles/`, so SCSS imports can reference token files directly.

## Naming Conventions

All files and folders use **kebab-case**, enforced by eslint-plugin-check-file in `eslint.config.mjs`.

## Path Aliases

- `@/*` maps to `./src/*`
- `@journeys/*` maps to `./src/data/journeys/*`
