import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  LogOut,
  User,
  Menu,
  X,
  MessageSquare,
  Cog,
  Bug,
  Server,
  Database,
  Wallet,
  Plus,
  Bot
} from 'lucide-react';
import {
  CustomDropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from '@/components/ui/custom-dropdown';
import { useAuth } from '@/contexts/AuthContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const { user, logout, API_BASE } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Загружаем баланс токенов
  useEffect(() => {
    const fetchTokenBalance = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/tokens/balance`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setTokenBalance(data.balance || 0);
        }
      } catch (error) {
        }
    };

    if (user) {
      fetchTokenBalance();
    }
  }, [user, API_BASE]);

  const menuItems = [
    {
      id: 'assistant',
      label: 'Ассистент',
      icon: MessageSquare,
      path: '/assistant',
      description: 'Telegram календарь бот'
    }
  ];

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center">
              <img 
                src="/neurotask-logo.jpg" 
                alt="Neurotask Logo" 
                className="h-10 w-10 rounded-lg object-cover mr-3"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Neurotask</h1>
                <p className="text-xs text-gray-600">AI Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden hover:bg-blue-50"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id}>
                  <Button
                    variant={isActiveRoute(item.path) ? "default" : "ghost"}
                    className={`w-full justify-start mb-2 ${
                      isActiveRoute(item.path) 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'hover:bg-blue-50'
                    }`}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Button>
                </div>
              );
            })}
          </nav>

          {/* User Profile Section - Fixed at bottom */}
          <div className="border-t bg-gray-50 p-4 mt-auto">
            <CustomDropdown
              trigger={
                <Button variant="ghost" className="w-full justify-start p-3 hover:bg-white transition-colors group">
                  <div className="flex items-center w-full">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-3 text-left flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{user?.username}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                </Button>
              }
            >
              <DropdownLabel>
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </DropdownLabel>
              <DropdownSeparator />
              
              {/* Token Balance Section */}
              <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 mx-2 rounded-md border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Баланс токенов</span>
                    <div className="text-xs text-gray-500">Доступно для использования</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-600">
                      {tokenBalance.toLocaleString()}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate('/assistant/token-history')}
                      className="h-6 w-6 p-0 hover:bg-blue-100 rounded-full"
                      title="Пополнить баланс"
                    >
                      <Plus className="h-3 w-3 text-blue-600" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <DropdownSeparator />
              
              {/* Quick Actions */}
              <DropdownItem onClick={() => navigate('/assistant/token-history')}>
                <Wallet className="mr-3 h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">История токенов</div>
                  <div className="text-xs text-gray-500">Пополнения и списания</div>
                </div>
              </DropdownItem>
              
              <DropdownItem onClick={() => navigate('/assistant/token-history?action=buy')}>
                <Plus className="mr-3 h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">Пополнить баланс</div>
                  <div className="text-xs text-gray-500">Купить токены</div>
                </div>
              </DropdownItem>
              
              <DropdownItem onClick={() => navigate('/assistant/ai-settings')}>
                <Bot className="mr-3 h-4 w-4 text-purple-600" />
                <div>
                  <div className="font-medium">Настройки AI</div>
                  <div className="text-xs text-gray-500">API ключи и провайдеры</div>
                </div>
              </DropdownItem>
              
              <DropdownSeparator />
              
              {/* Settings */}
              <DropdownItem onClick={() => navigate('/assistant/user-settings')}>
                <Cog className="mr-3 h-4 w-4 text-gray-600" />
                <div>
                  <div className="font-medium">Настройки профиля</div>
                  <div className="text-xs text-gray-500">Личные данные</div>
                </div>
              </DropdownItem>
              
              {/* Debug Tools */}
              <DropdownItem onClick={() => navigate('/assistant/cookie-debug')}>
                <Bug className="mr-3 h-4 w-4 text-orange-600" />
                <div>
                  <div className="font-medium">Диагностика куки</div>
                  <div className="text-xs text-gray-500">Проверка браузера</div>
                </div>
              </DropdownItem>
              
              <DropdownItem onClick={() => navigate('/assistant/server-test')}>
                <Server className="mr-3 h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">Тест сервера</div>
                  <div className="text-xs text-gray-500">Проверка API</div>
                </div>
              </DropdownItem>
              
              <DropdownItem onClick={() => navigate('/assistant/session-debug')}>
                <Database className="mr-3 h-4 w-4 text-indigo-600" />
                <div>
                  <div className="font-medium">Диагностика сессий</div>
                  <div className="text-xs text-gray-500">Проверка авторизации</div>
                </div>
              </DropdownItem>
              
              <DropdownSeparator />
              
              {/* Logout */}
              <DropdownItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-3 h-4 w-4" />
                <div>
                  <div className="font-medium">Выйти</div>
                  <div className="text-xs text-gray-500">Завершить сессию</div>
                </div>
              </DropdownItem>
            </CustomDropdown>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center px-4 lg:px-6 bg-gradient-to-r from-white to-gray-50">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden mr-3 hover:bg-blue-50"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {menuItems.find(item => isActiveRoute(item.path))?.label || 'Панель управления'}
            </h2>
            <p className="text-sm text-gray-500">
              {menuItems.find(item => isActiveRoute(item.path))?.description || 'Управление системой'}
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/assistant/token-history')}
              className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
            >
              <Wallet className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">{tokenBalance.toLocaleString()}</span>
              <span className="text-xs text-gray-500">токенов</span>
            </Button>
            
            <CustomDropdown
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full hover:bg-blue-50"
                >
                  <div className="h-6 w-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                </Button>
              }
            >
              <DropdownLabel>
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </DropdownLabel>
              <DropdownSeparator />
              
              {/* Token Balance Section */}
              <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 mx-2 rounded-md border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Баланс токенов</span>
                    <div className="text-xs text-gray-500">Доступно для использования</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-600">
                      {tokenBalance.toLocaleString()}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate('/assistant/token-history')}
                      className="h-6 w-6 p-0 hover:bg-blue-100 rounded-full"
                      title="Пополнить баланс"
                    >
                      <Plus className="h-3 w-3 text-blue-600" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <DropdownSeparator />
              
              {/* Quick Actions */}
              <DropdownItem onClick={() => navigate('/assistant/token-history')}>
                <Wallet className="mr-3 h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">История токенов</div>
                  <div className="text-xs text-gray-500">Пополнения и списания</div>
                </div>
              </DropdownItem>
              
              <DropdownItem onClick={() => navigate('/assistant/token-history?action=buy')}>
                <Plus className="mr-3 h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">Пополнить баланс</div>
                  <div className="text-xs text-gray-500">Купить токены</div>
                </div>
              </DropdownItem>
              
              <DropdownItem onClick={() => navigate('/assistant/ai-settings')}>
                <Bot className="mr-3 h-4 w-4 text-purple-600" />
                <div>
                  <div className="font-medium">Настройки AI</div>
                  <div className="text-xs text-gray-500">API ключи и провайдеры</div>
                </div>
              </DropdownItem>
              
              <DropdownSeparator />
              
              {/* Settings */}
              <DropdownItem onClick={() => navigate('/assistant/user-settings')}>
                <Cog className="mr-3 h-4 w-4 text-gray-600" />
                <div>
                  <div className="font-medium">Настройки профиля</div>
                  <div className="text-xs text-gray-500">Личные данные</div>
                </div>
              </DropdownItem>
              
              {/* Debug Tools */}
              <DropdownItem onClick={() => navigate('/assistant/cookie-debug')}>
                <Bug className="mr-3 h-4 w-4 text-orange-600" />
                <div>
                  <div className="font-medium">Диагностика куки</div>
                  <div className="text-xs text-gray-500">Проверка браузера</div>
                </div>
              </DropdownItem>
              
              <DropdownItem onClick={() => navigate('/assistant/server-test')}>
                <Server className="mr-3 h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">Тест сервера</div>
                  <div className="text-xs text-gray-500">Проверка API</div>
                </div>
              </DropdownItem>
              
              <DropdownItem onClick={() => navigate('/assistant/session-debug')}>
                <Database className="mr-3 h-4 w-4 text-indigo-600" />
                <div>
                  <div className="font-medium">Диагностика сессий</div>
                  <div className="text-xs text-gray-500">Проверка авторизации</div>
                </div>
              </DropdownItem>
              
              <DropdownSeparator />
              
              {/* Logout */}
              <DropdownItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-3 h-4 w-4" />
                <div>
                  <div className="font-medium">Выйти</div>
                  <div className="text-xs text-gray-500">Завершить сессию</div>
                </div>
              </DropdownItem>
            </CustomDropdown>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 