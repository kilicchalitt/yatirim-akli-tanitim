import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// jsdom does not run the cascade, so the theme guarantees are checked on the stylesheet text:
// every colour a form control uses comes from a token, and the dark set defines every token
// the light set does for colours (KI-39: selects once stayed dark in the light theme).
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8').replace(/\r\n/g, '\n');

const block = (selector) => {
  const start = css.indexOf(`${selector} {`);
  expect(start, `${selector} block`).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated ${selector}`);
};

const tokensOf = (text) => new Set([...text.matchAll(/^\s*(--[\w-]+):/gm)].map((m) => m[1]));

const COLOUR_TOKENS = [
  '--bg', '--surface', '--surface-2', '--border', '--border-strong', '--text', '--text-muted', '--text-faint',
  '--brand', '--on-brand', '--accent', '--accent-strong', '--accent-2', '--up', '--down', '--warn', '--overlay',
  '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--chart-6', '--chart-7', '--chart-8',
];

describe('theme tokens', () => {
  const light = tokensOf(block(':root'));
  const dark = tokensOf(block('[data-theme="dark"]'));

  test('the light and the dark set both define every colour token', () => {
    for (const token of COLOUR_TOKENS) {
      expect(light.has(token), `light ${token}`).toBe(true);
      expect(dark.has(token), `dark ${token}`).toBe(true);
    }
  });

  test('dark overrides only tokens that exist in the light set', () => {
    for (const token of dark) expect(light.has(token), `dark-only token ${token}`).toBe(true);
  });
});

describe('form controls follow the theme', () => {
  test('select and its options take background and text colour from tokens', () => {
    const select = block('.input,\n.select,\nselect,\ntextarea');
    expect(select).toMatch(/background-color:\s*var\(--surface\)/);
    expect(select).toMatch(/color:\s*var\(--text\)/);
    const option = block('select option,\n.select option');
    expect(option).toMatch(/background-color:\s*var\(--surface\)/);
    expect(option).toMatch(/color:\s*var\(--text\)/);
  });

  test('no control rule hard-codes a colour', () => {
    for (const selector of ['.input,\n.select,\nselect,\ntextarea', 'select option,\n.select option']) {
      const rule = block(selector);
      expect(rule, selector).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(rule, selector).not.toMatch(/rgba?\(/);
      expect(rule, selector).not.toMatch(/!important/);
    }
  });

  test('the old legacy token aliases are gone', () => {
    expect(css).not.toMatch(/--bg-primary|--accent-green|--glass-bg|--gradient-primary/);
  });
});
