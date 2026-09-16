import axios from 'axios';
import { API_URL } from '../config/api.js';
import { createCachedFetcher, sessionCache } from '../utils/sessionCache.js';
import { normalizeApiPath } from './normalizeApiPath.js';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // Add other default headers here if needed
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => ({
  ...config,
  url: normalizeApiPath(config.url),
}));

const rawGet = axiosInstance.get.bind(axiosInstance);

/** Returns the safe session-cache lifetime for stable reference endpoints. */
const cacheTtlFor = (url) => {
  if (/^\/menu\/?(?:\?|$)/.test(url)) return 5 * 60 * 1000;
  if (/^\/(roles|permissions|branches)\/?(?:\?|$)/.test(url)) return 2 * 60 * 1000;
  return 0;
};

/** Creates a deterministic query-string fragment for request cache keys. */
const stableParams = (params = {}) => Object.entries(params)
  .filter(([, value]) => value !== undefined && value !== null && value !== '')
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
  .join('&');

const cachedGet = createCachedFetcher({
  cache: sessionCache,
  fetch: (url, config) => rawGet(url, config),
});

axiosInstance.get = (url, config = {}) => {
  const normalizedUrl = normalizeApiPath(url);
  const { cacheTtl = cacheTtlFor(normalizedUrl), ...requestConfig } = config;
  const params = stableParams(requestConfig.params);
  const key = `http:${normalizedUrl}${params ? `?${params}` : ''}`;
  return cachedGet(normalizedUrl, {
    ...requestConfig,
    ttl: cacheTtl,
    key,
    dedupeInFlight: !requestConfig.signal,
  });
};

axiosInstance.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    if (method && method !== 'get' && method !== 'head') {
      sessionCache.removeByPrefix('http:');
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      sessionCache.remove('auth:user');
      sessionCache.removeByPrefix('http:');
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
