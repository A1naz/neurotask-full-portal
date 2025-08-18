import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Bot, 
  MessageSquare, 
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import TelegramBotManager from './TelegramBotManager';
import IntegrationsManager from './IntegrationsManager';

const Assistant = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [messageCountChanged, setMessageCountChanged] = useState(false);

  const { user, API_BASE } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    
    // Автоматическое обновление данных каждые 10 секунд
    const interval = setInterval(() => {
      fetchDashboardDataSilent();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Отслеживаем изменения в dashboardData
  useEffect(() => {
    if (dashboardData) {
      }
  }, [dashboardData]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dashboard/data`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  // Тихая функция обновления данных без показа загрузки
  const fetchDashboardDataSilent = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dashboard/data`, {
        credentials: 'include',
        cache: 'no-cache', // Принудительно не кэшировать
      });

      if (response.ok) {
        const data = await response.json();
        const newMessageCount = data.botStats?.messagesProcessed || 0;
        const oldMessageCount = dashboardData?.botStats?.messagesProcessed || 0;
        
        // Обновляем данные только если они изменились
        if (newMessageCount !== oldMessageCount) {
          setPreviousMessageCount(oldMessageCount);
          setDashboardData(data);
          setLastUpdate(new Date());
          setMessageCountChanged(true);
          
          // Сбрасываем флаг изменения через 2 секунды
          setTimeout(() => setMessageCountChanged(false), 2000);
        }
      }
    } catch (error) {
      }
  };

  const formatUptime = (uptime) => {
    if (!uptime) return 'Не активен';
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (days > 0) {
      return `${days}д ${remainingHours}ч ${minutes}м`;
    } else if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    } else {
      return `${minutes}м`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Telegram Ассистент</h1>
        <p className="text-gray-600">Управляйте вашим AI-ассистентом и интеграциями</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
                                  <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="bot">Управление ботом</TabsTrigger>
          <TabsTrigger value="integrations">Интеграции</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <Bot className="h-8 w-8 text-blue-600" />
                  <div className="ml-4 text-center">
                    <p className="text-sm font-medium text-gray-600">Telegram Bot</p>
                    <div className="flex items-center justify-center mt-1">
                      {dashboardData?.botStats?.isActive ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600">Активен</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-sm text-red-600">Неактивен</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                  <div className="ml-4 text-center">
                    <p className="text-sm font-medium text-gray-600">Сообщения</p>
                    <p className={`text-2xl font-bold transition-all duration-300 ${
                      messageCountChanged ? 'text-green-600 scale-110' : 'text-gray-900'
                    }`}>
                      {dashboardData?.botStats?.messagesProcessed || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-4 text-center">
                    <p className="text-sm font-medium text-gray-600">Время работы</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatUptime(dashboardData?.botStats?.uptime)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Integrations Block */}
          {(() => {
            const shouldShow = dashboardData?.integrations && 
                             (dashboardData.integrations.googleCalendar?.enabled || false);
            return shouldShow;
          })() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Интеграции
                </CardTitle>
                <CardDescription>
                  Статус подключенных сервисов и интеграций
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Google Calendar Integration */}
                  {dashboardData.integrations.googleCalendar?.enabled && (
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Google Calendar</p>
                          <p className="text-sm text-gray-600">
                            {dashboardData.integrations.googleCalendar.enabled 
                              ? (dashboardData.integrations.googleCalendar.tokensValid 
                                  ? "Включен и настроен" 
                                  : "Включен, требуется проверка")
                              : "Отключен"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={
                            dashboardData.integrations.googleCalendar.enabled 
                              ? (dashboardData.integrations.googleCalendar.tokensValid ? "default" : "secondary")
                              : "secondary"
                          }
                          className={
                            dashboardData.integrations.googleCalendar.enabled && dashboardData.integrations.googleCalendar.tokensValid
                              ? "bg-green-100 text-green-800 border-green-200"
                              : ""
                          }
                        >
                          {dashboardData.integrations.googleCalendar.enabled 
                            ? (dashboardData.integrations.googleCalendar.tokensValid 
                                ? "Активна" 
                                : "Требуется проверка")
                            : "Неактивна"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Placeholder for future integrations */}
                  {!dashboardData.integrations.googleCalendar?.enabled && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Другие интеграции появятся здесь в будущих обновлениях
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bot" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="h-5 w-5 mr-2" />
                Управление ботом
              </CardTitle>
              <CardDescription>
                Настройте и управляйте вашим Telegram ботом
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TelegramBotManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsManager />
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default Assistant;

