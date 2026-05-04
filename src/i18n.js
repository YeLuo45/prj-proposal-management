import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';
import he from './locales/he.json';

// RTL languages
const RTL_LANGUAGES = ['ar', 'he'];

/**
 * Check if a language is RTL (Right-to-Left)
 * @param {string} lang - Language code
 * @returns {boolean}
 */
export const isRTL = (lang) => {
  return RTL_LANGUAGES.includes(lang);
};

/**
 * Get the text direction for a given language
 * @param {string} lang - Language code
 * @returns {'ltr' | 'rtl'}
 */
export const getDirection = (lang) => {
  return isRTL(lang) ? 'rtl' : 'ltr';
};

/**
 * Apply RTL/LTR direction to the document
 * @param {string} lang - Language code
 */
export const applyDirection = (lang) => {
  const direction = getDirection(lang);
  document.documentElement.dir = direction;
  document.documentElement.lang = lang;
  
  // Update body class for RTL-specific styling
  if (direction === 'rtl') {
    document.body.classList.add('rtl');
    document.body.classList.remove('ltr');
  } else {
    document.body.classList.add('ltr');
    document.body.classList.remove('rtl');
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
      ar: { translation: ar },
      he: { translation: he },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      htmlTag: document.documentElement,
    },
  });

// Apply initial direction
applyDirection(i18n.language);

// Listen for language changes and update direction
i18n.on('languageChanged', (lng) => {
  applyDirection(lng);
});

export default i18n;
