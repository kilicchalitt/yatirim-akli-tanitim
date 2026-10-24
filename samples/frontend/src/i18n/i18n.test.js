// Run with `node --test` in frontend/. The two dictionaries must stay in step.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import tr from './tr.js';
import en from './en.js';
import { translate, interpolate, isSupported, detectLanguage } from './index.js';

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('tr and en have exactly the same keys', () => {
  const trKeys = Object.keys(tr).sort();
  const enKeys = Object.keys(en).sort();
  assert.deepEqual(enKeys.filter((k) => !(k in tr)), [], 'keys only in en');
  assert.deepEqual(trKeys.filter((k) => !(k in en)), [], 'keys only in tr');
});

test('no value is empty and placeholders match between languages', () => {
  for (const key of Object.keys(tr)) {
    assert.ok(tr[key].trim() !== '', `tr ${key} is empty`);
    assert.ok(en[key].trim() !== '', `en ${key} is empty`);
    assert.deepEqual(placeholders(en[key]), placeholders(tr[key]), `placeholders differ for ${key}`);
  }
});

test('translate fills placeholders and falls back to Turkish, then to the key', () => {
  assert.equal(translate('en', 'addStockModal.portfoye_eklendi', { symbol: 'AAPL' }), 'AAPL was added to the portfolio.');
  assert.equal(translate('tr', 'addStockModal.portfoye_eklendi', { symbol: 'AAPL' }), 'AAPL portföye eklendi.');
  assert.equal(translate('en', 'no.such.key'), 'no.such.key');
  assert.equal(interpolate('{a} and {b}', { a: 1 }), '1 and {b}');
});

test('only tr and en are supported; outside a browser the language is Turkish', () => {
  assert.ok(isSupported('tr') && isSupported('en'));
  assert.ok(!isSupported('de'));
  assert.equal(detectLanguage(), 'tr');
});
