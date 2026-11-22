import httpClient from './httpClient.js';

export async function fetchCatalogos() {
  const response = await httpClient.get('/api/costeo/catalogos');
  return response.data?.data ?? response.data;
}

export async function createCatalogoItem(catalogo, item) {
  const response = await httpClient.post(`/api/costeo/catalogos/${catalogo}`, item);
  return response.data;
}

export async function updateCatalogoItem(catalogo, id, item) {
  const response = await httpClient.put(`/api/costeo/catalogos/${catalogo}/${id}`, item);
  return response.data;
}

export async function deleteCatalogoItem(catalogo, id) {
  const response = await httpClient.delete(`/api/costeo/catalogos/${catalogo}/${id}`);
  return response.data;
}

