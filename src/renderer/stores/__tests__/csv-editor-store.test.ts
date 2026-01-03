import { describe, it, expect, beforeEach } from 'vitest';
import { useCSVEditorStore, isSpecialAccount, SPECIAL_ACCOUNT_CODES } from '../csv-editor-store';

describe('CSV Editor Store', () => {
  beforeEach(() => {
    const { setMonthOffset, setDefaultAccount, setDefaultProject, setShowPreview, setShowCsvOutput } = useCSVEditorStore.getState();
    setMonthOffset(0);
    setDefaultAccount('');
    setDefaultProject('');
    setShowPreview(false);
    setShowCsvOutput(false);
  });

  describe('Month Offset', () => {
    it('should initialize with offset 0', () => {
      const { monthOffset } = useCSVEditorStore.getState();
      expect(monthOffset).toBe(0);
    });

    it('should update month offset to -1', () => {
      const { setMonthOffset } = useCSVEditorStore.getState();
      setMonthOffset(-1);
      expect(useCSVEditorStore.getState().monthOffset).toBe(-1);
    });

    it('should update month offset to 1', () => {
      const { setMonthOffset } = useCSVEditorStore.getState();
      setMonthOffset(1);
      expect(useCSVEditorStore.getState().monthOffset).toBe(1);
    });
  });

  describe('Default Account', () => {
    it('should initialize with empty account', () => {
      const { defaultAccount } = useCSVEditorStore.getState();
      expect(defaultAccount).toBe('');
    });

    it('should set default account', () => {
      const { setDefaultAccount } = useCSVEditorStore.getState();
      setDefaultAccount('MY_ACCOUNT');
      expect(useCSVEditorStore.getState().defaultAccount).toBe('MY_ACCOUNT');
    });

    it('should clear default project when setting account', () => {
      const { setDefaultAccount, setDefaultProject } = useCSVEditorStore.getState();
      setDefaultProject('OLD_PROJECT');
      setDefaultAccount('NEW_ACCOUNT');
      expect(useCSVEditorStore.getState().defaultProject).toBe('');
    });
  });

  describe('Default Project', () => {
    it('should initialize with empty project', () => {
      const { defaultProject } = useCSVEditorStore.getState();
      expect(defaultProject).toBe('');
    });

    it('should set default project', () => {
      const { setDefaultProject } = useCSVEditorStore.getState();
      setDefaultProject('MY_PROJECT');
      expect(useCSVEditorStore.getState().defaultProject).toBe('MY_PROJECT');
    });
  });

  describe('Show Preview', () => {
    it('should initialize with preview hidden', () => {
      const { showPreview } = useCSVEditorStore.getState();
      expect(showPreview).toBe(false);
    });

    it('should toggle preview on', () => {
      const { setShowPreview } = useCSVEditorStore.getState();
      setShowPreview(true);
      expect(useCSVEditorStore.getState().showPreview).toBe(true);
    });

    it('should toggle preview off', () => {
      const { setShowPreview } = useCSVEditorStore.getState();
      setShowPreview(true);
      setShowPreview(false);
      expect(useCSVEditorStore.getState().showPreview).toBe(false);
    });
  });

  describe('Show CSV Output', () => {
    it('should initialize with CSV output hidden', () => {
      const { showCsvOutput } = useCSVEditorStore.getState();
      expect(showCsvOutput).toBe(false);
    });

    it('should toggle CSV output on', () => {
      const { setShowCsvOutput } = useCSVEditorStore.getState();
      setShowCsvOutput(true);
      expect(useCSVEditorStore.getState().showCsvOutput).toBe(true);
    });

    it('should toggle CSV output off', () => {
      const { setShowCsvOutput } = useCSVEditorStore.getState();
      setShowCsvOutput(true);
      setShowCsvOutput(false);
      expect(useCSVEditorStore.getState().showCsvOutput).toBe(false);
    });
  });

  describe('Hydration', () => {
    it('should allow setting hydration state to false', () => {
      const { setHasHydrated } = useCSVEditorStore.getState();
      setHasHydrated(false);
      expect(useCSVEditorStore.getState()._hasHydrated).toBe(false);
    });

    it('should set hydration state to true', () => {
      const { setHasHydrated } = useCSVEditorStore.getState();
      setHasHydrated(true);
      expect(useCSVEditorStore.getState()._hasHydrated).toBe(true);
    });
  });

  describe('Special Account Helpers', () => {
    it('should export special account codes', () => {
      expect(SPECIAL_ACCOUNT_CODES).toEqual(['BH', 'H', 'F', 'FDS', 'ND']);
    });

    it('should detect special account BH', () => {
      expect(isSpecialAccount('BH')).toBe(true);
    });

    it('should detect special account H', () => {
      expect(isSpecialAccount('H')).toBe(true);
    });

    it('should detect special account F', () => {
      expect(isSpecialAccount('F')).toBe(true);
    });

    it('should detect special account FDS', () => {
      expect(isSpecialAccount('FDS')).toBe(true);
    });

    it('should detect special account ND', () => {
      expect(isSpecialAccount('ND')).toBe(true);
    });

    it('should be case insensitive for special accounts', () => {
      expect(isSpecialAccount('bh')).toBe(true);
      expect(isSpecialAccount('fds')).toBe(true);
    });

    it('should not detect regular account', () => {
      expect(isSpecialAccount('REGULAR')).toBe(false);
    });

    it('should not detect partial match', () => {
      expect(isSpecialAccount('H1')).toBe(false);
      expect(isSpecialAccount('FD')).toBe(false);
    });
  });
});
