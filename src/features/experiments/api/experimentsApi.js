import { requestWithAliases } from '../../../shared/api/apiUtils';
import { ENDPOINT_ALIASES } from '../../../shared/constants/endpoints';

const LONG = 600_000;

/** POST /experiments/run — full CISI tokenizer × stem × ranking grid (may take many minutes). */
export function runCisiBenchmark() {
  return requestWithAliases({
    method: 'post',
    paths: ENDPOINT_ALIASES.experimentsRun,
    config: { timeout: LONG },
  });
}

/** GET /experiments/dataset-eval — quick MAP / P / R on CISI (default QRY/REL on server). */
export function getDatasetEval(params = {}) {
  return requestWithAliases({
    method: 'get',
    paths: ENDPOINT_ALIASES.experimentsDatasetEval,
    config: {
      params: { dataset: 'CISI', ...params },
      timeout: LONG,
    },
  });
}

export function buildExperimentVariant(payload = {}) {
  return requestWithAliases({
    method: 'post',
    paths: ENDPOINT_ALIASES.experimentsVariantBuild,
    config: { data: payload, timeout: LONG },
  });
}

export function searchExperimentVariant(payload = {}) {
  return requestWithAliases({
    method: 'post',
    paths: ENDPOINT_ALIASES.experimentsVariantSearch,
    config: { data: payload, timeout: LONG },
  });
}
