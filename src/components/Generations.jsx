import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Wand2, 
  Video, 
  Image, 
  Music,
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  Construction
} from 'lucide-react';

const Generations = () => {
  const navigate = useNavigate();
  
  const generationTypes = [
    {
      id: 'video',
      title: 'Генерация видео',
      description: 'AI-модели для создания видео контента',
      icon: Video,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      iconColor: 'text-purple-600',
      features: ['Runway Gen-3', 'Pika Labs', 'OpenAI Sora', 'Stable Video'],
      status: 'В разработке',
      path: '/generations/video'
    },
    {
      id: 'images',
      title: 'Генерация изображений',
      description: 'AI-модели для создания изображений',
      icon: Image,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      iconColor: 'text-green-600',
      features: ['Midjourney', 'DALL-E 3', 'Stable Diffusion', 'Adobe Firefly'],
      status: 'В разработке',
      path: '/generations/images'
    },
    {
      id: 'audio',
      title: 'Генерация аудио',
      description: 'AI-модели для создания речи и музыки',
      icon: Music,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      iconColor: 'text-orange-600',
      features: ['ElevenLabs', 'OpenAI TTS', 'Suno AI', 'Udio'],
      status: 'В разработке',
      path: '/generations/audio'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
            <Wand2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Генерации</h1>
            <p className="text-gray-600">Создание медиаконтента с помощью искусственного интеллекта</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>3 типа генераций</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>12 AI моделей</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span>Высокое качество</span>
          </div>
        </div>
      </div>

      {/* Development Notice */}
      <div className="relative mb-8">
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
                  Все AI генерации находятся в активной разработке. Функциональность будет доступна в ближайшее время.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {generationTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card key={type.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              {/* Blur overlay */}
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center p-4">
                  <Construction className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">В разработке</p>
                  <p className="text-gray-500 text-sm">Скоро будет доступно</p>
                </div>
              </div>
              
              <CardHeader className="pb-4 relative z-0">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${type.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{type.title}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {type.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 relative z-0">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {type.description}
                </p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Доступные модели:</h4>
                  <div className="space-y-1">
                    {type.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  className="w-full group-hover:bg-blue-600 transition-colors"
                  variant="outline"
                  onClick={() => navigate(type.path)}
                  disabled
                >
                  <span>Перейти к {type.title.toLowerCase()}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            О генерациях
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              Наша платформа интегрирует ведущие AI-модели для создания различных типов контента:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Видео генерация - создание коротких и длинных видео</li>
              <li>Генерация изображений - создание уникальных иллюстраций</li>
              <li>Аудио генерация - создание речи и музыки</li>
              <li>Все модели проходят тщательный отбор по качеству</li>
              <li>Постоянное обновление и добавление новых моделей</li>
            </ul>
            <p className="mt-3 text-gray-600">
              Выберите тип генерации для начала работы с AI-моделями.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Generations; 