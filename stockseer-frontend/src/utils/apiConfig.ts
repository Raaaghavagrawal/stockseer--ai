const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!configuredApiUrl && !import.meta.env.DEV) {
  throw new Error('VITE_API_BASE_URL must be set for deployed builds.');
}

const configuredBaseUrl = configuredApiUrl || 'http://127.0.0.1:8000';
let parsedBaseUrl: URL;
try {
  parsedBaseUrl = new URL(configuredBaseUrl);
} catch {
  throw new Error('VITE_API_BASE_URL must be an absolute HTTP(S) backend root URL.');
}

if (
  !['http:', 'https:'].includes(parsedBaseUrl.protocol) ||
  !parsedBaseUrl.hostname ||
  parsedBaseUrl.username ||
  parsedBaseUrl.password ||
  !['', '/'].includes(parsedBaseUrl.pathname) ||
  parsedBaseUrl.search ||
  parsedBaseUrl.hash
) {
  throw new Error('VITE_API_BASE_URL must be an absolute HTTP(S) backend root URL without credentials, path, query, or fragment.');
}

export const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}
