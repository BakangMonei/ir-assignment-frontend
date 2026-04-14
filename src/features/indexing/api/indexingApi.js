import { http } from '../../../shared/api/httpClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';

const CONFIG_KEYS = [
  ['tokenizer', ENDPOINTS.indexConfigTokenizer],
  ['ranking', ENDPOINTS.indexConfigRanking],
  ['stemming', ENDPOINTS.indexConfigStemming],
  ['normalization', ENDPOINTS.indexConfigNormalization],
];

export function buildIndex() {
  return http.post(ENDPOINTS.indexBuild);
}

export function getIndexStatus() {
  return http.get(ENDPOINTS.indexStatus);
}

export function getIndexStats() {
  return http.get(ENDPOINTS.indexStats);
}

export function getIndexHealth() {
  return http.get(ENDPOINTS.indexHealth);
}

export function getIndexMetrics() {
  return http.get(ENDPOINTS.indexMetrics);
}

export function recreateIndex() {
  return http.post(ENDPOINTS.indexRecreate);
}

/** Loads all index config endpoints; failed routes resolve to null (older backends). */
export async function fetchIndexConfigBundle() {
  const entries = await Promise.all(
    CONFIG_KEYS.map(async ([key, url]) => {
      try {
        const data = await http.get(url);
        return [key, data];
      } catch {
        return [key, null];
      }
    })
  );
  return Object.fromEntries(entries);
}

export function putTokenizerConfig(payload) {
  return http.put(ENDPOINTS.indexConfigTokenizer, payload);
}

export function putStemmingConfig(payload) {
  return http.put(ENDPOINTS.indexConfigStemming, payload);
}

export function putRankingConfig(payload) {
  return http.put(ENDPOINTS.indexConfigRanking, payload);
}

export function putNormalizationConfig(payload) {
  return http.put(ENDPOINTS.indexConfigNormalization, payload);
}
