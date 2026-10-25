// Layer boundaries from the build handoff §5.3 (CONSTRAINTS.md: Architecture).
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Cycles make modules impossible to reason about or test in isolation.",
      from: {},
      to: { circular: true },
    },
    {
      name: "feature-internals-private",
      severity: "error",
      comment:
        "Features import each other only through the other feature's public index.ts (handoff §5.3).",
      from: { path: "^src/features/([^/]+)/" },
      to: {
        path: "^src/features/([^/]+)/.+",
        pathNot: ["^src/features/$1/", "^src/features/[^/]+/index\\.tsx?$"],
      },
    },
    {
      name: "ui-is-vendor-layer",
      severity: "error",
      comment:
        "components/ui holds vendor primitives only: no product logic, shared or feature code.",
      from: { path: "^src/components/ui/" },
      to: {
        path: "^src/(features|components/shared|lib/(data|platform|realtime|permissions|tenant))/",
      },
    },
    {
      name: "shared-has-no-domain",
      severity: "error",
      comment: "components/shared composes ui/ into generic building blocks with no domain logic.",
      from: { path: "^src/components/shared/" },
      to: { path: "^src/(features|app|lib/(data|realtime|permissions))/" },
    },
    {
      name: "lib-is-below-ui",
      severity: "error",
      comment:
        "lib/ is the foundation layer; it must not depend on components, features or routes.",
      from: { path: "^src/lib/" },
      to: { path: "^src/(components|features|app)/" },
    },
    {
      name: "routes-are-thin",
      severity: "error",
      comment: "Nothing imports from app/ route files; routes compose features, not the reverse.",
      from: { pathNot: "^src/app/" },
      to: { path: "^src/app/" },
    },
    {
      name: "server-is-private",
      severity: "error",
      comment:
        "src/server is the demo API's server-only layer (ADR-012): only route handlers under src/app/api reach it, never UI, hooks or lib code that ships to the browser.",
      from: { pathNot: "^src/(server|app/api)/" },
      to: { path: "^src/server/" },
    },
    {
      name: "server-has-no-ui",
      severity: "error",
      comment:
        "The server layer depends on lib/ (shared schemas, pure logic) only, never on the UI.",
      from: { path: "^src/server/" },
      to: { path: "^src/(components|features|hooks|app|mocks)/" },
    },
    {
      name: "no-orphans",
      severity: "error",
      comment: "Dead modules are dead code (handoff §7).",
      from: {
        orphan: true,
        pathNot: ["\\.d\\.ts$", "\\.test\\.tsx?$", "^src/app/", "(^|/)tsconfig\\.json$"],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "\\.test\\.tsx?$" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
    },
  },
}
