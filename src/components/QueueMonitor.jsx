import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QueueMonitor = () => {
  const [queueStats, setQueueStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState('');
  const [jobStatus, setJobStatus] = useState(null);
  const [jobType, setJobType] = useState('deduct');

  const fetchQueueStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/balance/queue-stats');
      setQueueStats(response.data.stats);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки статистики очередей');
    } finally {
      setLoading(false);
    }
  };

  const checkJobStatus = async () => {
    if (!jobId.trim()) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/balance/queue-job-status?jobId=${jobId}&type=${jobType}`);
      setJobStatus(response.data.status);
      setError(null);
    } catch (err) {
      setError('Ошибка проверки статуса задачи');
    } finally {
      setLoading(false);
    }
  };

  const cleanOldJobs = async () => {
    try {
      setLoading(true);
      await axios.post('/api/balance/clean-queue');
      await fetchQueueStats(); // Обновляем статистику
      setError(null);
    } catch (err) {
      setError('Ошибка очистки старых задач');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueStats();
    const interval = setInterval(fetchQueueStats, 5000); // Обновляем каждые 5 секунд
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'active': return 'text-blue-600';
      case 'waiting': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Завершено';
      case 'failed': return 'Ошибка';
      case 'active': return 'Выполняется';
      case 'waiting': return 'Ожидает';
      case 'delayed': return 'Отложено';
      default: return status;
    }
  };

  if (loading && !queueStats) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">📊 Мониторинг очередей баланса</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Статистика очередей */}
        {queueStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Списание токенов</h3>
              <div className="space-y-1 text-sm">
                <div>Ожидает: <span className="font-medium">{queueStats.deduct?.waiting || 0}</span></div>
                <div>Выполняется: <span className="font-medium">{queueStats.deduct?.active || 0}</span></div>
                <div>Завершено: <span className="font-medium text-green-600">{queueStats.deduct?.completed || 0}</span></div>
                <div>Ошибки: <span className="font-medium text-red-600">{queueStats.deduct?.failed || 0}</span></div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Пополнение токенов</h3>
              <div className="space-y-1 text-sm">
                <div>Ожидает: <span className="font-medium">{queueStats.add?.waiting || 0}</span></div>
                <div>Выполняется: <span className="font-medium">{queueStats.add?.active || 0}</span></div>
                <div>Завершено: <span className="font-medium text-green-600">{queueStats.add?.completed || 0}</span></div>
                <div>Ошибки: <span className="font-medium text-red-600">{queueStats.add?.failed || 0}</span></div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Общая статистика</h3>
              <div className="space-y-1 text-sm">
                <div>Всего ожидает: <span className="font-medium">{queueStats.total?.waiting || 0}</span></div>
                <div>Всего выполняется: <span className="font-medium">{queueStats.total?.active || 0}</span></div>
                <div>Всего завершено: <span className="font-medium text-green-600">{queueStats.total?.completed || 0}</span></div>
                <div>Всего ошибок: <span className="font-medium text-red-600">{queueStats.total?.failed || 0}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Проверка статуса задачи */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-3">🔍 Проверить статус задачи</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="ID задачи"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="deduct">Списание</option>
              <option value="add">Пополнение</option>
            </select>
            <button
              onClick={checkJobStatus}
              disabled={!jobId.trim() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Проверить
            </button>
          </div>

          {jobStatus && (
            <div className="mt-3 p-3 bg-white rounded border">
              <h4 className="font-medium mb-2">Статус задачи {jobStatus.jobId}</h4>
              <div className="space-y-1 text-sm">
                <div>Статус: <span className={`font-medium ${getStatusColor(jobStatus.status)}`}>
                  {getStatusText(jobStatus.status)}
                </span></div>
                {jobStatus.result && (
                  <>
                    <div>Новый баланс: <span className="font-medium">{jobStatus.result.newBalance}</span></div>
                    <div>Описание: <span className="font-medium">{jobStatus.result.transaction?.description}</span></div>
                  </>
                )}
                {jobStatus.failedReason && (
                  <div>Ошибка: <span className="font-medium text-red-600">{jobStatus.failedReason}</span></div>
                )}
                <div>Прогресс: <span className="font-medium">{jobStatus.progress || 0}%</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Управление */}
        <div className="flex gap-3">
          <button
            onClick={fetchQueueStats}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Обновление...' : 'Обновить'}
          </button>
          <button
            onClick={cleanOldJobs}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Очистить старые задачи
          </button>
        </div>
      </div>
    </div>
  );
};

export default QueueMonitor; 