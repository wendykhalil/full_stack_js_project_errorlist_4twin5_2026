import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';
import arTranslation from './locales/ar/translation.json';

const BUNDLED_RESOURCES = {
  en: { translation: enTranslation },
  fr: { translation: frTranslation },
  ar: { translation: arTranslation },
};

function normalizeLanguage(language) {
  const value = String(language || '').trim().toLowerCase();
  if (value.startsWith('ar')) return 'ar';
  if (value.startsWith('fr')) return 'fr';
  return 'en';
}

function applyDocumentLanguage(language) {
  if (typeof document === 'undefined') return;
  const normalized = normalizeLanguage(language);
  document.documentElement.lang = normalized;
  document.documentElement.dir = normalized === 'ar' ? 'rtl' : 'ltr';
}

function getApiBase() {
  const raw = String(import.meta.env.VITE_API_URL || '').trim();
  return (raw || 'http://localhost:5000/api').replace(/\/$/, '');
}

const storedLanguage = typeof window !== 'undefined'
  ? normalizeLanguage(window.localStorage.getItem('i18nextLng') || 'en')
  : 'en';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: BUNDLED_RESOURCES,
    lng: storedLanguage,
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr', 'ar'],
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: (value) => normalizeLanguage(value),
    },
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    partialBundledLanguages: false,
    backend: {
      loadPath: `${getApiBase()}/translations/resources?lng={{lng}}`,
      requestOptions: {
        mode: 'cors',
        credentials: 'omit',
      },
      parse: (data) => {
        try {
          return JSON.parse(data);
        } catch {
          return {};
        }
      },
    },
    react: {
      useSuspense: false,
    },
    returnEmptyString: false,
  });

applyDocumentLanguage(storedLanguage);

i18n.on('languageChanged', (language) => {
  const normalized = normalizeLanguage(language);
  applyDocumentLanguage(normalized);
  try {
    window.localStorage.setItem('i18nextLng', normalized);
  } catch {
    // ignore localStorage errors
  }
});

export function getNormalizedLanguage(language) {
  return normalizeLanguage(language);
}

export default i18n;
