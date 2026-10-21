import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom reports an English browser; the suite runs in Turkish (the language is read from
// localStorage when src/i18n loads, also after vi.resetModules()).
const resetStorage = () => {
  localStorage.clear();
  localStorage.setItem('yz_lang', 'tr');
};
resetStorage();

// Each test starts from a clean DOM and an empty localStorage.
afterEach(() => {
  cleanup();
  resetStorage();
});
