/** Default includes /api; override with REACT_APP_API_BASE_URL (e.g. http://localhost:8080/api). */
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

export const ENDPOINTS = {
  documents: '/documents',
  documentsBulk: '/documents/bulk',
  documentsUpload: '/documents/upload',
  uploadCisi: '/upload/cisi',
  uploadPubmed: '/upload/pubmed',
  queries: '/queries',
  results: '/results',
  indexBuild: '/index/build',
  indexStatus: '/index/status',
  indexImportCisi: '/index/import/cisi',
  indexImportPubmed: '/index/import/pubmed',
  search: '/search',
  searchExpand: '/search/expand',
  evaluationRun: '/evaluation/run',
  evaluationMetrics: '/evaluation/metrics',
  evaluationPRCurve: '/evaluation/pr-curve',
  analyticsTermDistribution: '/analytics/term-distribution',
  analyticsZipf: '/analytics/zipf',
};
