import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeRole } from '../src/utils/normalizeRole.js'

test('normalizes supported worker and administrator role values', () => {
  assert.equal(normalizeRole('worker'), 'worker')
  assert.equal(normalizeRole(' Trabajador '), 'worker')
  assert.equal(normalizeRole('2'), 'worker')
  assert.equal(normalizeRole('administrador'), 'admin')
  assert.equal(normalizeRole('1'), 'admin')
  assert.equal(normalizeRole('unknown'), '')
})
