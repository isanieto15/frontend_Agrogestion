import { formatCOP } from '../services/agroData'

function formatQuantity(value) {
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
    cantidad: formatQuantity(detail.cantidad),
    unidad: detail.unidad || '--',
    costoUnitarioFmt: formatCOP(detail.costoUnitario),
    subtotalFmt: formatCOP(detail.subtotal),
  }))
}

export function totalMateriaPrimaDetalles(details = []) {
  return (Array.isArray(details) ? details : []).reduce(
    (total, detail) => total + (Number(detail.subtotal) || 0),
    0
  )
}
