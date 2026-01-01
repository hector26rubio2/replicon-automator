import { useState } from 'react';
import { generateId } from '../../../../shared/utils';
import type { ConfigTabProps } from './ConfigTab.types';
import AccountItem from './AccountItem';
import {
  addHorario,
  addAccount,
  addProject,
  removeAccount,
  removeHorario,
  updateHorario,
} from '../../../../shared/config-helpers';
import {
  ensureSpecialAccounts,
  getMissingSpecialCodes,
  getSortedMappingEntries,
  isSpecialAccountCode,
} from './ConfigTab.utils';

export default function ConfigTab({
  horarios,
  onHorariosChange,
  mappings,
  onMappingsChange,
  appConfig,
  onAppConfigChange,
}: ConfigTabProps) {
  const [newAccountCode, setNewAccountCode] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [accountError, setAccountError] = useState<string | null>(null);

  // Horarios handlers
  const handleAddHorario = () => {
    onHorariosChange(addHorario(horarios, { id: generateId(), start_time: '9:00am', end_time: '12:00pm' }));
  };

  const handleRemoveHorario = (id: string) => {
    onHorariosChange(removeHorario(horarios, id));
  };

  const handleUpdateHorario = (id: string, field: 'start_time' | 'end_time', value: string) => {
    onHorariosChange(updateHorario(horarios, id, field, value));
  };

  // Mappings handlers
  const handleAddAccount = () => {
    if (!newAccountCode || !newAccountName) return;

    const upperCode = newAccountCode.toUpperCase().trim();
    const isSpecialCode = isSpecialAccountCode(upperCode);

    if (isSpecialCode) {
      setAccountError(
        `El código ${upperCode} es una cuenta especial. Usa el botón "+ Cuentas especiales" para crearla/restaurarla.`,
      );
      return;
    }

    setAccountError(null);

    onMappingsChange(addAccount(mappings, upperCode, newAccountName));

    setNewAccountCode('');
    setNewAccountName('');
  };

  const handleRemoveAccount = (code: string) => {
    onMappingsChange(removeAccount(mappings, code));
  };

  const handleAddProject = (accountCode: string, projectCode: string, projectName: string) => {
    onMappingsChange(addProject(mappings, accountCode, projectCode, projectName));
  };

  const missingSpecialCodes = getMissingSpecialCodes(mappings);
  const isNewAccountSpecial = Boolean(newAccountCode) && isSpecialAccountCode(newAccountCode);

  const handleEnsureSpecialAccounts = () => {
    onMappingsChange(ensureSpecialAccounts(mappings));
  };

  const sortedMappingEntries = getSortedMappingEntries(mappings);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Horarios de trabajo */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">⏰</span>
            Horarios de Trabajo
          </h2>
          <button onClick={handleAddHorario} className="btn btn-success text-sm">
            + Agregar Horario
          </button>
        </div>

        <p className="text-slate-400 text-sm mb-4">
          Define los bloques de tiempo que se aplicarán a cada día de trabajo.
        </p>

        <div className="space-y-3">
          {horarios.map((horario, index) => (
            <div key={horario.id} className="flex items-center gap-4 p-3 bg-dark-200 rounded-lg">
              <span className="text-slate-500 w-8">#{index + 1}</span>

              <div className="flex items-center gap-2">
                <label className="text-slate-400 text-sm">Inicio:</label>
                <input
                  type="text"
                  value={horario.start_time}
                  onChange={(e) => handleUpdateHorario(horario.id, 'start_time', e.target.value)}
                  placeholder="7:00am"
                  className="w-28"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-400 text-sm">Fin:</label>
                <input
                  type="text"
                  value={horario.end_time}
                  onChange={(e) => handleUpdateHorario(horario.id, 'end_time', e.target.value)}
                  placeholder="1:00pm"
                  className="w-28"
                />
              </div>

              <div className="flex-1" />

              {horarios.length > 1 && (
                <button
                  onClick={() => handleRemoveHorario(horario.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="text-slate-500 text-xs mt-4">💡 Formato: hora:minutoam/pm (ej: 7:00am, 2:30pm)</p>
      </div>

      {/* Configuración de la App */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">⚙️</span>
          Configuración de la Aplicación
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL de Login (Okta)</label>
            <input
              type="text"
              value={appConfig.loginUrl}
              onChange={(e) => onAppConfigChange({ ...appConfig, loginUrl: e.target.value })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Timeout (ms)</label>
            <input
              type="number"
              value={appConfig.timeout}
              onChange={(e) =>
                onAppConfigChange({ ...appConfig, timeout: parseInt(e.target.value) || 45000 })
              }
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={appConfig.headless}
                onChange={(e) => onAppConfigChange({ ...appConfig, headless: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-slate-300">Modo sin ventana (headless)</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={appConfig.autoSave}
                onChange={(e) => onAppConfigChange({ ...appConfig, autoSave: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-slate-300">Guardar configuración automáticamente</span>
            </label>
          </div>
        </div>
      </div>

      {/* Mapeo de cuentas */}
      <div className="card">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            Mapeo de Cuentas y Proyectos
          </h2>

          {missingSpecialCodes.length > 0 && (
            <button
              onClick={handleEnsureSpecialAccounts}
              className="btn btn-secondary text-sm"
              title="Crea/restaura cuentas especiales (BH/H/F/ND/FDS) si faltan"
            >
              + Cuentas especiales
            </button>
          )}
        </div>

        <p className="text-slate-400 text-sm mb-4">
          Configura las abreviaciones de cuentas y sus proyectos asociados en Replicon.
          <span className="block text-slate-500 text-xs mt-1">
            Las cuentas especiales (BH/H/F/ND/FDS) se usan para festivos, vacaciones y fines de semana.
          </span>
          {missingSpecialCodes.length > 0 && (
            <span className="block text-amber-400 text-xs mt-1">
              Faltan cuentas especiales: {missingSpecialCodes.join(', ')}
            </span>
          )}
        </p>

        {/* Add new account */}
        <div className="flex gap-3 mb-4 p-3 bg-dark-200 rounded-lg">
          <input
            type="text"
            value={newAccountCode}
            onChange={(e) => setNewAccountCode(e.target.value.toUpperCase())}
            placeholder="Código (ej: AV)"
            className="w-32"
          />
          <input
            type="text"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            placeholder="Nombre en Replicon"
            className="flex-1"
          />
          <button
            onClick={handleAddAccount}
            disabled={!newAccountCode || !newAccountName || isNewAccountSpecial}
            className="btn btn-success"
          >
            + Agregar Cuenta
          </button>
        </div>

        {isNewAccountSpecial && (
          <p className="text-amber-400 text-xs mb-4">Ese código es una cuenta especial. Créala con “+ Cuentas especiales”.</p>
        )}

        {accountError && <p className="text-red-400 text-xs mb-4">{accountError}</p>}

        {/* Account list */}
        <div className="space-y-3 max-h-[400px] overflow-auto">
          {sortedMappingEntries.map(([code, account]) => (
            <AccountItem
              key={code}
              code={code}
              account={account}
              onRemove={() => handleRemoveAccount(code)}
              onAddProject={(projectCode, projectName) => handleAddProject(code, projectCode, projectName)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
