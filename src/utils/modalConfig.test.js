import assert from 'node:assert/strict'
import test from 'node:test'
import { getModalConfig, MODAL_TYPES, validateField, validateForm } from './modalConfig.js'

test('new user module selection defaults to Costos and requires at least one module', () => {
  const moduleField = getModalConfig(MODAL_TYPES.USUARIO).fields.find((field) => field.name === 'modulos')

  assert.deepEqual(moduleField.defaultValue, ['costos'])
  assert.equal(validateField(moduleField, ['inventario']), null)
  assert.equal(validateField(moduleField, ['costos', 'inventario']), null)
  assert.match(validateField(moduleField, []), /Módulos de acceso es requerido/)
})

test('user edit validates modules without requiring the create-only initial password', () => {
  const errors = validateForm(MODAL_TYPES.USUARIO, {
    nombre: 'Admin',
    apellidos: 'Usuario',
    correo: 'admin@example.com',
    rol: 'administrador',
    modulos: ['costos'],
    fincas: [],
    cultivos: [],
    contraseña: '',
  }, true)

  assert.equal(errors.contraseña, undefined)
  assert.equal(errors.modulos, undefined)
})
