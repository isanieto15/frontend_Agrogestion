import httpClient from './httpClient.js';

async function requestData(request) {
  const response = await request;
  if (response.data?.success === false) {
    throw new Error(response.data.message || 'No se pudo completar la operación.');
  }
  return response.data?.data ?? response.data;
}

export const fetchCostingConfiguration = () =>
  requestData(httpClient.get('/api/costeo/configuracion'));

export const createStage = (nombre, descripcion) =>
  requestData(httpClient.post('/api/costeo/etapas', { nombre, descripcion }));

export const updateStage = (id, nombre, descripcion) =>
  requestData(httpClient.put(`/api/costeo/etapas/${id}`, { nombre, descripcion }));

export const changeStageState = (id, activo) =>
  requestData(httpClient.patch(`/api/costeo/etapas/${id}/estado`, { activo }));

export const createCropType = (nombre) =>
  requestData(httpClient.post('/api/costeo/tipos-cultivo', { nombre }));

export const updateCropType = (id, nombre) =>
  requestData(httpClient.put(`/api/costeo/tipos-cultivo/${id}`, { nombre }));

export const changeCropTypeState = (id, activo) =>
  requestData(httpClient.patch(`/api/costeo/tipos-cultivo/${id}/estado`, { activo }));

export const saveCropTypeStages = (id, etapaIds) =>
  requestData(httpClient.put(`/api/costeo/tipos-cultivo/${id}/etapas`, { etapaIds }));

export const fetchGeneralCostAllocations = (fincaId) =>
  requestData(httpClient.get(`/api/costeo/prorrateo/${fincaId}`));

export const saveGeneralCostAllocations = (fincaId, asignaciones) =>
  requestData(httpClient.put(`/api/costeo/prorrateo/${fincaId}`, { asignaciones }));

export const fetchUnitConversions = (tipoCultivoId) =>
  requestData(httpClient.get('/api/costeo/conversiones', { params: { tipoCultivoId } }));

export const saveUnitConversions = (tipoCultivoId, conversiones) =>
  requestData(httpClient.put(`/api/costeo/tipos-cultivo/${tipoCultivoId}/conversiones`, { conversiones }));

export const saveSubcategoryConfig = (id, codigoContable, incluirCostoUnitario) =>
  requestData(httpClient.put(`/api/costeo/subcategorias/${id}/configuracion`, {
    codigoContable,
    incluirCostoUnitario,
  }));

export const fetchInventoryProducts = (fincaId) =>
  requestData(httpClient.get(`/api/costeo/inventario/productos/${fincaId}`));

export const registerInventoryConsumption = (payload) =>
  requestData(httpClient.post('/api/costeo/inventario/consumos', payload));

export const registerLaborPayment = (payload) =>
  requestData(httpClient.post('/api/costeo/pagos-mano-obra', payload));

export const fetchLaborPayments = (params) =>
  requestData(httpClient.get('/api/costeo/pagos-mano-obra', { params }));
