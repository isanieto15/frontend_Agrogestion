import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveApiUrl } from '../src/services/apiUrl.js';

test('production API URLs use HTTPS to avoid POST-to-GET redirects', () => {
  assert.equal(resolveApiUrl('http://api.example.com', true), 'https://api.example.com');
  assert.equal(resolveApiUrl('https://api.example.com', true), 'https://api.example.com');
});

test('development API URLs keep their configured protocol', () => {
  assert.equal(resolveApiUrl('http://localhost:3000', false), 'http://localhost:3000');
});
