import { http } from '../../../shared/api/httpClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';

/** GET /api/analytics/term-distribution → ApiResponse.data (unwrapped). */
export function getTermDistribution() {
  return http.get(ENDPOINTS.analyticsTermDistribution);
}

/** GET /api/analytics/zipf → ApiResponse.data (unwrapped). */
export function getZipf() {
  return http.get(ENDPOINTS.analyticsZipf);
}
