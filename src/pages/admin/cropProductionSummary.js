export function getCropProductionSummary(data) {
  const rows = Array.isArray(data) ? data : []
  const summary = rows.find((row) => row.production_summary)?.production_summary
  const baseTotals = Array.isArray(summary?.totalsByBaseUnit)
    ? summary.totalsByBaseUnit.filter((item) => item?.unidad && Number.isFinite(Number(item.cantidad)))
    : []
  const originalTotals = Array.isArray(summary?.totalsByOriginalUnit)
    ? summary.totalsByOriginalUnit.filter((item) => item?.unidad && Number.isFinite(Number(item.cantidad)))
    : []
  const excludedHarvestCount = Number(summary?.excludedHarvestCount) || 0
  const excludedCropCount = Number(summary?.excludedCropCount) || 0
  const pendingConversions = Array.isArray(summary?.pendingConversions)
    ? [...new Map(summary.pendingConversions.filter(Boolean).map((item) => [
      `${item.cultivoId ?? item.cultivo}:${item.unidadId ?? item.unidad}`,
      item,
    ])).values()]
    : []
  const originalUnitTotals = [...originalTotals.reduce((totals, item) => {
    totals.set(item.unidad, (totals.get(item.unidad) || 0) + Number(item.cantidad))
    return totals
  }, new Map())]
  const fallbackProductionRows = rows.filter((row) => row.total_produccion != null && row.unidad_base)
  const fallbackProductionUnits = new Set(fallbackProductionRows.map((row) => row.unidad_base))
  const fallbackProductionTotal = fallbackProductionRows.reduce((total, row) => total + Number(row.total_produccion), 0)
  const productionValue = summary
    ? baseTotals.length === 1
      ? `${Number(baseTotals[0].cantidad).toLocaleString('es-CO')} ${baseTotals[0].unidad}`
      : originalUnitTotals.length > 0
        ? originalUnitTotals.map(([unit, quantity]) => `${quantity.toLocaleString('es-CO')} ${unit}`).join(' · ')
        : Number(summary.harvestCount) > 0
          ? 'No comparable: no se pudo identificar la unidad de las cosechas'
          : 'No comparable: no hay cosechas para los filtros seleccionados'
    : fallbackProductionRows.length > 0 && fallbackProductionUnits.size === 1
      ? `${fallbackProductionTotal.toLocaleString('es-CO')} ${[...fallbackProductionUnits][0]}`
      : 'No comparable: no hay conversiones disponibles'

  return {
    productionValue,
    hasProductionSummary: Boolean(summary),
    excludedHarvestCount,
    excludedCropCount,
    pendingConversions,
  }
}
