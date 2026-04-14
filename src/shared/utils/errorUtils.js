export function getErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback;

  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }
  const apiMessage = data?.message;
  if (apiMessage) return String(apiMessage);

  if (typeof error?.message === 'string') return error.message;
  return fallback;
}
