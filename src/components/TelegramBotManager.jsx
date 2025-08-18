import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Bot, Settings, Trash2, Play, Square, CheckCircle, AlertCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const TelegramBotManager = () => {
  const { API_BASE, csrfToken } = useAuth();
  const [botSettings, setBotSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [aiProviders, setAiProviders] = useState([]);
  const [formData, setFormData] = useState({
    botToken: '',
    aiProvider: 'openai',
    contextEnabled: true,
    contextLimit: 30,
    companyName: 'Neurotask'
  });
  const [botStatus, setBotStatus] = useState(null);
  const [validatingToken, setValidatingToken] = useState(false);
  const [tokenValidation, setTokenValidation] = useState(null);

  // Загрузка настроек бота
  const fetchBotSettings = useCallback(async () => {
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
        if (data.success && data.botSettings) {
          setBotSettings(data.botSettings);
          setFormData({
            botToken: '', // Не показываем токен в форме
            aiProvider: data.botSettings.aiProvider,
            contextEnabled: data.botSettings.contextEnabled !== undefined ? data.botSettings.contextEnabled : true,
            contextLimit: data.botSettings.contextLimit || 30,
            companyName: data.botSettings.companyName || 'Neurotask'
          });
        } else if (data.botSettings) {
          console.log('🔍 Bot settings loaded:', {
            messageCount: data.botSettings.messageCount,
            activatedAt: data.botSettings.activatedAt,
            lastActivity: data.botSettings.lastActivity,
            isActive: data.botSettings.isActive
          });
          setBotSettings(data.botSettings);
          setFormData({
            botToken: '',
            aiProvider: data.botSettings.aiProvider,
            contextEnabled: data.botSettings.contextEnabled !== undefined ? data.botSettings.contextEnabled : true,
            contextLimit: data.botSettings.contextLimit || 30,
            companyName: data.botSettings.companyName || 'Neurotask'
          });
        } else {
          setBotSettings(null);
        }
      }
    } catch (error) {
      setError('Не удалось загрузить настройки бота');
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  // Загрузка доступных AI провайдеров
  const fetchAiProviders = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/telegram-bot/ai-providers`, {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Получаем активные провайдеры из любого доступного поля
        const providers = data.aiProviders || data.providers || [];
        setAiProviders(providers);
      } else {
        setError('Не удалось загрузить AI провайдеры');
      }
    } catch (error) {
      setError('Ошибка загрузки AI провайдеров');
    }
  }, [API_BASE]);

  // Валидация токена бота
  const validateBotToken = useCallback(async (token) => {
    if (!token) return;
    
    setValidatingToken(true);
    setTokenValidation(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/telegram-bot/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ botToken: token })
      });

      const data = await response.json();
      
      if (response.ok) {
        setTokenValidation({
          valid: true,
          message: data.message,
          botInfo: data.botInfo
        });
      } else {
        setTokenValidation({
          valid: false,
          message: data.message,
          error: data.error
        });
      }
    } catch (error) {
      setTokenValidation({
        valid: false,
        message: 'Ошибка подключения к серверу',
        error: error.message
      });
    } finally {
      setValidatingToken(false);
    }
  }, [API_BASE]);

  // Получение статуса ботов
  const fetchBotStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/telegram-bot/status`, {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setBotStatus(data);
      } else {
        const errorData = await response.json();
        }
    } catch (error) {
      }
  };

  // Получение статистики бота для вкладки "Обзор"
  const fetchBotStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/telegram-bot/stats`, {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Обновляем botSettings с полученной статистикой
        if (data.success && botSettings) {
          setBotSettings(prev => ({
            ...prev,
            messageCount: data.messageCount,
            activatedAt: data.activatedAt,
            lastActivity: data.lastActivity
          }));
        }
      } else {
        const errorData = await response.json();
        }
    } catch (error) {
      }
  };

  // Валидация токена при изменении
  useEffect(() => {
    if (formData.botToken) {
      validateBotToken(formData.botToken);
    }
  }, [formData.botToken, validateBotToken]);

  useEffect(() => {
    fetchBotSettings();
    fetchAiProviders();
  }, []); // Убираем зависимости, чтобы избежать циклических вызовов

  // Убираем циклический useEffect - статистика будет загружаться вместе с настройками
  // useEffect(() => {
  //   if (botSettings) {
  //     //     //     fetchBotStats();
  //   }
  // }, [botSettings]);

  // Сохранение настроек бота
  const saveBotSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Определяем, нужно ли отправлять токен
      const dataToSend = { ...formData };
      
      if (botSettings) {
        // Если бот уже существует, отправляем 'keep' для сохранения текущего токена
        dataToSend.botToken = 'keep';
        } else {
        // Если это новый бот, проверяем что токен передан
        if (!formData.botToken || formData.botToken.trim() === '') {
          setError('Для создания нового бота токен обязателен');
          setSaving(false);
          return;
        }
        }

      const response = await fetch(`${API_BASE}/api/telegram-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        await fetchBotSettings();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Не удалось сохранить настройки бота');
    } finally {
      setSaving(false);
    }
  };

  // Активация/деактивация бота
  const toggleBot = async (isActive) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const response = await fetch(`${API_BASE}/api/telegram-bot/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ isActive })
      });

      const data = await response.json();

      if (response.ok) {
        setError('');
        setSuccess(data.message);
        await fetchBotSettings();
      } else {
        setSuccess('');
        setError(data.message || 'Не удалось переключить бота');
      }
    } catch (error) {
      setSuccess('');
      setError('Ошибка сети при переключении статуса бота');
    } finally {
      setSaving(false);
    }
  };

  // Удаление настроек бота
  const deleteBotSettings = async () => {
    if (!confirm('Вы уверены, что хотите удалить настройки бота? Это действие нельзя отменить.')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const response = await fetch(`${API_BASE}/api/telegram-bot`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setBotSettings(null);
        setFormData({
          botToken: '',
          aiProvider: 'openai'
        });
      } else {
        setError(data.message || 'Не удалось удалить настройки бота');
      }
    } catch (error) {
      setError('Ошибка сети при удалении настроек бота');
    } finally {
      setSaving(false);
    }
  };

  // Функция для переключения контекста
  const toggleContext = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const newContextEnabled = !botSettings.contextEnabled;
      const response = await fetch(`${API_BASE}/api/telegram-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          botToken: 'keep', // Специальное значение для сохранения существующего токена
          aiProvider: botSettings.aiProvider,
          contextEnabled: newContextEnabled,
          contextLimit: botSettings.contextLimit,
          companyName: botSettings.companyName || 'Neurotask'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setBotSettings(data.botSettings);
        setSuccess(`Контекст чата ${data.botSettings.contextEnabled ? 'включен' : 'отключен'}`);
      } else {
        const data = await response.json();
        setError(data.message || 'Ошибка при изменении настроек контекста');
      }
    } catch (error) {
      setError('Ошибка сети при изменении настроек контекста');
    } finally {
      setSaving(false);
    }
  };

  // Функция для очистки контекста
  const clearContext = async () => {
    if (!confirm('Вы уверены, что хотите очистить весь контекст чата? Это действие нельзя отменить.')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const response = await fetch(`${API_BASE}/api/telegram-bot/context/all`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || 'Контекст чата успешно очищен');
        // Обновляем настройки бота
        await fetchBotSettings();
      } else {
        const data = await response.json();
        setError(data.message || 'Ошибка при очистке контекста');
      }
    } catch (error) {
      setError('Ошибка сети при очистке контекста');
    } finally {
      setSaving(false);
    }
  };

  // Обновление названия компании
  const updateCompanyName = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const response = await fetch(`${API_BASE}/api/telegram-bot/company-name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ companyName: formData.companyName })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Название компании обновлено');
        setTimeout(() => setSuccess(''), 3000);
        // Обновляем настройки бота
        await fetchBotSettings();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Не удалось обновить название компании');
      }
    } catch (error) {
      setError('Ошибка сети при обновлении названия компании');
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
           <h2 className="text-2xl font-bold text-gray-900">Управление Telegram Ботом</h2>
           <p className="text-gray-600">Настройка и управление вашим AI-ассистентом в Telegram</p>
         </div>
         <Bot className="h-8 w-8 text-blue-600" />
       </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {botSettings ? (
        // Существующие настройки бота
        <div className="space-y-6">
          <Card>
            <CardHeader>
                             <CardTitle className="flex items-center gap-2">
                 <Bot className="h-5 w-5" />
                 Статус Бота
               </CardTitle>
               <CardDescription>
                 Текущая конфигурация и статус бота
               </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                             <div className="flex items-center justify-between">
                 <div>
                   <p className="font-medium">Статус Бота</p>
                   <p className="text-sm text-gray-600">Telegram Бот</p>
                 </div>
                 <Badge variant={botSettings.isActive ? "default" : "secondary"}>
                   {botSettings.isActive ? "Активен" : "Неактивен"}
                 </Badge>
               </div>

              <div className="flex items-center justify-between">
                                 <div>
                   <p className="font-medium">AI Провайдер</p>
                   <p className="text-sm text-gray-600">{botSettings.aiProvider}</p>
                 </div>
                 <Badge variant="outline">{botSettings.aiProvider}</Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Название компании</p>
                    <p className="text-sm text-gray-600">
                      {botSettings.companyName || 'Neurotask'}
                    </p>
                  </div>
                  <Badge variant="outline">{botSettings.companyName || 'Neurotask'}</Badge>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Название вашей компании</Label>
                    <div className="flex gap-2">
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="Введите название компании"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="flex-1"
                      />
                      <Button
                        onClick={updateCompanyName}
                        disabled={saving || !formData.companyName.trim()}
                        size="sm"
                      >
                        {saving ? 'Сохранение...' : 'Сохранить'}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Это название будет использоваться в системном промпте бота для персонализации ответов
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Контекст чата</p>
                    <p className="text-sm text-gray-600">
                      {botSettings.contextEnabled ? `Включен (лимит: ${botSettings.contextLimit || 30})` : "Отключен"}
                    </p>
                  </div>
                  <Badge variant={botSettings.contextEnabled ? "default" : "secondary"}>
                    {botSettings.contextEnabled ? "Включен" : "Отключен"}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={toggleContext}
                    disabled={saving}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {botSettings.contextEnabled ? 'Отключить контекст' : 'Включить контекст'}
                  </Button>
                  <Button
                    onClick={clearContext}
                    disabled={saving}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Очистить контекст
                  </Button>
                </div>

                {/* Настройка лимита контекста */}
                {botSettings.contextEnabled && (
                  <div className="space-y-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="contextLimit">Лимит сообщений в контексте</Label>
                        <span className="text-sm font-medium text-gray-700">
                          {botSettings.contextLimit || 30} сообщений
                        </span>
                      </div>
                      <Slider
                        id="contextLimit"
                        min={5}
                        max={30}
                        step={1}
                        value={[botSettings.contextLimit || 30]}
                        onValueChange={(value) => {
                          // Обновляем настройки бота
                          const newContextLimit = value[0];
                          setBotSettings({ ...botSettings, contextLimit: newContextLimit });
                          
                          // Сохраняем в базу данных
                          fetch(`${API_BASE}/api/telegram-bot`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'X-CSRF-Token': csrfToken,
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                              botToken: 'keep',
                              aiProvider: botSettings.aiProvider,
                              contextEnabled: botSettings.contextEnabled,
                              contextLimit: newContextLimit,
                              companyName: botSettings.companyName || 'Neurotask'
                            })
                          }).then(async response => {
                            if (response.ok) {
                              } else {
                              const errorData = await response.json();
                              setError(`Ошибка обновления лимита контекста: ${errorData.message || 'Неизвестная ошибка'}`);
                            }
                          }).catch(error => {
                            setError('Ошибка сети при обновлении лимита контекста');
                          });
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>5</span>
                        <span>30</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Максимальное количество сообщений для сохранения в контексте (5-30)
                    </p>
                  </div>
                )}
              </div>

              {/* Статистика бота */}
              <div className="space-y-3">
                {/* Заголовок статистики */}
                <h3 className="text-lg font-semibold">Статистика бота</h3>

                {/* Количество сообщений */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Количество сообщений</p>
                    <p className="text-sm text-gray-600">Всего обработано</p>
                  </div>
                  <Badge variant="outline" className="text-lg font-semibold">
                    {botSettings?.messageCount || 0}
                  </Badge>
                </div>

                {/* Время активации */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Время активации</p>
                    <p className="text-sm text-gray-600">Когда бот был запущен</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {botSettings?.activatedAt ? new Date(botSettings.activatedAt).toLocaleString() : 'Не установлено'}
                  </p>
                </div>

                {/* Последняя активность */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Последняя активность</p>
                    <p className="text-sm text-gray-600">Время последнего сообщения</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {botSettings?.lastActivity ? new Date(botSettings.lastActivity).toLocaleString() : 'Не установлено'}
                  </p>
                </div>

                {/* Время работы бота */}
                {botSettings?.activatedAt && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Время работы</p>
                      <p className="text-sm text-gray-600">С момента активации</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {(() => {
                        const now = new Date();
                        const activated = new Date(botSettings.activatedAt);
                        const diffMs = now - activated;
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        
                        if (diffDays > 0) {
                          return `${diffDays}д ${diffHours}ч ${diffMinutes}м`;
                        } else if (diffHours > 0) {
                          return `${diffHours}ч ${diffMinutes}м`;
                        } else {
                          return `${diffMinutes}м`;
                        }
                      })()}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Статус ботов */}
              {botStatus && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Статус Всех Ботов</p>
                    <Badge variant="outline">
                      {botStatus.active}/{botStatus.total} активны
                    </Badge>
                  </div>
                  {botStatus.errors > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-center gap-2 text-yellow-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Найдено {botStatus.errors} ботов с ошибками</span>
                      </div>
                      <p className="text-sm mt-1">Некоторые боты были автоматически деактивированы из-за неверных токенов.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => toggleBot(!botSettings.isActive)}
                  disabled={saving}
                  variant={botSettings.isActive ? "outline" : "default"}
                  className="flex-1"
                >
                                     {botSettings.isActive ? (
                     <>
                       <Square className="h-4 w-4 mr-2" />
                       Деактивировать Бота
                     </>
                   ) : (
                     <>
                       <Play className="h-4 w-4 mr-2" />
                       Активировать Бота
                     </>
                   )}
                </Button>
                <Button
                  onClick={fetchBotStatus}
                  disabled={saving}
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Проверить Статус
                </Button>
                <Button
                  onClick={deleteBotSettings}
                  disabled={saving}
                  variant="destructive"
                >
                                     <Trash2 className="h-4 w-4 mr-2" />
                   Удалить
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Форма создания нового бота
        <Card>
          <CardHeader>
                           <CardTitle className="flex items-center gap-2">
                 <Settings className="h-5 w-5" />
                 Создать Нового Бота
               </CardTitle>
               <CardDescription>
                 Настройте вашего AI-ассистента в Telegram с возможностью подключения интеграций
               </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                             <Label htmlFor="botToken">Токен Бота *</Label>
               <Input
                 id="botToken"
                 type="password"
                 placeholder="Введите токен бота от @BotFather"
                 value={formData.botToken}
                 onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
               />
               <p className="text-xs text-gray-500">
                 Получите токен бота от @BotFather в Telegram
               </p>
               
               {/* Статус валидации токена */}
               {validatingToken && (
                 <div className="flex items-center gap-2 text-sm text-blue-600">
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                   Проверяем токен...
                 </div>
               )}
               
               {tokenValidation && !validatingToken && (
                 <div className={`p-3 rounded-md text-sm ${
                   tokenValidation.valid 
                     ? 'bg-green-50 text-green-700 border border-green-200' 
                     : 'bg-red-50 text-red-700 border border-red-200'
                 }`}>
                   <div className="flex items-center gap-2">
                     {tokenValidation.valid ? (
                       <CheckCircle className="h-4 w-4" />
                     ) : (
                       <AlertCircle className="h-4 w-4" />
                     )}
                     <span className="font-medium">
                       {tokenValidation.valid ? 'Токен валиден' : 'Ошибка токена'}
                     </span>
                   </div>
                   <p className="mt-1">{tokenValidation.message}</p>
                   {tokenValidation.valid && tokenValidation.botInfo && (
                     <div className="mt-2 text-xs">
                       <p><strong>Бот:</strong> @{tokenValidation.botInfo.username}</p>
                       <p><strong>Имя:</strong> {tokenValidation.botInfo.firstName}</p>
                       <p><strong>ID:</strong> {tokenValidation.botInfo.id}</p>
                     </div>
                   )}
                 </div>
               )}
            </div>

            <div className="space-y-2">
                             <Label htmlFor="aiProvider">AI Провайдер</Label>
               <Select
                 value={formData.aiProvider}
                 onValueChange={(value) => setFormData({ ...formData, aiProvider: value })}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Выберите AI провайдера" />
                 </SelectTrigger>
                <SelectContent>
                  {aiProviders.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                             {aiProviders.length === 0 && (
                 <p className="text-xs text-red-500">
                   AI провайдеры не настроены. Сначала настройте AI в разделе настроек.
                 </p>
               )}
            </div>

            {/* Настройки контекста */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Контекст чата</Label>
                  <p className="text-xs text-gray-500">
                    Сохранять историю сообщений для лучшего понимания контекста
                  </p>
                </div>
                <Switch
                  checked={formData.contextEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, contextEnabled: checked })}
                />
              </div>

              {formData.contextEnabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="contextLimit">Лимит сообщений в контексте</Label>
                      <span className="text-sm font-medium text-gray-700">
                        {formData.contextLimit} сообщений
                      </span>
                    </div>
                    <Slider
                      id="contextLimit"
                      min={5}
                      max={30}
                      step={1}
                      value={[formData.contextLimit]}
                      onValueChange={(value) => setFormData({ ...formData, contextLimit: value[0] })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>5</span>
                      <span>30</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Максимальное количество сообщений для сохранения в контексте (5-30)
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={saveBotSettings}
              disabled={saving || !formData.botToken || aiProviders.length === 0}
              className="w-full"
            >
                             {saving ? 'Сохранение...' : 'Создать Бота'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TelegramBotManager; 