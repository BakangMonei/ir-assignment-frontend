import { http } from '../../../shared/api/httpClient';
import { requestWithAliases } from '../../../shared/api/apiUtils';
import { ENDPOINTS, ENDPOINT_ALIASES } from '../../../shared/constants/endpoints';

const multipartConfig = {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 0,
};

/**
 * CISI: .ALL / .all / "cisi" in name. PubMed: .xml or MEDLINE-style .txt (and other extensions default to PUBMED).
 */
export function inferDatasetFromFilename(filename) {
  const lower = String(filename || '').toLowerCase();
  if (lower.includes('cisi') || lower.endsWith('.all')) {
    return 'CISI';
  }
  if (lower.endsWith('.xml') || lower.endsWith('.txt')) {
    return 'PUBMED';
  }
  return 'PUBMED';
}

const IMPORT_TIMEOUT_MS = 300_000;

export function importCisi(filePath) {
  return requestWithAliases({
    method: 'post',
    paths: [ENDPOINTS.indexImportCisi],
    config: { params: filePath ? { filePath } : {}, timeout: IMPORT_TIMEOUT_MS },
  });
}

export function importPubmed(filePath) {
  return requestWithAliases({
    method: 'post',
    paths: [ENDPOINTS.indexImportPubmed],
    config: { params: filePath ? { filePath } : {}, timeout: IMPORT_TIMEOUT_MS },
  });
}

/**
 * POST /documents/bulk — multipart file + dataset (CISI | PUBMED) + optional indexing fields.
 */
export async function bulkIndexDocumentsFromFile(file, options = {}) {
  const dataset = options.dataset || inferDatasetFromFilename(file.name);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('dataset', dataset);

  if (options.tokenizerType != null && options.tokenizerType !== '') {
    formData.append('tokenizerType', String(options.tokenizerType));
  }
  if (options.useStemming !== undefined) {
    formData.append('useStemming', options.useStemming ? 'true' : 'false');
  }
  if (options.rankingAlgorithm != null && options.rankingAlgorithm !== '') {
    formData.append('rankingAlgorithm', String(options.rankingAlgorithm));
  }
  if (options.lengthNormalization != null && options.lengthNormalization !== '') {
    formData.append('lengthNormalization', String(options.lengthNormalization));
  }

  const raw = await http.post(ENDPOINTS.documentsBulk, formData, multipartConfig);

  const list = Array.isArray(raw) ? raw : [];
  const documentCount = list.length;
  return {
    documentCount,
    documents: list,
    dataset,
    message: `Saved ${documentCount} document(s).`,
    raw,
  };
}

/**
 * POST /documents/upload — multipart file only; server infers parser from filename.
 * Success body: { message, documentCount }.
 */
export async function uploadDocumentSimple(file) {
  const formData = new FormData();
  formData.append('file', file);

  const raw = await http.post(ENDPOINTS.documentsUpload, formData, multipartConfig);

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return {
      message: raw.message != null ? String(raw.message) : '',
      documentCount: Number(raw.documentCount) || 0,
      raw,
    };
  }
  return {
    message: typeof raw === 'string' ? raw : '',
    documentCount: 0,
    raw,
  };
}

/** POST /upload/cisi — CISI-format file. */
export function uploadCisiFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  return http.post(ENDPOINTS.uploadCisi, formData, multipartConfig);
}

/** POST /upload/pubmed — PubMed XML or MEDLINE file. */
export function uploadPubmedFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  return http.post(ENDPOINTS.uploadPubmed, formData, multipartConfig);
}

function uploadWorkflowFile(file, aliases) {
  const formData = new FormData();
  formData.append('file', file);
  return requestWithAliases({
    method: 'post',
    paths: aliases,
    config: { data: formData, ...multipartConfig },
  });
}

export function uploadQueriesFile(file) {
  return uploadWorkflowFile(file, ENDPOINT_ALIASES.uploadQueries);
}

export function uploadRelevanceFile(file) {
  return uploadWorkflowFile(file, ENDPOINT_ALIASES.uploadRelevance);
}

export function workflowUpload(file) {
  return uploadWorkflowFile(file, ENDPOINT_ALIASES.workflowUpload);
}

export function getWorkflowStatus() {
  return requestWithAliases({ method: 'get', paths: ENDPOINT_ALIASES.workflowStatus });
}

export function resetWorkflow() {
  return requestWithAliases({ method: 'post', paths: ENDPOINT_ALIASES.workflowReset });
}
