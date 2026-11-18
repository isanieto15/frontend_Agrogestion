export function normalizeRole(role) {
  const value = String(role || '')
    .trim()
    .toLowerCase()
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')

  if (value === 'admin' || value === 'administrador' || value === '1') return 'admin'
  if (value === 'worker' || value === 'trabajador' || value === '2') return 'worker'
  return ''
}
