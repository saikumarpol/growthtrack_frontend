import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './en.json'; // Import English translations
import translationHi from './hi.json'; // Import French translations (if using)

i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: translationEN, // Set English translations
      },
      hi: {
        translation: translationHi, // Set French translations (if using)
      },
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already protects from XSS
    },
  });

export default i18n;
