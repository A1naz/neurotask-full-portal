import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  Key, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const CalendarIntegration = () => {
  const [tokens, setTokens] = useState({
    googleClientId: '',
    googleClientSecret: '',
  });
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { API_BASE } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTokens();
    fetchAuthStatus();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dashboard/tokens`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTokens({
          googleClientId: data.tokens.googleClientId || '',
          googleClientSecret: data.tokens.googleClientSecret || '',
        });
      }
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const fetchAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/calendar/auth/status`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAuthStatus(data);
      }
    } catch (error) {
      }
  };

  const handleTokenChange = (e) => {
    setTokens({
      ...tokens,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSaveTokens = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/dashboard/tokens`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleClientId: tokens.googleClientId,
          googleClientSecret: tokens.googleClientSecret,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Настройки Google Calendar сохранены');
        fetchAuthStatus();
      } else {
        setError(data.message || 'Ошибка сохранения настроек');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/calendar/auth/url`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data.authUrl, '_blank', 'width=500,height=600');
        
        // Poll for auth completion
        const pollInterval = setInterval(async () => {
          await fetchAuthStatus();
          if (authStatus?.isAuthenticated) {
            clearInterval(pollInterval);
            setSuccess('Google Calendar успешно подключен!');
          }
        }, 2000);

        // Stop polling after 5 minutes
        setTimeout(() => clearInterval(pollInterval), 300000);
      } else {
        const data = await response.json();
        setError(data.message || 'Ошибка получения URL авторизации');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    }
  };

  const handleClearTokens = async (tokenType) => {
    if (!confirm(`Вы уверены, что хотите удалить настройки ${tokenType === 'google' ? 'Google Calendar' : tokenType}?`)) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/dashboard/tokens/googleClientId`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setTokens({
          googleClientId: '',
          googleClientSecret: '',
        });
        setAuthStatus(null);
        setSuccess('Настройки Google Calendar удалены');
      } else {
        const data = await response.json();
        setError(data.message || 'Ошибка удаления настроек');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setSaving(false);
    }
  };

  // Тестирование создания события
  const testCreateEvent = async () => {
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 час
      
      const response = await fetch(`${API_BASE}/api/calendar/events`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: 'Тестовое событие',
          description: 'Событие создано для тестирования интеграции',
          startTime: now.toISOString(),
          endTime: endTime.toISOString(),
          timeZone: 'Europe/Moscow'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Тестовое событие успешно создано в календаре!');
      } else {
        setError(data.message || 'Ошибка создания тестового события');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    }
  };

  // Получение событий календаря
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const now = new Date();
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const response = await fetch(`${API_BASE}/api/calendar/events?timeMin=${now.toISOString()}&timeMax=${weekLater.toISOString()}&maxResults=10`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        const data = await response.json();
        setError(data.message || 'Ошибка получения событий');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoadingEvents(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <Calendar className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">Интеграция календаря</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Статус подключения
              </CardTitle>
              <CardDescription>
                Текущее состояние интеграции с Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {authStatus?.isAuthenticated ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500 mr-3" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                  )}
                  <div>
                    <p className="font-medium">
                      {authStatus?.isAuthenticated ? 'Google Calendar подключен' : 'Google Calendar не настроен'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {authStatus?.isAuthenticated 
                        ? 'Бот может создавать и читать события календаря'
                        : 'Требуется настройка для работы с календарем'
                      }
                    </p>
                  </div>
                </div>
                <Badge variant={authStatus?.isAuthenticated ? "default" : "secondary"}>
                  {authStatus?.isAuthenticated ? "Активен" : "Неактивен"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Google API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Настройки Google API
              </CardTitle>
              <CardDescription>
                Введите данные вашего Google Cloud проекта
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="googleClientId">Google Client ID</Label>
                  <Input
                    id="googleClientId"
                    name="googleClientId"
                    type="text"
                    placeholder="123456789-abcdef.apps.googleusercontent.com"
                    value={tokens.googleClientId}
                    onChange={handleTokenChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleClientSecret">Google Client Secret</Label>
                  <Input
                    id="googleClientSecret"
                    name="googleClientSecret"
                    type="password"
                    placeholder="GOCSPX-abcdefghijklmnopqrstuvwx"
                    value={tokens.googleClientSecret}
                    onChange={handleTokenChange}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleSaveTokens}
                  disabled={saving || !tokens.googleClientId || !tokens.googleClientSecret}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить настройки'
                  )}
                </Button>

                {(tokens.googleClientId || tokens.googleClientSecret) && (
                  <Button
                    variant="outline"
                    onClick={() => handleClearTokens('google')}
                    disabled={saving}
                  >
                    Удалить настройки
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Authorization */}
          {tokens.googleClientId && tokens.googleClientSecret && (
            <Card>
              <CardHeader>
                <CardTitle>Авторизация Google Calendar</CardTitle>
                <CardDescription>
                  Подключите ваш Google аккаунт для доступа к календарю
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Статус авторизации</p>
                    <p className="text-sm text-gray-600">
                      {authStatus?.isAuthenticated 
                        ? 'Авторизация выполнена успешно'
                        : 'Требуется авторизация Google аккаунта'
                      }
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={fetchAuthStatus}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleGoogleAuth}
                      disabled={authStatus?.isAuthenticated}
                    >
                      {authStatus?.isAuthenticated ? 'Подключено' : 'Подключить Google Calendar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Calendar Functions */}
          {authStatus?.isAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle>Тестирование функций календаря</CardTitle>
                <CardDescription>
                  Проверьте работу интеграции с Google Calendar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    onClick={testCreateEvent}
                    disabled={saving}
                    variant="outline"
                  >
                    Создать тестовое событие
                  </Button>
                  <Button
                    onClick={fetchEvents}
                    disabled={loadingEvents}
                    variant="outline"
                  >
                    {loadingEvents ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      'Получить события'
                    )}
                  </Button>
                </div>

                {events.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">События на ближайшую неделю:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {events.map((event, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="font-medium">{event.summary}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(event.start.dateTime || event.start.date).toLocaleString('ru-RU')} - 
                            {new Date(event.end.dateTime || event.end.date).toLocaleString('ru-RU')}
                          </div>
                          {event.description && (
                            <div className="text-sm text-gray-500 mt-1">{event.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Инструкции по настройке</CardTitle>
              <CardDescription>
                Пошаговое руководство по настройке Google Calendar API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">1. Создание проекта в Google Cloud Console</h4>
                  <p className="text-sm text-gray-600">
                    Перейдите в Google Cloud Console и создайте новый проект или выберите существующий.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">2. Включение Google Calendar API</h4>
                  <p className="text-sm text-gray-600">
                    В разделе "APIs & Services" найдите и включите Google Calendar API.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">3. Создание OAuth 2.0 учетных данных</h4>
                  <p className="text-sm text-gray-600">
                    Создайте OAuth 2.0 Client ID в разделе "Credentials". Добавьте ваш домен в список разрешенных.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">4. Настройка Redirect URI</h4>
                  <p className="text-sm text-gray-600">
                    Добавьте следующий URL в список разрешенных redirect URI:
                  </p>
                  <code className="block bg-muted p-2 rounded text-sm">
                    {window.location.origin}/api/calendar/auth/callback
                  </code>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Открыть Google Cloud Console
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CalendarIntegration;

