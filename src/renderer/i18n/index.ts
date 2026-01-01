/**
 * i18n Module Exports
 */
export { translations, type Language, type TranslationKeys } from './translations';
export { 
  useI18n,
  useI18n as useI18nStore,
  useTranslation, 
  getTranslation, 
  getCurrentLanguage,
  type TranslationKey 
} from './i18n-store';
