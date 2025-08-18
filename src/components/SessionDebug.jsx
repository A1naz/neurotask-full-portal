import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const SessionDebug = () => {
  const { API_BASE } = useAuth();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);

  // Инициализация без запросов к API
  useEffect(() => {
    showCurrentCookies();
  }, []);

  // Показываем только текущие куки без запросов к API
  const showCurrentCookies = () => {
    setSessionInfo({
      ping: {
        status: 'Not checked',
        ok: false,
        data: null
      },
      session: {
        status: 'Not checked',
        ok: false,
        data: null
      },
      cookies: document.cookie,
      timestamp: new Date().toISOString()
    });
  };

  const checkPingOnly = async () => {
    setLoading(true);
    
    try {
      const pingResponse = await fetch(`${API_BASE}/api/ping`, {
        credentials: 'include',
      });

      const info = {
        ping: {
          status: pingResponse.status,
          ok: pingResponse.ok,
          data: await pingResponse.json().catch(() => null)
        },
        session: {
          status: 'Not checked',
          ok: false,
          data: null
        },
        cookies: document.cookie,
        timestamp: new Date().toISOString()
      };

      setSessionInfo(info);
    } catch (error) {
      setSessionInfo({
        error: error.message,
        cookies: document.cookie,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    setLoading(true);
    
    try {
      const pingResponse = await fetch(`${API_BASE}/api/ping`, {
        credentials: 'include',
      });
      
      const sessionResponse = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: 'include',
      });

      const info = {
        ping: {
          status: pingResponse.status,
          ok: pingResponse.ok,
          data: await pingResponse.json().catch(() => null)
        },
        session: {
          status: sessionResponse.status,
          ok: sessionResponse.ok,
          data: await sessionResponse.json().catch(() => null)
        },
        cookies: document.cookie,
        timestamp: new Date().toISOString()
      };

      setSessionInfo(info);
    } catch (error) {
      setSessionInfo({
        error: error.message,
        cookies: document.cookie,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setTestResults(null);

    const results = [];

    try {
      // Тест 1: Попытка входа
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password'
        }),
      });

      const loginData = await loginResponse.json();
      
      results.push({
        name: 'Login Test',
        status: loginResponse.status,
        ok: loginResponse.ok,
        data: loginData,
        cookies: document.cookie
      });

      // Тест 2: Проверка сессии после входа
      if (loginResponse.ok) {
        const sessionResponse = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: 'include',
        });

        const sessionData = await sessionResponse.json();
        
        results.push({
          name: 'Session Check After Login',
          status: sessionResponse.status,
          ok: sessionResponse.ok,
          data: sessionData,
          cookies: document.cookie
        });
      }

      // Тест 3: Выход
      const logoutResponse = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      const logoutData = await logoutResponse.json();
      
      results.push({
        name: 'Logout Test',
        status: logoutResponse.status,
        ok: logoutResponse.ok,
        data: logoutData,
        cookies: document.cookie
      });

      // Тест 4: Проверка сессии после выхода
      const finalSessionResponse = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: 'include',
      });

      const finalSessionData = await finalSessionResponse.json().catch(() => ({ error: 'Failed to parse' }));
      
      results.push({
        name: 'Session Check After Logout',
        status: finalSessionResponse.status,
        ok: finalSessionResponse.ok,
        data: finalSessionData,
        cookies: document.cookie
      });

    } catch (error) {
      results.push({
        name: 'Error',
        status: 'ERROR',
        ok: false,
        error: error.message,
        cookies: document.cookie
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  const clearCookies = () => {
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    setSessionInfo(null);
    setTestResults(null);
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Диагностика сессий и куки
          <Badge variant="outline">Session Debug</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>✅ Безопасный режим:</strong> Этот компонент НЕ делает автоматических запросов к API. 
            Все проверки выполняются только по нажатию кнопок.
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button onClick={showCurrentCookies} variant="outline">
            Показать текущие куки
          </Button>
          <Button onClick={checkPingOnly} disabled={loading} variant="outline">
            {loading ? 'Проверка...' : 'Проверить подключение'}
          </Button>
          <Button onClick={checkSession} disabled={loading} variant="outline">
            {loading ? 'Проверка...' : 'Проверить авторизацию'}
          </Button>
          <Button onClick={testLogin} disabled={loading} variant="outline">
            {loading ? 'Тестирование...' : 'Тест входа/выхода'}
          </Button>
          <Button onClick={clearCookies} variant="destructive">
            Очистить куки
          </Button>
        </div>

        {sessionInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Ping Test:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Статус:</strong> {sessionInfo.ping?.status || 'N/A'}</p>
                  <p><strong>Успешно:</strong> {sessionInfo.ping?.ok ? 'Да' : 'Нет'}</p>
                  {sessionInfo.ping?.data && (
                    <p><strong>Данные:</strong> {JSON.stringify(sessionInfo.ping.data)}</p>
                  )}
                  {sessionInfo.ping?.status === 'Not checked' && (
                    <p className="text-gray-500 italic">Нажмите "Проверить подключение" для проверки</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Session Test:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Статус:</strong> {sessionInfo.session?.status || 'N/A'}</p>
                  <p><strong>Успешно:</strong> {sessionInfo.session?.ok ? 'Да' : 'Нет'}</p>
                  {sessionInfo.session?.data && (
                    <p><strong>Данные:</strong> {JSON.stringify(sessionInfo.session.data)}</p>
                  )}
                  {sessionInfo.session?.status === 'Not checked' && (
                    <p className="text-gray-500 italic">Нажмите "Проверить авторизацию" для проверки</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Куки:</h4>
              <div className="bg-muted p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                {sessionInfo.cookies || 'Куки отсутствуют'}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Время проверки:</h4>
              <p className="text-sm">{sessionInfo.timestamp}</p>
            </div>
          </div>
        )}

        {testResults && (
          <div className="space-y-4">
            <h4 className="font-semibold">Результаты тестов:</h4>
            <div className="space-y-2">
              {testResults.map((test, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{test.name}</span>
                    <span className={`font-semibold ${getStatusColor(test)}`}>
                      {getStatusText(test)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p><strong>Статус:</strong> {test.status}</p>
                    {test.data && (
                      <p><strong>Данные:</strong> {JSON.stringify(test.data)}</p>
                    )}
                    {test.error && (
                      <p className="text-red-600"><strong>Ошибка:</strong> {test.error}</p>
                    )}
                    <p><strong>Куки после теста:</strong></p>
                    <div className="bg-muted p-1 rounded text-xs font-mono max-h-20 overflow-y-auto">
                      {test.cookies || 'Куки отсутствуют'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Ожидаемое поведение:</h4>
          <ul className="text-sm space-y-1">
            <li>• <strong>Ping:</strong> Должен возвращать статус 200</li>
            <li>• <strong>Login:</strong> Должен устанавливать куки и возвращать пользователя</li>
            <li>• <strong>Session Check:</strong> Должен возвращать пользователя после входа</li>
            <li>• <strong>Logout:</strong> Должен очищать куки</li>
            <li>• <strong>Куки:</strong> Должны содержать connect.sid</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionDebug; 