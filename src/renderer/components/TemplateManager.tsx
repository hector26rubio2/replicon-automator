import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCSVTemplatesStore, type CSVTemplate } from '../stores/csv-templates-store';
import { useTranslation } from '../i18n';
import type { CSVRow } from '@shared/types';

interface TemplateManagerProps {
  currentData: CSVRow[] | null;
  onLoadTemplate: (data: CSVRow[]) => void;
  onClose?: () => void;
}

export const TemplateManager = memo(function TemplateManager({
  currentData,
  onLoadTemplate,
  onClose,
}: TemplateManagerProps) {
  const { t } = useTranslation();
  const { templates, addTemplate, deleteTemplate, duplicateTemplate, exportTemplates, importTemplates } = useCSVTemplatesStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const defaultTemplates = filteredTemplates.filter((t) => t.isDefault);
  const userTemplates = filteredTemplates.filter((t) => !t.isDefault);

  const handleSaveTemplate = useCallback(() => {
    if (!newTemplateName.trim() || !currentData?.length) return;
    
    addTemplate(newTemplateName.trim(), currentData, newTemplateDesc.trim() || undefined);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setShowSaveDialog(false);
  }, [newTemplateName, newTemplateDesc, currentData, addTemplate]);

  const handleLoadTemplate = useCallback((template: CSVTemplate) => {
    onLoadTemplate(JSON.parse(JSON.stringify(template.data)));
    onClose?.();
  }, [onLoadTemplate, onClose]);

  const handleDeleteTemplate = useCallback((id: string) => {
    if (confirm(t('templates.confirmDelete'))) {
      deleteTemplate(id);
    }
  }, [deleteTemplate, t]);

  const handleDuplicateTemplate = useCallback((id: string, name: string) => {
    const newName = prompt(t('templates.enterName'), `${name} (${t('common.copy')})`);
    if (newName) {
      duplicateTemplate(id, newName);
    }
  }, [duplicateTemplate, t]);

  const handleExport = useCallback(() => {
    const data = exportTemplates();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'csv-templates.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportTemplates]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text) as CSVTemplate[];
        importTemplates(data);
      } catch {
        alert(t('templates.importError'));
      }
    };
    input.click();
  }, [importTemplates, t]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const TemplateCard = ({ template }: { template: CSVTemplate }) => (
    <div
      className={`p-4 rounded-lg border transition-all cursor-pointer ${
        selectedTemplate === template.id
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
      }`}
      onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {template.name}
            </h4>
            {template.isDefault && (
              <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                {t('templates.default')}
              </span>
            )}
          </div>
          {template.description && (
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
              {template.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-slate-500">
            <span>{template.data.length} {t('templates.rows')}</span>
            <span>•</span>
            <span>{formatDate(template.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Expanded actions */}
      {selectedTemplate === template.id && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 flex flex-wrap gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleLoadTemplate(template); }}
            className="btn btn-primary text-sm py-1.5"
          >
            📥 {t('templates.load')}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDuplicateTemplate(template.id, template.name); }}
            className="btn btn-secondary text-sm py-1.5"
          >
            📋 {t('common.duplicate')}
          </button>
          {!template.isDefault && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
              className="btn btn-danger text-sm py-1.5"
            >
              🗑️ {t('common.delete')}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t('templates.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={!currentData?.length}
            className="btn btn-primary whitespace-nowrap"
            title={!currentData?.length ? t('templates.noDataToSave') : ''}
          >
            💾 {t('templates.saveAs')}
          </button>
          <button onClick={handleImport} className="btn btn-secondary">
            📤 {t('common.import')}
          </button>
          <button
            onClick={handleExport}
            disabled={userTemplates.length === 0}
            className="btn btn-secondary"
          >
            📥 {t('common.export')}
          </button>
        </div>
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            {t('templates.saveNew')}
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder={t('templates.namePlaceholder')}
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              className="w-full"
              autoFocus
            />
            <input
              type="text"
              placeholder={t('templates.descPlaceholder')}
              value={newTemplateDesc}
              onChange={(e) => setNewTemplateDesc(e.target.value)}
              className="w-full"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveTemplate}
                disabled={!newTemplateName.trim()}
                className="btn btn-primary"
              >
                {t('common.save')}
              </button>
              <button
                onClick={() => { setShowSaveDialog(false); setNewTemplateName(''); setNewTemplateDesc(''); }}
                className="btn btn-secondary"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Default templates */}
      {defaultTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <span>📌</span> {t('templates.defaultTemplates')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {defaultTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      )}

      {/* User templates */}
      {userTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <span>👤</span> {t('templates.myTemplates')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
          <span className="text-4xl block mb-2">📄</span>
          {searchQuery ? t('templates.noResults') : t('templates.noTemplates')}
        </div>
      )}
    </div>
  );
});

// Compact template selector for quick access
interface TemplateSelectorProps {
  onSelectTemplate: (data: CSVRow[]) => void;
  className?: string;
}

export const TemplateSelector = memo(function TemplateSelector({
  onSelectTemplate,
  className = '',
}: TemplateSelectorProps) {
  const { t } = useTranslation();
  const { templates } = useCSVTemplatesStore();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [isOpen]);

  const handleSelect = useCallback((template: CSVTemplate) => {
    onSelectTemplate(JSON.parse(JSON.stringify(template.data)));
    setIsOpen(false);
  }, [onSelectTemplate]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary flex items-center gap-2"
      >
        <span>📄</span>
        {t('templates.templates')}
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="fixed w-72 bg-white dark:bg-dark-100 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-[9999] overflow-hidden"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            <div className="max-h-80 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800 border-b border-gray-100 dark:border-slate-700 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {template.name}
                    </span>
                    {template.isDefault && (
                      <span className="px-1 py-0.5 text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                        {t('templates.default')}
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {template.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
});
