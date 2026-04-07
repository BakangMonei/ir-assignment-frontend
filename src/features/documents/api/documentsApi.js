import { http } from '../../../shared/api/httpClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';

export function getDocuments(params) {
  return http.get(ENDPOINTS.documents, { params });
}

export function createDocument(payload) {
  return http.post(ENDPOINTS.documents, payload);
}

export function updateDocument(id, payload) {
  return http.put(`${ENDPOINTS.documents}/${id}`, payload);
}

export function deleteDocument(id) {
  return http.delete(`${ENDPOINTS.documents}/${id}`);
}
