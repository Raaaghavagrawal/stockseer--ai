const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!configuredApiUrl && !import.meta.env.DEV) {
  throw new Error('VITE_API_BASE_URL must be set for deployed builds.');
}

export const API_BASE_URL = (configuredApiUrl || 'http://localhost:8000').replace(/\/+$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}
