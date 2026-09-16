const CACHE_VERSION = 'v1';
const DEFAULT_PREFIX = `resto:${CACHE_VERSION}:`;

/** Returns session storage when the runtime permits access to it. */
const getDefaultStorage = () => {
  try {
    return globalThis.sessionStorage;
  } catch {
    return null;
  }
};

/**
 * Creates a versioned, expiring cache backed by Web Storage. All storage
 * failures are treated as cache misses so restricted storage cannot break UI.
 */
export const createSessionCache = ({
  storage = getDefaultStorage(),
  now = Date.now,
  prefix = DEFAULT_PREFIX,
} = {}) => {
  const fullKey = (key) => `${prefix}${key}`;

  const remove = (key) => {
    try {
      storage?.removeItem(fullKey(key));
    } catch {
      // Cache invalidation must never break authentication or requests.
    }
  };

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
      try {
        const matchingKeys = [];
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (key?.startsWith(fullKey(keyPrefix))) matchingKeys.push(key);
        }
        matchingKeys.forEach((key) => storage.removeItem(key));
      } catch {
        // Storage access can fail in privacy modes or restricted contexts.
      }
    },
  };
};

/**
 * Wraps an asynchronous fetch function with expiring cache reads and optional
 * in-flight request deduplication.
 */
export const createCachedFetcher = ({ cache, fetch }) => {
  const inFlight = new Map();

  return async (resource, {
    ttl = 0,
    key = resource,
    dedupeInFlight = true,
    ...options
  } = {}) => {
    const cachedValue = ttl > 0 ? cache.get(key) : null;
    if (cachedValue) return { ...cachedValue, fromCache: true };

    if (dedupeInFlight && inFlight.has(key)) return inFlight.get(key);

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
      .finally(() => {
        if (inFlight.get(key) === request) inFlight.delete(key);
      });

    if (dedupeInFlight) inFlight.set(key, request);
    return request;
  };
};

export const sessionCache = createSessionCache();
