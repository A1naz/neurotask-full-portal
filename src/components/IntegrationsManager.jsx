import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Calendar, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Loader2, 
  ExternalLink,
  RefreshCw,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const IntegrationsManager = () => {
  const { API_BASE, csrfToken } = useAuth();
  const [integrations, setIntegrations] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Google Calendar Integration State
  const [calendarTokens, setCalendarTokens] = useState({
    clientId: '',
    clientSecret: '',
  });
  const [authStatus, setAuthStatus] = useState(null);
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [calendarError, setCalendarError] = useState('');
  const [calendarSuccess, setCalendarSuccess] = useState('');
  
  // Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [tokensValid, setTokensValid] = useState(false);

  useEffect(() => {
    fetchIntegrations();
    fetchCalendarTokens();
    fetchAuthStatus();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/telegram-bot`, {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Проверяем наличие настроек бота в любом из возможных форматов
        if ((data.success && data.botSettings) || data.botSettings) {
          const integrationsData = data.botSettings.integrations || {};
          setIntegrations(integrationsData);
        } else {
          }
      }
    } catch (error) {
      setError('Не удалось загрузить интеграции');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarTokens = async () => {
    try {
      // Получаем токены из настроек интеграций
      const response = await fetch(`${API_BASE}/api/telegram-bot`, {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Проверяем наличие настроек бота в любом из возможных форматов
        if ((data.success && data.botSettings) || data.botSettings) {
          if (data.botSettings.integrations?.googleCalendar?.settings) {
            const settings = data.botSettings.integrations.googleCalendar.settings;
            const newTokens = {
              clientId: settings.clientId || '',
              clientSecret: settings.clientSecret || ''
            };
            setCalendarTokens(newTokens);
            // Проверяем валидность токенов, если они есть
            if (newTokens.clientId && newTokens.clientSecret) {
              await validateTokens();
            } else {
              setTokensValid(false);
            }
          } else {
            setCalendarTokens({ clientId: '', clientSecret: '' });
            setTokensValid(false);
          }
        } else {
          setCalendarTokens({ clientId: '', clientSecret: '' });
          setTokensValid(false);
        }
      }
    } catch (error) {
      }
  };

  const fetchAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/google-calendar/auth-status`, {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuthStatus(data);
        // Обновляем состояние валидности токенов
        setTokensValid(data.tokensValid || false);
      }
    } catch (error) {
      }
  };

  const saveCalendarTokens = async () => {
    try {
      setCalendarSaving(true);
      setCalendarError('');
      setCalendarSuccess('');

      const response = await fetch(`${API_BASE}/api/telegram-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          botToken: 'keep',
          googleCalendarSettings: {
            clientId: calendarTokens.clientId,
            clientSecret: calendarTokens.clientSecret
          }
        })
      });

             if (response.ok) {
         setCalendarSuccess('Настройки Google Calendar успешно сохранены');
         fetchIntegrations();
         fetchAuthStatus();
         
         // Проверяем валидность токенов после сохранения
         if (calendarTokens.clientId && calendarTokens.clientSecret) {
           await validateTokens();
         } else {
           setTokensValid(false);
         }
         
         // Закрываем модальное окно после успешного сохранения
         setTimeout(() => {
           setShowSettingsModal(false);
         }, 1500);
       } else {
        const data = await response.json();
        setCalendarError(data.message || 'Ошибка сохранения настроек');
      }
    } catch (error) {
      setCalendarError('Ошибка сохранения настроек');
    } finally {
      setCalendarSaving(false);
    }
  };

  const initiateGoogleAuth = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/google-calendar/auth`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          window.open(data.authUrl, '_blank');
        }
      } else {
        const data = await response.json();
        setCalendarError(data.message || 'Ошибка инициализации авторизации');
      }
    } catch (error) {
      setCalendarError('Ошибка инициализации авторизации');
    }
  };

  const toggleGoogleCalendar = async (enabled) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const requestBody = {
        botToken: 'keep',
        googleCalendarEnabled: enabled
      };
      const response = await fetch(`${API_BASE}/api/telegram-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
         const responseData = await response.json();
         if (enabled) {
           setSuccess('Google Calendar включен. Теперь настройте Client ID и Client Secret в настройках.');
         } else {
           setSuccess('Google Calendar отключен');
         }
         await fetchIntegrations();
       } else {
        const data = await response.json();
        setError(data.message || 'Ошибка обновления интеграции');
      }
    } catch (error) {
      setError('Ошибка обновления интеграции');
    } finally {
      setSaving(false);
    }
  };

  const testGoogleCalendarConnection = async () => {
    try {
      setTestingConnection(true);
      setTestResult(null);

      const response = await fetch(`${API_BASE}/api/google-calendar/test`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: data.message || 'Подключение успешно'
        });
      } else {
        const data = await response.json();
        setTestResult({
          success: false,
          message: data.message || 'Ошибка подключения'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Ошибка подключения к серверу'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const validateTokens = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/google-calendar/test`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include'
      });

      if (response.ok) {
        setTokensValid(true);
        setTestResult({
          success: true,
          message: 'Токены валидны'
        });
      } else {
        setTokensValid(false);
        const data = await response.json();
        setTestResult({
          success: false,
          message: data.message || 'Токены невалидны'
        });
      }
    } catch (error) {
      setTokensValid(false);
      setTestResult({
        success: false,
        message: 'Ошибка проверки токенов'
      });
    }
  };

  const resetGoogleCalendarSettings = async () => {
    if (!confirm('Вы уверены, что хотите сбросить все настройки Google Calendar? Это действие нельзя отменить.')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch(`${API_BASE}/api/telegram-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          botToken: 'keep',
          googleCalendarSettings: {
            clientId: '',
            clientSecret: ''
          }
        })
      });

      if (response.ok) {
        setSuccess('Настройки Google Calendar сброшены');
        setTokensValid(false);
        fetchIntegrations();
        fetchCalendarTokens();
        fetchAuthStatus();
      } else {
        const data = await response.json();
        setError(data.message || 'Ошибка сброса настроек');
      }
    } catch (error) {
      setError('Ошибка сброса настроек');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Интеграции</h2>
          <p className="text-gray-600">Управляйте подключенными сервисами и их настройками</p>
        </div>
        <Settings className="h-8 w-8 text-blue-600" />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Google Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            Подключение к Google Calendar для управления событиями и задачами
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
                     {/* Integration Status */}
           <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50">
             <div className="flex items-center gap-3">
               <Calendar className="h-5 w-5 text-blue-600" />
                               <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-sm text-gray-600">
                    {integrations.googleCalendar?.enabled 
                      ? (calendarTokens.clientId && calendarTokens.clientSecret 
                          ? (tokensValid ? "Включен и настроен" : "Включен, токены невалидны")
                          : "Включен, требуется настройка")
                      : "Отключен"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant={
                    integrations.googleCalendar?.enabled 
                      ? (calendarTokens.clientId && calendarTokens.clientSecret && tokensValid ? "default" : "secondary")
                      : "secondary"
                  }
                  className={
                    integrations.googleCalendar?.enabled && calendarTokens.clientId && calendarTokens.clientSecret && tokensValid
                      ? "bg-green-100 text-green-800 border-green-200"
                      : ""
                  }
                >
                  {integrations.googleCalendar?.enabled 
                    ? (calendarTokens.clientId && calendarTokens.clientSecret 
                        ? (tokensValid ? "Активна" : "Требуется проверка")
                        : "Требуется настройка")
                    : "Неактивна"}
                </Badge>
               <Switch
                 checked={integrations.googleCalendar?.enabled || false}
                 onCheckedChange={(checked) => {
                   toggleGoogleCalendar(checked);
                 }}
                 disabled={saving}
               />
             </div>
           </div>

                       {/* Integration Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowSettingsModal(true)}
                disabled={!integrations.googleCalendar?.enabled}
              >
                <Settings className="h-4 w-4 mr-2" />
                Настройки
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={testGoogleCalendarConnection}
                disabled={testingConnection || !integrations.googleCalendar?.enabled || !calendarTokens.clientId || !calendarTokens.clientSecret || !tokensValid}
              >
                {testingConnection ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {testingConnection ? 'Тестирование...' : 'Тест'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={resetGoogleCalendarSettings}
                disabled={saving || !integrations.googleCalendar?.enabled}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Сброс
              </Button>
            </div>

           {/* Test Result */}
           {testResult && (
             <Alert variant={testResult.success ? "default" : "destructive"}>
               {testResult.success ? (
                 <CheckCircle2 className="h-4 w-4" />
               ) : (
                 <AlertCircle className="h-4 w-4" />
               )}
               <AlertDescription>{testResult.message}</AlertDescription>
             </Alert>
           )}

                     {/* Configuration Section */}
           {integrations.googleCalendar?.enabled && (
             <div className="space-y-4">
               <Separator />
               
               {calendarError && (
                 <Alert variant="destructive">
                   <AlertTriangle className="h-4 w-4" />
                   <AlertDescription>{calendarError}</AlertDescription>
                 </Alert>
               )}

               {calendarSuccess && (
                 <Alert>
                   <CheckCircle2 className="h-4 w-4" />
                   <AlertDescription>{calendarSuccess}</AlertDescription>
                 </Alert>
               )}

                               {/* Status Info */}
                <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Статус интеграции:</span>
                    <Badge 
                      variant={calendarTokens.clientId && calendarTokens.clientSecret && tokensValid ? "default" : "secondary"}
                      className={
                        calendarTokens.clientId && calendarTokens.clientSecret && tokensValid
                          ? "bg-green-100 text-green-800 border-green-200"
                          : ""
                      }
                    >
                      {calendarTokens.clientId && calendarTokens.clientSecret 
                        ? (tokensValid ? "Настроена" : "Требуется проверка")
                        : "Требуется настройка"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {calendarTokens.clientId && calendarTokens.clientSecret 
                      ? (tokensValid 
                          ? "Google Calendar полностью настроен и готов к работе"
                          : "Токены введены, но требуется проверка валидности")
                      : "Введите Client ID и Client Secret в настройках для активации"}
                  </p>
                </div>

               {authStatus && (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium text-gray-600">Статус авторизации:</span>
                     <Badge variant={authStatus.isAuthorized ? "default" : "secondary"}>
                       {authStatus.isAuthorized ? "Авторизован" : "Не авторизован"}
                     </Badge>
                   </div>

                   <Button 
                     onClick={fetchAuthStatus}
                     variant="outline"
                     className="w-full"
                   >
                     <RefreshCw className="mr-2 h-4 w-4" />
                     Обновить статус
                   </Button>
                 </div>
               )}
             </div>
           )}
        </CardContent>
      </Card>

             {/* Future Integrations Placeholder */}
       <Card className="border-dashed border-gray-300">
         <CardContent className="p-6">
           <div className="text-center">
             <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
             <h3 className="text-lg font-medium text-gray-900 mb-1">Добавить интеграцию</h3>
             <p className="text-sm text-gray-600">
               Новые интеграции появятся здесь в будущих обновлениях
             </p>
           </div>
         </CardContent>
       </Card>

       {/* Settings Modal */}
       <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Calendar className="h-5 w-5" />
               Настройки Google Calendar
             </DialogTitle>
             <DialogDescription>
               Настройте параметры подключения к Google Calendar
             </DialogDescription>
           </DialogHeader>
           
                       <div className="space-y-6">
              {/* Google Calendar Credentials */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="modalClientId">Google Client ID</Label>
                  <Input
                    id="modalClientId"
                    placeholder="Введите Google Client ID"
                    value={calendarTokens.clientId}
                    onChange={(e) => setCalendarTokens({
                      ...calendarTokens,
                      clientId: e.target.value
                    })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Client ID из Google Cloud Console
                  </p>
                </div>

                <div>
                  <Label htmlFor="modalClientSecret">Google Client Secret</Label>
                  <Input
                    id="modalClientSecret"
                    type="password"
                    placeholder="Введите Google Client Secret"
                    value={calendarTokens.clientSecret}
                    onChange={(e) => setCalendarTokens({
                      ...calendarTokens,
                      clientSecret: e.target.value
                    })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Client Secret из Google Cloud Console
                  </p>
                </div>

                <Button 
                  onClick={saveCalendarTokens}
                  disabled={calendarSaving}
                  className="w-full"
                >
                  {calendarSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить токены'
                  )}
                </Button>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4">
                <Separator />
                <h4 className="font-medium text-gray-900">Дополнительные настройки</h4>
                
                <div>
                  <Label htmlFor="calendarId">ID Календаря</Label>
                  <Input
                    id="calendarId"
                    placeholder="primary"
                    defaultValue="primary"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ID календаря для синхронизации (по умолчанию: primary)
                  </p>
                </div>

                <div>
                  <Label htmlFor="timezone">Часовой пояс</Label>
                  <Input
                    id="timezone"
                    placeholder="Europe/Moscow"
                    defaultValue="Europe/Moscow"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Часовой пояс для событий
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="notifications" defaultChecked />
                  <Label htmlFor="notifications">Уведомления о событиях</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="autoSync" defaultChecked />
                  <Label htmlFor="autoSync">Автоматическая синхронизация</Label>
                </div>
              </div>

              {/* Auth Status in Modal */}
              {authStatus && (
                <div className="space-y-4">
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Статус авторизации:</span>
                      <Badge variant={authStatus.isAuthorized ? "default" : "secondary"}>
                        {authStatus.isAuthorized ? "Авторизован" : "Не авторизован"}
                      </Badge>
                    </div>

                    {!authStatus.isAuthorized && calendarTokens.clientId && calendarTokens.clientSecret && (
                      <Button onClick={initiateGoogleAuth} className="w-full">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Авторизоваться в Google
                      </Button>
                    )}

                    <Button 
                      onClick={fetchAuthStatus}
                      variant="outline"
                      className="w-full"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Обновить статус
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => setShowSettingsModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button
                  onClick={() => {
                    // Здесь можно добавить логику сохранения дополнительных настроек
                    setShowSettingsModal(false);
                    setSuccess('Настройки сохранены');
                  }}
                  className="flex-1"
                >
                  Сохранить
                </Button>
              </div>
            </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 };

export default IntegrationsManager; 