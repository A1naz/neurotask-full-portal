import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Bot, 
  Settings, 
  LogOut, 
  Activity, 
  MessageSquare, 
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Состояния компонента
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  
  // API базовый URL
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchDashboardData();
    
    // Обновляем только данные каждые 10 секунд
    const interval = setInterval(() => {
      fetchDashboardDataSilent();
    }, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, [API_BASE]); // Добавляем API_BASE как зависимость

  // Отслеживаем изменения в dashboardData
  useEffect(() => {
    if (dashboardData) {
      console.log('🔍 Dashboard data updated:', dashboardData);
    }
  }, [dashboardData]);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/dashboard/data`, {
        credentials: 'include',
        cache: 'no-cache', // Принудительно не кэшировать
      });

      if (response.ok) {
        const data = await response.json();
        const newMessageCount = data.botStats?.messagesProcessed || 0;
        const oldMessageCount = dashboardData?.botStats?.messagesProcessed || 0;
        
        // Обновляем состояние только если данные действительно изменились
        if (newMessageCount !== oldMessageCount) {
          setDashboardData(data);
          setPreviousMessageCount(oldMessageCount);
        } else {
          setDashboardData(data);
        }
        
        setLastUpdate(new Date());
      } else {
        console.error('❌ Failed to fetch dashboard data:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
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
        
        // Обновляем состояние только если данные действительно изменились
        if (newMessageCount !== oldMessageCount) {
          setDashboardData(data);
          setPreviousMessageCount(oldMessageCount);
        } else {
          setDashboardData(data);
        }
        
        setLastUpdate(new Date());
      } else {
        console.error('❌ Failed to fetch dashboard data silently:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data silently:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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

  // Мемоизируем данные для предотвращения лишних перерендеров
  const memoizedDashboardData = useMemo(() => dashboardData, [dashboardData]);

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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Панель управления</h1>
              <p className="mt-1 text-sm text-gray-500">
                Последнее обновление: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex items-center">
                  <Bot className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Telegram Bot</p>
                    <div className="flex items-center mt-1">
                      {memoizedDashboardData?.botStats?.isActive ? (
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Google Calendar</p>
                    <div className="flex items-center mt-1">
                      {memoizedDashboardData?.tokens?.hasGoogleAuth ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600">Подключен</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-sm text-red-600">Не настроен</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => fetchDashboardData(true)}
                  disabled={refreshing}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex items-center">
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Сообщения</p>
                    <p 
                      className="text-2xl font-bold text-gray-900"
                      key={`message-count-${memoizedDashboardData?.botStats?.messagesProcessed || 0}`}
                    >
                      {memoizedDashboardData?.botStats?.messagesProcessed || 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Время работы</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatUptime(memoizedDashboardData?.botStats?.uptime)}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => fetchDashboardData(true)}
                  disabled={refreshing}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Статус бота:</span>
                  <Badge variant={memoizedDashboardData?.botStats?.isActive ? "default" : "secondary"}>
                    {memoizedDashboardData?.botStats?.isActive ? "Активен" : "Неактивен"}
                  </Badge>
                </div>
                <Separator />
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/bot-management')}
                >
                  Управление ботом
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Интеграция календаря
              </CardTitle>
              <CardDescription>
                Подключите Google Calendar для синхронизации событий
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Google Calendar:</span>
                  <Badge variant={memoizedDashboardData?.tokens?.hasGoogleAuth ? "default" : "secondary"}>
                    {memoizedDashboardData?.tokens?.hasGoogleAuth ? "Подключен" : "Не настроен"}
                  </Badge>
                </div>
                <Separator />
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/calendar-integration')}
                >
                  Настроить календарь
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Настройки пользователя
              </CardTitle>
              <CardDescription>
                Управляйте настройками профиля и системы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Имя пользователя:</p>
                  <p className="text-sm text-gray-900">{user?.username}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Email:</p>
                  <p className="text-sm text-gray-900">{user?.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Часовой пояс:</p>
                  <p className="text-sm text-gray-900">{memoizedDashboardData?.settings?.timezone || 'Europe/Moscow'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Язык:</p>
                  <p className="text-sm text-gray-900">{memoizedDashboardData?.settings?.language === 'ru' ? 'Русский' : 'English'}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <Button onClick={() => navigate('/user-settings')}>
                Изменить настройки
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

