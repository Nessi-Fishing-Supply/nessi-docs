# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

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

- `src/app/` — Pages (homepage, journey detail)
- `src/data/journeys/` — Journey JSON files (synced from nessi-web-app)
- `src/types/journey.ts` — TypeScript types, layer/status/persona configs
- `src/features/journeys/components/` — Journey visualization components
- `src/styles/` — Nessi design tokens (variables, mixins, globals)

### Journey Data Schema

Journey JSON files follow the schema in `nessi-web-app/docs/journeys/schema.json`. Key concepts:

- **Journey** — A complete user flow (e.g., "Shop Invite Acceptance")
- **Flow** — A sub-flow within a journey (e.g., "Owner Sends Invite", "Accept as New User")
- **Step** — An individual action with a `layer` (client/server/database/background/email/external)
- **Branch** — A decision point that splits the flow
- **ErrorCase** — Known error conditions at a step

### Styling

Same conventions as nessi-web-app: SCSS Modules, CSS custom properties from design tokens, mobile-first with `@include breakpoint()`, kebab-case file names.

## Naming Conventions

Same as nessi-web-app: all files and folders use **kebab-case**, enforced by eslint-plugin-check-file.

## Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).
