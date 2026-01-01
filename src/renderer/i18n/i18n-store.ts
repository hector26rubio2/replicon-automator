/**
 * i18n Store - Language management with Zustand
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, Language, TranslationKeys } from './translations';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationKeys>;

interface I18nState {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let result: unknown = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Return the key if not found
    }
  }
  
  return typeof result === 'string' ? result : path;
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'es', // Default to Spanish
      
      setLanguage: (language: Language) => {
        set({ language });
        // Update HTML lang attribute
        if (typeof document !== 'undefined') {
          document.documentElement.lang = language;
        }
      },
      
      t: (key: string): string => {
        const { language } = get();
        const currentTranslations = translations[language];
        return getNestedValue(currentTranslations, key);
      },
    }),
    {
      name: 'replicon-language',
      partialize: (state) => ({ language: state.language }),
    }
  )
);

// Helper hook for using translations
export function useTranslation() {
  const { language, setLanguage, t } = useI18n();
  
  return {
    language,
    setLanguage,
    t,
    isSpanish: language === 'es',
    isEnglish: language === 'en',
  };
}

// Get translation outside of React components
export function getTranslation(key: string): string {
  return useI18n.getState().t(key);
}

// Get current language outside of React components
export function getCurrentLanguage(): Language {
  return useI18n.getState().language;
}
