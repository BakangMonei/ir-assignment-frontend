# Frontend Audit and Fix Log

## Broken or Incomplete Flows Found
- Data Source missed `workflow` lifecycle coverage (`/workflow/status`, `/workflow/reset`, `/workflow/upload`) and had no UI for `/api/upload/queries` + `/api/upload/relevance`.
- Settings route was a placeholder, so centralized IR configuration could not be updated from UI.
- API calls were inconsistent across modules (mixed raw `axios` clients and `http`), with no endpoint alias fallback.
- Search/Evaluation/Analytics/Experiments modules only used one endpoint form and did not gracefully support backend alias routes.
- Evaluation page lacked comparison endpoints (`/api/evaluation/compare/*`) and `/api/evaluation/search` visibility.
- Experiments page did not expose `/experiments/variant/build` or `/experiments/variant/search`.

## What Was Fixed
- Added a shared alias-aware API request helper at `src/shared/api/apiUtils.js` (`requestWithAliases` + collection normalization utility).
- Added a centralized alias map in `src/shared/constants/endpoints.js` via `ENDPOINT_ALIASES`.
- Hardened API modules to use alias fallback:
  - `datasourceApi`, `indexingApi`, `searchApi`, `evaluationApi`, `analyticsApi`, `experimentsApi`.
- Extended Data Source page:
  - query/relevance uploads, workflow upload, workflow status panel, workflow reset action.
  - loading/error/success feedback for each new action.
- Implemented a real Settings page at `src/pages/SettingsPage.js` and wired route `/settings`.
  - reads current backend config bundle and syncs tokenizer/stemming/ranking/normalization via PUT routes.
- Added Evaluation comparison controls for tokenizer/stemming/ranking and evaluation search API.
- Added Experiments variant actions for build/search endpoints.

## Final Frontend-to-Backend Endpoint Map

### Upload / Workflow
- `/api/upload/cisi`, `/api/upload/pubmed`
- `/api/upload/queries`, `/api/upload/relevance`
- `/workflow/upload`, `/workflow/status`, `/workflow/reset`

### Indexing
- `/index/build`, `/api/index/build`
- `/index/status`, `/api/index/status`
- `/api/index/stats`, `/api/index/metrics`, `/api/index/recreate`
- `/api/index/import/cisi`, `/api/index/import/pubmed`
- `/api/index/config/tokenizer`, `/api/index/config/stemming`, `/api/index/config/ranking`, `/api/index/config/normalization`
- `/api/index/health`

### Search
- `/search`, `/api/search`, `/api/ir/search`
- `/search/expand`, `/api/search/expand`

### Evaluation
- `/evaluation/run`, `/api/ir/evaluate`
- `/evaluation/metrics`, `/api/evaluation/metrics`
- `/evaluation/pr-curve`, `/api/evaluation/pr-curve`
- `/api/evaluation/search`
- `/api/evaluation/compare/tokenizers`, `/api/evaluation/compare/stemming`, `/api/evaluation/compare/ranking`

### Analytics
- `/analytics/term-distribution`, `/api/analytics/term-distribution`
- `/analytics/zipf`, `/api/analytics/zipf`

### CRUD
- `/documents`, `/documents/{id}`, `/api/documents`, `/api/documents/{id}`
- `/queries`, `/queries/{id}`, `/api/queries`, `/api/queries/{id}`
- `/results`, `/results/{id}`, `/api/results`, `/api/results/{id}`

### Experiments
- `/experiments/run`, `/api/experiments/run`
- `/experiments/dataset-eval`, `/api/experiments/dataset-eval`
- `/experiments/variant/build`, `/experiments/variant/search`

## Assumptions
- 404/405 means route mismatch and should trigger alias fallback; non-routing failures should surface directly.
- Evaluation compare/search endpoints may return backend-specific map payloads, so the UI displays raw JSON safely.
- Existing `/api`-based base URL strategy remains unchanged for backward compatibility.

## Run / Test Steps
- Start frontend: `npm start`
- Verify all sidebar routes load:
  - `/data-source`, `/indexing`, `/search`, `/results`, `/evaluation`, `/analytics`, `/documents`, `/queries`, `/experiments`, `/settings`
- In Data Source:
  - test CISI/PubMed upload/import, then workflow status/reset, then queries/relevance upload.
- In Indexing:
  - test build/recreate and config PUT controls.
- In Search:
  - run baseline and expansion paths and verify ranked rows.
- In Evaluation:
  - run evaluation, load metrics + PR curve, then compare buttons.
- In Analytics:
  - check term distribution and zipf render with non-empty and empty payloads.
- In Experiments:
  - run benchmark, dataset eval, manual run, and variant build/search.

## Developer Notes / API Usage Snippets
- Alias fallback call pattern:
  - `requestWithAliases({ method: 'get', paths: ENDPOINT_ALIASES.search, config: { params } })`
- Workflow status polling:
  - `useQuery({ queryKey: ['workflow-status'], queryFn: getWorkflowStatus, refetchInterval: 10000 })`
- Config synchronization:
  - `Promise.all([putTokenizerConfig(...), putStemmingConfig(...), putRankingConfig(...), putNormalizationConfig(...)])`
