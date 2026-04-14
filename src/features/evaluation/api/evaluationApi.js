import { http } from '../../../shared/api/httpClient';
import { ENDPOINTS, getBackendRootOrigin } from '../../../shared/constants/endpoints';
import { normalizeEvaluationMetrics, normalizePrCurveForChart } from '../utils/evaluationNormalize';

const EVALUATION_RUN_PATH = '/evaluation/run';

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
  const url = `${getBackendRootOrigin()}${EVALUATION_RUN_PATH}`;
  return http.post(url, { retrievedDocIds, relevantDocIds });
}

export function getEvaluationMetrics() {
  return http.get(ENDPOINTS.evaluationMetrics).then(normalizeEvaluationMetrics);
}

export function getPRCurve() {
  return http.get(ENDPOINTS.evaluationPRCurve).then(normalizePrCurveForChart);
}
