import { requestWithAliases } from '../../../shared/api/apiUtils';
import { ENDPOINT_ALIASES } from '../../../shared/constants/endpoints';
import { normalizeEvaluationMetrics, normalizePrCurveForChart } from '../utils/evaluationNormalize';

/**
 * POST /evaluation/run (root controller, not /api/evaluation/run).
 * Body: { retrievedDocIds: string[], relevantDocIds: string[] }
 * Response: ApiResponse with EvaluationMetrics in data (http client unwraps to metrics object).
 */
export function runEvaluation(payload) {
  const retrievedDocIds = (payload.retrievedDocIds || [])
    .map(String)
    .map(s => s.trim())
    .filter(Boolean);
  const relevantDocIds = (payload.relevantDocIds || [])
    .map(String)
    .map(s => s.trim())
    .filter(Boolean);
  return requestWithAliases({
    method: 'post',
    paths: ENDPOINT_ALIASES.evaluationRun,
    config: { data: { retrievedDocIds, relevantDocIds } },
  });
}

export function getEvaluationMetrics() {
  return requestWithAliases({
    method: 'get',
    paths: ENDPOINT_ALIASES.evaluationMetrics,
  }).then(normalizeEvaluationMetrics);
}

export function getPRCurve() {
  return requestWithAliases({
    method: 'get',
    paths: ENDPOINT_ALIASES.evaluationPrCurve,
  }).then(normalizePrCurveForChart);
}

export function runEvaluationSearch(params) {
  return requestWithAliases({
    method: 'get',
    paths: ENDPOINT_ALIASES.evaluationSearch,
    config: { params },
  });
}

export function compareEvaluationBy(type, params) {
  const map = {
    tokenizer: ENDPOINT_ALIASES.evaluationCompareTokenizers,
    stemming: ENDPOINT_ALIASES.evaluationCompareStemming,
    ranking: ENDPOINT_ALIASES.evaluationCompareRanking,
  };
  return requestWithAliases({ method: 'get', paths: map[type] || [], config: { params } });
}
