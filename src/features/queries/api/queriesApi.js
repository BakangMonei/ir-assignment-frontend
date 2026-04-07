import { http } from '../../../shared/api/httpClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';

export const queriesApi = {
  list: () => http.get(ENDPOINTS.queries),
  getById: id => http.get(`${ENDPOINTS.queries}/${id}`),
  create: payload => http.post(ENDPOINTS.queries, payload),
  update: (id, payload) => http.put(`${ENDPOINTS.queries}/${id}`, payload),
  remove: id => http.delete(`${ENDPOINTS.queries}/${id}`),
};
