import httpClient from './httpClient.js';

export async function fetchAdminEmailConfig() {
  try {
    const response = await httpClient.get('/admin/config-correo');
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'No se pudo consultar la configuración de correo.',
    };
  }
}

export async function saveAdminEmailConfig(config) {
  try {
    const response = await httpClient.put('/admin/config-correo', config);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'No se pudo guardar la configuración de correo.',
    };
  }
}

export async function testAdminEmailConfig() {
  try {
    const response = await httpClient.post('/admin/config-correo/probar');
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'No se pudo probar la configuración de correo.',
    };
  }
}

export async function fetchPasswordResetAvailability() {
  try {
    const response = await httpClient.get('/auth/password-reset-availability');
    return { available: Boolean(response.data) };
  } catch {
    return { available: false };
  }
}
