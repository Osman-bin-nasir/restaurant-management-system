const DEFAULT_API_URL = 'https://restaurant-management-system-7r81.onrender.com/api';

const withoutTrailingSlash = (url) => url.replace(/\/$/, '');

/**
 * Keeps browser API calls same-origin in production so the HTTP-only auth
 * cookie is first-party, while Socket.IO continues to connect to Render.
 */
export const resolveApiConfig = ({
  configuredApiUrl,
  configuredSocketUrl,
  isProduction,
}) => {
  const requestedApiUrl = withoutTrailingSlash(configuredApiUrl || DEFAULT_API_URL);
  const directApiUrl = /^https?:\/\//.test(requestedApiUrl)
    ? requestedApiUrl
    : DEFAULT_API_URL;

  return {
    apiUrl: isProduction ? '/api' : requestedApiUrl,
    socketUrl: withoutTrailingSlash(
      configuredSocketUrl || directApiUrl.replace(/\/api$/, ''),
    ),
  };
};
