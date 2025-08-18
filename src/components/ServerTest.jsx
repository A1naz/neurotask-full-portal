import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const ServerTest = () => {
  const { API_BASE } = useAuth();
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const testServerConnection = async () => {
    setLoading(true);
    setTestResults(null);

    const results = {
      apiBase: API_BASE,
      tests: []
    };

    // Test 1: Basic connectivity
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      results.tests.push({
        name: 'Basic connectivity to /auth/me',
        status: response.status,
        ok: response.ok,
        error: null
      });
    } catch (error) {
      results.tests.push({
        name: 'Basic connectivity to /auth/me',
        status: 'ERROR',
        ok: false,
        error: error.message
      });
    }

    // Test 2: CORS preflight
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'OPTIONS',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      results.tests.push({
        name: 'CORS preflight check',
        status: response.status,
        ok: response.ok,
        error: null
      });
    } catch (error) {
      results.tests.push({
        name: 'CORS preflight check',
        status: 'ERROR',
        ok: false,
        error: error.message
      });
    }

    // Test 3: Simple ping endpoint (if exists)
    try {
      const response = await fetch(`${API_BASE}/api/ping`, {
        method: 'GET',
        credentials: 'include',
      });
      
      results.tests.push({
        name: 'Ping endpoint',
        status: response.status,
        ok: response.ok,
        error: null
      });
    } catch (error) {
      results.tests.push({
        name: 'Ping endpoint',
        status: 'ERROR',
        ok: false,
        error: error.message
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  const getStatusColor = (test) => {
    if (test.error) return 'text-red-600';
    if (test.ok) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getStatusText = (test) => {
    if (test.error) return 'Ошибка';
    if (test.ok) return 'Успешно';
    return `Статус: ${test.status}`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔌 Тест подключения к серверу
          <Badge variant="outline">Server Test</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testServerConnection} disabled={loading} variant="outline">
            {loading ? 'Тестирование...' : 'Тестировать подключение'}
          </Button>
        </div>

        {testResults && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">API Base URL:</h4>
              <code className="text-sm bg-gray-100 p-2 rounded block">
                {testResults.apiBase}
              </code>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Результаты тестов:</h4>
              <div className="space-y-2">
                {testResults.tests.map((test, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{test.name}</span>
                      <span className={`font-semibold ${getStatusColor(test)}`}>
                        {getStatusText(test)}
                      </span>
                    </div>
                    {test.error && (
                      <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                        {test.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Возможные решения:</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Сервер не запущен:</strong> Запустите сервер на порту 3001</li>
                <li>• <strong>CORS проблема:</strong> Настройте CORS на сервере</li>
                <li>• <strong>Неправильный URL:</strong> Проверьте API_BASE в AuthContext</li>
                <li>• <strong>Сетевые проблемы:</strong> Проверьте файрвол и настройки сети</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServerTest; 