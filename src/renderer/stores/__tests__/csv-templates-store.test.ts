import { describe, it, expect, beforeEach } from 'vitest';
import { useCSVTemplatesStore } from '../csv-templates-store';
import type { CSVTemplate } from '../csv-templates-store';

describe('CSV Templates Store', () => {
  beforeEach(() => {
    // Reset to initial state with default templates
    useCSVTemplatesStore.setState({
      templates: useCSVTemplatesStore.getState().templates.filter(t => t.isDefault),
    });
  });

  describe('Default Templates', () => {
    it('should initialize with default templates', () => {
      const { templates } = useCSVTemplatesStore.getState();
      const defaultTemplates = templates.filter(t => t.isDefault);
      expect(defaultTemplates.length).toBeGreaterThan(0);
    });

    it('should have "Semana Estándar" template', () => {
      const { templates } = useCSVTemplatesStore.getState();
      const weeklyTemplate = templates.find(t => t.id === 'default-weekly');
      expect(weeklyTemplate).toBeDefined();
      expect(weeklyTemplate?.name).toBe('Semana Estándar');
      expect(weeklyTemplate?.isDefault).toBe(true);
      expect(weeklyTemplate?.data.length).toBe(5);
    });

    it('should have "Multi-Proyecto" template', () => {
      const { templates } = useCSVTemplatesStore.getState();
      const multiTemplate = templates.find(t => t.id === 'default-multi-project');
      expect(multiTemplate).toBeDefined();
      expect(multiTemplate?.name).toBe('Multi-Proyecto');
      expect(multiTemplate?.isDefault).toBe(true);
    });

    it('should have "Semana con Fin de Semana" template', () => {
      const { templates } = useCSVTemplatesStore.getState();
      const weekendTemplate = templates.find(t => t.id === 'default-with-weekend');
      expect(weekendTemplate).toBeDefined();
      expect(weekendTemplate?.data.length).toBe(7);
    });

    it('should have "Vacía" template', () => {
      const { templates } = useCSVTemplatesStore.getState();
      const emptyTemplate = templates.find(t => t.id === 'default-empty');
      expect(emptyTemplate).toBeDefined();
      expect(emptyTemplate?.data.length).toBe(1);
    });
  });

  describe('addTemplate', () => {
    it('should add a new template', () => {
      const { addTemplate, templates } = useCSVTemplatesStore.getState();
      const initialCount = templates.length;
      
      const newTemplate = addTemplate('Test Template', [
        { cuenta: 'TEST', proyecto: 'PROJ', extras: '' }
      ]);

      expect(useCSVTemplatesStore.getState().templates.length).toBe(initialCount + 1);
      expect(newTemplate.name).toBe('Test Template');
      expect(newTemplate.isDefault).toBe(false);
    });

    it('should generate unique ID for new template', () => {
      const { addTemplate } = useCSVTemplatesStore.getState();
      
      const template1 = addTemplate('Template 1', [{ cuenta: '', proyecto: '', extras: '' }]);
      const template2 = addTemplate('Template 2', [{ cuenta: '', proyecto: '', extras: '' }]);

      expect(template1.id).not.toBe(template2.id);
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const { addTemplate } = useCSVTemplatesStore.getState();
      const before = Date.now();
      
      const template = addTemplate('Test', [{ cuenta: '', proyecto: '', extras: '' }]);
      const after = Date.now();

      expect(template.createdAt).toBeGreaterThanOrEqual(before);
      expect(template.createdAt).toBeLessThanOrEqual(after);
      expect(template.updatedAt).toBe(template.createdAt);
    });

    it('should add template with description', () => {
      const { addTemplate } = useCSVTemplatesStore.getState();
      
      const template = addTemplate('Test', [{ cuenta: '', proyecto: '', extras: '' }], 'Test description');

      expect(template.description).toBe('Test description');
    });

    it('should deep clone data to prevent mutation', () => {
      const { addTemplate } = useCSVTemplatesStore.getState();
      const originalData = [{ cuenta: 'ORIGINAL', proyecto: 'PROJ', extras: '' }];
      
      const template = addTemplate('Test', originalData);
      originalData[0].cuenta = 'MODIFIED';

      expect(template.data[0].cuenta).toBe('ORIGINAL');
    });
  });

  describe('updateTemplate', () => {
    it('should update template name', () => {
      const { addTemplate, updateTemplate } = useCSVTemplatesStore.getState();
      const template = addTemplate('Original Name', [{ cuenta: '', proyecto: '', extras: '' }]);
      
      updateTemplate(template.id, { name: 'Updated Name' });

      const updated = useCSVTemplatesStore.getState().getTemplate(template.id);
      expect(updated?.name).toBe('Updated Name');
    });

    it('should update template description', () => {
      const { addTemplate, updateTemplate } = useCSVTemplatesStore.getState();
      const template = addTemplate('Test', [{ cuenta: '', proyecto: '', extras: '' }]);
      
      updateTemplate(template.id, { description: 'New description' });

      const updated = useCSVTemplatesStore.getState().getTemplate(template.id);
      expect(updated?.description).toBe('New description');
    });

    it('should update template data', () => {
      const { addTemplate, updateTemplate } = useCSVTemplatesStore.getState();
      const template = addTemplate('Test', [{ cuenta: 'OLD', proyecto: 'OLD', extras: '' }]);
      
      updateTemplate(template.id, { data: [{ cuenta: 'NEW', proyecto: 'NEW', extras: '' }] });

      const updated = useCSVTemplatesStore.getState().getTemplate(template.id);
      expect(updated?.data[0].cuenta).toBe('NEW');
    });

    it('should update updatedAt timestamp', () => {
      const { addTemplate, updateTemplate } = useCSVTemplatesStore.getState();
      const template = addTemplate('Test', [{ cuenta: '', proyecto: '', extras: '' }]);
      
      updateTemplate(template.id, { name: 'Updated' });
      const updated = useCSVTemplatesStore.getState().getTemplate(template.id);
      expect(updated?.updatedAt).toBeGreaterThanOrEqual(template.updatedAt);
    });

    it('should not affect other templates', () => {
      const { addTemplate, updateTemplate } = useCSVTemplatesStore.getState();
      const template1 = addTemplate('Template 1', [{ cuenta: '', proyecto: '', extras: '' }]);
      const template2 = addTemplate('Template 2', [{ cuenta: '', proyecto: '', extras: '' }]);
      
      updateTemplate(template1.id, { name: 'Updated Template 1' });

      const unchanged = useCSVTemplatesStore.getState().getTemplate(template2.id);
      expect(unchanged?.name).toBe('Template 2');
    });

    it('should not update non-existent template', () => {
      const { templates } = useCSVTemplatesStore.getState();
      const initialCount = templates.length;
      
      useCSVTemplatesStore.getState().updateTemplate('non-existent-id', { name: 'Updated' });

      expect(useCSVTemplatesStore.getState().templates.length).toBe(initialCount);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete custom template', () => {
      const { addTemplate, deleteTemplate } = useCSVTemplatesStore.getState();
      const template = addTemplate('To Delete', [{ cuenta: '', proyecto: '', extras: '' }]);
      const initialCount = useCSVTemplatesStore.getState().templates.length;
      
      deleteTemplate(template.id);

      expect(useCSVTemplatesStore.getState().templates.length).toBe(initialCount - 1);
      expect(useCSVTemplatesStore.getState().getTemplate(template.id)).toBeUndefined();
    });

    it('should not delete default template', () => {
      const { templates, deleteTemplate } = useCSVTemplatesStore.getState();
      const defaultTemplate = templates.find(t => t.isDefault);
      expect(defaultTemplate).toBeDefined();
      
      const initialCount = templates.length;
      deleteTemplate(defaultTemplate!.id);

      expect(useCSVTemplatesStore.getState().templates.length).toBe(initialCount);
      expect(useCSVTemplatesStore.getState().getTemplate(defaultTemplate!.id)).toBeDefined();
    });

    it('should ignore delete of non-existent template', () => {
      const { templates, deleteTemplate } = useCSVTemplatesStore.getState();
      const initialCount = templates.length;
      
      deleteTemplate('non-existent-id');

      expect(useCSVTemplatesStore.getState().templates.length).toBe(initialCount);
    });
  });

  describe('getTemplate', () => {
    it('should retrieve template by ID', () => {
      const { addTemplate, getTemplate } = useCSVTemplatesStore.getState();
      const template = addTemplate('Test', [{ cuenta: 'TEST', proyecto: 'PROJ', extras: '' }]);
      
      const retrieved = getTemplate(template.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(template.id);
      expect(retrieved?.name).toBe('Test');
    });

    it('should return undefined for non-existent ID', () => {
      const { getTemplate } = useCSVTemplatesStore.getState();
      
      const result = getTemplate('non-existent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('duplicateTemplate', () => {
    it('should create duplicate with new name', () => {
      const { addTemplate, duplicateTemplate, getTemplate } = useCSVTemplatesStore.getState();
      const original = addTemplate('Original', [{ cuenta: 'TEST', proyecto: 'PROJ', extras: '' }]);
      
      const duplicate = duplicateTemplate(original.id, 'Duplicate');

      expect(duplicate).toBeDefined();
      expect(duplicate?.name).toBe('Duplicate');
      expect(duplicate?.id).not.toBe(original.id);
    });

    it('should copy data from original', () => {
      const { addTemplate, duplicateTemplate } = useCSVTemplatesStore.getState();
      const original = addTemplate('Original', [
        { cuenta: 'TEST1', proyecto: 'PROJ1', extras: 'extra1' },
        { cuenta: 'TEST2', proyecto: 'PROJ2', extras: 'extra2' }
      ]);
      
      const duplicate = duplicateTemplate(original.id, 'Duplicate');

      expect(duplicate?.data).toEqual(original.data);
      expect(duplicate?.data.length).toBe(2);
    });

    it('should copy description from original', () => {
      const { addTemplate, duplicateTemplate } = useCSVTemplatesStore.getState();
      const original = addTemplate('Original', [{ cuenta: '', proyecto: '', extras: '' }], 'Original description');
      
      const duplicate = duplicateTemplate(original.id, 'Duplicate');

      expect(duplicate?.description).toBe('Original description');
    });

    it('should return undefined for non-existent template', () => {
      const { duplicateTemplate } = useCSVTemplatesStore.getState();
      
      const result = duplicateTemplate('non-existent-id', 'Duplicate');

      expect(result).toBeUndefined();
    });

    it('should not set isDefault on duplicate', () => {
      const { templates, duplicateTemplate } = useCSVTemplatesStore.getState();
      const defaultTemplate = templates.find(t => t.isDefault);
      expect(defaultTemplate).toBeDefined();
      
      const duplicate = duplicateTemplate(defaultTemplate!.id, 'Duplicate');

      expect(duplicate?.isDefault).toBe(false);
    });
  });

  describe('importTemplates', () => {
    it('should import new templates', () => {
      const { templates, importTemplates } = useCSVTemplatesStore.getState();
      const initialCount = templates.length;
      
      const toImport: CSVTemplate[] = [
        {
          id: 'imported-1',
          name: 'Imported 1',
          data: [{ cuenta: '', proyecto: '', extras: '' }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDefault: false,
        }
      ];
      
      importTemplates(toImport);

      expect(useCSVTemplatesStore.getState().templates.length).toBe(initialCount + 1);
    });

    it('should not import duplicate IDs', () => {
      const { addTemplate, templates, importTemplates } = useCSVTemplatesStore.getState();
      const existing = addTemplate('Existing', [{ cuenta: '', proyecto: '', extras: '' }]);
      const initialCount = useCSVTemplatesStore.getState().templates.length;
      
      const toImport: CSVTemplate[] = [
        {
          id: existing.id,
          name: 'Duplicate ID',
          data: [{ cuenta: '', proyecto: '', extras: '' }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDefault: false,
        }
      ];
      
      importTemplates(toImport);

      expect(useCSVTemplatesStore.getState().templates.length).toBe(initialCount);
    });

    it('should not import default templates', () => {
      const { templates, importTemplates } = useCSVTemplatesStore.getState();
      const initialCount = templates.length;
      
      const toImport: CSVTemplate[] = [
        {
          id: 'default-imported',
          name: 'Default Import',
          data: [{ cuenta: '', proyecto: '', extras: '' }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDefault: true,
        }
      ];
      
      importTemplates(toImport);

      expect(useCSVTemplatesStore.getState().templates.length).toBe(initialCount);
    });

    it('should regenerate IDs for imported templates', () => {
      const { importTemplates } = useCSVTemplatesStore.getState();
      
      const toImport: CSVTemplate[] = [
        {
          id: 'original-id',
          name: 'Imported',
          data: [{ cuenta: '', proyecto: '', extras: '' }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDefault: false,
        }
      ];
      
      importTemplates(toImport);

      const imported = useCSVTemplatesStore.getState().templates.find(t => t.name === 'Imported');
      expect(imported?.id).not.toBe('original-id');
    });
  });

  describe('exportTemplates', () => {
    it('should export only custom templates', () => {
      const { addTemplate, exportTemplates } = useCSVTemplatesStore.getState();
      addTemplate('Custom 1', [{ cuenta: '', proyecto: '', extras: '' }]);
      addTemplate('Custom 2', [{ cuenta: '', proyecto: '', extras: '' }]);
      
      const exported = exportTemplates();

      expect(exported.length).toBe(2);
      expect(exported.every(t => !t.isDefault)).toBe(true);
    });

    it('should not export default templates', () => {
      const { exportTemplates } = useCSVTemplatesStore.getState();
      
      const exported = exportTemplates();

      expect(exported.every(t => !t.isDefault)).toBe(true);
    });

    it('should export empty array if no custom templates', () => {
      const { exportTemplates } = useCSVTemplatesStore.getState();
      
      const exported = exportTemplates();

      expect(exported).toEqual([]);
    });

    it('should export complete template data', () => {
      const { addTemplate, exportTemplates } = useCSVTemplatesStore.getState();
      const template = addTemplate('Custom', [{ cuenta: 'TEST', proyecto: 'PROJ', extras: 'extra' }], 'Description');
      
      const exported = exportTemplates();

      expect(exported[0]).toEqual(template);
      expect(exported[0].data[0].cuenta).toBe('TEST');
      expect(exported[0].description).toBe('Description');
    });
  });
});
