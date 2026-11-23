export function formatMateriaPrimaCOP(value) {
  const amount = Number(value)
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatMateriaPrimaQuantity(value) {
  const quantity = Number(value)
  return Number.isFinite(quantity)
    ? quantity.toLocaleString('es-CO', { maximumFractionDigits: 6 })
    : '--'
}

export function formatMateriaPrimaDetalles(details = []) {
  return (Array.isArray(details) ? details : []).map((detail) => ({
    id: detail.idKardex,
    producto: detail.producto || '--',
    referencia: detail.referencia || `Salida #${detail.idKardex}`,
    cantidad: formatMateriaPrimaQuantity(detail.cantidad),
    unidad: detail.unidad || '--',
    costoUnitarioFmt: formatMateriaPrimaCOP(detail.costoUnitario),
    subtotalFmt: formatMateriaPrimaCOP(detail.subtotal),
  }))
}

export function totalMateriaPrimaDetalles(details = []) {
  return (Array.isArray(details) ? details : []).reduce(
    (total, detail) => total + (Number(detail.subtotal) || 0),
    0
  )
}
