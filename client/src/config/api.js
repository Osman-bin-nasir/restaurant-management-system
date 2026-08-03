const configuredApiUrl = import.meta.env.VITE_API_URL;

export const API_URL = configuredApiUrl || 'https://restaurant-management-system-5gwu.onrender.com/api';
export const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');
