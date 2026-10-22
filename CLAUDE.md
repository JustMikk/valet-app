# Valet Workforce — frontend

@AGENTS.md

Mobile-first PWA (staff / admin / platform) on Next.js App Router + TypeScript + Tailwind v4 + shadcn (Base UI). Frontend only; backend is mocked behind `src/lib/data` interfaces.

## Sources of truth
- How to build: [docs/inputs/Valet_Workforce_Frontend_Build_Handoff_for_Claude_Code.md](docs/inputs/Valet_Workforce_Frontend_Build_Handoff_for_Claude_Code.md)
- Product behavior: [docs/inputs/product-spec.md](docs/inputs/product-spec.md)
- Visuals: [docs/inputs/DESIGN_README.md](docs/inputs/DESIGN_README.md), [docs/inputs/SCREENS.md](docs/inputs/SCREENS.md), [docs/inputs/designs/](docs/inputs/designs/). App screens beat `Design System.dc.html` where they differ (OPEN_QUESTIONS D1).
- Decisions: [docs/DECISIONS.md](docs/DECISIONS.md) · Questions: [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) · Setup: [docs/SETUP_LOG.md](docs/SETUP_LOG.md)

If the spec and the design conflict or are silent: stop, ask, log in OPEN_QUESTIONS. Never invent behavior or copy.

## Hard rules
- Static export must build (`output: 'export'`): no Server Actions, route handlers on Request, proxy/middleware, ISR, cookies, rewrites/redirects.
- Device APIs (`navigator.geolocation`, `getUserMedia`, `Notification`, `indexedDB`) only inside `src/lib/platform/*` web providers.
- Tokens only: no hex values, magic numbers or raw font sizes in components. Tenant accent comes from CSS variables at the root.
- Status is never color alone: icon + words.
- No bill rates in staff-facing types; no pay rates in venue/invoice types.
- TS strict, no `any`, no `@ts-ignore`, Zod at every boundary, components ≤ ~250 lines, `cn()` + `cva` for variants.
- `components/ui` = vendor layer (CLI-installed, minimal documented edits). `components/shared` = our composites. `features/*` import each other only through `index.ts`.

## Workflow
- Component sourcing: shadcn registry first → Aceternity (wrapped in `components/shared`) → custom from primitives. Record the source in `docs/DESIGN_INTAKE.md`.
- Per slice: `/spec` → `/plan` → owner approval → `/build` (TDD, small commits) → `/test` → `/review`.
- Verify library APIs against bundled docs (`node_modules/next/dist/docs/`) or official docs, not memory.
- Commands: `pnpm dev` · `pnpm build` (static export to `out/`) · `pnpm lint`.
