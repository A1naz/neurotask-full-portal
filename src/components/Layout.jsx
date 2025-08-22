import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  User,
  Menu,
  X,
  MessageSquare,
  Cog,
  Wallet,
  Plus,
  Bot,
  Sparkles,
  FileText,
  Users,
  TrendingUp,
  Share2,
  Target,
  Megaphone,
  Headphones,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  Wand2,
  Video,
  Image,
  Music,
  CheckSquare,
  Home, // Добавим недостающие
  ListChecks,
  Calendar,
  Landmark,
  History,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // Импортируем Skeleton
import {
  CustomDropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from '@/components/ui/custom-dropdown';
import { useAuth } from '@/contexts/AuthContext';
import { useTokenBalance } from '@/contexts/TokenBalanceContext';
import { cn } from "@/lib/utils";
import ProfileDropdown from './ProfileDropdown'; // Импортируем новый компонент

// Маппинг имен иконок на компоненты иконок
const iconComponents = {
  MessageSquare,
  Sparkles,
  CheckSquare,
  Wand2,
  Video,
  Image,
  Music,
  Users,
  FileText,
  TrendingUp,
  Share2,
  Target,
  Megaphone,
  ShoppingCart,
  Headphones,
  Home, // Добавим недостающие
  ListChecks,
  Bot,
  Calendar,
  Landmark,
  History,
  Cpu,
  Settings
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMenuItems, setSidebarMenuItems] = useState([]);
  const [profileMenuItems, setProfileMenuItems] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => JSON.parse(localStorage.getItem('sidebar-collapsed')) || false
  );
  
  const [agentsExpanded, setAgentsExpanded] = useState(() => {
    // Загружаем состояние из localStorage при инициализации
    const saved = localStorage.getItem('agentsExpanded');
    return saved !== null ? JSON.parse(saved) : true; // По умолчанию развернуто
  });
  const [generationsExpanded, setGenerationsExpanded] = useState(() => {
    // Загружаем состояние из localStorage при инициализации
    const saved = localStorage.getItem('generationsExpanded');
    return saved !== null ? JSON.parse(saved) : true; // По умолчанию развернуто
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const { user, logout, API_BASE, csrfToken, setAllowedRoutes } = useAuth();
  const { balance: tokenBalance } = useTokenBalance();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Загрузка меню с сервера
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!user) return;
      
      setIsLoadingMenu(true);
      setMenuError(null);
      
      try {
        const response = await fetch(`${API_BASE}/api/menu`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить конфигурацию меню.');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Функция для добавления иконок к пунктам меню
          const mapIcons = (items) => {
            return items.map(item => ({
              ...item,
              icon: iconComponents[item.iconName],
              children: item.children ? mapIcons(item.children) : [],
            }));
          };
          
          setSidebarMenuItems(mapIcons(data.sidebarMenuItems));
          setProfileMenuItems(mapIcons(data.profileMenuItems));

          // Рекурсивно собираем все доступные пути для ProtectedRoute
          const getAllPaths = (items) => {
            let paths = [];
            items.forEach(item => {
              if (item.path) {
                paths.push(item.path);
              }
              if (item.children) {
                paths = paths.concat(getAllPaths(item.children));
              }
            });
            return paths;
          };
          const sidebarPaths = getAllPaths(data.sidebarMenuItems);
          const profilePaths = getAllPaths(data.profileMenuItems);
          // Объединяем и удаляем дубликаты
          setAllowedRoutes([...new Set([...sidebarPaths, ...profilePaths])]);

        } else {
          throw new Error(data.message || 'Ошибка при получении меню.');
        }
      } catch (error) {
        setMenuError(error.message);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    fetchMenuItems();
  }, [user, API_BASE, setAllowedRoutes]);

  // Загрузить настройки интерфейса из базы данных
  const loadInterfaceSettings = async () => {
    if (!user?._id) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/users/${user._id}/settings`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          // Обновляем состояние компонента
          setAgentsExpanded(data.settings.agentsExpanded ?? true);
          setGenerationsExpanded(data.settings.generationsExpanded ?? true);
          
          // Синхронизируем с localStorage для быстрого доступа
          localStorage.setItem('agentsExpanded', JSON.stringify(data.settings.agentsExpanded ?? true));
          localStorage.setItem('generationsExpanded', JSON.stringify(data.settings.generationsExpanded ?? true));
        }
      }
    } catch (error) {
      }
  };

  // Сохранить настройки интерфейса в базу данных
  const saveInterfaceSettings = async (agentsExpanded, generationsExpanded) => {
    if (!user?._id) {
      // Если пользователь не авторизован, сохраняем только в localStorage
      return;
    }
    
    if (!csrfToken) {
      // Если CSRF токен недоступен, сохраняем только в localStorage
      return;
    }
    
    setIsSavingSettings(true);
    try {
      const response = await fetch(`${API_BASE}/api/users/${user._id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          interfaceSettings: {
            agentsExpanded,
            generationsExpanded
          }
        })
      });
      
      if (!response.ok) {
        // В случае ошибки, по крайней мере сохраняем в localStorage
        } else {
        }
    } catch (error) {
      // В случае ошибки, по крайней мере сохраняем в localStorage
      } finally {
      setIsSavingSettings(false);
    }
  };

  // Загружаем настройки при авторизации пользователя
  useEffect(() => {
    if (user?._id) {
      loadInterfaceSettings();
    }
  }, [user?._id]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    if (path === '/assistant') {
      // Для кнопки "Ассистент" активна только если мы точно на /assistant, а не на /assistant/multi-chat
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const renderMenuItems = () => {
    if (isLoadingMenu) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="ml-4 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="ml-4 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      );
    }

    if (menuError) {
      return (
        <div className="text-red-500 text-center p-4">
          <p>Ошибка загрузки меню:</p>
          <p className="text-sm">{menuError}</p>
        </div>
      );
    }

    return sidebarMenuItems.map((item) => { // Используем sidebarMenuItems
      const Icon = item.icon;
      const hasChildren = item.children && item.children.length > 0;
      const isActive = isActiveRoute(item.path);
      
      return (
        <div key={item.id}>
          {hasChildren ? (
            // Элемент с дочерними элементами (Генерации, Агенты)
            <div>
              <div className="flex items-center gap-1 mb-2">
                {/* Основная кнопка группы */}
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "flex-1 justify-start",
                    isActive 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'hover:bg-blue-50',
                    isSidebarCollapsed && "px-2"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  {Icon && <Icon className={cn("h-5 w-5", isSidebarCollapsed ? "mx-auto" : "mr-3")} />}
                  {!isSidebarCollapsed && item.label}
                </Button>
                
                {/* Кнопка разворачивания/сворачивания */}
                {!isSidebarCollapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-blue-50"
                    disabled={isSavingSettings}
                    onClick={() => {
                      // Обрабатываем изменение состояния для вкладки "Агенты"
                      if (item.id === 'agents') {
                        const newState = !agentsExpanded;
                        setAgentsExpanded(newState);
                        localStorage.setItem('agentsExpanded', JSON.stringify(newState));
                        saveInterfaceSettings(newState, generationsExpanded);
                      } 
                      // Обрабатываем изменение состояния для вкладки "Генерации"
                      else if (item.id === 'generations') {
                        const newState = !generationsExpanded;
                        setGenerationsExpanded(newState);
                        localStorage.setItem('generationsExpanded', JSON.stringify(newState));
                        saveInterfaceSettings(agentsExpanded, newState);
                      }
                    }}
                  >
                    {isSavingSettings ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (item.id === 'agents' ? agentsExpanded : generationsExpanded) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              
              {/* Render children if expanded */}
              {hasChildren && ((item.id === 'agents' && agentsExpanded) || (item.id === 'generations' && generationsExpanded)) && (
                <div className="ml-4 space-y-1 mb-2">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    if (!ChildIcon) return null; // Добавим проверку
                    const isChildActive = isActiveRoute(child.path);
                    
                    return (
                      <Button
                        key={child.id}
                        variant={isChildActive ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start text-sm",
                          isChildActive 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'hover:bg-blue-50',
                          isSidebarCollapsed && "px-2"
                        )}
                        onClick={() => navigate(child.path)}
                      >
                        {ChildIcon && <ChildIcon className={cn("h-4 w-4", isSidebarCollapsed ? "mx-auto" : "mr-3")} />}
                        {!isSidebarCollapsed && child.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // Обычный элемент без дочерних элементов
            <Button
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start mb-2",
                isActive 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'hover:bg-blue-50',
                isSidebarCollapsed && "px-2"
              )}
              onClick={() => navigate(item.path)}
            >
              {Icon && <Icon className={cn("h-5 w-5", isSidebarCollapsed ? "mx-auto" : "mr-3")} />}
              {!isSidebarCollapsed && item.label}
            </Button>
          )}
        </div>
      );
    });
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full',
        isSidebarCollapsed ? 'w-20' : 'w-64'
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            {!isSidebarCollapsed && (
              <div 
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/assistant')}
              >
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
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
            >
              {isSidebarCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
            </Button>
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
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            {renderMenuItems()}
          </nav>

          {/* User Profile Section - Fixed at bottom */}
          <div className="border-t bg-gray-50 p-4 mt-auto sticky bottom-0 z-10">
            <ProfileDropdown
              direction="up"
              user={user}
              tokenBalance={tokenBalance}
              profileMenuItems={profileMenuItems}
              isLoading={isLoadingMenu}
              error={menuError}
              onLogout={handleLogout}
              trigger={
                <Button variant="ghost" className="w-full justify-start p-3 hover:bg-white transition-colors group">
                  <div className="flex items-center w-full">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    {!isSidebarCollapsed && (
                      <div className="ml-3 text-left flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{user?.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    )}
                    {!isSidebarCollapsed && (
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </Button>
              }
            />
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
            
            <ProfileDropdown
              direction="down"
              user={user}
              tokenBalance={tokenBalance}
              profileMenuItems={profileMenuItems}
              isLoading={isLoadingMenu}
              error={menuError}
              onLogout={handleLogout}
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
            />
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