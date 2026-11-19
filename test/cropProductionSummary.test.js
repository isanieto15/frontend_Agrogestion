import assert from 'node:assert/strict'
import test from 'node:test'
import { getCropProductionSummary } from '../src/pages/admin/cropProductionSummary.js'

function reportRow(productionSummary) {
  return { production_summary: productionSummary }
}

test('all convertible harvests keep the common-base total', () => {
  const result = getCropProductionSummary([
    reportRow({
      totalsByBaseUnit: [{ unidad: 'kg', cantidad: '160.5' }],
      totalsByOriginalUnit: [{ unidad: 'caja', cantidad: '20' }],
      excludedHarvestCount: 0,
      excludedCropCount: 0,
      pendingConversions: [],
      harvestCount: 2,
    }),
  ])

  assert.equal(result.productionValue, '160,5 kg')
  assert.equal(result.excludedHarvestCount, 0)
})

test('partial totals show excluded harvests and pending crop-unit pairs', () => {
  const result = getCropProductionSummary([
    reportRow({
      totalsByBaseUnit: [{ unidad: 'kg', cantidad: 120 }],
      totalsByOriginalUnit: [{ unidad: 'kg', cantidad: 120 }, { unidad: 'caja', cantidad: 10 }],
      excludedHarvestCount: 1,
      excludedCropCount: 1,
      pendingConversions: [{ cultivoId: 7, cultivo: 'Tomate', unidadId: 3, unidad: 'caja' }],
      harvestCount: 2,
    }),
  ])

  assert.equal(result.productionValue, '120 kg')
  assert.equal(result.excludedHarvestCount, 1)
  assert.equal(result.excludedCropCount, 1)
  assert.deepEqual(result.pendingConversions.map((item) => `${item.cultivo} (${item.unidad})`), ['Tomate (caja)'])
})

test('incomparable base units fall back to original-unit totals', () => {
  const result = getCropProductionSummary([
    reportRow({
      totalsByBaseUnit: [{ unidad: 'kg', cantidad: 120 }, { unidad: 'caja', cantidad: 40 }],
      totalsByOriginalUnit: [{ unidad: 'kg', cantidad: 120 }, { unidad: 'caja', cantidad: 40 }],
      excludedHarvestCount: 0,
      excludedCropCount: 0,
      pendingConversions: [],
      harvestCount: 2,
    }),
  ])

  assert.equal(result.productionValue, '120 kg · 40 caja')
})

test('no convertible harvests still show their original-unit breakdown', () => {
  const result = getCropProductionSummary([
    reportRow({
      totalsByBaseUnit: [],
      totalsByOriginalUnit: [{ unidad: 'kg', cantidad: 120 }, { unidad: 'caja', cantidad: 40 }],
      excludedHarvestCount: 2,
      excludedCropCount: 2,
      pendingConversions: [],
      harvestCount: 2,
    }),
  ])

  assert.equal(result.productionValue, '120 kg · 40 caja')
})

test('no harvests explain why the total is unavailable', () => {
  const result = getCropProductionSummary([
    reportRow({
      totalsByBaseUnit: [],
      totalsByOriginalUnit: [],
      excludedHarvestCount: 0,
      excludedCropCount: 0,
      pendingConversions: [],
      harvestCount: 0,
    }),
  ])

  assert.equal(result.productionValue, 'No comparable: no hay cosechas para los filtros seleccionados')
})
