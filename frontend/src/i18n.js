import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import {
  translateDOM, restoreDOM,
  startObserver, stopObserver,
  hasCachedTranslations,
} from './services/translationService';

const STORAGE_KEY = 'bmp_lang';

function getSavedLang() {
  try { return localStorage.getItem(STORAGE_KEY) || 'fr'; } catch { return 'fr'; }
}

function applyLangToDOM(lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

// ✅ Initialize i18n with empty resources first, then load FR JSON dynamically
// This avoids blocking the initial JS parse with a large JSON import
i18n
  .use(initReactI18next)
  .init({
    resources: {},
    lng: 'fr',
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en', 'ar'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

// Load FR translation asynchronously — doesn't block initial render
import('./locales/fr/translation.json').then((module) => {
  const frTranslation = module.default || module;
  i18n.addResourceBundle('fr', 'translation', frTranslation, true, true);
}).catch(() => {});

// Apply saved language on startup
const savedLang = getSavedLang();
applyLangToDOM(savedLang);

if (savedLang !== 'fr') {
  // Wait for React to fully render before translating
  const delay = hasCachedTranslations(savedLang) ? 300 : 1000;
  setTimeout(() => {
    translateDOM(savedLang).then(() => startObserver(savedLang));
  }, delay);
}

/**
 * Switch language.
 * @param {string} lang - 'fr' | 'en' | 'ar'
 * @param {function} [onProgress] - called with 0-100 during API translation
 */
export async function changeLanguage(lang, onProgress) {
  localStorage.setItem(STORAGE_KEY, lang);
  applyLangToDOM(lang);
  stopObserver();

  if (lang === 'fr') {
    restoreDOM();
    return;
  }

  await translateDOM(lang, onProgress);
  startObserver(lang);
}

export function getCurrentLang() {
  return getSavedLang();
}

export { hasCachedTranslations as isLanguageLoaded, useTranslation };
export default i18n;
