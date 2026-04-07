# IR Assignment Frontend (Modernized)

Production-oriented React frontend for an Information Retrieval platform integrated with a Spring Boot backend.

## Tech stack

- React + React Router
- React Query (server state)
- Axios client with interceptors
- Tailwind CSS + Framer Motion
- React Toastify
- Recharts

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
REACT_APP_API_BASE_URL=http://localhost:8080
```

3. Start app:

```bash
npm start
```

## Scripts

- `npm start` - run development server
- `npm run build` - create production build
- `npm test` - run tests

## Architecture overview

```text
src/
  app/           # app shell and routing
  pages/         # route-level pages
  features/      # domain-specific modules (documents/search/indexing/evaluation/analytics/queries/results)
  shared/        # reusable api client, constants, hooks, UI primitives, utilities
```

## API behavior assumptions

- API wraps responses as `{ success, data, message, statusCode }`.
- Client reads `data` automatically and treats `success=false` as an application error.
- Search, analytics, and evaluation list payloads may be returned as arrays or paginated objects; UI handles both.

## Current module coverage

- Documents: list/create/delete + filters and pagination params
- Search: advanced search input, model/toggles, expansion trigger, scored list
- Indexing: build/rebuild trigger + status polling
- Evaluation: run action + metrics + PR curve chart
- Analytics: term distribution + zipf trend
- Queries/Results: API layer and route placeholders ready for full CRUD component expansion
