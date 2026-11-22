import httpClient from './httpClient';

export async function fetchAuditEvents(filters) {
  const response = await httpClient.get('/api/auditoria', { params: filters });
  return response.data.data;
}

export async function fetchAuditEvent(id) {
  const response = await httpClient.get(`/api/auditoria/${id}`);
  return response.data.data;
}
