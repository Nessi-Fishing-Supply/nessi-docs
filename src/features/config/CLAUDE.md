# Config

## Overview

Renders the config reference (enum list with values) and roles & permissions matrix. Data source is the extracted `config-ref.json` and `roles.json` from nessi-web-app.

## Architecture

```
config/
├── services/
│   └── config.ts         — Data access (wraps branch-loader today, API tomorrow)
├── hooks/
│   └── use-config.ts     — TanStack Query hooks for client components
├── components/
│   └── config-list/      — Config enum list with collapsible rows + roles matrix
└── index.ts              — Public API (barrel export)
```

## Services

| Function                 | Returns        | Used By                    |
| ------------------------ | -------------- | -------------------------- |
| `getConfigEnums(branch)` | `ConfigEnum[]` | ConfigPage, useConfigEnums |
| `getRoles(branch)`       | `Role[]`       | ConfigPage, useRoles       |

## Hooks

| Hook               | Query Key                  | Returns                                    |
| ------------------ | -------------------------- | ------------------------------------------ |
| `useConfigEnums()` | `['config-enums', branch]` | `{ data: ConfigEnum[], isLoading, error }` |
| `useRoles()`       | `['roles', branch]`        | `{ data: Role[], isLoading, error }`       |

## Data Flow

- **Server:** Page → `getConfigEnums(branch)` + `getRoles(branch)` → branch-loader → props → ConfigList
- **Client:** Component → `useConfigEnums()` / `useRoles()` → useQuery → service → branch-loader
