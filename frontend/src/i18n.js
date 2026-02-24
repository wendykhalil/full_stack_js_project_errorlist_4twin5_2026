import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)                // Charge les fichiers de traduction (via HTTP)
  .use(LanguageDetector)       // Détecte la langue du navigateur
  .use(initReactI18next)       // Passe i18next à React
  .init({
    fallbackLng: 'fr',          // Langue par défaut
    supportedLngs: ['fr', 'en'], // Langues supportées
    interpolation: { escapeValue: false }, // React le fait déjà
    backend: {
      loadPath: '/locales/{{lng}}/translation.json' // Chemin des fichiers
    }
  });

export default i18n;