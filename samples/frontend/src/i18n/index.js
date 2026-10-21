// Arayüz dili (TR/EN), bağımlılıksız (D-13, D-41). Sözlükler düz anahtar → metin; `{ad}`
// yer tutucuları `t(anahtar, { ad })` ile doldurulur. Dil değişince sayfa yeniden yüklenir
// (`changeLanguage`), bu yüzden `t` ve `locale` modül düzeyinde güvenle kullanılabilir.
import tr from './tr.js';
import en from './en.js';

export const SUPPORTED_LANGUAGES = ['tr', 'en'];
export const DEFAULT_LANGUAGE = 'tr';
const STORAGE_KEY = 'yz_lang';
const LOCALES = { tr: 'tr-TR', en: 'en-US' };
const DICTIONARIES = { tr, en };

const storage = () => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

export const isSupported = (code) => SUPPORTED_LANGUAGES.includes(code);

// Kayıtlı seçim → tarayıcı dili → Türkçe.
export function detectLanguage() {
  const store = storage();
  if (!store) return DEFAULT_LANGUAGE; // tarayıcı dışı (node --test): Türkçe
  const saved = store.getItem(STORAGE_KEY);
  if (isSupported(saved)) return saved;
  const browser = typeof navigator !== 'undefined' ? String(navigator.language || '').slice(0, 2).toLowerCase() : '';
  return isSupported(browser) ? browser : DEFAULT_LANGUAGE;
}

let current = detectLanguage();
if (typeof document !== 'undefined') {
  document.documentElement.lang = current;
  // index.html is Turkish; the tab title and description follow the language.
  document.title = translate(current, 'app.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', translate(current, 'app.description'));
}

export const getLanguage = () => current;
export const getLocale = () => LOCALES[current];
// Modül düzeyinde sabit olarak kullanılabilir (dil değişince sayfa yenilenir).
export const locale = LOCALES[current];

// Kayıtlı dili değiştirir; sayfayı yenilemez (çağıran karar verir).
export function storeLanguage(code) {
  if (!isSupported(code)) return false;
  storage()?.setItem(STORAGE_KEY, code);
  return true;
}

export function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}

// Eksik anahtar sırayla seçili dil → Türkçe → anahtarın kendisi.
export function translate(language, key, params) {
  const dictionary = DICTIONARIES[language] || tr;
  const template = dictionary[key] ?? tr[key] ?? key;
  return interpolate(template, params);
}

export function t(key, params) {
  return translate(current, key, params);
}

export const hasStoredLanguage = () => isSupported(storage()?.getItem(STORAGE_KEY));

// Saves the language and reloads: every text, number and date format (many are module
// constants) is then rebuilt in the new language in one go. A signed-in user's choice is
// also saved on the account (authStore.setLanguage) because the server answers in the
// account's language.
export function changeLanguage(code) {
  if (code === current || !storeLanguage(code)) return;
  if (typeof window !== 'undefined') window.location.reload();
}
