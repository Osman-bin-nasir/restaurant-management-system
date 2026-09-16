/**
 * Registers the production service worker after initial rendering so service
 * worker setup never delays the application's critical path.
 */
export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;

  const register = () => navigator.serviceWorker.register('/sw.js').catch(() => {
    // The application remains fully functional if registration is unavailable.
  });

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(register, { timeout: 2_000 });
  } else {
    window.setTimeout(register, 0);
  }
};
