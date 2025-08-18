import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Construction, 
  Clock, 
  Code, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

const UnderDevelopment = ({ title, description, icon: Icon = Construction }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Construction className="w-5 h-5 text-orange-600" />
              Статус разработки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  В разработке
                </Badge>
                <span className="text-sm text-gray-500">Ожидается в ближайшем обновлении</span>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-orange-800 mb-1">Функция в разработке</h3>
                    <p className="text-sm text-orange-700">
                      Мы активно работаем над этой функцией. Она будет доступна в одном из следующих обновлений.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Планируемые возможности
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">AI-ассистент для автоматизации задач</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Интеграция с популярными платформами</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Аналитика и отчеты</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Кастомизация под ваши нужды</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            Техническая информация
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">React</div>
              <div className="text-sm text-blue-600">Frontend Framework</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">Node.js</div>
              <div className="text-sm text-green-600">Backend Runtime</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">AI/ML</div>
              <div className="text-sm text-purple-600">Искусственный интеллект</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Есть вопросы или предложения по этой функции?
            </p>
            <p className="text-sm text-gray-500">
              Свяжитесь с нашей командой разработки
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnderDevelopment; 