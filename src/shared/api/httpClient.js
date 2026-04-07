import axios from 'axios';
import { API_BASE_URL } from '../constants/endpoints';

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
});

http.interceptors.request.use(config => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(
      '[API Request]',
      config.method?.toUpperCase(),
      config.url,
      config.params || config.data
    );
  }
  return config;
});

http.interceptors.response.use(
  response => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[API Response]', response.config.url, response.data);
    }

    const payload = response.data;
    if (payload && payload.success === false) {
      const err = new Error(payload.message || 'Request failed');
      err.response = { data: payload };
      throw err;
    }

    return payload?.data ?? payload;
  },
  error => Promise.reject(error)
);

export { http };
