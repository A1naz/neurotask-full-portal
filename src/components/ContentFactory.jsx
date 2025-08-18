import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Sparkles, 
  Zap, 
  Brain,
  PenTool,
  Image,
  Video,
  Music,
  ArrowRight,
  Clock,
  AlertCircle,
  TrendingUp,
  Share2,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Globe,
  Users,
  BarChart3,
  Calendar,
  Target,
  Bot,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Plus,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const ContentFactory = () => {
  const contentModules = [
    {
      id: 'articles',
      title: 'Генерация статей',
      description: 'AI-создание уникальных статей для блогов, сайтов и СМИ',
      icon: PenTool,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      features: ['SEO-оптимизация', 'Проверка уникальности', 'Адаптация под аудиторию', 'Автоматическое форматирование'],
      status: 'В разработке',
      progress: 75
    },
    {
      id: 'social',
      title: 'Социальные сети',
      description: 'Автоматическая публикация в сотни аккаунтов соцсетей',
      icon: Share2,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      features: ['Instagram, Facebook, Twitter', 'Автопостинг', 'Аналитика', 'A/B тестирование'],
      status: 'В разработке',
      progress: 60
    },
    {
      id: 'youtube',
      title: 'YouTube контент',
      description: 'Создание и публикация видео на сотни YouTube каналов',
      icon: Youtube,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      features: ['Генерация скриптов', 'Автоматический монтаж', 'Публикация', 'Аналитика'],
      status: 'В разработке',
      progress: 45
    },
    {
      id: 'multimedia',
      title: 'Мультимедиа',
      description: 'Создание изображений, видео и аудио контента',
      icon: Image,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      features: ['AI-генерация изображений', 'Создание видео', 'Озвучка', 'Брендинг'],
      status: 'В разработке',
      progress: 80
    }
  ];

  const socialPlatforms = [
    { name: 'Instagram', icon: Instagram, color: 'text-pink-600', accounts: 150 },
    { name: 'Facebook', icon: Facebook, color: 'text-blue-600', accounts: 200 },
    { name: 'Twitter', icon: Twitter, color: 'text-blue-400', accounts: 120 },
    { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', accounts: 80 },
    { name: 'YouTube', icon: Youtube, color: 'text-red-600', accounts: 50 },
    { name: 'TikTok', icon: Video, color: 'text-black', accounts: 100 }
  ];

  const stats = {
    totalAccounts: 700,
    activeAccounts: 650,
    publishedToday: 1250,
    scheduledPosts: 3400,
    engagementRate: 8.5,
    reachToday: 250000
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Контент-завод</h1>
            <p className="text-gray-600">Автоматическая генерация и публикация контента в сотни аккаунтов</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>4 модуля генерации</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>700+ подключенных аккаунтов</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span>AI-автоматизация</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Активных аккаунтов</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeAccounts}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Опубликовано сегодня</p>
                <p className="text-2xl font-bold text-green-600">{stats.publishedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Запланировано</p>
                <p className="text-2xl font-bold text-orange-600">{stats.scheduledPosts}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Охват сегодня</p>
                <p className="text-2xl font-bold text-purple-600">{stats.reachToday.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contentModules.map((module) => {
          const Icon = module.icon;
          return (
            <Card key={module.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${module.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {module.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {module.description}
                </p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Возможности:</h4>
                  <div className="space-y-1">
                    {module.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Прогресс разработки</span>
                    <span className="font-medium">{module.progress}%</span>
                  </div>
                  <Progress value={module.progress} className="h-2" />
                </div>
                
                <Button 
                  className="w-full group-hover:bg-purple-600 transition-colors"
                  variant="outline"
                  disabled
                >
                  <span>Скоро будет доступно</span>
                  <Clock className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Social Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Подключенные платформы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {socialPlatforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <div key={platform.name} className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${platform.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{platform.name}</h3>
                  <p className="text-sm text-gray-600">{platform.accounts} аккаунтов</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Automation Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-green-600" />
              Автоматизация публикаций
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Планировщик контента</h4>
                  <p className="text-sm text-gray-600">Автоматическое планирование публикаций</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Таргетирование</h4>
                  <p className="text-sm text-gray-600">Публикация в нужное время для целевой аудитории</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Аналитика</h4>
                  <p className="text-sm text-gray-600">Отслеживание эффективности публикаций</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-600" />
              Управление аккаунтами
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Plus className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium">Массовое подключение</h4>
                  <p className="text-sm text-gray-600">Подключение сотен аккаунтов одновременно</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium">Автопостинг</h4>
                  <p className="text-sm text-gray-600">Автоматическая публикация контента</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-medium">Синхронизация</h4>
                  <p className="text-sm text-gray-600">Синхронизация контента между платформами</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Development Status */}
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
                <h3 className="font-medium text-orange-800 mb-1">Контент-завод в активной разработке</h3>
                <p className="text-sm text-orange-700">
                  Мы создаем революционную систему автоматической генерации и публикации контента. 
                  В ближайшем обновлении вы сможете подключать сотни аккаунтов и автоматически публиковать 
                  AI-сгенерированный контент во все социальные сети.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentFactory; 