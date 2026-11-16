export function resolveApiUrl(apiUrl, isProduction) {
  if (typeof apiUrl !== 'string' || !apiUrl.trim()) return apiUrl;

  const normalizedUrl = apiUrl.trim();
  return isProduction
    ? normalizedUrl.replace(/^http:\/\//i, 'https://')
    : normalizedUrl;
}
