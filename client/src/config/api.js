import { resolveApiConfig } from './resolveApiConfig.js';

const config = resolveApiConfig({
  configuredApiUrl: import.meta.env.VITE_API_URL,
  configuredSocketUrl: import.meta.env.VITE_SOCKET_URL,
  isProduction: import.meta.env.PROD,
});

export const API_URL = config.apiUrl;
export const SOCKET_URL = config.socketUrl;
