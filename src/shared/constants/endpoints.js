/**
 * Single origin for axios; paths below are relative to this base.
 * Ensures `/queries` and `/results` call `GET /api/queries` and `GET /api/results` (ApiQueriesController,
 * ApiResultsController — same IRPlatformService behavior as non-prefixed routes on the server).
 * You may set `REACT_APP_API_BASE_URL=http://localhost:8080` (no `/api`); it is normalized to `.../api`.
 */
function normalizeApiBase(raw) {
  const trimmed = (raw || 'http://localhost:8080/api').replace(/\/+$/, '');
  if (/\/api$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
}

export const API_BASE_URL = normalizeApiBase(process.env.REACT_APP_API_BASE_URL);

/**
 * Controllers under `/evaluation/run` are on the servlet context root (e.g. `http://host:8080/evaluation/run`),
 * not under `/api`. Use with getBackendRootOrigin() for POST run; GET metrics/PR curve stay under `/api`.
 */
export function getBackendRootOrigin() {
  return API_BASE_URL.replace(/\/api\/?$/i, '');
}

export const ENDPOINTS = {
  documents: '/documents',
  documentsBulk: '/documents/bulk',
  documentsUpload: '/documents/upload',
  uploadCisi: '/upload/cisi',
  uploadPubmed: '/upload/pubmed',
  /** Resolved as `{API_BASE_URL}/queries` → `/api/queries` when base ends with `/api`. */
  queries: '/queries',
  /** Resolved as `{API_BASE_URL}/results` → `/api/results` when base ends with `/api`. */
  results: '/results',
  indexBuild: '/index/build',
  indexStatus: '/index/status',
  indexStats: '/index/stats',
  indexHealth: '/index/health',
  indexMetrics: '/index/metrics',
  indexRecreate: '/index/recreate',
  indexConfigTokenizer: '/index/config/tokenizer',
  indexConfigStemming: '/index/config/stemming',
  indexConfigRanking: '/index/config/ranking',
  indexConfigNormalization: '/index/config/normalization',
  indexImportCisi: '/index/import/cisi',
  indexImportPubmed: '/index/import/pubmed',
  experimentsRunCisi: '/experiments/run',
  experimentsDatasetEval: '/experiments/dataset-eval',
  search: '/search',
  /** POST JSON body (SearchRequestDTO): same Lucene index as GET /search; uses applyLengthNormalization. */
  irSearch: '/ir/search',
  searchExpand: '/search/expand',
  /** GET — ApiResponse.data = EvaluationMetrics */
  evaluationMetrics: '/evaluation/metrics',
  /** GET — ApiResponse.data = number[][] ([precision, recall] per point) */
  evaluationPRCurve: '/evaluation/pr-curve',
  /**
   * GET — ApiAnalyticsController (same IRPlatformService stats as legacy GET /analytics/… on the root).
   * Response: ApiResponse envelope; http client unwraps `data`.
   */
  analyticsTermDistribution: '/analytics/term-distribution',
  /** GET — ApiResponse; `irPlatformService` Zipf stats, message e.g. "Zipf analysis". */
  analyticsZipf: '/analytics/zipf',
};
