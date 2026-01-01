import { useEffect, useState } from 'react';
import type { CSVRow } from '../../../../shared/types';
import type { CSVEditorTabProps, DayInfo, ExtDraftEntry } from './CSVEditorTab.types';
import {
  DEFAULT_HOLIDAY_CODE,
  DEFAULT_WEEKEND_CODE,
  DOW_ES,
  MONTHLY_TEMPLATE_SETTINGS_KEY,
  MONTHS_ES,
} from './CSVEditorTab.constants';
import {
  buildCsvText,
  buildExtString,
  computeHolidaySet,
  isSpecialAccountCode,
  parseExtString as parseExtStringUtil,
} from './CSVEditorTab.utils';

export default function CSVEditorTab({
  data,
  onDataChange,
  onSaveCSV,
  mappings,
}: CSVEditorTabProps) {
  const [baseNow] = useState(() => new Date());
  const [monthOffset, setMonthOffset] = useState<-1 | 0 | 1>(0);
  const [defaultAccount, setDefaultAccount] = useState<string>('');
  const [defaultProject, setDefaultProject] = useState<string>('');
  const [dayInfo, setDayInfo] = useState<DayInfo[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCsvOutput, setShowCsvOutput] = useState(false);
  const [templateSavedHint, setTemplateSavedHint] = useState<string | null>(null);
  const [extEditorRowIndex, setExtEditorRowIndex] = useState<number | null>(null);
  const [extDraftEntries, setExtDraftEntries] = useState<ExtDraftEntry[]>([
    { cuenta: '', proyecto: '', inicio: '', fin: '' },
  ]);
  const [extDraftError, setExtDraftError] = useState<string | null>(null);

  const selectedMonthDate = new Date(baseNow.getFullYear(), baseNow.getMonth() + monthOffset, 1);
  const selectedYear = selectedMonthDate.getFullYear();
  const selectedMonthIndex = selectedMonthDate.getMonth();
  const selectedMonthNumber = selectedMonthIndex + 1;
  const selectedMonthLabel = MONTHS_ES[selectedMonthIndex];
  const daysInSelectedMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();

  useEffect(() => {
    // Si cambias de mes, la columna visual de días ya no aplica.
    setDayInfo(null);
  }, [monthOffset]);

  useEffect(() => {
    // Si no hay data, no mostrar salida de CSV
    if (!data || data.length === 0) setShowCsvOutput(false);
  }, [data]);

  useEffect(() => {
    // Restaurar última plantilla guardada (si existe)
    try {
      const raw = localStorage.getItem(MONTHLY_TEMPLATE_SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        monthOffset?: -1 | 0 | 1;
        defaultAccount?: string;
        defaultProject?: string;
      };
      if (parsed.monthOffset === -1 || parsed.monthOffset === 0 || parsed.monthOffset === 1) {
        setMonthOffset(parsed.monthOffset);
      }
      if (typeof parsed.defaultAccount === 'string') setDefaultAccount(parsed.defaultAccount);
      if (typeof parsed.defaultProject === 'string') setDefaultProject(parsed.defaultProject);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddRow = () => {
    const newRow: CSVRow = { cuenta: '', proyecto: '', extras: '' };
    onDataChange([...(data || []), newRow]);
    setDayInfo(null);
  };

  const handleClearTable = () => {
    onDataChange([]);
    setDayInfo(null);
  };

  const handleSaveTemplateSettings = () => {
    try {
      localStorage.setItem(
        MONTHLY_TEMPLATE_SETTINGS_KEY,
        JSON.stringify({ monthOffset, defaultAccount, defaultProject }),
      );
      setTemplateSavedHint('Plantilla guardada');
      window.setTimeout(() => setTemplateSavedHint(null), 1500);
    } catch {
      setTemplateSavedHint('No se pudo guardar');
      window.setTimeout(() => setTemplateSavedHint(null), 1500);
    }
  };

  const handleRemoveRow = (index: number) => {
    if (!data) return;
    const newData = data.filter((_, i) => i !== index);
    onDataChange(newData);
    setDayInfo(null);
  };

  const handleUpdateRow = (index: number, field: keyof CSVRow, value: string) => {
    if (!data) return;
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onDataChange(newData);
  };

  const parseExtString = (extras: string) => parseExtStringUtil(extras, mappings);

  const openExtEditorForRow = (rowIndex: number) => {
    const current = data?.[rowIndex]?.extras ?? '';
    const parsed = parseExtString(current);
    if (parsed.entries.length > 0 && !parsed.error) {
      setExtDraftEntries(parsed.entries);
      setExtDraftError(null);
    } else {
      setExtDraftEntries([{ cuenta: '', proyecto: '', inicio: '', fin: '' }]);
      setExtDraftError(parsed.error);
    }
    setExtEditorRowIndex(rowIndex);
  };

  const closeExtEditor = () => {
    setExtEditorRowIndex(null);
    setExtDraftError(null);
  };

  const applyExtEditor = () => {
    if (extEditorRowIndex == null) return;
    const nextExtras = buildExtString(extDraftEntries);
    const validation = parseExtString(nextExtras);
    if (nextExtras && validation.error) {
      setExtDraftError(validation.error);
      return;
    }
    handleUpdateRow(extEditorRowIndex, 'extras', nextExtras);
    closeExtEditor();
  };

  const handleConfigureDayManually = (rowIndex: number) => {
    handleUpdateRow(rowIndex, 'cuenta', DEFAULT_WEEKEND_CODE);
    handleUpdateRow(rowIndex, 'proyecto', DEFAULT_WEEKEND_CODE);
    openExtEditorForRow(rowIndex);
  };

  const buildMonthlyTemplate = (mode: 'create' | 'update') => {
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const monthIndex = selectedMonthIndex;
    const year = selectedYear;
    const month = selectedMonthNumber;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const holidaySet = computeHolidaySet(year);

    const existing = mode === 'update' ? (data ?? []) : [];
    const rows: CSVRow[] = [];
    const info: DayInfo[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, monthIndex, d);
      const dayOfWeek = day.getDay();
      const dayKey = `${year}-${pad2(month)}-${pad2(d)}`;

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidaySet.has(dayKey);
      const prevExtras = existing[d - 1]?.extras ?? '';

      info.push({
        date: dayKey,
        dayNumber: d,
        dowLabel: DOW_ES[dayOfWeek] ?? '',
        isWeekend,
        isHoliday,
      });

      if (isWeekend) {
        rows.push({ cuenta: DEFAULT_WEEKEND_CODE, proyecto: DEFAULT_WEEKEND_CODE, extras: prevExtras });
        continue;
      }

      if (isHoliday) {
        rows.push({ cuenta: DEFAULT_HOLIDAY_CODE, proyecto: '', extras: prevExtras });
        continue;
      }

      rows.push({
        cuenta: defaultAccount,
        proyecto: defaultProject,
        extras: prevExtras,
      });
    }

    onDataChange(rows);
    setDayInfo(info);
  };

  const handleCreateMonthlyTemplate = () => buildMonthlyTemplate('create');
  const handleUpdateMonthlyTemplate = () => buildMonthlyTemplate('update');

  const accountCodes = Object.keys(mappings);
  const extAccountCodes = accountCodes.filter((code) => !isSpecialAccountCode(code));
  const projectCodes = defaultAccount && mappings[defaultAccount]?.projects ? Object.keys(mappings[defaultAccount].projects) : [];
  const csvText = buildCsvText(data);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toolbar */}
      <div className="card">
        <div className="flex flex-col gap-4">
          {/* Plantilla mensual */}
          <div className="w-full flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
            <select
              value={monthOffset}
              onChange={(e) => setMonthOffset(Number(e.target.value) as -1 | 0 | 1)}
              className="w-full sm:flex-1 sm:min-w-56"
            >
              <option value={-1}>Mes anterior</option>
              <option value={0}>Mes actual</option>
              <option value={1}>Mes siguiente</option>
            </select>
            <span className="w-full sm:w-auto text-center text-slate-300 text-sm px-2 py-1 rounded bg-dark-200">
              {selectedMonthLabel} {selectedYear}
            </span>
            <span className="w-full sm:w-auto text-center text-slate-400 text-sm px-2 py-1 rounded bg-dark-200">
              {daysInSelectedMonth} días
            </span>
            <select
              value={defaultAccount}
              onChange={(e) => {
                setDefaultAccount(e.target.value);
                setDefaultProject('');
              }}
              className="w-full sm:flex-1 sm:min-w-48"
              title="Cuenta por defecto (Lun-Vie)"
            >
              <option value="">Cuenta</option>
              {accountCodes.map((code) => (
                <option key={code} value={code}>
                  {code} - {mappings[code]?.name || 'N/A'}
                </option>
              ))}
            </select>
            <select
              value={defaultProject}
              onChange={(e) => setDefaultProject(e.target.value)}
              className="w-full sm:flex-1 sm:min-w-48"
              disabled={!defaultAccount}
              title="Proyecto por defecto (Lun-Vie)"
            >
              <option value="">Proyecto</option>
              {projectCodes.map((code) => (
                <option key={code} value={code}>
                  {code} - {mappings[defaultAccount]?.projects?.[code] || 'N/A'}
                </option>
              ))}
            </select>

            <button
              onClick={handleCreateMonthlyTemplate}
              className="btn btn-success w-full sm:w-auto"
              title="Crear plantilla mensual"
            >
              🗓️
            </button>

            <button
              onClick={handleUpdateMonthlyTemplate}
              className="btn btn-secondary w-full sm:w-auto"
              disabled={!data || data.length === 0}
              title="Actualizar plantilla (reaplica cuenta/proyecto Lun-Vie y preserva Extras)"
            >
              🔄
            </button>

            <button
              onClick={handleSaveTemplateSettings}
              className="btn btn-secondary w-full sm:w-auto"
              title="Guardar plantilla (mes/cuenta/proyecto)"
            >
              📌
            </button>

            <button
              onClick={() => setShowPreview((v) => !v)}
              className="btn btn-secondary w-full sm:w-auto"
              disabled={!data || data.length === 0}
              title="Ver vista previa"
            >
              👁️
            </button>

            <button
              onClick={() => setShowCsvOutput((v) => !v)}
              className="btn btn-secondary w-full sm:w-auto"
              disabled={!data || data.length === 0}
              title="Ver CSV final (texto)"
              type="button"
            >
              📄
            </button>

            <button
              onClick={() => void onSaveCSV()}
              className="btn btn-secondary w-full sm:w-auto"
              disabled={!data || data.length === 0}
              title="Guardar CSV"
              type="button"
            >
              💾
            </button>

            {templateSavedHint && (
              <span className="w-full sm:w-auto text-center text-slate-400 text-xs px-2 py-1 rounded bg-dark-200">
                {templateSavedHint}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Editor Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">📝</span>
            Editor de Datos ({daysInSelectedMonth} días) — {selectedMonthLabel} {selectedYear}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleClearTable}
              className="btn btn-secondary text-sm"
              disabled={!data || data.length === 0}
              title="Borra todas las filas"
            >
              🧹 Borrar tabla
            </button>
            <button onClick={handleAddRow} className="btn btn-success text-sm">
              + Agregar Fila
            </button>
          </div>
        </div>

        {showPreview && data && data.length > 0 && (
          <div className="mb-4 p-3 bg-dark-200 rounded-lg">
            <p className="text-sm text-slate-400 mb-2">Vista previa:</p>
            <div className="max-h-32 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="text-left py-1">Día</th>
                    <th className="text-left py-1">Cuenta</th>
                    <th className="text-left py-1">Proyecto</th>
                    <th className="text-left py-1">Extras</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((row, index) => (
                    <tr key={index} className="text-slate-300">
                      <td className="py-1">{index + 1}</td>
                      <td className="py-1">{row.cuenta}</td>
                      <td className="py-1">{row.proyecto}</td>
                      <td className="py-1 text-slate-500">{row.extras || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 5 && (
                <p className="text-slate-500 text-xs mt-2">... y {data.length - 5} días más</p>
              )}
            </div>
          </div>
        )}

        {showCsvOutput && data && data.length > 0 && (
          <div className="mb-4 p-3 bg-dark-200 rounded-lg">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-sm text-slate-400">CSV final:</p>
              <span className="text-xs text-slate-500">{data.length} filas</span>
            </div>
            <textarea
              readOnly
              value={csvText}
              className="w-full bg-dark-300 font-mono text-xs"
              rows={8}
            />
          </div>
        )}

        <div className="overflow-auto max-h-[500px] rounded-lg border border-slate-700">
          <table className="w-full">
            <thead className="bg-dark-200 sticky top-0">
              <tr className="text-slate-400 text-sm">
                <th className="py-3 px-4 text-left w-16">Día</th>
                <th className="py-3 px-4 text-left w-32">Fecha</th>
                <th className="py-3 px-4 text-left">Cuenta</th>
                <th className="py-3 px-4 text-left">Proyecto</th>
                <th className="py-3 px-4 text-left">
                  <div className="flex items-center gap-2">
                    <span>Extras</span>
                    <span
                      className="text-slate-500"
                      title="Formato: EXT/CUENTA:PROYECTO:INICIO:FIN  |  Ej: EXT/PROD:PI:1600:1800  |  Múltiples: EXT/...;AV:MS:1800:2000"
                    >
                      ℹ️
                    </span>
                  </div>
                </th>
                <th className="py-3 px-4 text-center w-20">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((row, index) => (
                  <tr 
                    key={index} 
                    className="border-t border-slate-700/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-2 px-4 text-slate-500 font-mono">{index + 1}</td>
                    <td className="py-2 px-4 text-slate-300 font-mono text-sm">
                      {dayInfo && dayInfo[index]
                        ? `${String(dayInfo[index].dayNumber).padStart(2, '0')} ${dayInfo[index].dowLabel}`
                        : '--'}
                      {dayInfo && dayInfo[index]?.isWeekend ? (
                        <span className="ml-2 text-slate-500">FDS</span>
                      ) : null}
                      {dayInfo && dayInfo[index]?.isHoliday ? (
                        <span className="ml-2 text-amber-400">★</span>
                      ) : null}
                    </td>
                    <td className="py-2 px-4">
                      <select
                        value={row.cuenta}
                        onChange={(e) => handleUpdateRow(index, 'cuenta', e.target.value)}
                        className="w-full bg-dark-200"
                      >
                        <option value="">Seleccionar...</option>
                        {accountCodes.map(code => (
                          <option key={code} value={code}>
                            {code} - {mappings[code]?.name || 'N/A'}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-4">
                      <select
                        value={row.proyecto}
                        onChange={(e) => handleUpdateRow(index, 'proyecto', e.target.value)}
                        className="w-full bg-dark-200"
                        disabled={!row.cuenta || !mappings[row.cuenta]}
                      >
                        <option value="">Seleccionar...</option>
                        {row.cuenta && mappings[row.cuenta]?.projects && 
                          Object.keys(mappings[row.cuenta].projects).map(code => (
                            <option key={code} value={code}>
                              {code} - {mappings[row.cuenta].projects[code] || 'N/A'}
                            </option>
                          ))
                        }
                      </select>
                    </td>
                    <td className="py-2 px-4">
                      {(() => {
                        const validation = parseExtString(row.extras || '');
                        const showError = Boolean((row.extras || '').trim()) && Boolean(validation.error);
                        return (
                          <div>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={row.extras || ''}
                                onChange={(e) => handleUpdateRow(index, 'extras', e.target.value)}
                                placeholder="EXT/PROD:PI:1600:1800"
                                className={`w-full bg-dark-200 ${showError ? 'border border-red-500/60' : ''}`}
                              />
                              <button
                                type="button"
                                onClick={() => openExtEditorForRow(index)}
                                className="btn btn-secondary"
                                title="Editar horas extra (EXT)"
                              >
                                ⏱️
                              </button>
                            </div>
                            {showError && (
                              <p className="text-red-400 text-xs mt-1">{validation.error}</p>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-2 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleConfigureDayManually(index)}
                          className="btn btn-secondary"
                          title="Configurar día manual (sin horarios preestablecidos)"
                        >
                          ✍️
                        </button>
                        <button
                          onClick={() => handleRemoveRow(index)}
                          className="inline-flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                          title="Eliminar fila"
                          type="button"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No hay datos. Carga un CSV o crea una plantilla mensual para comenzar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {extEditorRowIndex != null && (
        <div className="fixed left-1/2 top-24 -translate-x-1/2 z-50 w-[95vw] max-w-2xl">
          <div className="card bg-dark-200 border border-slate-700">
            <div className="flex items-center justify-between gap-4 mb-3">
              <h3 className="text-white font-semibold">⏱️ Horas extra (EXT) — Día {extEditorRowIndex + 1}</h3>
              <button onClick={closeExtEditor} className="btn btn-secondary" title="Cerrar">
                ✕
              </button>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="text-left py-2">Cuenta</th>
                    <th className="text-left py-2">Proyecto</th>
                    <th className="text-left py-2">Inicio</th>
                    <th className="text-left py-2">Fin</th>
                    <th className="text-center py-2 w-16"> </th>
                  </tr>
                </thead>
                <tbody>
                  {extDraftEntries.map((e, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="py-2 pr-2">
                        <select
                          value={e.cuenta}
                          onChange={(ev) => {
                            const nextCuenta = ev.target.value.toUpperCase();
                            const next = [...extDraftEntries];
                            const prevProyecto = next[i]?.proyecto ?? '';
                            const projectKeys = nextCuenta && mappings[nextCuenta]?.projects ? Object.keys(mappings[nextCuenta].projects) : [];
                            const proyectoValido = prevProyecto && projectKeys.includes(prevProyecto);

                            next[i] = {
                              ...next[i],
                              cuenta: nextCuenta,
                              proyecto: proyectoValido ? prevProyecto : '',
                            };
                            setExtDraftEntries(next);
                          }}
                          className="w-full bg-dark-300"
                          title="Cuenta (EXT)"
                        >
                          <option value="">Cuenta</option>
                          {extAccountCodes.map((code) => (
                            <option key={code} value={code}>
                              {code} - {mappings[code]?.name || 'N/A'}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={e.proyecto}
                          onChange={(ev) => {
                            const next = [...extDraftEntries];
                            next[i] = { ...next[i], proyecto: ev.target.value.toUpperCase() };
                            setExtDraftEntries(next);
                          }}
                          className="w-full bg-dark-300"
                          disabled={!e.cuenta || !mappings[e.cuenta]}
                          title="Proyecto (EXT)"
                        >
                          <option value="">Proyecto</option>
                          {e.cuenta && mappings[e.cuenta]?.projects
                            ? Object.keys(mappings[e.cuenta].projects).map((code) => (
                                <option key={code} value={code}>
                                  {code} - {mappings[e.cuenta].projects[code] || 'N/A'}
                                </option>
                              ))
                            : null}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={e.inicio}
                          onChange={(ev) => {
                            const next = [...extDraftEntries];
                            next[i] = { ...next[i], inicio: ev.target.value.replace(/[^0-9]/g, '').slice(0, 4) };
                            setExtDraftEntries(next);
                          }}
                          placeholder="1600"
                          className="w-full bg-dark-300"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={e.fin}
                          onChange={(ev) => {
                            const next = [...extDraftEntries];
                            next[i] = { ...next[i], fin: ev.target.value.replace(/[^0-9]/g, '').slice(0, 4) };
                            setExtDraftEntries(next);
                          }}
                          placeholder="1800"
                          className="w-full bg-dark-300"
                        />
                      </td>
                      <td className="py-2 text-center">
                        <button
                          className="text-red-400 hover:text-red-300"
                          title="Eliminar"
                          onClick={() => {
                            const next = extDraftEntries.filter((_, idx) => idx !== i);
                            setExtDraftEntries(next.length ? next : [{ cuenta: '', proyecto: '', inicio: '', fin: '' }]);
                          }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {extDraftError && <p className="text-red-400 text-xs mt-2">{extDraftError}</p>}

            <div className="flex flex-wrap gap-2 justify-between items-center mt-4">
              <button
                className="btn btn-secondary"
                onClick={() => setExtDraftEntries([...extDraftEntries, { cuenta: '', proyecto: '', inicio: '', fin: '' }])}
                title="Agregar fila"
              >
                +
              </button>

              <div className="flex gap-2">
                <button className="btn btn-secondary" onClick={closeExtEditor}>
                  Cancelar
                </button>
                <button className="btn btn-success" onClick={applyExtEditor}>
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
