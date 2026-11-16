import httpClient from './httpClient.js';

function parseCurrencyParameter(value, maxDecimals = 2) {
  if (value == null) return NaN
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN
  let text = String(value).trim().replace(/\s/g, '')
  if (!text) return NaN
  const negative = text.includes('-')
  text = text.replace(/[^0-9.,]/g, '')
  if (!text) return NaN
  const lastSeparator = Math.max(text.lastIndexOf('.'), text.lastIndexOf(','))
  const trailingDigits = lastSeparator < 0 ? 0 : text.length - lastSeparator - 1
  const hasDecimalSeparator = trailingDigits > 0 && trailingDigits <= maxDecimals
  const integerPart = hasDecimalSeparator
    ? text.slice(0, lastSeparator).replace(/[.,]/g, '')
    : text.replace(/[.,]/g, '')
  const decimalPart = hasDecimalSeparator ? text.slice(lastSeparator + 1) : ''
  const parsed = Number(`${integerPart || '0'}${decimalPart ? `.${decimalPart}` : ''}`)
  return Number.isFinite(parsed) ? (negative ? -parsed : parsed) : NaN
}

export async function fetchCultivosPorFinca(fincaId, estado = 'ACTIVO') {
  const response = await httpClient.get(`/api/cultivos/finca/${fincaId}`, {
    params: { estado },
  });
  return response.data?.data ?? response.data;
}

export async function fetchTiposCultivo() {
  const response = await httpClient.get('/api/tipos-cultivo');
  return response.data?.data ?? response.data;
}

export async function createCultivo({ nombre, idtipocultivo, idfinca }) {
  console.log('[cultivoService] createCultivo -> request payload', { nombre, idtipocultivo, idfinca })
  const response = await httpClient.post('/api/cultivos', {
    nombre,
    idtipocultivo,
    idfinca,
  });
  console.log('[cultivoService] createCultivo -> response', response && response.data ? response.data : response)
  return response.data;
}

export async function fetchEstados() {
  const response = await httpClient.get('/api/estados');
  return response.data?.data ?? response.data;
}

export async function updateCultivo(id, { nombre, idtipocultivo, idestado, fecha_inicio }) {
  const response = await httpClient.put(`/api/cultivos/${id}`, {
    nombre,
    idtipocultivo,
    idestado,
    fecha_inicio,
  });
  return response.data;
}

export async function deleteCultivo(id) {
  const response = await httpClient.delete(`/api/cultivos/${id}`);
  return response.data;
}

export async function fetchCultivoDetalle(idcultivo) {
  const response = await httpClient.get(`/api/cultivos/${idcultivo}/detalle`);
  return response.data?.data ?? response.data;
}

export async function fetchCategoriasCosto() {
  const response = await httpClient.get('/api/categorias-costo');
  return response.data?.data ?? response.data;
}

export async function fetchSubcategoriasPorCategoria(categoriaId) {
  const response = await httpClient.get(`/api/subcategorias-costo/${categoriaId}`);
  return response.data?.data ?? response.data;
}

export async function fetchEstadosPago() {
  const response = await httpClient.get('/api/estados-pago');
  return response.data?.data ?? response.data;
}

export async function fetchUnidadesMedida() {
  const response = await httpClient.get('/api/unidades-medida');
  return response.data?.data ?? response.data;
}

export async function fetchTiposPrecio() {
  const response = await httpClient.get('/api/tipos-precio');
  return response.data?.data ?? response.data;
}

export async function fetchEtapaEnProcesoPorCultivo(cultivoId) {
  const response = await httpClient.get(`/api/cultivos/${cultivoId}/etapa-en-proceso`);
  return response.data?.data ?? response.data;
}

export async function fetchEtapasPorCultivo(cultivoId) {
  const response = await httpClient.get(`/api/cultivos/${cultivoId}/etapas`);
  return response.data?.data ?? response.data;
}

export async function fetchAllEtapasCatalog(tipoCultivoId = null) {
  const response = await httpClient.get('/api/etapas', {
    params: tipoCultivoId ? { tipoCultivoId } : {},
  });
  return response.data?.data ?? response.data;
}

export async function createEtapaForCultivo(cultivoId, { idetapa, descripcion, forceFinalize = false }) {
  const response = await httpClient.post(`/api/cultivos/${cultivoId}/etapas`, {
    idetapa,
    descripcion,
    forceFinalize,
  });
  return response.data;
}

export async function updateEtapaForCultivo(etapaCultivoId, { idetapa, descripcion, idestado }, { forceFinalize = false, forceEnProceso = false } = {}) {
  const response = await httpClient.put(`/api/cultivos/etapas/${etapaCultivoId}`, {
    idetapa,
    descripcion,
    idestado,
    forceFinalize,
    forceEnProceso,
  });
  return response.data;
}

export async function deleteEtapaForCultivo(etapaCultivoId) {
  const response = await httpClient.delete(`/api/cultivos/etapas/${etapaCultivoId}`);
  return response.data;
}

export async function validateCultivoForCost(cultivoId) {
  const response = await httpClient.get(`/api/cultivos/${cultivoId}/validate-for-cost`);
  return response.data;
}

export async function createCosto({ descripcion, valor, idcultivo = null, idetapa_cultivo = null, idusuario, idsubcategoria, idfinca, idestado_pago }) {
  const response = await httpClient.post('/api/costos', {
    descripcion: descripcion?.trim() || null,
    valor: parseCurrencyParameter(valor),
    idcultivo: idcultivo != null ? Number(idcultivo) : null,
    idetapa_cultivo: idetapa_cultivo != null ? Number(idetapa_cultivo) : null,
    idusuario: Number(idusuario),
    idsubcategoria: Number(idsubcategoria),
    idfinca: Number(idfinca),
    idestado_pago: Number(idestado_pago),
  })
  return response.data
}

export async function updateCosto(idcosto, { descripcion, valor, idsubcategoria, idestado_pago }) {
  const response = await httpClient.put(`/api/costos/${idcosto}`, {
    descripcion: descripcion?.trim() || null,
    valor: parseCurrencyParameter(valor),
    idsubcategoria: Number(idsubcategoria),
    idestado_pago: Number(idestado_pago),
  })
  return response.data
}

export async function fetchCostosPorFinca(fincaId) {
  const response = await httpClient.get(`/api/costos/finca/${fincaId}`)
  return response.data?.data ?? response.data
}

export async function deleteCosto(idcosto) {
  const response = await httpClient.delete(`/api/costos/${idcosto}`)
  return response.data
}

export async function changeCostoState(idcosto, nuevoEstado, motivo) {
  const response = await httpClient.patch(`/api/costos/${idcosto}/state`, {
    nuevoEstado,
    motivo,
  })
  return response.data
}

export async function changeCultivoState(idcultivo, nuevoEstado, motivo) {
  const response = await httpClient.patch(`/api/cultivos/${idcultivo}/state`, {
    nuevoEstado,
    motivo,
  })
  return response.data
}

export async function changeEtapaState(idEtapaCultivo, nuevoEstado, motivo) {
  const response = await httpClient.patch(`/api/cultivos/etapas/${idEtapaCultivo}/state`, {
    nuevoEstado,
    motivo,
  })
  return response.data
}

export async function changeCosechaState(idCosecha, nuevoEstado, motivo) {
  const response = await httpClient.patch(`/api/cosechas/${idCosecha}/state`, {
    nuevoEstado,
    motivo,
  })
  return response.data
}

export async function fetchCosechasPorCultivo(cultivoId) {
  const response = await httpClient.get(`/api/cultivos/${cultivoId}/cosechas`)
  return response.data?.data ?? response.data
}

export async function createCosecha(cultivoId, { cantidad, idunidadmedida, precio, idtipo_precio }) {
  const response = await httpClient.post(`/api/cultivos/${cultivoId}/cosechas`, {
    cantidad: parseCurrencyParameter(cantidad, 3),
    idunidadmedida,
    precio: parseCurrencyParameter(precio),
    idtipo_precio,
  })
  return response.data
}

export async function updateCosecha(idcosecha, { cantidad, idunidadmedida, precio, idtipo_precio }) {
  const response = await httpClient.put(`/api/cosechas/${idcosecha}`, {
    cantidad: parseCurrencyParameter(cantidad, 3),
    idunidadmedida,
    precio: parseCurrencyParameter(precio),
    idtipo_precio,
  })
  return response.data
}

export async function deleteCosecha(idcosecha) {
  const response = await httpClient.delete(`/api/cosechas/${idcosecha}`)
  return response.data
}
