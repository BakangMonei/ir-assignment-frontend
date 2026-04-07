import { http } from '../../../shared/api/httpClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';

export const resultsApi = {
  list: () => http.get(ENDPOINTS.results),
  getById: (id) => http.get(`${ENDPOINTS.results}/${id}`),
  create: (payload) => http.post(ENDPOINTS.results, payload),
  update: (id, payload) => http.put(`${ENDPOINTS.results}/${id}`, payload),
  remove: (id) => http.delete(`${ENDPOINTS.results}/${id}`),
};
