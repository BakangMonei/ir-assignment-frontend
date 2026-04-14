import { http } from './httpClient';

function isAbsoluteUrl(path) {
  return /^https?:\/\//i.test(String(path || ''));
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

/**
 * Try endpoint aliases from left to right until one succeeds.
 * Retries only on route-level errors (404/405) so non-routing failures still surface.
 */
export async function requestWithAliases({ method = 'get', paths = [], config = {} }) {
  const aliasPaths = ensureArray(paths).filter(Boolean);
  let lastError = null;

  for (const path of aliasPaths) {
    try {
      const reqConfig = {
        method,
        url: path,
        ...config,
      };
      if (isAbsoluteUrl(path)) reqConfig.baseURL = '';
      return await http.request(reqConfig);
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status !== 404 && status !== 405) break;
    }
  }

  throw lastError || new Error('All endpoint aliases failed');
}

export function normalizeCollectionResponse(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  if (Array.isArray(raw.content)) return raw.content;
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.results)) return raw.results;
  if (Array.isArray(raw.documents)) return raw.documents;
  if (Array.isArray(raw.queries)) return raw.queries;
  return [];
}
