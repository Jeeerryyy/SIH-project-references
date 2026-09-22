import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from '../locales/en/translation.json';
import hiTranslation from '../locales/hi/translation.json';

const savedLang = localStorage.getItem('arogya_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      hi: { translation: hiTranslation },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export const changeLanguage = (lang: 'en' | 'hi') => {
  i18n.changeLanguage(lang);
  localStorage.setItem('arogya_lang', lang);
  document.documentElement.lang = lang;
};

export default i18n;
