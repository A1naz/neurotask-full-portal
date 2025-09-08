import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { aiModelsConfig } from '@/config/ai-models';
import { 
  Bot, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Power,
  PowerOff,
  Settings,
  MessageSquare,
  Video,
  Image,
  Music
} from 'lucide-react';

const AISettings = () => {
  const { API_BASE, csrfToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [aiProviders, setAiProviders] = useState({
    openai: false,
    gemini: false,
    xai: false,
    yandexgpt: false,
    gigachat: false,
    anthropic: false,
    deepseek: false,
    veo3: false, // Added for video generation
    imagen: false // Added for image generation
  });
  const [selectedModels, setSelectedModels] = useState({});

  // Основные AI модели (чат)
  const chatModels = [
    {
      key: 'openai',
      name: 'OpenAI',
      icon: '🤖',
      color: 'bg-green-100 text-green-800',
      isDisabled: false
    },
    {
      key: 'gemini',
      name: 'Google Gemini',
      icon: '🌟',
      color: 'bg-blue-100 text-blue-800',
      isDisabled: false
    },
    {
      key: 'xai',
      name: 'xAI',
      icon: '🚀',
      color: 'bg-purple-100 text-purple-800',
      isDisabled: false
    },
    {
      key: 'yandexgpt',
      name: 'Yandex GPT',
      icon: '🔍',
      color: 'bg-red-100 text-red-800',
      isDisabled: false
    },
    {
      key: 'gigachat',
      name: 'GigaChat',
      icon: '💼',
      color: 'bg-orange-100 text-orange-800',
      isDisabled: false
    },
    {
      key: 'anthropic',
      name: 'Anthropic',
      icon: '🧠',
      color: 'bg-indigo-100 text-indigo-800',
      isDisabled: false
    },
    {
      key: 'deepseek',
      name: 'DeepSeek',
      icon: '🔍',
      color: 'bg-emerald-100 text-emerald-800',
      isDisabled: false
    }
  ].map(provider => {
    const models = aiModelsConfig[provider.key]?.models || [];
    const description = models.length > 0
      ? models.slice(0, 3).join(', ') + (models.length > 3 ? '...' : '')
      : 'Модели не указаны';
    return { ...provider, description };
  });

  // Видео модели
  const videoModels = [
    {
      key: 'runway',
      name: 'Runway Gen-3',
      description: 'Продвинутая генерация видео',
      icon: '🎬',
      color: 'bg-purple-100 text-purple-800',
      isDisabled: true
    },
    {
      key: 'pika',
      name: 'Pika Labs',
      description: 'Быстрая генерация коротких видео',
      icon: '⚡',
      color: 'bg-blue-100 text-blue-800',
      isDisabled: true
    },
    {
      key: 'sora',
      name: 'OpenAI Sora',
      description: 'Революционная модель видео',
      icon: '🎥',
      color: 'bg-green-100 text-green-800',
      isDisabled: true
    },
    {
      key: 'stable-video',
      name: 'Stable Video Diffusion',
      description: 'Стабильная генерация видео',
      icon: '🎞️',
      color: 'bg-orange-100 text-orange-800',
      isDisabled: true
    },
    {
      key: 'luma',
      name: 'Luma AI',
      description: '3D видео и анимации',
      icon: '🎭',
      color: 'bg-red-100 text-red-800',
      isDisabled: true
    },
    {
      key: 'veo3',
      name: 'Google Veo3',
      description: 'Продвинутая генерация видео от Google',
      icon: '🚀',
      color: 'bg-yellow-100 text-yellow-800',
      isDisabled: false
    }
  ];

  // Аудио модели
  const audioModels = [
    {
      key: 'elevenlabs',
      name: 'ElevenLabs',
      description: 'Генерация речи с клонированием',
      icon: '🎤',
      color: 'bg-purple-100 text-purple-800',
      isDisabled: true
    },
    {
      key: 'openai-tts',
      name: 'OpenAI TTS',
      description: 'Высококачественная генерация речи',
      icon: '🔊',
      color: 'bg-blue-100 text-blue-800',
      isDisabled: true
    },
    {
      key: 'suno',
      name: 'Suno AI',
      description: 'Генерация музыки и песен',
      icon: '🎵',
      color: 'bg-green-100 text-green-800',
      isDisabled: true
    },
    {
      key: 'udio',
      name: 'Udio',
      description: 'Создание песен',
      icon: '🎼',
      color: 'bg-orange-100 text-orange-800',
      isDisabled: true
    },
    {
      key: 'mubert',
      name: 'Mubert',
      description: 'AI-генерация фоновой музыки',
      icon: '🎧',
      color: 'bg-indigo-100 text-indigo-800',
      isDisabled: true
    }
  ];

  // Модели генерации изображений
  const imageModels = [
    {
      key: 'midjourney',
      name: 'Midjourney',
      description: 'Продвинутая генерация изображений',
      icon: '🎨',
      color: 'bg-purple-100 text-purple-800',
      isDisabled: true
    },
    {
      key: 'dalle',
      name: 'DALL-E 3',
      description: 'Создание реалистичных изображений',
      icon: '🖼️',
      color: 'bg-blue-100 text-blue-800',
      isDisabled: true
    },
    {
      key: 'stable-diffusion',
      name: 'Stable Diffusion XL',
      description: 'Открытая модель генерации',
      icon: '🎭',
      color: 'bg-green-100 text-green-800',
      isDisabled: true
    },
    {
      key: 'firefly',
      name: 'Adobe Firefly',
      description: 'Интеграция с Adobe Creative Suite',
      icon: '✨',
      color: 'bg-orange-100 text-orange-800',
      isDisabled: true
    },
    {
      key: 'leonardo',
      name: 'Leonardo AI',
      description: 'Создание концепт-арта',
      icon: '🎪',
      color: 'bg-red-100 text-red-800',
      isDisabled: true
    },
    {
      key: 'imagen',
      name: 'Google Imagen',
      description: 'Продвинутая генерация изображений от Google',
      icon: '🌈',
      color: 'bg-indigo-100 text-indigo-800',
      isDisabled: false
    }
  ];

  const providersList = chatModels; // Для обратной совместимости

  useEffect(() => {
    if (csrfToken) {
      loadAISettings();
    }
  }, [csrfToken]);

  const loadAISettings = async () => {
    if (!csrfToken) {
      setError('Ошибка: CSRF токен не найден');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/ai-settings`, {
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.aiProviders) {
          setAiProviders(data.aiProviders);
        }
        if (data.selectedModels) {
          setSelectedModels(data.selectedModels);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(`Ошибка загрузки: ${errorData.message || response.statusText}`);
        }
    } catch (error) {
      setError('Ошибка загрузки настроек AI');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProvider = async (providerKey, enabled) => {
    if (!csrfToken) {
      setError('Ошибка: CSRF токен не найден');
      return;
    }
    
    // Проверяем, не отключен ли провайдер
    const provider = providersList.find(p => p.key === providerKey);
    if (provider?.isDisabled) {
      setError('Этот провайдер временно недоступен');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const updatedProviders = {
        ...aiProviders,
        [providerKey]: enabled
      };
      
      // Если провайдер выключается, удаляем его из selectedModels, если он там есть
      const updatedModels = { ...selectedModels };
      if (!enabled && updatedModels[providerKey]) {
        delete updatedModels[providerKey];
      } else if (enabled && !updatedModels[providerKey]) {
        // Если включается и модели нет, ставим дефолтную (первую в списке)
        const providerConfig = aiModelsConfig[providerKey];
        if (providerConfig && providerConfig.models.length > 0) {
          updatedModels[providerKey] = providerConfig.models[0];
        }
      }

      const response = await fetch(`${API_BASE}/api/ai-settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ 
          aiProviders: updatedProviders,
          selectedModels: updatedModels
        }),
      });

      if (response.ok) {
        setAiProviders(updatedProviders);
        setSelectedModels(updatedModels);
        setSuccess(`${provider?.name} ${enabled ? 'включен' : 'выключен'}!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Ошибка сохранения настроек');
      }
    } catch (error) {
      setError('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleModelChange = async (providerKey, model) => {
    if (!csrfToken) {
      setError('Ошибка: CSRF токен не найден');
      return;
    }
    
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const updatedModels = {
        ...selectedModels,
        [providerKey]: model
      };

      const response = await fetch(`${API_BASE}/api/ai-settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ 
          aiProviders,
          selectedModels: updatedModels 
        }),
      });

      if (response.ok) {
        setSelectedModels(updatedModels);
        setSuccess(`Модель для ${providerKey} обновлена!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Ошибка сохранения настроек');
      }
    } catch (error) {
      setError('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };


  const getActiveProvidersCount = () => {
    return Object.entries(aiProviders).filter(([key, enabled]) => {
      const provider = providersList.find(p => p.key === key);
      return enabled && !provider?.isDisabled;
    }).length;
  };

  const getAvailableProvidersCount = () => {
    return providersList.filter(p => !p.isDisabled).length;
  };

  // Функция для рендеринга моделей
  const renderModelsGrid = (models) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((provider) => (
          <Card 
            key={provider.key} 
            className={`relative ${provider.isDisabled ? 'opacity-60 bg-gray-50' : ''}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl ${provider.isDisabled ? 'opacity-50' : ''}`}>
                    {provider.icon}
                  </span>
                  <div>
                    <Label className={`text-base font-semibold ${provider.isDisabled ? 'text-gray-500' : ''}`}>
                      {provider.name}
                    </Label>
                    <p className={`text-sm ${provider.isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                      {provider.description}
                    </p>
                    {provider.isDisabled && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        В разработке
                      </Badge>
                    )}
                  </div>
                </div>
                <Switch
                  checked={aiProviders[provider.key]}
                  onCheckedChange={(enabled) => handleToggleProvider(provider.key, enabled)}
                  disabled={saving || provider.isDisabled}
                />
              </div>

              {/* Model Selector */}
              {aiProviders[provider.key] && !provider.isDisabled && aiModelsConfig[provider.key] && (
                <div className="mt-4">
                  <Label htmlFor={`model-select-${provider.key}`} className="text-sm font-medium text-gray-700 mb-2 block">
                    Выбор модели
                  </Label>
                  <Select
                    value={selectedModels[provider.key] || aiModelsConfig[provider.key]?.models[0]}
                    onValueChange={(model) => handleModelChange(provider.key, model)}
                    disabled={saving}
                  >
                    <SelectTrigger id={`model-select-${provider.key}`}>
                      <SelectValue placeholder="Выберите модель" />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModelsConfig[provider.key].models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Status indicator */}
              <div className="mt-3 flex items-center gap-2">
                {provider.isDisabled ? (
                  <>
                    <PowerOff className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Недоступен</span>
                  </>
                ) : aiProviders[provider.key] ? (
                  <>
                    <Power className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Включен</span>
                  </>
                ) : (
                  <>
                    <PowerOff className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Выключен</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка настроек AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Настройки AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            Включите или выключите отдельные AI сервисы. API ключи настраиваются администратором в глобальных настройках проекта.
          </p>

          {success && (
            <Alert className="mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Summary Card */}
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Общий статус AI</h3>
                    <p className="text-sm text-blue-700">
                      Активно: {getActiveProvidersCount()} из {getAvailableProvidersCount()} доступных сервисов
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-900">
                    {getActiveProvidersCount()}
                  </div>
                  <div className="text-xs text-blue-600">активных</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Models Tabs */}
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Основные
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Видео
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                Аудио
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Изображения
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Основные AI модели</h3>
                </div>
                {renderModelsGrid(chatModels)}
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Видео модели</h3>
                </div>
                {renderModelsGrid(videoModels)}
              </div>
            </TabsContent>

            <TabsContent value="audio" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Music className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold">Аудио модели</h3>
                </div>
                {renderModelsGrid(audioModels)}
              </div>
            </TabsContent>

            <TabsContent value="images" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Image className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Модели генерации изображений</h3>
                </div>
                {renderModelsGrid(imageModels)}
              </div>
            </TabsContent>
          </Tabs>

          {/* Information Card */}
          <Card className="mt-6 bg-gray-50 border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    О настройках AI
                  </h3>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p>
                      Каждый AI сервис можно включать и выключать независимо:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Включенные сервисы будут доступны для использования</li>
                      <li>Выключенные сервисы не будут использоваться</li>
                      <li>Настройки сохраняются в вашем профиле</li>
                      <li>API ключи настраиваются администратором глобально</li>
                      <li>Изменения применяются мгновенно</li>
                    </ul>
                    <p className="mt-3 text-gray-600">
                      Рекомендуется включать только те сервисы, которые вы планируете использовать.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISettings; 