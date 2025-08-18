import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Bot, 
  Key, 
  Activity, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BotManagement = () => {
  const [botData, setBotData] = useState(null);
  const [tokens, setTokens] = useState({
    telegramBotToken: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { API_BASE } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBotData();
    fetchTokens();
  }, []);

  const fetchBotData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dashboard/bot-stats`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setBotData(data.stats);
      }
    } catch (error) {
      }
  };

  const fetchTokens = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dashboard/tokens`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTokens({
          telegramBotToken: data.tokens.telegramBotToken || '',
        });
      }
    } catch (error) {
      } finally {
      setLoading(false);
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

  const handleSaveToken = async () => {
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
          telegramBotToken: tokens.telegramBotToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Токен бота успешно сохранен');
        // Refresh bot data after saving token
        setTimeout(() => {
          fetchBotData();
        }, 1000);
      } else {
        setError(data.message || 'Ошибка сохранения токена');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setSaving(false);
    }
  };

  const handleClearToken = async () => {
    if (!confirm('Вы уверены, что хотите удалить токен бота?')) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/dashboard/tokens/telegramBotToken`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setTokens({ telegramBotToken: '' });
        setSuccess('Токен бота удален');
        fetchBotData();
      } else {
        setError(data.message || 'Ошибка удаления токена');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setSaving(false);
    }
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/telegram/webhook/process`;
    navigator.clipboard.writeText(webhookUrl);
    setSuccess('URL webhook скопирован в буфер обмена');
  };

  const formatUptime = (uptime) => {
    if (!uptime) return 'Не активен';
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}ч ${minutes}м`;
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
            <Bot className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">Управление ботом</h1>
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
                <Activity className="h-5 w-5 mr-2" />
                Статус бота
              </CardTitle>
              <CardDescription>
                Текущее состояние и статистика вашего Telegram бота
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {botData?.isActive ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-600">Статус</p>
                  <Badge variant={botData?.isActive ? "default" : "secondary"} className="mt-1">
                    {botData?.isActive ? "Активен" : "Неактивен"}
                  </Badge>
                </div>

                <div className="text-center">
                  <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Сообщения</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {botData?.messagesProcessed || 0}
                  </p>
                </div>

                <div className="text-center">
                  <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Время работы</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatUptime(botData?.uptime)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Настройка токена бота
              </CardTitle>
              <CardDescription>
                Введите токен вашего Telegram бота для активации
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

              <div className="space-y-2">
                <Label htmlFor="telegramBotToken">Токен Telegram бота</Label>
                <Input
                  id="telegramBotToken"
                  name="telegramBotToken"
                  type="password"
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={tokens.telegramBotToken}
                  onChange={handleTokenChange}
                />
                <p className="text-xs text-gray-500">
                  Получите токен у @BotFather в Telegram
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleSaveToken}
                  disabled={saving || !tokens.telegramBotToken}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить токен'
                  )}
                </Button>

                {tokens.telegramBotToken && (
                  <Button
                    variant="outline"
                    onClick={handleClearToken}
                    disabled={saving}
                  >
                    Удалить токен
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Настройка Webhook</CardTitle>
              <CardDescription>
                URL для получения сообщений от Telegram
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex">
                  <Input
                    value={`${window.location.origin}/api/telegram/webhook/process`}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyWebhookUrl}
                    className="ml-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Используйте этот URL для настройки webhook в @BotFather
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Инструкции по настройке</CardTitle>
              <CardDescription>
                Пошаговое руководство по созданию и настройке бота
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">1. Создание бота</h4>
                  <p className="text-sm text-gray-600">
                    Откройте Telegram и найдите @BotFather. Отправьте команду /newbot и следуйте инструкциям.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">2. Получение токена</h4>
                  <p className="text-sm text-gray-600">
                    После создания бота @BotFather выдаст вам токен. Скопируйте его и вставьте в поле выше.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">3. Настройка webhook (опционально)</h4>
                  <p className="text-sm text-gray-600">
                    Для получения сообщений в реальном времени настройте webhook, используя URL выше.
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://t.me/botfather', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Открыть @BotFather
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

export default BotManagement;

