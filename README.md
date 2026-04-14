# IR Platform Frontend Manual

Production-oriented React frontend for the Spring Boot Information Retrieval backend.

## 1) What this frontend does

This UI is designed around a guided workflow:

1. **Data Source** (import/upload)
2. **Indexing** (build/rebuild index)
3. **Search** (retrieve ranked results)
4. **Evaluation** (when relevance data exists, e.g. CISI)
5. **Analytics** (term distribution + Zipf)

The app enforces readiness:

- Search is enabled only after data import/upload + index build
- Evaluation is enabled only when relevance data is available (CISI)

## 2) Requirements

- Node.js 18+ (or latest LTS)
- npm
- Backend running at `http://localhost:8080/api` (Spring API prefix; host/port may differ)

## 3) Setup and run

### Install

```bash
npm install
```

### Environment

Create `.env`:

```env
REACT_APP_API_BASE_URL=http://localhost:8080/api
```

If your server exposes routes under a different base path, set this to that full prefix (no trailing slash).

### Start dev server

```bash
npm start
```

### Build for production

```bash
npm run build
```

### Run tests

```bash
npm test -- --watch=false --watchman=false
```

## 4) Backend endpoint strategy

The app prefers modern endpoints for core workflows, with legacy fallback adapters for import/upload.

### API base (`REACT_APP_API_BASE_URL`)

Default in code is `http://localhost:8080/api`. All paths below are relative to that base.

### Documents and uploads

- `GET/POST /documents` — CRUD list/create
- `PUT /documents/{id}` — update (send full document shape where required, e.g. title + content)
- `POST /documents/bulk` — multipart `file` + `dataset` (`CISI` | `PUBMED`) + optional tokenizer/ranking fields
- `POST /documents/upload` — multipart `file` only; response `{ message, documentCount }`
- `POST /upload/cisi`, `POST /upload/pubmed` — dataset-specific multipart uploads

### Other preferred endpoints

- Queries: `/queries`
- Results: `/results`
- Indexing: `/index/build`, `/index/status`
- Search: `/search`, `/search/expand`
- Evaluation: `/evaluation/run`, `/evaluation/metrics`, `/evaluation/pr-curve`
- Analytics: `/analytics/term-distribution`, `/analytics/zipf`

### Server-side corpus import (optional `filePath` query)

- `POST /index/import/cisi`
- `POST /index/import/pubmed`

## 5) Full operator manual (step-by-step)

### Step A — Data Source (entry point)

Go to **Data Source** in sidebar.

You can:

- **Import CISI** (dataset with relevance data)
- **Import PubMed**
- **Upload custom file** (`.txt`, `.xml`, `.zip`)

After success, UI shows status and guides you to indexing.

### Step B — Build/Rebuild Index

Go to **Indexing**.

- Click **Build/Rebuild Index**
- Wait for status cards/json to refresh

Once index is available, search becomes enabled.

### Step C — Search Workbench

Go to **Search**.

Set:

- `query`
- `model` (`tf`, `tfidf`, `normalized`, `bm25`)
- `stemming`, `expansion`
- filters (`category`, `year`, `keywords`, `operator`)
- pagination (`page`, `size`)

Click **Search** to retrieve ranked results.

Optional:

- **Expand Query** to call query expansion API

Export:

- **Download JSON**
- **Download CSV**

### Step D — Results library

Go to **Results**.

- Manage saved result sets
- Export saved results using:
  - **Download JSON**
  - **Download CSV**

### Step E — Evaluation pipeline

Go to **Evaluation**.

For CISI workflow:

- Provide relevant and retrieved IDs
- Click **Run**
- Review Precision, Recall, F1, MAP and PR curve

Evaluation stays disabled until prerequisite readiness is met.

### Step F — Analytics

Go to **Analytics**.

View:

- Term distribution table
- Zipf trend chart

Page is hardened for multiple backend payload shapes.

## 6) UI controls and navigation

- **Collapsible sidebar**: click collapse/expand control in sidebar header
- **Top bar status pills**:
  - active dataset indicator (`none`, `CISI`, `PubMed`, `Uploaded`)
  - backend connection indicator
- **Toasts**: success/failure feedback for actions
- **Empty/error states**: shown when data is missing or endpoint fails

## 7) Project architecture

```text
src/
  app/
    router/               # route definitions
    App.js                # app shell composition
  features/
    */api/                # domain API wrappers
  pages/                  # route-level screens
  shared/
    api/                  # axios client with interceptors
    constants/            # endpoints
    hooks/                # readiness hooks, debounced hooks
    state/                # platform state (localStorage)
    ui/                   # reusable primitives/layout
    utils/                # error parsing, download utils
```

## 8) Troubleshooting

### Search/Evaluation disabled

- Ensure you imported/uploaded data first
- Ensure index build completed
- For evaluation: use CISI import (relevance data)

### Backend disconnected indicator

- Confirm backend is running at `REACT_APP_API_BASE_URL`
- Check CORS and network access

### No analytics chart data

- Build index and run searches first
- Verify backend returns analytics payload

## 9) Notes for extension

- Add authenticated uploads if backend introduces auth
- Add richer table pagination metadata binding when backend includes total counts
- Add E2E tests for full A→F workflow
