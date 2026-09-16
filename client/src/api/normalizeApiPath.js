/**
 * Vercel's external rewrite does not match API URLs ending in a slash. Keep
 * relative API paths canonical so they cannot fall through to the SPA shell.
 */
export const normalizeApiPath = (url) => {
  if (typeof url !== 'string' || url === '/' || !url.startsWith('/')) return url;
  return url.replace(/\/+([?#]|$)/, '$1');
};
