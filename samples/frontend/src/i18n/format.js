// Sayı ve tarih biçimleri seçili dile göre (tr-TR / en-US); biçimleyiciler önbelleğe alınır.
import { getLocale } from './index.js';

const cache = new Map();

function formatter(Ctor, options) {
  const localeCode = getLocale();
  const key = `${Ctor.name}|${localeCode}|${JSON.stringify(options || {})}`;
  if (!cache.has(key)) cache.set(key, new Ctor(localeCode, options));
  return cache.get(key);
}

export const numberFormat = (options) => formatter(Intl.NumberFormat, options);
export const dateFormat = (options) => formatter(Intl.DateTimeFormat, options);

export const formatNumber = (value, options) => numberFormat(options).format(value);
export const formatDate = (value, options = { dateStyle: 'short' }) => dateFormat(options).format(new Date(value));

export const fixed2 = (value) => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// `value` is already a percentage (4.8 → "%4,80" in Turkish, "4.80%" in English).
export const formatPercent = (value, digits = 2) =>
  formatNumber(value / 100, { style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits });
