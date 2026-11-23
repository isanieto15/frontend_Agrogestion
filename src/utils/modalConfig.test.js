import assert from 'node:assert/strict'
import test from 'node:test'
import { getModalConfig, MODAL_TYPES, validateField } from './modalConfig.js'

test('new user module selection defaults to Costos and requires at least one module', () => {
  const moduleField = getModalConfig(MODAL_TYPES.USUARIO).fields.find((field) => field.name === 'modulos')

  assert.deepEqual(moduleField.defaultValue, ['costos'])
  assert.equal(validateField(moduleField, ['inventario']), null)
  assert.equal(validateField(moduleField, ['costos', 'inventario']), null)
  assert.match(validateField(moduleField, []), /Módulos de acceso es requerido/)
})
