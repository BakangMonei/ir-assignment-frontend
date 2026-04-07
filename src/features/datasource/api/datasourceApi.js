import axios from 'axios';
import { http } from '../../../shared/api/httpClient';
import { API_BASE_URL, ENDPOINTS } from '../../../shared/constants/endpoints';

const legacy = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
});

export function importCisi() {
  return legacy.post(ENDPOINTS.legacyImportCisi).then(r => r.data?.data ?? r.data);
}

export function importPubmed() {
  return legacy.post(ENDPOINTS.legacyImportPubmed).then(r => r.data?.data ?? r.data);
}

export async function uploadDocumentFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    return await legacy
      .post(ENDPOINTS.legacyUploadDocuments, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => r.data?.data ?? r.data);
  } catch {
    // Fallback: create a manual document if legacy upload endpoint is unavailable.
    return http.post(ENDPOINTS.documents, {
      title: file.name,
      content: 'Uploaded file metadata placeholder. Backend upload endpoint unavailable.',
      category: 'uploaded',
      year: new Date().getFullYear(),
    });
  }
}
