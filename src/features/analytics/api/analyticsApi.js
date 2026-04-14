import { requestWithAliases } from '../../../shared/api/apiUtils';
import { ENDPOINT_ALIASES } from '../../../shared/constants/endpoints';

/** GET /api/analytics/term-distribution → ApiResponse.data (unwrapped). */
export function getTermDistribution() {
  return requestWithAliases({ method: 'get', paths: ENDPOINT_ALIASES.analyticsTermDistribution });
}

/** GET /api/analytics/zipf → ApiResponse.data (unwrapped). */
export function getZipf() {
  return requestWithAliases({ method: 'get', paths: ENDPOINT_ALIASES.analyticsZipf });
}
