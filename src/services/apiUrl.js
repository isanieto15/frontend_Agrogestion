export const PRODUCTION_API_URL = 'https://backend-lyc0.onrender.com';

export function resolveApiUrl(apiUrl, isProduction) {
  if (isProduction) return PRODUCTION_API_URL;
  if (typeof apiUrl !== 'string' || !apiUrl.trim()) return apiUrl;

  return apiUrl.trim();
}
