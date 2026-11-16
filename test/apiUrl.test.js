import assert from 'node:assert/strict';
import test from 'node:test';
import { PRODUCTION_API_URL, resolveApiUrl } from '../src/services/apiUrl.js';

test('production uses the verified HTTPS backend URL', () => {
  assert.equal(resolveApiUrl('http://old-api.example.com', true), PRODUCTION_API_URL);
  assert.equal(PRODUCTION_API_URL, 'https://backend-lyc0.onrender.com');
});

test('development API URLs keep their configured protocol', () => {
  assert.equal(resolveApiUrl('http://localhost:3000', false), 'http://localhost:3000');
});
