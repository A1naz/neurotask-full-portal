import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Music, 
  Sparkles, 
  Zap, 
  Brain,
  Mic,
  Clock,
  AlertTriangle,
  CheckCircle,
  Star,
  TrendingUp,
  Users,
  BarChart3,
  Settings,
  Download,
  Share2,
  Heart,
  Eye,
  Headphones,
  Volume2,
  Construction
} from 'lucide-react';

const AudioGeneration = () => {
  const aiModels = [
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      description: 'Продвинутая генерация речи с клонированием голосов',
      icon: Mic,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      features: ['Клонирование голосов', 'Эмоции', 'Многоязычность', 'API доступ'],
      status: 'Доступно',
      rating: 4.9,
      users: 180000,
      price: 'От $0.30/1000 символов'
    },
    {
      id: 'openai-tts',
      name: 'OpenAI TTS',
      description: 'Высококачественная генерация речи от OpenAI',
      icon: Mic,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      features: ['6 голосов', 'Высокое качество', 'Безопасность', 'Интеграция'],
      status: 'Доступно',
      rating: 4.8,
      users: 250000,
      price: 'От $0.015/1000 символов'
    },
    {
      id: 'suno',
      name: 'Suno AI',
      description: 'Генерация музыки и песен с текстовыми подсказками',
      icon: Music,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      features: ['Музыка из текста', 'Пение', 'Инструменты', 'Стили'],
      status: 'Доступно',
      rating: 4.7,
      users: 95000,
      price: 'От $0.05/минута'
    },
    {
      id: 'udio',
      name: 'Udio',
      description: 'Создание песен с полным контролем над процессом',
      icon: Music,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      features: ['Полные песни', 'Стили', 'Инструменты', 'Экспорт'],
      status: 'Доступно',
      rating: 4.6,
      users: 75000,
      price: 'От $0.04/минута'
    },
    {
      id: 'mubert',
      name: 'Mubert',
      description: 'AI-генерация фоновой музыки для контента',
      icon: Music,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      features: ['Фоновая музыка', 'Настроения', 'Длительность', 'Без лицензий'],
      status: 'Доступно',
      rating: 4.5,
      users: 120000,
      price: 'От $0.02/минута'
    },
    {
      id: 'soundraw',
      name: 'Soundraw',
      description: 'Создание музыки для видео и подкастов',
      icon: Music,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      features: ['Видео музыка', 'Подкасты', 'Стили', 'Экспорт'],
      status: 'Доступно',
      rating: 4.4,
      users: 68000,
      price: 'От $0.03/минута'
    },
    {
      id: 'aiva',
      name: 'AIVA',
      description: 'Композитор ИИ для создания оригинальной музыки',
      icon: Music,
      color: 'bg-gradient-to-br from-pink-500 to-pink-600',
      features: ['Оригинальная музыка', 'Композиции', 'Стили', 'Лицензии'],
      status: 'Доступно',
      rating: 4.3,
      users: 45000,
      price: 'От $0.06/минута'
    },
    {
      id: 'ampermusic',
      name: 'Amper Music',
      description: 'Создание музыки для рекламы и брендинга',
      icon: Music,
      color: 'bg-gradient-to-br from-teal-500 to-teal-600',
      features: ['Рекламная музыка', 'Брендинг', 'Эмоции', 'Коммерческое использование'],
      status: 'Доступно',
      rating: 4.2,
      users: 32000,
      price: 'От $0.08/минута'
    }
  ];

  const stats = {
    totalGenerations: 45680,
    todayGenerations: 892,
    averageRating: 4.6,
    activeUsers: 12300,
    totalAudio: 89000
  };

  return (
    <div className="space-y-6 p-6">
      {/* Development Notice */}
      <div className="relative mb-8 z-20">
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <div className="p-2 bg-amber-500 rounded-full">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
              Раздел в разработке
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 text-sm">
              Функциональность находится в активной разработке. Будет доступна в ближайшее время.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Blur overlay for entire content */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="p-4 bg-gray-400 rounded-full mx-auto mb-4">
            <Construction className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-600 mb-2">В разработке</h2>
          <p className="text-gray-500 text-lg">Скоро будет доступно</p>
        </div>
      </div>

      {/* Content with z-0 */}
      <div className="relative z-0">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <Music className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Генерация аудио</h1>
              <p className="text-gray-600">AI-модели для создания речи, музыки и звуковых эффектов</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>8 AI моделей</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>{stats.totalGenerations.toLocaleString()} генераций</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span>Средний рейтинг {stats.averageRating}</span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Всего генераций</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalGenerations.toLocaleString()}</p>
                </div>
                <Music className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Сегодня</p>
                  <p className="text-2xl font-bold text-green-600">{stats.todayGenerations}</p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Активных пользователей</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.activeUsers.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Создано аудио</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalAudio.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aiModels.map((model) => {
            const Icon = model.icon;
            return (
              <Card key={model.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${model.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={model.status === 'Доступно' ? "default" : "secondary"}>
                            {model.status}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{model.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {model.description}
                  </p>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Возможности:</h4>
                    <div className="space-y-1">
                      {model.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{model.users.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{model.price}</p>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full group-hover:bg-orange-600 transition-colors"
                    variant="outline"
                    disabled={model.status === 'В разработке'}
                  >
                    <span>{model.status === 'Доступно' ? 'Попробовать' : 'Скоро будет доступно'}</span>
                    {model.status === 'В разработке' ? (
                      <Clock className="w-4 h-4 ml-2" />
                    ) : (
                      <Volume2 className="w-4 h-4 ml-2" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Возможности платформы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Download className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Экспорт в разных форматах</h4>
                    <p className="text-sm text-gray-600">MP3, WAV, FLAC, AAC</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Прямая публикация</h4>
                    <p className="text-sm text-gray-600">В социальные сети</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Аналитика</h4>
                    <p className="text-sm text-gray-600">Статистика использования</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Статус разработки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-orange-800 mb-1">Интеграция в разработке</h3>
                    <p className="text-sm text-orange-700">
                      Мы активно работаем над интеграцией всех ведущих AI-моделей для генерации аудио. 
                      В ближайшем обновлении вы сможете создавать уникальную музыку и речь с помощью ИИ.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AudioGeneration; 