import { describe, it, expect, beforeEach } from 'vitest';
import { useUnsavedChangesStore } from '../unsaved-changes-store';

describe('Unsaved Changes Store', () => {
  beforeEach(() => {
    useUnsavedChangesStore.setState({ 
      hasUnsavedChanges: false,
      changedSections: new Set(),
    });
  });

  describe('initialization', () => {
    it('should initialize without unsaved changes', () => {
      const { hasUnsavedChanges } = useUnsavedChangesStore.getState();
      expect(hasUnsavedChanges).toBe(false);
    });

    it('should have empty changed sections', () => {
      const { changedSections } = useUnsavedChangesStore.getState();
      expect(changedSections.size).toBe(0);
    });
  });

  describe('setUnsavedChanges', () => {
    it('should mark section as changed', () => {
      const { setUnsavedChanges } = useUnsavedChangesStore.getState();
      
      setUnsavedChanges('csv', true);
      
      const { hasUnsavedChanges, changedSections } = useUnsavedChangesStore.getState();
      expect(hasUnsavedChanges).toBe(true);
      expect(changedSections.has('csv')).toBe(true);
    });

    it('should handle multiple sections', () => {
      const { setUnsavedChanges } = useUnsavedChangesStore.getState();
      
      setUnsavedChanges('csv', true);
      setUnsavedChanges('config', true);
      
      const { changedSections } = useUnsavedChangesStore.getState();
      expect(changedSections.size).toBe(2);
      expect(changedSections.has('csv')).toBe(true);
      expect(changedSections.has('config')).toBe(true);
    });

    it('should unmark section', () => {
      const { setUnsavedChanges } = useUnsavedChangesStore.getState();
      
      setUnsavedChanges('csv', true);
      setUnsavedChanges('csv', false);
      
      const { hasUnsavedChanges, changedSections } = useUnsavedChangesStore.getState();
      expect(hasUnsavedChanges).toBe(false);
      expect(changedSections.has('csv')).toBe(false);
    });

    it('should update hasUnsavedChanges based on section count', () => {
      const { setUnsavedChanges } = useUnsavedChangesStore.getState();
      
      setUnsavedChanges('csv', true);
      setUnsavedChanges('config', true);
      expect(useUnsavedChangesStore.getState().hasUnsavedChanges).toBe(true);
      
      setUnsavedChanges('csv', false);
      expect(useUnsavedChangesStore.getState().hasUnsavedChanges).toBe(true);
      
      setUnsavedChanges('config', false);
      expect(useUnsavedChangesStore.getState().hasUnsavedChanges).toBe(false);
    });
  });

  describe('markSaved', () => {
    it('should clear all changes', () => {
      const { setUnsavedChanges, markSaved } = useUnsavedChangesStore.getState();
      
      setUnsavedChanges('csv', true);
      setUnsavedChanges('config', true);
      
      markSaved();
      
      const { hasUnsavedChanges, changedSections } = useUnsavedChangesStore.getState();
      expect(hasUnsavedChanges).toBe(false);
      expect(changedSections.size).toBe(0);
    });
  });

  describe('markAllSaved', () => {
    it('should clear all changes', () => {
      const { setUnsavedChanges, markAllSaved } = useUnsavedChangesStore.getState();
      
      setUnsavedChanges('csv', true);
      
      markAllSaved();
      
      const { hasUnsavedChanges } = useUnsavedChangesStore.getState();
      expect(hasUnsavedChanges).toBe(false);
    });
  });
});
