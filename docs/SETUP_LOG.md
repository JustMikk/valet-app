# Setup Log (build handoff §3)

Environment: Windows 11, Node 24.15.0, pnpm 12.11.2, git 2.53.0.

## Commands run

| Step | Command | Result |
|---|---|---|
| 3.1 scaffold | `pnpm dlx create-next-app@latest valet-workforce --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --no-turbopack --skip-install --yes` (in a scratch dir, then copied in: the project folder name has a space and already had a README) | next 16.4.2, react 19.3.0, tailwindcss 4.3.3, typescript 5.9.3 |
| 3.1 export | `output: 'export'` in `next.config.ts`; `pnpm build` | ✅ `out/` produced (after removing `cacheComponents`, see ADR-001) |
| 3.1 shadcn | `pnpm dlx shadcn@latest init -d --pointer` | ✅ `components.json` (style `base-nova`, base `base`), shadcn 4.22.1 |
| 3.2 agent-skills | `/plugin marketplace add addyosmani/agent-skills` → `/plugin install agent-skills@addy-agent-skills` | ⏳ **pending — must be run by the owner** (interactive slash command) |
| 3.3 shadcn skill | `pnpm dlx skills add shadcn/ui -a claude-code -y --copy` (skills CLI 1.7.4) | ✅ `.claude/skills/shadcn`, `.claude/skills/migrate-radix-to-base`, `skills-lock.json`; content reviewed |
| 3.4 shadcn MCP | `pnpm dlx shadcn@latest mcp init --client claude` | ✅ `.mcp.json` written · ⏳ restart + `/mcp` check pending |
| 3.5 Aceternity | `"@aceternity": "https://ui.aceternity.com/registry/{name}.json"` in `components.json` | ✅ |

## Verification checklist (§3.6)

- [x] `components.json` exists and includes the `@aceternity` registry
- [ ] `/plugin` shows `agent-skills`; `/spec`, `/plan`, `/build`, `/test`, `/constraints`, `/review` available — **pending owner**
- [x] shadcn skill installed; `pnpm dlx shadcn@latest info --json` runs
- [ ] `/mcp` shows `shadcn` Connected — **pending restart**
- [~] Registry queries: CLI verified both registries (`shadcn view button` ✅, `shadcn search @aceternity -q card` ✅ 100 results). Repeat through the MCP after restart.
- [x] This log
