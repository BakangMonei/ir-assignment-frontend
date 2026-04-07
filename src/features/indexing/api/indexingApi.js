import { http } from '../../../shared/api/httpClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';

export function buildIndex() {
  return http.post(ENDPOINTS.indexBuild);
}

export function getIndexStatus() {
  return http.get(ENDPOINTS.indexStatus);
}
