import { http } from '../../../shared/api/httpClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';

export function performSearch(params) {
  return http.get(ENDPOINTS.search, { params });
}

export function expandQuery(query) {
  return http.post(`${ENDPOINTS.searchExpand}?query=${encodeURIComponent(query)}`);
}
