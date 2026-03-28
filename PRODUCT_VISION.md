# Product Vision: Archway

> **Product Observability for the entire organization.**
>
> Category: Product Observability / Product Governance & Insights
>
> This document captures the product vision as discussed between Kyle Holloway and Claude on 2026-03-28. It is an honest assessment of what this could become, including risks, open questions, and the existing proof-of-concept that validates the core approach.

---

## The Core Thesis

Every attempt to manually maintain product-level documentation has failed at every company, forever. Pre-AI, post-AI, it doesn't matter. Someone builds a diagram, a wiki page, an OpenAPI spec. The next PR from the dev across the hall doesn't update it. Within weeks it drifts. Within months it's stale. Within a year it's actively misleading. It becomes a burden — another "thing" to maintain — and eventually everyone stops trusting it and defaults to tribal knowledge and Slack DMs.

**The only version of product documentation that works is the one that's generated from source code with zero human maintenance.** That's not a feature of Archway. That's the entire reason it exists.

---

## The Problem

**Nobody in the building can explain a single flow end to end.**

Ask the backend lead to walk through the checkout flow — they'll cover the API endpoints and database writes but miss the client-side error handling, the toast notifications, the email that fires on success. Ask the frontend lead — they'll cover the UI interactions and API calls but not know what happens after the request hits the server. Ask QA — they'll describe the happy path they tested in Postman but not the background job that runs afterward. Ask the product owner — they'll describe the business requirements but not the technical implementation.

Each of them knows their slice. The complete picture exists only in the aggregate of their collective knowledge — assembled through standups, Slack threads, ticket comments, and hallway conversations. It has never been written down, visualized, or maintained in one place.

**This is not a people problem.** It's not that the team is bad at documentation or communication. At 90 engineers across multiple platforms, multiple repos, shipping constantly — it is structurally impossible for any human to hold the complete picture. The system is too big and changes too fast. You cannot document a system faster than 90 engineers change it. Every manual solution fails not because of lack of discipline, but because the task itself is impossible for humans at that scale. This is a problem only tooling can solve.

The broken workflows that follow are symptoms, not root causes:

1. **Documentation drift** — Confluence pages, wiki articles, and Miro boards are written once and never updated. Within weeks of creation, they diverge from the actual system. Teams know this and stop trusting them, which means they stop reading them, which means they stop writing them.

2. **Tribal knowledge as API docs** — When documentation is unreliable, engineers default to Slack DMs: "Hey, what does this endpoint return?" "Can you send me a curl command?" Backend engineers become human documentation servers. This doesn't scale and creates single points of failure.

3. **Invisible non-UI behavior** — When an email fires, how a background job processes, what rules govern a state transition, what happens when a cron triggers — none of this is visible by clicking through the frontend. QA can't test what they can't see. Product can't spec what they don't understand. Designers can't account for flows they don't know exist.

4. **Cross-platform blindness** — Enterprises operate multiple platforms (web, mobile, internal tools, APIs, infrastructure). No single person or tool has a complete picture of how a feature works across all of them. "How does authentication work on iOS vs web vs the restaurant tool?" requires asking three different teams.

5. **Proxy layer opacity** — Modern frontend architectures often proxy API calls through a middleware layer (e.g., Next.js API routes that transform data before it hits the client). This creates an invisible translation layer that neither frontend nor backend engineers fully own or document.

6. **Release risk from invisible dependencies** — "Will this PR break something?" is answered with gut feel, not data. There's no way to see what journeys, endpoints, or data models a change touches across the full system.

7. **Failed feature handoffs** — Product designs a feature, presents it to stakeholders, gets approval, hands it to engineering. Engineering fires back: "This is impossible given how the system actually works." Now product is frustrated, devs are frustrated, stakeholders are disappointed, and the timeline slips. If product had visibility into the actual architecture — the real data model, the real API surface, the real journey flows — they'd design within the constraints of reality instead of against them. This isn't saving a meeting. It's preventing entire project derailments.

**The cost is concrete.** 5 staff members on an hour-long call to explain a flow in dev-speak to a product owner = $500-750 in loaded salary. This happens daily across multiple teams. That's $300-750k/year burned on "how does this work" conversations — and the information degrades ~5% per day until the meeting has to happen again. Engineers should spend their time building, not explaining.

**The root cause is the same in every case: the source of truth (production code) is disconnected from the tools people use to understand the system (documents, diagrams, wikis).**

---

## The Product

Archway is a hosted SaaS platform that connects to an organization's GitHub repositories, reads their production codebases, and generates a living, interactive map of their entire product architecture — always current, always reflecting what's actually deployed.

### Core Principles

1. **Production is sacred.** The production view is a read-only, dynamically generated reflection of merged code. No human can manually edit, curate, or "fix" what production shows. The moment a human can override the generated view, drift begins and the tool's core value is destroyed.

2. **Generated, never authored.** Every visualization — API maps, data models, entity relationships, state machines, user journeys — is extracted from code, not hand-drawn. The system does the work, not the user.

3. **Multi-repo, multi-platform aware.** Real enterprises don't have "a codebase." They have 10-15 repos spanning Go APIs, Next.js frontends, React Native apps, internal tools, infrastructure-as-code, and more. Archway maps repos to roles and traces connections across all of them.

4. **Deep, not wide.** The interaction model is progressive drill-down. Start with a user journey. Click into the data model. Follow a relationship. Land on an endpoint. Jump to the actual source code on GitHub. As deep as you need to go.

5. **Environments and versioning are first-class.** Production, staging, feature branches — all visualized, all diffable. "What changed between these two releases" is a visual overlay, not a commit list.

---

## Proof of Concept: Nessi Docs

Archway isn't theoretical. The proof-of-concept exists and is in daily use.

**Nessi Docs** (`nessi-docs` repository) is an internal documentation and product visualization app built for the Nessi fishing marketplace. It implements the core Archway concept against a single codebase:

### What's Already Built and Working

- **User journey canvases** — interactive pan/zoom graph visualizations showing complete user flows across client, server, background processes, and integrations. Entry nodes, step nodes, decision nodes with direction-aware edge routing, animated trace mode, and frosted glass node styling.
- **API map** — auto-extracted endpoint reference with method, path, domain grouping, and deep-link targets.
- **Data model / ERD** — entity table reference with full field definitions, plus interactive entity relationship diagram canvas with category-colored nodes and relationship edges.
- **Lifecycle state machines** — auto-generated state machine canvases showing entity state transitions with list page, switcher navigation, and 7 lifecycles (member, shop, listing, invite, flag, subscription, ownership transfers).
- **Feature domain pages** — feature grouping by business domain with coverage metrics and accordion drill-down.
- **Deep-linking system** — cross-page navigation with hash anchors, auto-expand, highlight animation, and scroll-into-view. Journey node → data model row → API endpoint → source code.
- **Global search** — search across all extracted data (journeys, entities, endpoints, features).
- **Changelog** — generated from PR metadata with conventional commit parsing and domain filtering.
- **System architecture diagrams** — interactive canvas visualizations of tech stacks (layered dependency graphs), data flows (directional data movement), and pipeline diagrams (agent workflows, CI/CD). Same pan/zoom canvas with trace mode, tooltips, and frosted glass nodes. Already rendering 4 validated diagrams: tech stack, data flow, conductor pipeline, and skill/agent pipeline.
- **Shared canvas infrastructure** — reusable pan/zoom provider, dot grid backgrounds, minimap, toolbar, legend, stagger entry animations. Used by journeys, ERD, lifecycles, and architecture canvases.
- **Impact analysis (trace mode + rich tooltips)** — already implemented across all canvases. Click any node to activate trace mode: the canvas isolates all connected nodes and edges, dims everything else, and animates the active connections. This is the "what connects to this thing?" view. Rich tooltips on every node type provide forward connections with deep-links:
  - **Journey step tooltips** — show the endpoint being called, code reference, UX behavior (toasts, redirects, modals, emails), error cases with HTTP status codes, and link to the production page where the client-side interaction lives. Deep-links to the API map and data model.
  - **Entity tooltips** — show field/RLS/index/trigger counts, purpose, primary key, foreign key relationships, and API endpoints that touch this table (via cross-links system). Deep-link to the data model detail view.
  - **Lifecycle state tooltips** — show incoming and outgoing transitions, terminal state indicators, and the lifecycle's purpose.
  - **Cross-links engine** (`cross-links.ts`) — a computed bidirectional index that maps entities ↔ endpoints. `getEndpointsForTable()` returns all endpoints touching a table; `getTablesForEndpoint()` returns all tables an endpoint touches. Path-to-table matching uses compound matching, direct matches, and prefix/suffix matching to resolve the relationships automatically.

  The combination of trace mode (visual isolation of connected nodes) and rich tooltips (forward connections with deep-links to every related artifact) means impact analysis is already a working feature — "click anything, see everything it connects to, click through to the source."

- **GitHub source linking** — every artifact links directly to its source code on GitHub. Journey steps link to feature code, API endpoints link to route files, data model entities link to migration files, lifecycle states link to enum definitions. The final stop on the deep-dive chain: journey → data model → endpoint → source code on GitHub. Links open in a new tab showing the exact file on the `main` branch.

### How the Current Pipeline Works

1. **Extraction scripts** in `nessi-web-app` run as individual jobs — each targeting a specific domain (routes, schemas, models, journeys, etc.). These are deterministic, code-based parsers.
2. **Raw data** lands as structured JSON files — true, accurate, directly from production code.
3. **AI journey creation** — the conductor agent (agentic engineering workflow) runs a journey-creation agent before submitting PRs, producing structured journey definitions as a first-class artifact of the development process.
4. **Data sync** — JSON files sync from `nessi-web-app` to `nessi-docs/src/data/generated/` via GitHub Action (with `_meta.json` tracking source commit hash).
5. **Transformer layer** — `src/data/index.ts` imports all raw JSON, computes derived fields (layouts, colors, domain mapping, cross-links), and exports typed data for the UI.
6. **Rendering layer** — Next.js App Router with SCSS Modules renders everything as interactive canvas visualizations with the shared canvas infrastructure.

### What Needs to Change for Enterprise (Nessi → Archway)

| Nessi Docs (current)                           | Archway (enterprise)                                       |
| ---------------------------------------------- | ---------------------------------------------------------- |
| JSON files stored in the repo                  | Database-backed storage (versioned snapshots)              |
| Extraction scripts live inside `nessi-web-app` | Extraction runs externally via GitHub read-only connection |
| Single repo, single codebase                   | Multi-repo, multi-language, multi-platform                 |
| GitHub Action triggers sync                    | GitHub webhooks trigger incremental extraction             |
| One user (Kyle)                                | Multi-tenant with SSO/SAML, RBAC, team workspaces          |
| AI journeys created by conductor agent         | AI journey extraction from arbitrary codebases             |
| Hardcoded to Nessi's code patterns             | Generalized parsers for multiple frameworks/languages      |
| Static site (SSG)                              | Dynamic SaaS application with user state                   |

**The visualization layer, interaction patterns, deep-linking system, and canvas infrastructure are validated and proven.** The gap is generalizing the extraction pipeline and building the multi-tenant platform around it.

---

## How It Works

### 1. Connect

- Organization connects their GitHub org (or GitLab/Bitbucket — GitHub first).
- Admin maps repositories to roles: `this repo = Go API monolith`, `this repo = Next.js web app`, `this repo = React Native mobile`, `this repo = internal restaurant tools`, `this repo = IaC/platform`.
- No write access required. Read-only connection. No scripts, files, or configuration injected into customer repos.

### 2. Extract

Extraction is a layered system, running externally against the connected repos:

**Layer 1 — Deterministic Parsers (no AI)**

- Route definitions (Express, Gin, Next.js App Router, FastAPI, etc.)
- ORM/schema definitions (Prisma, GORM, SQLAlchemy, TypeORM, ActiveRecord, etc.)
- OpenAPI/Swagger specs (even stale ones, as a starting point)
- Middleware chains and proxy mappings
- Database migrations and entity relationships
- State machine definitions
- IaC resource definitions
- Background job/cron configurations
- Event/queue producer-consumer mappings

This layer is reliable, fast, and has zero AI dependency. It produces: API maps, data models, ERDs, lifecycle/state machine diagrams, proxy layer visibility, and infrastructure topology. This is the same approach used in the Nessi Docs proof-of-concept — deterministic scripts pulling raw data from code — generalized to support multiple frameworks and languages.

**Layer 2 — AI-Powered Flow Tracing**

Not a single AI pass that "one-shots" the entire system. A systematic, auditable pipeline:

1. **Domain-by-domain mapping.** Extraction agents work one domain at a time (auth, checkout, ordering, etc.), not the entire codebase at once. Each domain is a bounded, manageable problem.

2. **Deterministic call-graph tracing does 95% of the work.** AST parsing, import resolution, call graphs — follow the wires from a button click to a fetch call to a route handler to a DB write to an event emission. These are concrete code artifacts, not inferences. AI fills the remaining gaps: cross-repo boundary hops, dynamic dispatch resolution, config-driven routing, event-driven chains where the connection isn't explicit in imports.

3. **AI for humanization.** Once flows are mapped, AI translates technical function names and code references into human-readable language. `handleSubmit` → "User clicks Buy Now." `sendOrderConfirmation` → "Confirmation email sends to customer." The underlying data is deterministic. The framing is AI-assisted. This is how the Nessi proof-of-concept already works — raw data is true and accurate from code, AI draws the experience maps.

4. **Independent validation pass.** A second fleet of agents, with no knowledge of what the first pass produced, traces the same flows independently. Where the two passes agree, confidence is high. Where they disagree, the flow is flagged for re-analysis. This is how you reach 99.99% — not by trusting one pass, but by cross-validating.

5. **Continuous accuracy monitoring.** Full-system validation scans run on regular intervals (monthly or configurable). If accuracy drops below threshold on any domain, trigger a targeted rescan. The system self-heals. Every node in every journey is backed by a file reference in the source code — fully auditable.

The result: a systematic, repeatable, looping pipeline that maps the product domain by domain and validates itself until accuracy targets are met. Not magic — engineering.

**Layer 3 — Visual Capture (future)**

- Playwright-based screenshots of production UI during extraction
- Tied to journey nodes — "user clicks Buy Now" shows the actual screenshot of that exact button on the actual checkout page, not a wireframe, not a Figma mock
- Stored as versioned snapshots alongside architecture data
- Eliminates ambiguity — "add to cart" means nothing at an enterprise with 30 add-to-cart buttons across different products, platforms, and viewports. The screenshot tied to the journey node removes all doubt.
- Bonus: visual regression detection almost for free — if the screenshot changes between versions, it's visible in the diff

### 3. Sync

- GitHub webhook fires on PR merge to trunk
- Incremental re-extraction runs against affected repos only (not full rebuild every time)
- First scan is comprehensive (domain by domain until the platform is fully mapped)
- Subsequent updates are surgical — only re-extract what the PR touched
- Production view updates automatically
- Every extraction produces a versioned snapshot stored in the database
- Changelog generated from PR metadata (conventional commits, PR titles, labels)

### 4. Render

- Hosted web application with interactive canvas visualizations
- Progressive deep-linking: journey → data model → relationship → endpoint → source code on GitHub
- Global search across the entire product architecture
- Filterable by product line, platform, domain, environment
- AI translates technical architecture into language product, QA, and leadership can digest — non-tech-speak presentation of technical realities

---

## Environments & Diffing

### Environments

- **Production** — read-only, sacred, always current with merged code
- **Staging/Pre-prod** — extracted from staging branches, shows what's about to ship
- **Feature branches** — extracted on-demand, shows proposed changes in architectural context

### Visual Diffing

- Overlay any two environments or versions
- See added/removed/modified nodes across journeys, data models, API surfaces
- "This release adds 2 endpoints, modifies the order lifecycle, and touches the checkout journey at these 3 nodes"
- Red/green visual diff on the canvas level
- Pre-release review: staging vs production before cutting a release — a release review that actually means something, not a PR list

### Branch Exploration

- Users can create exploratory branches from the production view
- "What if we added a payment provider here? A new entity there?" — sketch on top of the real system, not a blank canvas
- Diff exploratory branch against production to visualize proposed architectural changes
- Grounded in reality — every exploration starts from what actually exists

### AI Agent Sandbox

Via the Archway MCP, AI coding agents can create sandbox environments to validate their own work before opening a PR:

1. **Query** — agent asks Archway for the current architecture around the feature it's building
2. **Build** — agent writes code with full awareness of existing journeys, endpoints, tables, and relationships
3. **Validate** — agent runs extraction against its own changes in a sandbox branch, sees the architectural impact visually — new nodes, modified journeys, affected endpoints
4. **PR** — agent opens the PR with confidence; Archway bot comments the before/after architecture diff for human reviewers
5. **Merge** — production view updates automatically

The AI reviews its own architectural impact before a human ever sees the PR. Archway becomes the architecture layer of the AI engineering stack — present at every stage from planning to production.

---

## AI Systems & Workflow Visualization

Archway doesn't just map code architecture — it maps AI tooling architecture too. As enterprises adopt agentic engineering, their AI systems become a critical part of the product that nobody can see end to end.

### What Gets Visualized

- **Agentic engineering pipelines** — ticket-to-PR conductors, plan-architect → task-executor → review-orchestrator flows. Who builds what, which model runs where, what quality gates exist, how failures escalate.
- **Department-specific AI workflows** — engineering has conductors, QA has test-case generators (e.g., PRD/ticket → Xray test cases), product has PRD-to-spec pipelines, design has UX research agents. Each team's automation becomes visible across the organization.
- **Custom plugin/skill ecosystems** — enterprises build internal AI tooling (slash commands, expert skills, domain-specific agents). Archway maps what exists, what triggers what, and how they compose.
- **AI model allocation** — which agents use which models (Opus for planning, Sonnet for execution), cost implications, performance characteristics.

### Why This Matters

Most enterprises adopting AI have no visibility into their AI systems as a whole. Individual teams build agents and workflows in isolation. Nobody knows:

- What AI tools exist across the organization
- How they interconnect
- What models they use and at what cost
- What happens when one fails
- Whether two teams built the same thing independently

Archway surfaces this the same way it surfaces code architecture — extracted from the repos where the AI tooling is defined, always current, always navigable.

### Already Proven in the POC

The Nessi Docs prototype already renders interactive architecture diagrams for:

- **Conductor pipeline** — autonomous ticket-to-PR state machine with 8 agents, escalation paths, and quality gates
- **Skill & agent pipeline** — 13 developer commands routing through expert skills, design intelligence agents, testing agents, and outputs
- **Tech stack** — 5-layer technology dependency graph
- **Data flow** — directional data movement between browser, server, and database

These use the same canvas infrastructure (trace mode, tooltips, frosted glass nodes, animated flow edges) as user journeys and entity relationships.

---

## Product Segmentation

Enterprises don't think in repos. They think in products and platforms.

### Product Lines

- Map repos and components to product lines: "Catering Web App," "iOS Consumer App," "Restaurant Internal Tools," "Ordering Platform"
- A single journey might span multiple product lines (user orders on web → restaurant tool shows the order → delivery app picks it up)
- Cross-product-line visibility shows how platforms interact

### Filtered Views

- "Show me only the catering web app"
- "Show me staging for the mobile apps"
- "Overlay PR #312 against prod in the React Native flows"
- Segmentation is combinable: product line + environment + version
- Without segmentation, you have a cool visualization. With it, you have a tool that maps to how enterprises actually think about their systems — by product line, by platform, by environment.

---

## Who It's For

Archway is not just for engineers. It's for everyone who needs to understand the product.

### Executive Leadership (COO, CTO, VP Eng)

- New executive onboarding: "here are the 4 platforms we operate, here are the major journeys, here's how restaurant tools connect to the ordering system" — no 3 weeks of engineering briefings needed
- "What does our system actually look like right now?" — answered by opening Archway, not scheduling meetings
- Release reviews grounded in architecture diffs, not PR lists
- Investment decisions informed by actual system complexity
- Talking points about technical innovation backed by the real system

### Product Management

- Domain knowledge of the real production system, not a Figma diagram from 6 months ago
- Understanding non-UI behaviors: when emails fire, how background processing works, what rules apply
- Product owners who don't understand how things are built can see the architecture without reading code — presented in non-tech-speak by the AI presentation layer
- Feature scoping grounded in what actually exists today — design within the constraints of reality instead of against them
- "What do we have in the ordering domain right now?" — answered instantly, accurately

### Design

- Understanding the full flow, not just the screen they're redesigning
- Seeing where their UI connects to server behavior, background jobs, notifications
- Screenshots of production UI tied to journey nodes — see the actual button, not a description of a button
- Figma frame references alongside code references — drift between design intent and production reality becomes visible

### QA / Test Engineering

- Test plans grounded in actual flows, not assumptions or stale specs
- Visibility into non-UI behavior that needs testing — "the endpoint returned 200 but did the data actually get passed to Braze? To the CRM?" Archway shows the full pipeline, not just the API response
- "What does this endpoint actually return?" — answered by the tool, not a Slack DM
- Pre-release diff shows exactly what changed and needs regression testing

### Developers

- Onboarding to unfamiliar parts of the system — especially in multi-repo environments where engineers don't know which repo an endpoint lives in
- Cross-team visibility: "how does the team next to me use this shared table?"
- Proxy layer transparency: see the transformation between frontend API calls and backend endpoints
- Deep-link from a journey node straight to the source code on GitHub
- Impact analysis: "what journeys and flows touch this table I'm about to migrate?"

### AI Coding Agents

- Query architecture via Archway MCP before building features
- File-level, line-level precision: not "the checkout journey exists" but "`BuyButton.tsx:47` calls `createOrder` in `api/orders/route.ts:23` which writes to the `orders` table and triggers `sendConfirmationEmail` in `email/order-confirmation.ts:8`"
- Validate architectural impact in sandbox before opening PRs
- Build with surgical awareness instead of scanning the entire codebase

### C-Suite / Stakeholders

- Product architecture awareness without requiring technical deep-dives
- Compliance and legal: "show me every flow where we collect user data"
- Board-level visibility into technical innovation and system maturity

---

## What It Replaces

| Current State                                              | Archway                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| Stale Confluence docs nobody trusts                        | Living architecture always reflecting production              |
| Unmaintained OpenAPI specs                                 | Auto-extracted API maps updated on every PR                   |
| Manual Miro/FigJam diagrams that drift day one             | Generated journey canvases that can't drift                   |
| Slack DMs asking "what does this endpoint do?"             | Searchable, deep-linked endpoint reference                    |
| Tribal knowledge about non-UI behaviors                    | Visible state machines, background jobs, event flows          |
| "Ask the backend team" for API documentation               | Self-service drill-down from journey to endpoint to source    |
| PR lists as release reviews                                | Visual architecture diffs between environments                |
| Wiki-based onboarding docs                                 | Guided domain exploration of the real system                  |
| Curl commands shared in Slack as API docs                  | Interactive endpoint reference with schemas and relationships |
| Hour-long meetings explaining flows in dev-speak           | Self-service product architecture in non-tech-speak           |
| Product designing features that are technically impossible | Product scoping grounded in the real system architecture      |

---

## Key Features

### v1 — Foundation (Deterministic Extraction)

- GitHub org connection, multi-repo mapping (repos → roles)
- Deterministic extraction: API routes, data models, schemas, ERDs, middleware/proxy chains, state machines
- Interactive canvas visualizations (pan/zoom, deep-linking, trace mode)
- Progressive drill-down: journey → data model → relationship → endpoint → GitHub source
- **Impact analysis (already proven in POC)** — trace mode isolates all connected nodes on click; rich tooltips show forward connections with deep-links to every related artifact; cross-links engine provides bidirectional entity ↔ endpoint mapping; production page links on client-side nodes
- Global search across all extracted data
- Changelog from PR metadata
- Basic product-line segmentation (repo-to-product mapping)
- Enterprise auth (SSO/SAML via Okta, OneLogin, etc.)
- Role-based access control
- SOC 2 Type II compliance

### v2 — AI Journeys & Environments

- AI-powered journey extraction (cross-repo flow tracing via the systematic pipeline described in "How It Works")
- AI humanization layer (technical code references → non-tech-speak)
- Environment support (production, staging, feature branches)
- Visual diffing between any two environments or versions
- Snapshot versioning with time-travel
- Branch exploration mode (sketch on top of production, diff against it)
- **On-demand journey queries** — users define flows that matter to them ("show me all entry points for adding a product to cart"). The system traverses the architecture graph and generates a living journey that stays current with every extraction. Not manual curation — a saved query. Supports forward tracing ("where does this go?"), backward tracing ("how do users get here?"), and cross-cutting queries ("every flow that triggers an email," "every path through the payments service").
- Independent validation agents + continuous accuracy monitoring (monthly full-system rescans)

### v3 — Intelligence & Visual Capture

- AI-powered insights and recommendations ("this auth flow is missing email confirmation," "this table has no API exposure," "terms and conditions checkbox isn't tracked against the user row in the DB")
- Playwright-based production UI screenshots tied to journey nodes — the actual button on the actual page, not a description
- Coverage gap detection (orphan endpoints, unreferenced tables, dead flows)
- Onboarding paths (assign a domain to a new hire, guided exploration of the real system)

### v4 — Integrations & Developer Infrastructure

- **PR impact bot** — GitHub bot comments on every PR with architecture impact summary: "This PR modifies the checkout journey (3 nodes affected), touches the `orders` table, and changes 2 endpoints in the payments API. [View impact →]". Makes Archway visible on every PR review without anyone opening the dashboard.
- **Slack/Teams bot** — "@archway what touches the orders table?" answered inline with formatted response and deep-link. Replaces the "hey backend team, what does this endpoint do?" DMs that happen every day at every company.
- **Archway MCP** — Plug Archway into Claude Code, Cursor, or any AI coding agent. The agent queries product architecture while building: "What does the checkout journey look like? What tables does it touch?" Archway responds with file-level, line-level precision. The AI builds with surgical awareness instead of scanning the entire codebase. When the PR merges, Archway extracts the changes and the architecture updates. Closed-loop flywheel: better architecture awareness → better AI-generated code → cleaner extraction → better architecture awareness. This shifts Archway from "observability tool you look at" to "infrastructure your AI agents depend on."
- **AI Agent Sandbox** — agents can create sandbox branch views, run extraction against their own changes, and validate architectural impact before opening a PR. The AI reviews its own work before a human ever sees it.
- **Figma linking** — Nodes can reference Figma frames (design intent) alongside GitHub files (implementation). Not a sync — a reference. If the design says X but production does Y, that's a finding Archway surfaces, not a bug. Drift between design and production becomes visible information.
- **Collaboration layer** — Comments anchored to specific nodes, shareable deep-links to specific journey views, @-mentions for cross-functional discussion. Not editing the architecture — discussing it. Replaces Slack threads where people screenshot diagrams and draw arrows.

### v5+ — Platform Maturity

- GitLab and Bitbucket support
- Advanced analytics dashboards (architecture complexity trends, cross-team dependency mapping, domain coverage metrics)
- Custom annotations and tagging (non-destructive, layered on top of production view — never modifying the generated data)
- REST API for integrating Archway data into other tools (CI/CD pipelines, project management, incident response)
- Webhook/event system for triggering external workflows on architecture changes
- Mobile-optimized views
- Embeddable widgets for internal dashboards

---

## Competitive Landscape

| Tool                                     | What It Does                               | What It Doesn't Do                                                                                                                                                  |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Swagger / Redocly / Readme**           | API documentation                          | No journeys, no data models, no cross-repo, manual maintenance                                                                                                      |
| **Backstage (Spotify)**                  | Service catalog, developer portal          | No journey visualization, no extraction from code, requires heavy customization, $200k+/yr in engineering time to maintain                                          |
| **Cortex / OpsLevel**                    | Service ownership & catalog ($100-200k/yr) | Shows what exists, not how it connects. No journeys, no architecture visualization                                                                                  |
| **Datadog / New Relic**                  | Runtime observability & monitoring         | Runtime, not architecture. Can tell you a request failed, can't tell you a lifecycle step is missing                                                                |
| **Miro / FigJam**                        | Manual diagramming                         | Drifts immediately, no code connection, manual maintenance                                                                                                          |
| **dbdiagram.io / dbdocs.io**             | ERD visualization                          | Database only, no journeys, no API mapping, no cross-repo                                                                                                           |
| **Eraser.io**                            | AI-generated diagrams                      | Not from production code, point-in-time, manual trigger                                                                                                             |
| **Swimm**                                | Code-coupled documentation                 | Documentation, not visualization. Requires authors.                                                                                                                 |
| **AI chat (Claude, GPT reading a repo)** | One-time answers for one engineer          | Not persistent, not shared, not visual, not diffable, not cross-repo. A product manager can't prompt Claude against the codebase. A new COO can't. A QA lead can't. |

**Archway's unique position:** No existing tool provides auto-generated, always-current, cross-repo product architecture visualization with journey tracing, environment diffing, and progressive deep-linking to source code. GitHub owns code. Datadog owns logs. Sentry owns errors. **Archway owns the product.**

---

## Strategic Considerations

### Open-Source the Extraction Layer

The PostHog/Grafana/Sentry playbook: open-source the deterministic parsers, keep the platform proprietary.

**Why this works:**

- **Enterprise trust** — security teams can audit the exact code that reads their repos. "It's open source, here's what it does" is the fastest path through procurement.
- **Community-contributed parsers** — a Rails dev adds a Rails parser, a Django dev adds Django. The framework coverage problem solves itself over time instead of requiring Archway to build every parser in-house.
- **Developer brand awareness** — open-source projects get talked about, starred, blogged about. Feeds the self-serve funnel for indie/team tiers.
- **The moat stays proprietary** — the platform (multi-tenancy, environments, diffing, AI journey extraction, MCP, collaboration, sandbox) is where the value lives. Parsers are the plumbing.

### Security Architecture — Read, Don't Store

For enterprise trust, the extraction model should be:

- Archway reads source code during extraction in an ephemeral environment
- Extraction produces structured metadata (route definitions, schemas, relationships, journey graphs)
- Only the metadata is stored — **never raw source code**
- The ephemeral environment is destroyed after extraction completes
- Deep-links to source code point to GitHub (where the code already lives behind their own access controls)

"We never store your source code" is a one-line answer to the security team's first question.

### Competitive Moat

The honest question: what stops GitHub, Datadog, or a well-funded startup from building this?

**GitHub** thinks in repos, not products. Their mental model is code → PR → merge → deploy. Archway's mental model is "your product is 12 repos and here's what they do together." This cross-repo, product-level view is fundamentally different from how GitHub sees the world — it's also why Backstage exists as a separate product despite GitHub having all the raw data.

**Datadog** thinks in runtime. Requests, traces, logs, errors. They can tell you a request failed. They can't tell you a lifecycle step is missing from a journey. Architecture-time vs runtime is a different lens entirely.

**Sentry** thinks in errors. Same runtime orientation — what went wrong, not what exists.

**Archway thinks in product.** It rounds out the suite. These are complementary, not competitive.

The moat deepens with every parser contributed (open-source network effects), every enterprise onboarded (framework coverage breadth), and every validation cycle completed (extraction accuracy improvements).

### Why AI Doesn't Commoditize This

The objection: "Can't an engineer just ask Claude to read the repo and explain the checkout flow?"

Yes — and that gives one person a one-time answer in a chat thread that dies. It's not persistent, not shared, not visual, not diffable, not cross-repo, and nobody except that engineer can use it. A product manager can't prompt Claude against the codebase. A new COO can't. A QA lead can't. And even the engineer would need every repo cloned locally with an AI agent capable of tracing across all of them — then the output is a mermaid diagram in a terminal, not a navigable product with environments, overlays, and collaboration.

Archway is a shared, persistent, living product that serves the entire organization. An AI chat response serves one person once. These are fundamentally different things.

---

## Founding Narrative

"I was building a consumer marketplace using AI coding agents — an agentic engineering workflow where Claude builds features from specs with high accuracy. The agents were producing code faster than I could track what was being built. I needed to see the whole picture: every user journey, every API endpoint, every data relationship, how they all connect. So I built a tool that dynamically generates that picture from production code.

I couldn't find anything like it. OpenAPI spec covers APIs but not journeys. Miro covers diagrams but drifts immediately. Backstage covers service catalogs but not product architecture. Nothing showed me the complete, always-current, interactive picture of what my product actually is.

So I built it. Interactive canvases for user journeys. Auto-extracted API maps and data models. Entity relationship diagrams. State machine visualizations. Deep-linking across all of them — click a journey node, dive into the data model, follow a relationship to an endpoint, jump to the source code. All generated from production code, updated on every PR, zero manual maintenance.

Then I realized: every engineering team has this problem. And with AI agents accelerating code production, the gap between 'what we built' and 'what we understand about what we built' is growing fast. The tool I built for myself is the tool every enterprise needs."

---

## Why Now

Four market forces make this product viable today in a way it wasn't 3 years ago:

1. **Agentic engineering is accelerating code production.** Teams using AI-assisted development are shipping faster than humans can track. The gap between "what we built" and "what we understand about what we built" is growing. Archway closes that gap.

2. **AI can now read and reason about code at scale.** The journey extraction layer — tracing cross-repo execution paths — is possible because LLMs can follow call chains, identify patterns, and produce structured output from code. This capability didn't exist at production quality until recently.

3. **Multi-platform complexity is increasing.** Web, mobile, internal tools, APIs, microservices, serverless, IaC — the number of repos and platforms per company is growing. The "one person who knows the whole system" doesn't exist anymore. The tool that replaces that person has a massive market.

4. **Vibe coding is creating codebases their creators don't understand.** Solo developers and startups are using AI agents to generate entire applications in hours. The result is working software that nobody fully comprehends — 50 endpoints, 30 tables, auth flows that were never explicitly designed. "What did my AI just build?" is a question being asked right now with no good answer. Archway answers it.

---

## Pricing & Go-to-Market

### Tier Structure

| Tier           | Price                 | Target                                        | Includes                                                                                                                                                         |
| -------------- | --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Free Trial** | $0 / 7 days           | Anyone                                        | Full features, 1 repo — experience the product before committing                                                                                                 |
| **Indie**      | $100/mo               | Solo devs, vibe coders, early-stage startups  | 1-3 repos, 1 product line, core visualizations (API map, data model, ERD, journeys), changelog, search                                                           |
| **Team**       | $200-400/mo           | Growing startups, small eng teams (5-20 devs) | 5-10 repos, multiple product lines, environments, basic diffing, snapshot versioning                                                                             |
| **Enterprise** | Custom ($150-200k/yr) | Large orgs (50+ engineers, multi-platform)    | Unlimited repos, SSO/SAML, RBAC, full environment diffing, product-line segmentation, impact analysis, AI agent sandbox, dedicated support, SLAs, data isolation |

### Go-to-Market Strategy

**Product-led growth feeds enterprise sales.** The free trial and indie tier create a self-serve funnel — developers try it, see value, upgrade. This builds a user base and brand without a sales team. When those users' companies grow, or when an enterprise engineering leader sees a demo from someone on their team already using it, the enterprise conversation starts warm.

**First 5 enterprise customers come from Kyle's network.** Principal Engineer at a large enterprise, 15+ years in the industry, direct relationships with engineering leadership at multiple companies. The first design partners don't require cold outreach.

**The vibe coding angle is a marketing wedge.** "What did your AI just build?" is a hook that resonates immediately with the current zeitgeist. It drives indie/team tier adoption and gets the product talked about, while the enterprise tier is the revenue engine.

**The indie tier is the Datadog/Slack/GitHub playbook.** Startup uses Archway at $100/mo. Startup grows to 200 people. They're already on Archway. They upgrade to enterprise. No sales cycle — they grew into it.

### Bootstrap Path

**Phase 1 — Prove It (Months 1-3)**

- Pilot at CAVA against 1-2 repos (float infra costs personally)
- Produce something visibly useful: API map, data model, ERD for the Go API monolith
- Show it to Sr. Dir of Engineering. Not a sales pitch — "look what I built, look what it shows us"
- Refine based on real feedback from a real enterprise codebase
- Validate willingness to pay with 3-4 VP/CTO-level contacts at other enterprises

**Phase 2 — First Revenue (Months 4-8)**

- Expand CAVA pilot if there's internal pull
- Reach into network for 1-2 additional design partners
- Target: 2-3 paying customers at $50-100k/yr (early adopter pricing, v1 feature set)
- Revenue covers infrastructure costs and validates willingness to pay

**Phase 3 — Product-Market Fit (Months 9-18)**

- AI journey extraction layer ships (v2)
- Environments and diffing ship
- Self-serve indie/team tiers launch ($100-400/mo)
- Target: 5-10 enterprise customers, growing self-serve base
- At this point: either profitable and growing without dilution, or raise from a position of strength with revenue and proven customers

**Phase 4 — Scale (18+ months)**

- Enterprise sales team
- SOC 2 Type II certification
- Integrations layer (PR bot, Slack bot, MCP)
- Open-source extraction parsers
- Category leadership in product observability

---

## Open Questions & Risks

### Technical Risks

1. **AI extraction accuracy** — If the AI hallucinates a journey that doesn't exist, trust is destroyed. The accuracy bar is 99.99% — not 85% with a confidence badge. 80% accurate workflows aren't worth $200k/yr. Mitigation: the extraction pipeline described in "How It Works" is designed for this — deterministic call-graph tracing does 95% of the work, AI fills gaps, independent validation agents cross-check, and monthly full-system rescans self-heal drift. Every node is backed by a file reference. The product that ships 100 journeys at 99.99% accuracy beats the one that ships 500 at 85%.

2. **Language/framework coverage** — Deterministic parsers need to support the frameworks enterprises actually use. Go, Python, Java, TypeScript, Ruby, Kotlin — each has its own patterns for routes, schemas, and middleware. This is a long tail of parser development. Mitigation: open-source parsers invite community contributions; start with the 3-4 most common stacks (TypeScript/Next.js, Go, Python, Java) and expand from there.

3. **Scale** — A large enterprise might have millions of lines of code across 15+ repos. Extraction needs to be fast enough to run on every PR merge without blocking workflows. Incremental extraction (only re-process changed files) is essential. Full system scans run on intervals, not on every PR.

4. **Proxy layer complexity** — Tracing the data transformation through proxy/BFF layers (Next.js API routes, GraphQL resolvers, API gateways) is one of the highest-value features and also one of the hardest extraction problems. These layers often transform, aggregate, or rename data in ways that break simple call-graph tracing.

### Business Risks

1. **AI infrastructure dependency** — The journey extraction layer depends on AI providers. If costs spike or availability drops, the core differentiator is affected. Mitigation: the deterministic layer provides standalone value without any AI dependency; AI is additive for v1, essential for v2+. The AI extraction runs at build-time (not runtime), so if AI providers vanish, the last extraction still works — the product degrades gracefully, it doesn't die.

2. **Security and procurement** — Reading customer codebases requires extraordinary trust. SOC 2 Type II is table stakes. Some enterprises will require on-prem or VPC deployment options. This is a real investment ($50-100k and 6-12 months for the initial audit). The "read, don't store" security architecture helps significantly.

3. **Enterprise sales cycles** — $150-200k/yr deals take 3-9 months to close. This requires runway, sales engineering capacity, and patience. The product needs to demo well and survive a technical evaluation. Mitigation: bootstrap from indie/team tier revenue and Kyle's network; don't depend on enterprise deals for early survival.

4. **Category creation** — "Product observability" isn't an established category with an existing budget line item. This means no incumbent to displace, but also means the market needs to be educated. Mitigation: the ROI math is concrete ($300-750k/yr in wasted explanation meetings vs $150k for Archway), and the problem is immediately recognizable to anyone who's lived it.

5. **"Vitamin vs painkiller" risk** — Documentation drift is chronic pain, not acute. People have lived with it for decades. The question is whether anyone feels this pain acutely enough to champion a $150-200k purchase. Mitigation: the framing isn't "better docs" — it's "reduced failed handoffs, faster onboarding, fewer wasted meetings, AI agent infrastructure." Each of these is quantifiable and has a specific champion (VP Eng for onboarding, Product Lead for handoff failures, Engineering Manager for meeting overhead).

### Open Questions

1. **On-prem / self-hosted option** — Some enterprises (finance, healthcare, defense) will never allow code to leave their infrastructure. Is a self-hosted deployment option necessary for the target market, or can the "read, don't store" architecture satisfy security requirements?

2. **Team** — Building this requires backend/infrastructure engineers (extraction pipeline, GitHub integration, multi-tenant platform), frontend engineers (canvas visualizations, the rendering layer), AI/ML engineers (journey extraction and validation), and enterprise go-to-market (sales, security compliance). What does the founding team look like? Can Kyle build the v1 solo while employed, or does this require a co-founder from day one?

3. **Name** — "Archway" is the working name. Evokes architecture (arch), pathways/journeys (way), and a structural opening to see what's on the other side. Clean, one word, no major conflicts in the dev tools space. Domain availability TBD.

---

## The Bottom Line

The prototype exists and works. The visualization layer is proven. The data model is sound. The interaction patterns (deep-linking, canvas navigation, progressive drill-down) are validated through daily use on a real product. The extraction pipeline — deterministic scripts pulling raw data from code, AI drawing the experience maps — is the same approach, proven at small scale, that Archway generalizes to enterprise.

The path from working prototype to enterprise product requires:

- Generalizing extraction from one codebase to many (multi-language, multi-framework)
- Building the GitHub integration and multi-repo orchestration layer
- Adding environments, versioning, and visual diffing
- Achieving enterprise security compliance (SOC 2, SSO/SAML, data isolation)
- Proving AI journey extraction accuracy at a level enterprises can trust (99.99%)

The competitive landscape is empty at this intersection. The problem is universal and expensive. The timing — with agentic engineering accelerating code production and vibe coding creating codebases nobody fully understands — is right.

### The Math

| Scenario                          | ARR    | Valuation (10-15x) |
| --------------------------------- | ------ | ------------------ |
| 5 enterprise clients @ $175k avg  | $875k  | $8.7-13.1M         |
| 10 enterprise clients @ $175k avg | $1.75M | $17.5-26.2M        |
| 10 enterprise + self-serve base   | $2-3M  | $20-45M            |

Potential acquirers: GitHub, Atlassian, Datadog, GitLab, JetBrains — any platform where "product observability" is a natural extension.

Alternatively: $1-2M ARR with low overhead is a highly profitable lifestyle business with no dilution and no boss.

The prototype exists. The UI is proven. The market is real. The question is execution.
