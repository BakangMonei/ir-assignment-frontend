import { http } from '../../../shared/api/httpClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';

function buildSearchParams(raw) {
  const params = { ...raw };
  if (params.lengthNormalization !== undefined && params.lengthNorm === undefined) {
    params.lengthNorm = params.lengthNormalization;
  }
  delete params.lengthNormalization;

  const out = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    out[k] = v;
  });
  return out;
}

export function performSearch(params) {
  return http.get(ENDPOINTS.search, { params: buildSearchParams(params) });
}

export function expandQuery(query) {
  return http.post(`${ENDPOINTS.searchExpand}?query=${encodeURIComponent(query)}`);
}
