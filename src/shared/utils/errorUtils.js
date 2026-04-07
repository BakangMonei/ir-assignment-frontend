export function getErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback;

  const apiMessage = error?.response?.data?.message;
  if (apiMessage) return apiMessage;

  if (typeof error?.message === 'string') return error.message;
  return fallback;
}
