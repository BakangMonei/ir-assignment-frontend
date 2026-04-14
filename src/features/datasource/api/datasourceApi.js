import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../../../shared/constants/endpoints';

const legacy = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
});

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

export function importCisi(filePath) {
  return legacy
    .post(ENDPOINTS.indexImportCisi, null, {
      params: filePath ? { filePath } : {},
    })
    .then(r => r.data?.data ?? r.data);
}

export function importPubmed(filePath) {
  return legacy
    .post(ENDPOINTS.indexImportPubmed, null, {
      params: filePath ? { filePath } : {},
    })
    .then(r => r.data?.data ?? r.data);
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

  const raw = await legacy
    .post(ENDPOINTS.documentsBulk, formData, multipartConfig)
    .then(r => r.data?.data ?? r.data);

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

  const raw = await legacy
    .post(ENDPOINTS.documentsUpload, formData, multipartConfig)
    .then(r => r.data?.data ?? r.data);

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
  return legacy
    .post(ENDPOINTS.uploadCisi, formData, multipartConfig)
    .then(r => r.data?.data ?? r.data);
}

/** POST /upload/pubmed — PubMed XML or MEDLINE file. */
export function uploadPubmedFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  return legacy
    .post(ENDPOINTS.uploadPubmed, formData, multipartConfig)
    .then(r => r.data?.data ?? r.data);
}
