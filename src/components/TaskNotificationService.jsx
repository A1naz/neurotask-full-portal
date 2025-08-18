import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  BellOff, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Send,
  Settings,
  Telegram,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const TaskNotificationService = () => {
  const { user, API_BASE } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  
  // Настройки уведомлений
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    telegramEnabled: true,
    emailEnabled: false,
    dueDateReminder: 24, // часы до срока
    overdueReminder: 12, // часы после просрочки
    statusChangeNotification: true,
    assigneeNotification: true,
    commentNotification: true,
    dailyDigest: true,
    weeklyReport: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  // Тестовое уведомление
  const [testNotification, setTestNotification] = useState({
    type: 'due_date',
    message: '',
    recipient: user?.username || ''
  });

  // Типы уведомлений
  const notificationTypes = [
    { 
      value: 'due_date', 
      label: 'Напоминание о сроке', 
      icon: Clock, 
      color: 'bg-blue-100 text-blue-800',
      description: 'Уведомление о приближающемся сроке выполнения'
    },
    { 
      value: 'overdue', 
      label: 'Просроченная задача', 
      icon: AlertTriangle, 
      color: 'bg-red-100 text-red-800',
      description: 'Уведомление о просроченных задачах'
    },
    { 
      value: 'status_change', 
      label: 'Изменение статуса', 
      icon: CheckCircle, 
      color: 'bg-green-100 text-green-800',
      description: 'Уведомление об изменении статуса задачи'
    },
    { 
      value: 'assignment', 
      label: 'Назначение задачи', 
      icon: User, 
      color: 'bg-purple-100 text-purple-800',
      description: 'Уведомление о назначении новой задачи'
    },
    { 
      value: 'comment', 
      label: 'Новый комментарий', 
      icon: MessageSquare, 
      color: 'bg-orange-100 text-orange-800',
      description: 'Уведомление о новых комментариях'
    }
  ];

  // Загрузить настройки уведомлений
  const loadNotificationSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/notifications/settings`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotificationSettings(data.settings || notificationSettings);
      }
    } catch (err) {
      } finally {
      setLoading(false);
    }
  };

  // Сохранить настройки уведомлений
  const saveNotificationSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(notificationSettings)
      });

      if (response.ok) {
        setShowSettingsDialog(false);
        // Показать уведомление об успехе
        setError('Настройки уведомлений сохранены!');
        setTimeout(() => setError(null), 3000);
      } else {
        throw new Error('Ошибка сохранения настроек');
      }
    } catch (err) {
      setError(err.message);
      }
  };

  // Отправить тестовое уведомление
  const sendTestNotification = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(testNotification)
      });

      if (response.ok) {
        setShowTestDialog(false);
        setError('Тестовое уведомление отправлено!');
        setTimeout(() => setError(null), 3000);
      } else {
        throw new Error('Ошибка отправки тестового уведомления');
      }
    } catch (err) {
      setError(err.message);
      }
  };

  // Получить статистику уведомлений
  const getNotificationStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/stats`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      }
  };

  // Включить/выключить уведомления
  const toggleNotifications = (type) => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Обновить настройку
  const updateSetting = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Обновить тихое время
  const updateQuietHours = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value
      }
    }));
  };

  useEffect(() => {
    loadNotificationSettings();
    getNotificationStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Уведомления о задачах</h1>
          <p className="text-gray-600 mt-2">Настройка и управление уведомлениями</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowTestDialog(true)}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Тест уведомления
          </Button>
          <Button 
            onClick={() => setShowSettingsDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Настройки
          </Button>
        </div>
      </div>

      {/* Статус уведомлений */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {notificationSettings.enabled ? (
                <Bell className="w-5 h-5 text-green-600" />
              ) : (
                <BellOff className="w-5 h-5 text-red-600" />
              )}
              Общий статус
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {notificationSettings.enabled ? 'Уведомления включены' : 'Уведомления отключены'}
              </span>
              <Switch
                checked={notificationSettings.enabled}
                onCheckedChange={(checked) => updateSetting('enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Telegram className="w-5 h-5 text-blue-600" />
              Telegram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {notificationSettings.telegramEnabled ? 'Включено' : 'Отключено'}
              </span>
              <Switch
                checked={notificationSettings.telegramEnabled}
                onCheckedChange={(checked) => updateSetting('telegramEnabled', checked)}
                disabled={!notificationSettings.enabled}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Ежедневный дайджест
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {notificationSettings.dailyDigest ? 'Включено' : 'Отключено'}
              </span>
              <Switch
                checked={notificationSettings.dailyDigest}
                onCheckedChange={(checked) => updateSetting('dailyDigest', checked)}
                disabled={!notificationSettings.enabled}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Типы уведомлений */}
      <Card>
        <CardHeader>
          <CardTitle>Типы уведомлений</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notificationTypes.map(type => {
              const Icon = type.icon;
              const isEnabled = notificationSettings[`${type.value}Notification`] !== false;
              
              return (
                <div key={type.value} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${type.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{type.label}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => updateSetting(`${type.value}Notification`, checked)}
                    disabled={!notificationSettings.enabled}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Настройки времени */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Напоминания о сроках</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Напоминать за (часы до срока)
              </label>
              <Select 
                value={notificationSettings.dueDateReminder.toString()} 
                onValueChange={(value) => updateSetting('dueDateReminder', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 час</SelectItem>
                  <SelectItem value="6">6 часов</SelectItem>
                  <SelectItem value="12">12 часов</SelectItem>
                  <SelectItem value="24">1 день</SelectItem>
                  <SelectItem value="48">2 дня</SelectItem>
                  <SelectItem value="72">3 дня</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Напоминать о просрочке (часы)
              </label>
              <Select 
                value={notificationSettings.overdueReminder.toString()} 
                onValueChange={(value) => updateSetting('overdueReminder', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 час</SelectItem>
                  <SelectItem value="6">6 часов</SelectItem>
                  <SelectItem value="12">12 часов</SelectItem>
                  <SelectItem value="24">1 день</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Тихое время</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Включить тихое время</span>
              <Switch
                checked={notificationSettings.quietHours.enabled}
                onCheckedChange={(checked) => updateQuietHours('enabled', checked)}
                disabled={!notificationSettings.enabled}
              />
            </div>
            
            {notificationSettings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Начало
                  </label>
                  <Input
                    type="time"
                    value={notificationSettings.quietHours.start}
                    onChange={(e) => updateQuietHours('start', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Конец
                  </label>
                  <Input
                    type="time"
                    value={notificationSettings.quietHours.end}
                    onChange={(e) => updateQuietHours('end', e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Статистика уведомлений */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика уведомлений</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 10).map((notification, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${notificationTypes.find(t => t.value === notification.type)?.color || 'bg-gray-100'}`}>
                      {React.createElement(notificationTypes.find(t => t.value === notification.type)?.icon || 'div', { className: 'w-4 h-4' })}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={notification.sent ? 'default' : 'secondary'}>
                    {notification.sent ? 'Отправлено' : 'В очереди'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">История уведомлений пуста</p>
          )}
        </CardContent>
      </Card>

      {/* Диалог настроек */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Настройки уведомлений</DialogTitle>
            <DialogDescription>
              Настройте параметры уведомлений о задачах
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Основные настройки */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Основные настройки</h3>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Включить уведомления</span>
                <Switch
                  checked={notificationSettings.enabled}
                  onCheckedChange={(checked) => updateSetting('enabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Telegram уведомления</span>
                <Switch
                  checked={notificationSettings.telegramEnabled}
                  onCheckedChange={(checked) => updateSetting('telegramEnabled', checked)}
                  disabled={!notificationSettings.enabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email уведомления</span>
                <Switch
                  checked={notificationSettings.emailEnabled}
                  onCheckedChange={(checked) => updateSetting('emailEnabled', checked)}
                  disabled={!notificationSettings.enabled}
                />
              </div>
            </div>
            
            {/* Типы уведомлений */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Типы уведомлений</h3>
              
              {notificationTypes.map(type => (
                <div key={type.value} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{type.label}</span>
                  <Switch
                    checked={notificationSettings[`${type.value}Notification`] !== false}
                    onCheckedChange={(checked) => updateSetting(`${type.value}Notification`, checked)}
                    disabled={!notificationSettings.enabled}
                  />
                </div>
              ))}
            </div>
            
            {/* Расписание */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Расписание</h3>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ежедневный дайджест</span>
                <Switch
                  checked={notificationSettings.dailyDigest}
                  onCheckedChange={(checked) => updateSetting('dailyDigest', checked)}
                  disabled={!notificationSettings.enabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Еженедельный отчет</span>
                <Switch
                  checked={notificationSettings.weeklyReport}
                  onCheckedChange={(checked) => updateSetting('weeklyReport', checked)}
                  disabled={!notificationSettings.enabled}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Отмена
            </Button>
            <Button onClick={saveNotificationSettings}>
              Сохранить настройки
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог тестового уведомления */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Тестовое уведомление</DialogTitle>
            <DialogDescription>
              Отправьте тестовое уведомление для проверки настроек
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип уведомления
              </label>
              <Select 
                value={testNotification.type} 
                onValueChange={(value) => setTestNotification(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Сообщение
              </label>
              <Textarea
                value={testNotification.message}
                onChange={(e) => setTestNotification(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Введите тестовое сообщение"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Получатель
              </label>
              <Input
                value={testNotification.recipient}
                onChange={(e) => setTestNotification(prev => ({ ...prev, recipient: e.target.value }))}
                placeholder="Username или email"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Отмена
            </Button>
            <Button 
              onClick={sendTestNotification}
              disabled={!testNotification.message.trim()}
            >
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Обработка ошибок */}
      {error && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded ${
          error.includes('успешно') || error.includes('сохранены') || error.includes('отправлено')
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {error}
          <button 
            className="ml-4 hover:opacity-70"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskNotificationService;
