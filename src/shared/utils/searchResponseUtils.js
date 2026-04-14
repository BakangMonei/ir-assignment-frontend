/**
 * Normalizes varied search API envelopes to a list of hit rows.
 * Matches backends that return { results }, Spring Page { content }, etc.
 */
export function normalizeSearchRows(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];

  if (Array.isArray(raw.content)) return raw.content;
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.results)) return raw.results;
  if (Array.isArray(raw.documents)) return raw.documents;

  return [];
}

/** Optional metadata alongside hits (see InformationRetrievalBackend search handler). */
export function extractSearchMeta(raw) {
  const rows = normalizeSearchRows(raw);
  if (!raw || typeof raw !== 'object') {
    return {
      rows,
      totalHits: rows.length,
      latencyMs: null,
      precision: null,
      recall: null,
      f1Score: null,
    };
  }
  return {
    rows,
    totalHits: raw.totalHits ?? raw.total ?? rows.length,
    latencyMs: raw.latencyMs ?? raw.queryTime ?? null,
    queryId: raw.queryId ?? null,
    page: raw.page,
    size: raw.size,
    precision: raw.precision ?? raw.metrics?.precision ?? null,
    recall: raw.recall ?? raw.metrics?.recall ?? null,
    f1Score: raw.f1Score ?? raw.metrics?.f1Score ?? null,
  };
}
