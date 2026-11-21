/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ── Cross-workspace isolation (DESIGN 10.4) ─────────────────────────────

    {
      name: "shared-no-apps",
      comment: "packages/shared must not import from any app (DESIGN 10.4)",
      severity: "error",
      from: { path: "^packages/shared/" },
      to: { path: "^apps/" },
    },
    {
      name: "web-no-api",
      comment: "apps/web must not import from apps/api (DESIGN 10.4)",
      severity: "error",
      from: { path: "^apps/web/" },
      to: { path: "^apps/api/" },
    },
    {
      name: "api-no-web",
      comment: "apps/api must not import from apps/web (DESIGN 10.4)",
      severity: "error",
      from: { path: "^apps/api/" },
      to: { path: "^apps/web/" },
    },

    // ── Layer rules (DESIGN 4.2, 10.4) ──────────────────────────────────────

    {
      name: "domain-purity",
      comment:
        "Domain functions may not import services, repositories, routes, db or " +
        "infrastructure — only packages/shared, errors.ts and own module types (DESIGN 4.2)",
      severity: "error",
      from: { path: "\\.domain\\.ts$" },
      to: {
        path: "\\.(?:service|repository|routes|register)\\.ts$|/db/|/middleware/|/container\\.ts$|/app\\.ts$|/main\\.ts$|/config\\.ts$|/logger\\.ts$|/route-registry\\.ts$|/respond\\.ts$",
      },
    },
    {
      name: "domain-no-infrastructure-npm",
      comment:
        "Domain files must not import HTTP or database npm packages — they must stay pure (DESIGN 4.2)",
      severity: "error",
      from: { path: "\\.domain\\.ts$" },
      to: { dependencyTypes: ["npm"], path: "[/](?:express|mongodb)[/@]" },
    },
    {
      name: "routes-no-db",
      comment: "Route files must not reach the DB layer directly — only via services (DESIGN 4.2)",
      severity: "error",
      from: { path: "\\.routes\\.ts$" },
      to: {
        path: "\\.repository\\.ts$|^apps/api/src/db/",
      },
    },
    {
      name: "routes-no-mongodb",
      comment: "Route files must not import the MongoDB driver (DESIGN 4.2)",
      severity: "error",
      from: { path: "\\.routes\\.ts$" },
      // pnpm resolves to node_modules/.pnpm/mongodb@x.y/node_modules/mongodb/...
      // so we match the package name as a path segment, not a prefix.
      to: { dependencyTypes: ["npm"], path: "[/]mongodb[/@]" },
    },
    {
      name: "service-no-express",
      comment:
        "Service files must not import express — services are framework-agnostic (DESIGN 4.2)",
      severity: "error",
      from: { path: "\\.service\\.ts$" },
      to: { dependencyTypes: ["npm"], path: "[/]express[/@]" },
    },
    {
      name: "service-no-mongodb",
      comment:
        "Service files must not import mongodb — only repositories and db/ touch the driver (DESIGN 4.2)",
      severity: "error",
      from: { path: "\\.service\\.ts$" },
      to: { dependencyTypes: ["npm"], path: "[/]mongodb[/@]" },
    },
    {
      name: "no-mongodb-outside-db",
      comment: "Only repository files and db/ may import the MongoDB driver (DESIGN 4.2, 10.4)",
      severity: "error",
      from: {
        path: "^apps/api/src/",
        pathNot: "\\.repository\\.ts$|^apps/api/src/db/|^apps/api/src/test-support/",
      },
      to: { dependencyTypes: ["npm"], path: "[/]mongodb[/@]" },
    },

    // ── Web API client isolation (DESIGN 10.4, 15.4) ────────────────────────

    {
      name: "web-api-client-isolation",
      comment:
        "Only feature api.ts files may import the api-client; components, pages and lib " +
        "helpers must not (DESIGN 10.4)",
      severity: "error",
      from: {
        path: "^apps/web/src/(?:components|pages)/",
      },
      to: { path: "apps/web/src/lib/api-client\\.ts$" },
    },

    // ── Web feature isolation (DESIGN 10.4, 15.4) ───────────────────────────
    // A feature may cross-call another feature only through its api.ts.
    // Note: dependency-cruiser cannot distinguish same-feature from
    // cross-feature imports without backreference support in to.path.
    // This rule is intentionally deferred until the first features/ folders are
    // created and can be tested; it passes vacuously on the current codebase.
    // Add per-feature exceptions (or use a custom reporter plugin) at that point.

    // ── No circular imports (DESIGN 10.4) ────────────────────────────────────

    {
      name: "no-circular",
      comment: "Circular imports are not allowed anywhere in the codebase (DESIGN 10.4)",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],

  options: {
    // Extend the resolver with TS extensions so NodeNext .js→.ts mapping works.
    // express and mongodb are hoisted to root node_modules/ via .npmrc so that
    // the service and route rules can resolve them from the monorepo root.
    enhancedResolveOptions: {
      extensions: [".js", ".ts", ".tsx", ".cjs", ".mjs"],
    },
    // Don't traverse into node_modules or build output, but DO track the
    // dependency edge so rules on dependencyTypes: ["npm"] work correctly.
    doNotFollow: {
      path: "node_modules|dist",
    },
    // Fully exclude these (not application code).
    exclude: {
      path: "\\.dependency-cruiser\\.cjs|docs/openapi\\.json",
    },
  },
};
