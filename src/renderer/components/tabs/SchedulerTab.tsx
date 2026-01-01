/**
 * Scheduler Tab Component - UI for managing scheduled tasks
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n';

interface ScheduledTask {
  id: string;
  name: string;
  enabled: boolean;
  schedule: {
    type: 'daily' | 'weekly' | 'monthly' | 'once';
    time: string;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    date?: string;
  };
  accountIds: string[];
  lastRun?: string;
  nextRun?: string;
}

export function SchedulerTab() {
  const { t, language } = useTranslation();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<ScheduledTask> | null>(null);

  const DAYS_OF_WEEK = [
    { value: 0, label: t('scheduler.sun') },
    { value: 1, label: t('scheduler.mon') },
    { value: 2, label: t('scheduler.tue') },
    { value: 3, label: t('scheduler.wed') },
    { value: 4, label: t('scheduler.thu') },
    { value: 5, label: t('scheduler.fri') },
    { value: 6, label: t('scheduler.sat') },
  ];

  const loadTasks = useCallback(async () => {
    try {
      const result = await window.electronAPI?.getScheduledTasks?.();
      if (result) {
        setTasks(result);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, []);

  // Load tasks on mount (using setTimeout to avoid sync setState warning)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadTasks();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [loadTasks]);

  const handleCreateTask = () => {
    setEditingTask({
      name: '',
      enabled: true,
      schedule: {
        type: 'daily',
        time: '09:00',
        daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
      },
      accountIds: [],
    });
    setIsEditing(true);
  };

  const handleEditTask = (task: ScheduledTask) => {
    setEditingTask({ ...task });
    setIsEditing(true);
  };

  const handleSaveTask = async () => {
    if (!editingTask) return;

    try {
      if (editingTask.id) {
        await window.electronAPI?.updateScheduledTask?.(editingTask.id, editingTask);
      } else {
        await window.electronAPI?.createScheduledTask?.(editingTask);
      }
      await loadTasks();
      setIsEditing(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm(t('scheduler.confirmDelete'))) return;

    try {
      await window.electronAPI?.deleteScheduledTask?.(id);
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleToggleTask = async (id: string) => {
    try {
      await window.electronAPI?.toggleScheduledTask?.(id);
      await loadTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleRunNow = async (id: string) => {
    try {
      await window.electronAPI?.runScheduledTaskNow?.(id);
    } catch (error) {
      console.error('Error running task:', error);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('scheduler.title')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('scheduler.description')}
          </p>
        </div>
        <button
          onClick={handleCreateTask}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     transition-colors duration-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          {t('scheduler.newTask')}
        </button>
      </div>

      {/* Task List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {tasks.length === 0 ? (
          <div className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {t('scheduler.noTasks')}
            </p>
            <button
              onClick={handleCreateTask}
              className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('scheduler.createFirst')}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
                                  border-2 border-transparent transition-colors duration-200
                                  ${task.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow 
                                    transition duration-200 ${task.enabled ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {task.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {task.schedule.type === 'daily' && `${t('scheduler.dailyAt')} ${task.schedule.time}`}
                        {task.schedule.type === 'weekly' && (
                          <>
                            {task.schedule.daysOfWeek?.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')} 
                            {' '}a las {task.schedule.time}
                          </>
                        )}
                        {task.schedule.type === 'monthly' && `${t('scheduler.monthlyDay').replace('{day}', String(task.schedule.dayOfMonth))} ${task.schedule.time}`}
                        {task.schedule.type === 'once' && `${task.schedule.date} a las ${task.schedule.time}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400 mr-4">
                      <div>{t('scheduler.lastRun')}: {formatDate(task.lastRun)}</div>
                      <div>{t('scheduler.nextRun')}: {formatDate(task.nextRun)}</div>
                    </div>
                    <button
                      onClick={() => handleRunNow(task.id)}
                      className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                      title={t('scheduler.runNow')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title={t('common.edit')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title={t('common.delete')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingTask.id ? t('scheduler.editTask') : t('scheduler.newTask')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t('scheduler.taskName')}
                </label>
                <input
                  type="text"
                  value={editingTask.name || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('scheduler.taskName')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t('scheduler.frequency')}
                </label>
                <select
                  value={editingTask.schedule?.type || 'daily'}
                  onChange={(e) => setEditingTask({
                    ...editingTask,
                    schedule: { ...(editingTask.schedule ?? { time: '09:00' }), type: e.target.value as 'daily' | 'weekly' | 'monthly' | 'once' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">{t('scheduler.daily')}</option>
                  <option value="weekly">{t('scheduler.weekly')}</option>
                  <option value="monthly">{t('scheduler.monthly')}</option>
                  <option value="once">{t('scheduler.once')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t('scheduler.time')}
                </label>
                <input
                  type="time"
                  value={editingTask.schedule?.time || '09:00'}
                  onChange={(e) => setEditingTask({
                    ...editingTask,
                    schedule: { ...(editingTask.schedule ?? { type: 'daily' }), time: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {editingTask.schedule?.type === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t('scheduler.daysOfWeek')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => {
                          const current = editingTask.schedule?.daysOfWeek || [];
                          const updated = current.includes(day.value)
                            ? current.filter(d => d !== day.value)
                            : [...current, day.value];
                          setEditingTask({
                            ...editingTask,
                            schedule: { ...(editingTask.schedule ?? { type: 'weekly', time: '09:00' }), daysOfWeek: updated }
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                    ${editingTask.schedule?.daysOfWeek?.includes(day.value)
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                                    }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {editingTask.schedule?.type === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {t('scheduler.dayOfMonth')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editingTask.schedule?.dayOfMonth || 1}
                    onChange={(e) => setEditingTask({
                      ...editingTask,
                      schedule: { ...(editingTask.schedule ?? { type: 'monthly', time: '09:00' }), dayOfMonth: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {editingTask.schedule?.type === 'once' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {t('scheduler.date')}
                  </label>
                  <input
                    type="date"
                    value={editingTask.schedule?.date || ''}
                    onChange={(e) => setEditingTask({
                      ...editingTask,
                      schedule: { ...(editingTask.schedule ?? { type: 'once', time: '09:00' }), date: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingTask(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 
                           rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
