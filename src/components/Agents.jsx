import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  Share2, 
  Target, 
  Megaphone, 
  ShoppingCart, 
  Headphones,
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  FileText,
  Construction
} from 'lucide-react';

const Agents = () => {
  const navigate = useNavigate();

  const agents = [
    {
      id: 'content-factory',
      title: 'Контент-завод',
      description: 'Автоматическая генерация и публикация контента в сотни аккаунтов',
      icon: FileText,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      iconColor: 'text-purple-600',
      features: ['AI-генерация статей', 'Автопостинг', '700+ аккаунтов', 'Аналитика'],
      status: 'В разработке',
      path: '/agents/content-factory'
    },
    {
      id: 'marketing',
      title: 'Маркетинг',
      description: 'AI-агент для автоматизации маркетинговых процессов и стратегий',
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconColor: 'text-blue-600',
      features: ['Стратегии продвижения', 'Анализ конкурентов', 'Планирование кампаний'],
      status: 'В разработке',
      path: '/agents/marketing'
    },
    {
      id: 'smm',
      title: 'SMM',
      description: 'AI-агент для управления социальными сетями и контент-маркетинга',
      icon: Share2,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      iconColor: 'text-purple-600',
      features: ['Контент-планы', 'Аналитика соцсетей', 'Автопостинг'],
      status: 'В разработке',
      path: '/agents/smm'
    },
    {
      id: 'targetologist',
      title: 'Таргетолог',
      description: 'AI-агент для настройки и оптимизации таргетированной рекламы',
      icon: Target,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      iconColor: 'text-green-600',
      features: ['Настройка рекламы', 'A/B тестирование', 'Оптимизация бюджета'],
      status: 'В разработке',
      path: '/agents/targetologist'
    },
    {
      id: 'directologist',
      title: 'Директолог',
      description: 'AI-агент для работы с Яндекс.Директ и контекстной рекламой',
      icon: Megaphone,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      iconColor: 'text-orange-600',
      features: ['Яндекс.Директ', 'Контекстная реклама', 'Ключевые слова'],
      status: 'В разработке',
      path: '/agents/directologist'
    },
    {
      id: 'sales',
      title: 'Продажи',
      description: 'AI-агент для автоматизации процессов продаж и лидогенерации',
      icon: ShoppingCart,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      iconColor: 'text-red-600',
      features: ['Лидогенерация', 'Воронка продаж', 'Автоматизация'],
      status: 'В разработке',
      path: '/agents/sales'
    },
    {
      id: 'support',
      title: 'Тех. поддержка',
      description: 'AI-агент для автоматизации технической поддержки клиентов',
      icon: Headphones,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      iconColor: 'text-indigo-600',
      features: ['Чат-боты', 'База знаний', 'Тикеты'],
      status: 'В разработке',
      path: '/agents/support'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Агенты</h1>
            <p className="text-gray-600">Специализированные AI-агенты для различных бизнес-задач</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>7 специализированных агентов</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Автоматизация процессов</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span>Искусственный интеллект</span>
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
                  Все AI агенты находятся в активной разработке. Функциональность будет доступна в ближайшее время.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <Card key={agent.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              {/* Blur overlay */}
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center p-4">
                  <Construction className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">В разработке</p>
                  <p className="text-gray-500 text-sm">Скоро будет доступно</p>
                </div>
              </div>
              
              <CardHeader className="pb-4 relative z-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${agent.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.title}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {agent.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 relative z-0">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {agent.description}
                </p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Возможности:</h4>
                  <div className="space-y-1">
                    {agent.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={() => navigate(agent.path)}
                  className="w-full group-hover:bg-blue-600 transition-colors"
                  variant="outline"
                  disabled
                >
                  <span>Открыть агента</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
            <Sparkles className="w-5 h-5 text-purple-600" />
            О наших AI агентах
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Искусственный интеллект</h3>
              <p className="text-sm text-gray-600">Продвинутые алгоритмы машинного обучения</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Автоматизация</h3>
              <p className="text-sm text-gray-600">Сокращение рутинных задач и повышение эффективности</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Результаты</h3>
              <p className="text-sm text-gray-600">Измеримые улучшения в бизнес-процессах</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Agents; 