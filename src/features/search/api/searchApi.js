import { http } from '../../../shared/api/httpClient';
import { requestWithAliases } from '../../../shared/api/apiUtils';
import { ENDPOINTS, ENDPOINT_ALIASES } from '../../../shared/constants/endpoints';

/** GET /api/search (lengthNorm) + DTO field applyLengthNormalization when both are useful for the backend. */
function buildSearchParams(raw) {
  const params = { ...raw };

  const lengthVal =
    params.applyLengthNormalization ??
    params.lengthNorm ??
    (params.lengthNormalization !== undefined ? params.lengthNormalization : undefined);

  delete params.applyLengthNormalization;
  delete params.lengthNorm;
  delete params.lengthNormalization;

  const out = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    out[k] = v;
  });

  if (lengthVal !== undefined && lengthVal !== null && lengthVal !== '') {
    const bool = Boolean(lengthVal);
    out.lengthNorm = bool;
    out.applyLengthNormalization = bool;
  }

  return out;
}

export function performSearch(params) {
  return requestWithAliases({
    method: 'get',
    paths: ENDPOINT_ALIASES.search,
    config: { params: buildSearchParams(params) },
  });
}

/**
 * POST /api/ir/search — body matches backend SearchRequestDTO (query, tokenizerType, useStemming,
 * rankingAlgorithm, applyLengthNormalization, collection, page, resultsPerPage).
 */
export function performIrSearch(body) {
  return http.post(ENDPOINTS.irSearch, body);
}

export function expandQuery(query) {
  return requestWithAliases({
    method: 'post',
    paths: ENDPOINT_ALIASES.searchExpand.map(path => `${path}?query=${encodeURIComponent(query)}`),
  });
}
