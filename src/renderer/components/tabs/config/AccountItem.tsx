import { useState } from 'react';
import type { AccountItemProps } from './ConfigTab.types';
import { getSpecialAccountLabel } from './ConfigTab.utils';

export default function AccountItem({ code, account, onRemove, onAddProject }: AccountItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newProjectCode, setNewProjectCode] = useState('');
  const [newProjectName, setNewProjectName] = useState('');

  const handleAdd = () => {
    if (newProjectCode && newProjectName) {
      onAddProject(newProjectCode.toUpperCase(), newProjectName);
      setNewProjectCode('');
      setNewProjectName('');
    }
  };

  const specialLabel = getSpecialAccountLabel(code);
  const isSpecial = Boolean(specialLabel);

  return (
    <div className={`border rounded-lg overflow-hidden ${isSpecial ? 'border-amber-700/50' : 'border-slate-700'}`}>
      <div
        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/50 transition-colors ${isSpecial ? 'bg-amber-900/20' : 'bg-dark-200'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-primary-400 font-mono font-bold">{code}</span>
          <span className="text-slate-300">{account.name}</span>
          {isSpecial && (
            <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded">{specialLabel}</span>
          )}
          <span className="text-slate-500 text-sm">({Object.keys(account.projects).length} proyectos)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{isExpanded ? '▼' : '▶'}</span>
          {!isSpecial && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-red-400 hover:text-red-300 ml-2"
              title="Eliminar cuenta"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 bg-dark-300/50 border-t border-slate-700">
          {/* Projects list */}
          {Object.entries(account.projects).length > 0 ? (
            <div className="space-y-2 mb-3">
              {Object.entries(account.projects).map(([projCode, projName]) => (
                <div key={projCode} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 font-mono w-12">{projCode}</span>
                  <span className="text-slate-300">→</span>
                  <span className="text-white">{projName || '(vacío)'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm mb-3">No hay proyectos configurados</p>
          )}

          {/* Add project */}
          <div className="flex gap-2 pt-2 border-t border-slate-700">
            <input
              type="text"
              value={newProjectCode}
              onChange={(e) => setNewProjectCode(e.target.value.toUpperCase())}
              placeholder="Código"
              className="w-20 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Nombre del proyecto en Replicon"
              className="flex-1 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAdd();
              }}
              disabled={!newProjectCode || !newProjectName}
              className="btn btn-primary text-sm py-1"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
