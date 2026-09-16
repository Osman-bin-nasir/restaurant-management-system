const CACHE_VERSION = 'v1';
const DEFAULT_PREFIX = `resto:${CACHE_VERSION}:`;

const getDefaultStorage = () => {
  try {
    return globalThis.sessionStorage;
  } catch {
    return null;
  }
};

export const createSessionCache = ({
  storage = getDefaultStorage(),
  now = Date.now,
  prefix = DEFAULT_PREFIX,
} = {}) => {
  const fullKey = (key) => `${prefix}${key}`;

  const remove = (key) => storage?.removeItem(fullKey(key));

  return {
    get(key) {
      if (!storage) return null;
      try {
        const raw = storage.getItem(fullKey(key));
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (!entry.expiresAt || entry.expiresAt <= now()) {
          remove(key);
          return null;
        }
        return entry.value;
      } catch {
        remove(key);
        return null;
      }
    },
    set(key, value, ttl) {
      if (!storage || ttl <= 0) return;
      try {
        storage.setItem(fullKey(key), JSON.stringify({
          value,
          expiresAt: now() + ttl,
        }));
      } catch {
        // Storage can be unavailable or full; caching must never break the app.
      }
    },
    remove,
    removeByPrefix(keyPrefix) {
      if (!storage) return;
      const matchingKeys = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key?.startsWith(fullKey(keyPrefix))) matchingKeys.push(key);
      }
      matchingKeys.forEach((key) => storage.removeItem(key));
    },
  };
};

export const createCachedFetcher = ({ cache, fetch }) => {
  const inFlight = new Map();

  return async (resource, { ttl = 0, key = resource, ...options } = {}) => {
    const cachedValue = ttl > 0 ? cache.get(key) : null;
    if (cachedValue) return { ...cachedValue, fromCache: true };

    if (inFlight.has(key)) return inFlight.get(key);

    const request = Promise.resolve(fetch(resource, options))
      .then((response) => {
        if (ttl > 0 && response?.status >= 200 && response.status < 300) {
          cache.set(key, {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          }, ttl);
        }
        return response;
      })
      .finally(() => inFlight.delete(key));

    inFlight.set(key, request);
    return request;
  };
};

export const sessionCache = createSessionCache();
