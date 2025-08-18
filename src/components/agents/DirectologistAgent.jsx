import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Construction } from 'lucide-react';

const DirectologistAgent = () => {
  return (
    <div className="p-6">
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
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Директолог агент</h1>
            <p className="text-gray-600">AI-агент для автоматизации рекламных кампаний в Яндекс.Директ</p>
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
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">AI-агент директолог</h4>
                      <p className="text-sm text-gray-600">Автоматизация рекламных кампаний</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Планируемые возможности
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Автоматическое создание кампаний</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Оптимизация ставок</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Анализ эффективности</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectologistAgent; 