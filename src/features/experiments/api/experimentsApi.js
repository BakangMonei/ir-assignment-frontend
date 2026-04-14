import { http } from '../../../shared/api/httpClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';

const LONG = 600_000;

/** POST /experiments/run — full CISI tokenizer × stem × ranking grid (may take many minutes). */
export function runCisiBenchmark() {
  return http.post(ENDPOINTS.experimentsRunCisi, null, { timeout: LONG });
}

/** GET /experiments/dataset-eval — quick MAP / P / R on CISI (default QRY/REL on server). */
export function getDatasetEval(params = {}) {
  return http.get(ENDPOINTS.experimentsDatasetEval, {
    params: { dataset: 'CISI', ...params },
    timeout: LONG,
  });
}
