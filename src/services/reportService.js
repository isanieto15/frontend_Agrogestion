import httpClient from './httpClient.js';

async function getJson(response) {
  if (response.success === false) {
    return { success: false, error: response.error || response.message || 'Error en la respuesta' };
  }
  return response;
}

function normalizeReportFilters(filters = {}) {
  const normalized = { ...filters };
  for (const key of ['fincaId', 'cultivoId', 'categoriaId', 'subcategoriaId', 'usuarioId', 'estadoId', 'tipoCultivoId', 'etapaId']) {
    const value = filters[key];
    if (value === '' || value == null) {
      normalized[key] = null;
      continue;
    }
    const number = Number(value);
    normalized[key] = Number.isInteger(number) && number > 0 ? number : null;
  }
  normalized.fechaInicio = filters.fechaInicio || null;
  normalized.fechaFin = filters.fechaFin || null;
  return normalized;
}

export async function fetchReportFilters(fincaId) {
  try {
    const query = fincaId ? `?fincaId=${encodeURIComponent(fincaId)}` : '';
    const response = await httpClient.get(`/api/reportes/filters${query}`);
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportFilters error', error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error de red',
    };
  }
}

export async function fetchReportPorCultivo(filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/por-cultivo', normalizeReportFilters(filters));
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportPorCultivo error', error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error de red',
    };
  }
}

export async function fetchReportCostos(filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/costos', normalizeReportFilters(filters));
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportCostos error', error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error de red',
    };
  }
}

export async function fetchReportProduccion(filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/produccion', normalizeReportFilters(filters));
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportProduccion error', error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error de red',
    };
  }
}

export async function fetchReportRentabilidad(filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/rentabilidad', normalizeReportFilters(filters));
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportRentabilidad error', error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error de red',
    };
  }
}

export async function fetchReportTrabajador(filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/trabajador', normalizeReportFilters(filters));
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportTrabajador error', error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error de red',
    };
  }
}

export async function fetchReportQuery(reportType, filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/query', {
      reportType,
      filters: normalizeReportFilters(filters),
    });
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportQuery error', error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error de red',
    };
  }
}

export async function exportReportFile(tipo, formato, filtros = {}) {
  let response
  try {
    response = await httpClient.post(
      '/api/reportes/export',
      { tipo, formato, filtros: normalizeReportFilters(filtros) },
      { responseType: 'blob' }
    )
  } catch (error) {
    const responseBlob = error.response?.data
    let message = error.response?.data?.message || error.message || 'No se pudo exportar el reporte.'
    if (responseBlob instanceof Blob) {
      try {
        const payload = JSON.parse(await responseBlob.text())
        message = payload.message || message
      } catch {
        message = 'No se pudo exportar el reporte.'
      }
    }
    throw new Error(message, { cause: error })
  }

  const blob = new Blob([response.data], { type: response.headers['content-type'] })
  const disposition = response.headers['content-disposition'] || ''
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `reporte-${tipo}.${formato}`
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return filename
}

export default {
  fetchReportFilters,
  fetchReportPorCultivo,
  fetchReportCostos,
  fetchReportProduccion,
  fetchReportRentabilidad,
  fetchReportTrabajador,
  fetchReportQuery,
  exportReportFile,
};
