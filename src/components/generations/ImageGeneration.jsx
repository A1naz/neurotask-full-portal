import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Image, 
  Sparkles, 
  Zap, 
  Brain,
  Palette,
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
  Construction
} from 'lucide-react';

const ImageGeneration = () => {
  const aiModels = [
    {
      id: 'midjourney',
      name: 'Midjourney',
      description: 'Продвинутая генерация изображений с высоким художественным качеством',
      icon: Palette,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      features: ['4K качество', 'Художественный стиль', 'Детализация', 'Стилизация'],
      status: 'Доступно',
      rating: 4.9,
      users: 250000,
      price: 'От $0.10/изображение'
    },
    {
      id: 'dalle',
      name: 'DALL-E 3',
      description: 'AI-модель от OpenAI для создания уникальных изображений',
      icon: Palette,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      features: ['Высокое качество', 'Точность описания', 'Безопасность', 'API доступ'],
      status: 'Доступно',
      rating: 4.8,
      users: 180000,
      price: 'От $0.04/изображение'
    },
    {
      id: 'stable-diffusion',
      name: 'Stable Diffusion',
      description: 'Открытая модель для генерации изображений с настройкой',
      icon: Palette,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      features: ['Open source', 'Настройка параметров', 'Локальный запуск', 'Бесплатно'],
      status: 'Доступно',
      rating: 4.6,
      users: 320000,
      price: 'Бесплатно'
    },
    {
      id: 'adobe-firefly',
      name: 'Adobe Firefly',
      description: 'Генерация изображений от Adobe с интеграцией в Creative Suite',
      icon: Palette,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      features: ['Adobe интеграция', 'Коммерческое использование', 'Высокое качество', 'Безопасность'],
      status: 'Доступно',
      rating: 4.7,
      users: 95000,
      price: 'Включено в подписку'
    },
    {
      id: 'leonardo',
      name: 'Leonardo AI',
      description: 'Специализированная модель для создания концепт-арта и иллюстраций',
      icon: Palette,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      features: ['Концепт-арт', 'Иллюстрации', 'Стилизация', 'Быстрая генерация'],
      status: 'Доступно',
      rating: 4.5,
      users: 78000,
      price: 'От $0.08/изображение'
    },
    {
      id: 'runway',
      name: 'Runway ML',
      description: 'Продвинутые AI-инструменты для создания и редактирования изображений',
      icon: Palette,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      features: ['Редактирование', 'Стилизация', 'Анимация', 'Профессиональные инструменты'],
      status: 'Доступно',
      rating: 4.4,
      users: 45000,
      price: 'От $0.12/изображение'
    }
  ];

  return (
    <div className="space-y-6 p-6 relative">
      {/* Development Notice */}
      <div className="relative mb-8 z-20">
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-full">
                <Construction className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">
                  Раздел в разработке
                </h3>
                <p className="text-amber-700 text-sm">
                  Генерация изображений находится в активной разработке. Функциональность будет доступна в ближайшее время.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blur overlay for entire content */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="text-center p-8">
          <Construction className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">В разработке</h2>
          <p className="text-gray-500 text-lg">Скоро будет доступно</p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8 relative z-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
            <Image className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Генерация изображений</h1>
            <p className="text-gray-600">AI-модели для создания уникальных изображений</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>6 AI моделей</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Высокое качество</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span>Современные технологии</span>
          </div>
        </div>
      </div>

      {/* AI Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-0">
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
                      <Badge 
                        variant={model.status === 'Доступно' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {model.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{model.rating}</span>
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
                  <div className="flex items-center gap-2 text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{model.users.toLocaleString()}</span>
                  </div>
                  <div className="font-medium text-gray-900">
                    {model.price}
                  </div>
                </div>
                
                <Button 
                  className="w-full group-hover:bg-green-600 transition-colors"
                  variant="outline"
                  disabled={model.status === 'В разработке'}
                >
                  <span>{model.status === 'Доступно' ? 'Попробовать' : 'Скоро'}</span>
                  <Palette className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-0">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">6</div>
            <div className="text-sm text-gray-600">AI моделей</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">4.7</div>
            <div className="text-sm text-gray-600">Средний рейтинг</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">870K</div>
            <div className="text-sm text-gray-600">Пользователей</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">4K</div>
            <div className="text-sm text-gray-600">Макс. разрешение</div>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="mt-8 relative z-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            О генерации изображений
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              Наша платформа интегрирует ведущие AI-модели для создания изображений:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Художественные иллюстрации и концепт-арт</li>
              <li>Фотографические изображения высокого качества</li>
              <li>Стилизация и фильтры</li>
              <li>Коммерческое использование</li>
              <li>Экспорт в различных форматах</li>
            </ul>
            <p className="mt-3 text-gray-600">
              Выберите модель для начала создания уникальных изображений.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageGeneration; 