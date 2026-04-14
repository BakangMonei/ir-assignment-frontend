export function getErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback;

  const code = error?.code;
  if (code === 'ECONNABORTED') {
    return 'Request timed out. Check that the API is running and reachable.';
  }
  if (code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return 'Network error: cannot reach the API. Confirm REACT_APP_API_BASE_URL and that the server is up.';
  }

  const status = error?.response?.status;
  if (status === 503 || status === 502) {
    return 'The API is temporarily unavailable (bad gateway / service unavailable). Retry shortly.';
  }
  if (status === 404) {
    return 'API endpoint not found (404). The backend route may differ from what the frontend expects.';
  }

  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }
  const apiMessage = data?.message;
  if (apiMessage) return String(apiMessage);

  if (typeof error?.message === 'string') return error.message;
  return fallback;
}
