import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getCompatibleMateriaPrimaUnits,
  normalizeMateriaPrimaUnit,
} from './materiaPrimaUnits.js'

test('matches singular, plural and common abbreviations for the same unit', () => {
  assert.equal(normalizeMateriaPrimaUnit('L'), normalizeMateriaPrimaUnit('Litros'))
  assert.equal(normalizeMateriaPrimaUnit('kg'), normalizeMateriaPrimaUnit('Kilogramos'))
  assert.equal(normalizeMateriaPrimaUnit('Unidad'), normalizeMateriaPrimaUnit('Unidades'))
})

test('does not treat different scales as interchangeable', () => {
  assert.notEqual(normalizeMateriaPrimaUnit('Litros'), normalizeMateriaPrimaUnit('Mililitros'))
  assert.notEqual(normalizeMateriaPrimaUnit('Kilogramos'), normalizeMateriaPrimaUnit('Gramos'))
})

test('returns only catalog units compatible with a Kardex output', () => {
  const units = [
    { id: 1, nombre: 'Litros' },
    { id: 2, nombre: 'Mililitros' },
    { id: 3, nombre: 'Kilogramos' },
  ]

  assert.deepEqual(getCompatibleMateriaPrimaUnits('litro', units), [units[0]])
})
