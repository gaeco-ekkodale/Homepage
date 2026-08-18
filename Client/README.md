# Homepage Client

The gaeco start page as a micro-frontend: a four-step getting-started checklist whose status is
derived live from the platform services.

## Run locally

```bash
npm ci
npm run dev          # http://localhost:3136
```

The standalone shell mounts the plugin at `/` and at `/${VITE_MOUNT_PATH}`, so `npm run dev` lands
directly on the page. Service URLs come from `.env`; comment one out to see how that step degrades
to "status unknown".

## Environment variables

Defined centrally in [`env.d.ts`](./env.d.ts). Only entries with the value `null` are required;
everything the page can live without carries a default.

| Variable | Purpose |
| --- | --- |
| `VITE_MOUNT_PATH` | Mount path of the plugin (standalone routing + OIDC redirect). Required. |
| `VITE_GUIDELINE_API_URL` | Guideline service - step 1 (any guideline uploaded?). |
| `VITE_ONTOLOGY_API_URL` | Ontology service - step 1 (any ontology uploaded?). |
| `VITE_USECASE_API_URL` | UseCase service - step 2 (use case count) and prerequisite for step 4. |
| `VITE_ACCESS_API_URL` | Access service - step 3 (any access right configured?). |
| `VITE_INSTANCE_API_URL` | Instance service - step 4 (any instance in the graph?). |
| `VITE_PLATFORMCONFIG_ROUTE` | Route step 1 links to. Default `/platform-config`. |
| `VITE_USECASE_ROUTE` | Route step 2 links to. Default `/usecase`. |
| `VITE_ACCESS_ROUTE` | Route step 3 links to. Default `/access`. |
| `VITE_INSTANCE_ROUTE` | Route step 4 links to. Default `/instance`. |
| `VITE_ENABLE_DEMO_DATA` | `true` shows the demo-data hint. Anything else hides it entirely. |
| `VITE_KEYCLOAK_AUTHORITY` / `VITE_KEYCLOAK_CLIENT_ID` | Standalone dev only. |

Note on production builds: every `VITE_` value is compiled to a `VITE_X_PLACEHOLDER` string and
rewritten by the Docker entrypoint - but only for variables that are actually set. `src/config/env.ts`
therefore treats a surviving placeholder as "not configured".

## How the status is derived

`src/hooks/usePlatformReadiness.ts` fans out one GET per service with React Query and maps the
results onto five states: `done`, `open`, `unknown`, `unreachable`, `checking`.

- **Nothing is persisted.** No localStorage, no server-side progress. The page recomputes on every
  mount, so a deleted guideline reopens step 1 and a second tester on the same stack sees the truth.
- **"Not reachable" is never "empty".** A failed request produces `unreachable` with the concrete
  reason (network, 401/403, HTTP status, malformed body) so the page doubles as a diagnostics view.
- **Missing configuration degrades, it does not break.** An unset service URL yields `unknown`; the
  step still renders with its link and explanation.
- **Step 4 depends on step 2.** The instance graph is addressable per use case only
  (`GET /{useCaseId}/Instances/graph`), so up to five use cases are probed and the largest instance
  count wins. With no use case the step reports `unknown`, not `open`.
- **All steps done** is reported as "this platform is already set up" (demo data, or a colleague) -
  never as the current user's own progress.
