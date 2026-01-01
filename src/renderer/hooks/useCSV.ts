import { useState, useCallback, useMemo } from 'react';
import type { CSVRow } from '@shared/types';
import { useTranslation } from '@/i18n';

type NotifyFn = (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;

const MAX_HISTORY = 50;

const defaultNotify: NotifyFn = (type, msg) => {
  if (type === 'error' || type === 'warning') {
    console.error(msg);
  }
};

export function useCSV(notify?: NotifyFn) {
  const { t } = useTranslation();
  const [data, setDataInternal] = useState<CSVRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [copiedRow, setCopiedRow] = useState<CSVRow | null>(null);
  
  const [past, setPast] = useState<CSVRow[][]>([]);
  const [future, setFuture] = useState<CSVRow[][]>([]);

  const showMessage = useMemo(() => notify ?? defaultNotify, [notify]);

  const setData = useCallback((newData: CSVRow[] | null) => {
    if (newData !== null && data !== null) {
      setPast(prev => [...prev.slice(-(MAX_HISTORY - 1)), data]);
      setFuture([]);
    }
    setDataInternal(newData);
  }, [data]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    
    const newPast = [...past];
    const previous = newPast.pop();
    if (!previous) return;
    
    setPast(newPast);
    if (data) {
      setFuture(prev => [data, ...prev]);
    }
    
    setDataInternal(previous);
    showMessage('info', t('csv.undone'));
  }, [data, past, showMessage, t]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    
    const [next, ...newFuture] = future;
    
    if (data) {
      setPast(prev => [...prev, data]);
    }
    setFuture(newFuture);
    
    setDataInternal(next);
    showMessage('info', t('csv.redone'));
  }, [data, future, showMessage, t]);

  const copyRow = useCallback((index: number) => {
    if (data && data[index]) {
      setCopiedRow({ ...data[index] });
      showMessage('info', t('csv.rowCopied'));
    }
  }, [data, showMessage, t]);

  const pasteRow = useCallback(() => {
    if (copiedRow && data) {
      const newData = [...data, { ...copiedRow }];
      setData(newData);
      showMessage('info', t('csv.rowPasted'));
    }
  }, [copiedRow, data, setData, showMessage, t]);

  const duplicateRow = useCallback((index: number) => {
    if (data && data[index]) {
      const newData = [...data];
      newData.splice(index + 1, 0, { ...data[index] });
      setData(newData);
      showMessage('info', t('csv.rowDuplicated'));
    }
  }, [data, setData, showMessage, t]);

  const loadCSV = useCallback(async () => {
    try {
      const result = await window.electronAPI.loadCSV();
      
      if (result.success && result.data) {
        setPast([]);
        setFuture([]);
        
        setDataInternal(result.data);
        setFileName(result.filePath?.split(/[\\/]/).pop() || 'archivo.csv');
        showMessage('success', t('csv.csvLoaded').replace('{count}', String(result.data.length)));
      } else if (result.error) {
        showMessage('error', `${t('csv.csvLoadError')}: ${result.error}`);
      }
    } catch (error) {
      showMessage('error', `${t('csv.csvLoadError')}: ${error}`);
    }
  }, [showMessage, t]);

  const loadCSVFromFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      
      const startIndex = lines[0]?.toLowerCase().includes('cuenta') ? 1 : 0;
      
      const parsedData: CSVRow[] = lines.slice(startIndex).map(line => {
        const [cuenta = '', proyecto = '', extras = ''] = line.split(',').map(s => s.trim());
        return { cuenta, proyecto, extras };
      }).filter(row => row.cuenta || row.proyecto);
      
      if (parsedData.length > 0) {
        setPast([]);
        setFuture([]);
        
        setDataInternal(parsedData);
        setFileName(file.name);
        showMessage('success', t('csv.csvLoaded').replace('{count}', String(parsedData.length)));
      } else {
        showMessage('warning', t('csv.csvEmpty'));
      }
    } catch (error) {
      showMessage('error', `${t('csv.csvError')}: ${error}`);
    }
  }, [showMessage, t]);

  const saveCSV = useCallback(async () => {
    if (!data || data.length === 0) {
      showMessage('warning', t('csv.noDataToSave'));
      return;
    }

    try {
      const result = await window.electronAPI.saveCSV(data);
      
      if (result.success) {
        showMessage('success', t('csv.csvSaved'));
      } else if (result.error) {
        showMessage('error', `${t('csv.csvSaveError')}: ${result.error}`);
      }
    } catch (error) {
      showMessage('error', `${t('csv.csvSaveError')}: ${error}`);
    }
  }, [data, showMessage, t]);

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    data,
    setData,
    fileName,
    loadCSV,
    loadCSVFromFile,
    saveCSV,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    historyInfo: { undoSteps: past.length, redoSteps: future.length },
    clearHistory,
    copyRow,
    pasteRow,
    duplicateRow,
    hasCopiedRow: copiedRow !== null,
  };
}
