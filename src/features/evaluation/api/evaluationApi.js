import { http } from '../../../shared/api/httpClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';

export function runEvaluation(payload) {
  return http.post(ENDPOINTS.evaluationRun, payload);
}

export function getEvaluationMetrics() {
  return http.get(ENDPOINTS.evaluationMetrics);
}

export function getPRCurve() {
  return http.get(ENDPOINTS.evaluationPRCurve);
}
