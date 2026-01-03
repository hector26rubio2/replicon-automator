import { describe, it, expect } from 'vitest';
import { translations, type Language } from '../translations';

describe('Translations', () => {
  const languages: Language[] = ['en', 'es'];

  describe('Structure validation', () => {
    it('should have translations for both languages', () => {
      expect(translations).toHaveProperty('en');
      expect(translations).toHaveProperty('es');
    });

    it('should have common section in both languages', () => {
      languages.forEach(lang => {
        expect(translations[lang]).toHaveProperty('common');
        expect(typeof translations[lang].common).toBe('object');
      });
    });
  });

  describe('Common translations', () => {
    it('should have basic action words', () => {
      const actions = ['save', 'cancel', 'delete', 'edit', 'add', 'close'];

      languages.forEach(lang => {
        actions.forEach(action => {
          expect(translations[lang].common).toHaveProperty(action);
          expect(typeof translations[lang].common[action]).toBe('string');
          expect(translations[lang].common[action].length).toBeGreaterThan(0);
        });
      });
    });

    it('should have status words', () => {
      const statuses = ['error', 'success', 'warning', 'info', 'loading'];

      languages.forEach(lang => {
        statuses.forEach(status => {
          expect(translations[lang].common).toHaveProperty(status);
        });
      });
    });

    it('should have yes/no translations', () => {
      languages.forEach(lang => {
        expect(translations[lang].common).toHaveProperty('yes');
        expect(translations[lang].common).toHaveProperty('no');
      });
    });
  });

  describe('Navigation translations', () => {
    it('should have nav section', () => {
      languages.forEach(lang => {
        expect(translations[lang]).toHaveProperty('nav');
        expect(typeof translations[lang].nav).toBe('object');
      });
    });
  });

  describe('Theme translations', () => {
    it('should have theme mode translations', () => {
      const modes = ['light', 'dark', 'system'];

      languages.forEach(lang => {
        modes.forEach(mode => {
          expect(translations[lang].theme).toHaveProperty(mode);
        });
      });
    });

    it('should have theme action translations', () => {
      languages.forEach(lang => {
        expect(translations[lang].theme).toHaveProperty('label');
        expect(translations[lang].theme).toHaveProperty('current');
      });
    });
  });

  describe('Error translations', () => {
    it('should have errors section', () => {
      languages.forEach(lang => {
        expect(translations[lang]).toHaveProperty('errors');
        expect(typeof translations[lang].errors).toBe('object');
      });
    });
  });

  describe('CSV Editor translations', () => {
    it('should have csvEditor section', () => {
      languages.forEach(lang => {
        expect(translations[lang]).toHaveProperty('csvEditor');
        expect(typeof translations[lang].csvEditor).toBe('object');
      });
    });
  });

  describe('Config translations', () => {
    it('should have config section', () => {
      languages.forEach(lang => {
        expect(translations[lang]).toHaveProperty('config');
        expect(typeof translations[lang].config).toBe('object');
      });
    });
  });

  describe('Automation translations', () => {
    it('should have automation states', () => {
      languages.forEach(lang => {
        expect(translations[lang].notifications).toHaveProperty('automationStarted');
        expect(translations[lang].notifications).toHaveProperty('automationCompleted');
        expect(translations[lang].notifications).toHaveProperty('automationFailed');
      });
    });
  });

  describe('Update translations', () => {
    it('should have update states', () => {
      const states = ['checking', 'available', 'downloading', 'downloaded'];

      languages.forEach(lang => {
        states.forEach(state => {
          expect(translations[lang].updates).toHaveProperty(state);
        });
      });
    });

    it('should have update actions', () => {
      const actions = ['install', 'download', 'later'];

      languages.forEach(lang => {
        actions.forEach(action => {
          expect(translations[lang].updates).toHaveProperty(action);
        });
      });
    });
  });

  describe('Template translations', () => {
    it('should have templates section', () => {
      languages.forEach(lang => {
        expect(translations[lang]).toHaveProperty('templates');
        expect(typeof translations[lang].templates).toBe('object');
      });
    });
  });

  describe('History translations', () => {
    it('should have history metrics', () => {
      const metrics = ['totalExecutions', 'successRate', 'avgDuration'];

      languages.forEach(lang => {
        metrics.forEach(metric => {
          expect(translations[lang].history).toHaveProperty(metric);
        });
      });
    });

    it('should have history actions', () => {
      languages.forEach(lang => {
        expect(translations[lang].history).toHaveProperty('clearHistory');
        expect(translations[lang].history).toHaveProperty('viewDetails');
      });
    });
  });

  describe('Type consistency', () => {
    it('should have same keys in both languages', () => {
      const enKeys = Object.keys(translations.en);
      const esKeys = Object.keys(translations.es);

      expect(enKeys.sort()).toEqual(esKeys.sort());
    });

    it('should have same nested keys in common section', () => {
      const enCommonKeys = Object.keys(translations.en.common);
      const esCommonKeys = Object.keys(translations.es.common);

      expect(enCommonKeys.sort()).toEqual(esCommonKeys.sort());
    });

    it('should not have empty strings', () => {
      languages.forEach(lang => {
        Object.entries(translations[lang]).forEach(([_section, values]) => {
          Object.entries(values).forEach(([_key, value]) => {
            if (typeof value === 'string') {
              expect(value.length).toBeGreaterThan(0);
            }
          });
        });
      });
    });
  });
});
