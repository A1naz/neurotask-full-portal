import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Settings,
  User,
  Lock,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Key
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext'; // Import useDashboard
import ApiKeys from './ApiKeys';

const UserSettings = () => {
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [settings, setSettings] = useState({
    timezone: 'Europe/Moscow',
    defaultEventDuration: 60,
    language: 'ru',
  });
  // const [loading, setLoading] = useState(true); // Removed local loading state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const { user, updateProfile, changePassword, API_BASE } = useAuth();
  const { dashboardData, loading } = useDashboard(); // Get dashboardData and loading from context
  const navigate = useNavigate();

  const timezones = [
    { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
    { value: 'Europe/London', label: 'Лондон (UTC+0)' },
    { value: 'America/New_York', label: 'Нью-Йорк (UTC-5)' },
    { value: 'America/Los_Angeles', label: 'Лос-Анджелес (UTC-8)' },
    { value: 'Asia/Tokyo', label: 'Токио (UTC+9)' },
    { value: 'Asia/Shanghai', label: 'Шанхай (UTC+8)' },
    { value: 'Australia/Sydney', label: 'Сидней (UTC+11)' },
    { value: 'Europe/Berlin', label: 'Берлин (UTC+1)' },
    { value: 'Europe/Paris', label: 'Париж (UTC+1)' },
  ];

  const durations = [
    { value: 15, label: '15 минут' },
    { value: 30, label: '30 минут' },
    { value: 60, label: '1 час' },
    { value: 90, label: '1.5 часа' },
    { value: 120, label: '2 часа' },
  ];

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
      });
    }
    // fetchSettings(); // Removed local fetchSettings call
    // Populate settings from dashboardData if available
    if (dashboardData?.settings) {
      setSettings({
        timezone: dashboardData.settings.timezone || 'Europe/Moscow',
        defaultEventDuration: dashboardData.settings.defaultEventDuration || 60,
        language: dashboardData.settings.language || 'ru',
      });
    }
  }, [user, dashboardData]); // Add dashboardData to dependencies

  // Remove fetchSettings function - handled by DashboardContext
  // const fetchSettings = async () => {
  //   try {
  //     const response = await fetch(`${API_BASE}/api/dashboard/data`, {
  //       credentials: 'include',
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       if (data.settings) {
  //         setSettings({
  //           timezone: data.settings.timezone || 'Europe/Moscow',
  //           defaultEventDuration: data.settings.defaultEventDuration || 60,
  //           language: data.settings.language || 'ru',
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     } finally {
  //     setLoading(false);
  //   }
  // };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSettingsChange = (field, value) => {
    setSettings({
      ...settings,
      [field]: value,
    });
    setError('');
    setSuccess('');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const result = await updateProfile(profileData);

    if (result.success) {
      setSuccess('Профиль успешно обновлен');
    } else {
      setError(result.message || 'Ошибка обновления профиля');
    }

    setSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Новые пароли не совпадают');
      setSaving(false);
      return;
    }

    // Validate password length
    if (passwordData.newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setSaving(false);
      return;
    }

    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);

    if (result.success) {
      setSuccess('Пароль успешно изменен');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } else {
      setError(result.message || 'Ошибка изменения пароля');
    }

    setSaving(false);
  };

  const handleUpdateSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/dashboard/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Настройки успешно сохранены');
      } else {
        setError(data.message || 'Ошибка сохранения настроек');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setSaving(false);
    }
  };

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
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <Settings className="h-8 w-8 text-gray-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">Настройки пользователя</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Профиль
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Lock className="h-4 w-4 inline mr-2" />
                Безопасность
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'system'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Globe className="h-4 w-4 inline mr-2" />
                Система
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'api'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Key className="h-4 w-4 inline mr-2" />
                API Ключи
              </button>
            </nav>
          </div>
        </div>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Настройки профиля
                </CardTitle>
                <CardDescription>
                  Измените информацию вашего профиля
                </CardDescription>
              </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Имя пользователя</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      value={profileData.username}
                      onChange={handleProfileChange}
                      required
                      minLength={3}
                      maxLength={30}
                      pattern="[a-zA-Z0-9_]+"
                      title="Только буквы, цифры и подчеркивания"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    'Обновить профиль'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Безопасность
                </CardTitle>
                <CardDescription>
                  Измените пароль вашего аккаунта
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Текущий пароль</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Новый пароль</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Подтвердите новый пароль</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={8}
                    />
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Изменение...
                      </>
                    ) : (
                      'Изменить пароль'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Системные настройки
                </CardTitle>
                <CardDescription>
                  Настройте параметры системы и календаря
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Часовой пояс</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => handleSettingsChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Длительность события по умолчанию</Label>
                  <Select
                    value={settings.defaultEventDuration.toString()}
                    onValueChange={(value) => handleSettingsChange('defaultEventDuration', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value.toString()}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Язык интерфейса</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => handleSettingsChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <Button onClick={handleUpdateSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить настройки'
                )}
              </Button>
            </CardContent>
          </Card>
          )}

          {/* API Keys */}
          {activeTab === 'api' && <ApiKeys />}
        </div>
      </main>
    </div>
  );
};

export default UserSettings;

