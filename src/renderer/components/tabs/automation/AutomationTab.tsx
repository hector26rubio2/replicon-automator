import type { Credentials, CSVRow, AutomationProgress } from '../../../../shared/types';

interface AutomationTabProps {
  credentials: Credentials;
  onCredentialsChange: (credentials: Credentials) => void;
  csvData: CSVRow[] | null;
  csvFileName: string | null;
  onLoadCSV: () => Promise<void>;
  onStartAutomation: () => Promise<void>;
  onStopAutomation: () => Promise<void>;
  onPauseAutomation: () => Promise<void>;
  status: AutomationProgress['status'];
  progress: AutomationProgress | null;
  isPaused: boolean;
}

export default function AutomationTab({
  credentials,
  onCredentialsChange,
  csvData,
  csvFileName,
  onLoadCSV,
  onStartAutomation,
  onStopAutomation,
  onPauseAutomation,
  status,
  progress,
  isPaused,
}: AutomationTabProps) {
  const isRunning = status === 'running';
  const canStart = credentials.email && credentials.password && csvData && csvData.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Credenciales */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🔐</span>
          Credenciales de Okta
        </h2>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => onCredentialsChange({ ...credentials, email: e.target.value })}
              placeholder="tu.correo@empresa.com"
              className="w-full"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Contraseña</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => onCredentialsChange({ ...credentials, password: e.target.value })}
              placeholder="••••••••"
              className="w-full"
              disabled={isRunning}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={credentials.rememberMe}
              onChange={(e) => onCredentialsChange({ ...credentials, rememberMe: e.target.checked })}
              className="w-4 h-4 rounded border-slate-600 text-primary-500 focus:ring-primary-500"
              disabled={isRunning}
            />
            <span className="text-sm text-slate-400">Recordar mis credenciales</span>
          </label>
        </div>
      </div>

      {/* Archivo CSV */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Archivo CSV
        </h2>

        <div className="flex items-center gap-4">
          <button onClick={onLoadCSV} className="btn btn-secondary" disabled={isRunning}>
            📁 Cargar CSV
          </button>

          <div className="flex-1">
            {csvFileName ? (
              <div className="flex items-center gap-3">
                <span className="text-emerald-400">✓</span>
                <span className="text-white">{csvFileName}</span>
                <span className="text-slate-500">({csvData?.length || 0} días)</span>
              </div>
            ) : (
              <span className="text-slate-500">No hay archivo seleccionado</span>
            )}
          </div>
        </div>

        {csvData && csvData.length > 0 && (
          <div className="mt-4 p-3 bg-dark-200 rounded-lg">
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
                  {csvData.slice(0, 5).map((row, index) => (
                    <tr key={index} className="text-slate-300">
                      <td className="py-1">{index + 1}</td>
                      <td className="py-1">{row.cuenta}</td>
                      <td className="py-1">{row.proyecto}</td>
                      <td className="py-1 text-slate-500">{row.extras || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length > 5 && (
                <p className="text-slate-500 text-xs mt-2">... y {csvData.length - 5} días más</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress Card */}
      {progress && status !== 'idle' && (
        <div className="card border-primary-500/30">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📈</span>
            Progreso
          </h2>

          <div className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-sm text-slate-400 mb-1">
                <span>
                  Día {progress.currentDay} de {progress.totalDays}
                </span>
                <span>{Math.round((progress.currentDay / progress.totalDays) * 100)}%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${(progress.currentDay / progress.totalDays) * 100}%` }}
                />
              </div>
            </div>

            {/* Current entry */}
            {progress.totalEntries > 0 && (
              <div>
                <div className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>
                    Entrada {progress.currentEntry} de {progress.totalEntries}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-400 transition-all duration-300"
                    style={{ width: `${(progress.currentEntry / progress.totalEntries) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Status message */}
            <p className="text-slate-300">{progress.message}</p>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="card">
        <div className="flex gap-4 justify-center">
          {!isRunning ? (
            <button
              onClick={onStartAutomation}
              disabled={!canStart}
              className={`btn btn-success px-8 py-3 text-lg ${!canStart ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              🚀 Iniciar Automatización
            </button>
          ) : (
            <>
              <button onClick={onPauseAutomation} className="btn btn-warning px-6">
                {isPaused ? '▶️ Reanudar' : '⏸️ Pausar'}
              </button>
              <button onClick={onStopAutomation} className="btn btn-danger px-6">
                ⏹️ Detener
              </button>
            </>
          )}
        </div>

        {!canStart && !isRunning && (
          <p className="text-center text-slate-500 text-sm mt-4">
            {!credentials.email || !credentials.password
              ? '⚠️ Ingresa tus credenciales'
              : '⚠️ Carga un archivo CSV para continuar'}
          </p>
        )}
      </div>
    </div>
  );
}
