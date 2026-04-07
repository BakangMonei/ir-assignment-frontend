export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export const ENDPOINTS = {
  documents: '/documents',
  queries: '/queries',
  results: '/results',
  indexBuild: '/index/build',
  indexStatus: '/index/status',
  search: '/search',
  searchExpand: '/search/expand',
  evaluationRun: '/evaluation/run',
  evaluationMetrics: '/evaluation/metrics',
  evaluationPRCurve: '/evaluation/pr-curve',
  analyticsTermDistribution: '/analytics/term-distribution',
  analyticsZipf: '/analytics/zipf',
};
