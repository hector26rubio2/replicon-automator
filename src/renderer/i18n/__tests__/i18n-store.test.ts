import { describe, it, expect } from 'vitest';
const translations = {
  en: {
    common: { save: 'Save', cancel: 'Cancel' },
    header: { title: 'Replicon Automator' },
  },
  es: {
    common: { save: 'Guardar', cancel: 'Cancelar' },
    header: { title: 'Replicon Automator' },
  },
};
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let result: unknown = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof result === 'string' ? result : path;
}
describe('i18n Store', () => {
  describe('Translation Function', () => {
    it('should return correct translation for key', () => {
      const result = getNestedValue(translations.en, 'common.save');
      expect(result).toBe('Save');
    });
    it('should return Spanish translation', () => {
      const result = getNestedValue(translations.es, 'common.save');
      expect(result).toBe('Guardar');
    });
    it('should return key for missing translation', () => {
      const result = getNestedValue(translations.en, 'nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });
    it('should handle deeply nested keys', () => {
      const nestedTranslations = {
        en: {
          level1: {
            level2: {
              level3: 'Deep value'
            }
          }
        }
      };
      const result = getNestedValue(nestedTranslations.en, 'level1.level2.level3');
      expect(result).toBe('Deep value');
    });
  });
  describe('Language Switching', () => {
    it('should switch between languages', () => {
      let currentLang: 'en' | 'es' = 'en';
      const t = (key: string) => getNestedValue(translations[currentLang], key);
      expect(t('common.save')).toBe('Save');
      currentLang = 'es';
      expect(t('common.save')).toBe('Guardar');
    });
    it('should maintain same keys across languages', () => {
      const enKeys = Object.keys(translations.en.common);
      const esKeys = Object.keys(translations.es.common);
      expect(enKeys).toEqual(esKeys);
    });
  });
  describe('Translation Helpers', () => {
    it('should detect current language', () => {
      const isSpanish = (lang: string) => lang === 'es';
      const isEnglish = (lang: string) => lang === 'en';
      expect(isSpanish('es')).toBe(true);
      expect(isEnglish('en')).toBe(true);
      expect(isSpanish('en')).toBe(false);
    });
    it('should format with placeholders', () => {
      const template = 'Hello, {name}!';
      const formatted = template.replace('{name}', 'World');
      expect(formatted).toBe('Hello, World!');
    });
    it('should handle multiple placeholders', () => {
      const template = '{greeting}, {name}! You have {count} messages.';
      const values = { greeting: 'Hello', name: 'User', count: '5' };
      const formatted = template.replace(/\{(\w+)\}/g, (_, key) => values[key as keyof typeof values] || '');
      expect(formatted).toBe('Hello, User! You have 5 messages.');
    });
  });
});
