import { http } from '../../../shared/api/httpClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';

export function getTermDistribution() {
  return http.get(ENDPOINTS.analyticsTermDistribution);
}

export function getZipf() {
  return http.get(ENDPOINTS.analyticsZipf);
}
