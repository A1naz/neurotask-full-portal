import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  ChevronsRight,
  Info,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"; // Импортируем Skeleton
import {
  CustomDropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from "@/components/ui/custom-dropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useTokenBalance } from "@/contexts/TokenBalanceContext";
import { cn } from "@/lib/utils";
import ProfileDropdown from "./ProfileDropdown"; // Импортируем новый компонент
import ChatHistoryMenu from './ChatHistoryMenu';
import ContactUsModal from './ContactUsModal'; // Импортируем модальное окно
import ChatHistoryModal from './ChatHistoryModal'; // Импортируем модальное окно истории
import ReferralModal from './ReferralModal'; // Импортируем реферальное модальное окно
import TestTimeoutButton from './TestTimeoutButton'; // Импортируем кнопку тестирования таймаутов

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
  Settings,
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isContactModalOpen, setContactModalOpen] = useState(false);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [isReferralModalOpen, setReferralModalOpen] = useState(false);
  // Remove local menu state
  // const [sidebarMenuItems, setSidebarMenuItems] = useState([]);
  // const [profileMenuItems, setProfileMenuItems] = useState([]);
  // const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  // const [menuError, setMenuError] = useState(null);

  const {
    user,
    logout,
    API_BASE,
    // setAllowedRoutes, // This will be handled internally by AuthContext
    isSidebarCollapsed,
    updateSidebarState,
    agentsExpanded,
    generationsExpanded,
    updateInterfaceSettings,
    allowedRoutes, // Get allowed routes from AuthContext
    fetchAllowedRoutes, // Get fetch function from AuthContext
    sidebarMenuItems, // Get menu items from AuthContext
    profileMenuItems, // Get profile menu items from AuthContext
    isLoadingMenu, // Get loading state from AuthContext
    menuError, // Get error state from AuthContext
    userChatHistories,
    selectChat,
    currentChatId,
    loadUserChatHistories,
  } = useAuth();
  const { balance: tokenBalance, bonusBalance } = useTokenBalance();
  const navigate = useNavigate();
  const location = useLocation();

  // Remove local menu fetching useEffect
  // useEffect(() => {
  //   const fetchMenuItems = async () => {
  //     if (!user) return;
  //
  //     setIsLoadingMenu(true);
  //     setMenuError(null);
  //
  //     try {
  //       const response = await fetch(`${API_BASE}/api/menu`, {
  //         credentials: 'include',
  //       });
  //
  //       if (!response.ok) {
  //         throw new Error('Не удалось загрузить конфигурацию меню.');
  //       }
  //
  //       const data = await response.json();
  //
  //       if (data.success) {
  //         // Функция для добавления иконок к пунктам меню
  //         const mapIcons = (items) => {
  //           return items.map(item => ({
  //             ...item,
  //             icon: iconComponents[item.iconName],
  //             children: item.children ? mapIcons(item.children) : [],
  //           }));
  //         };
  //
  //         setSidebarMenuItems(mapIcons(data.sidebarMenuItems));
  //         setProfileMenuItems(mapIcons(data.profileMenuItems));
  //
  //         // Рекурсивно собираем все доступные пути для ProtectedRoute
  //         const getAllPaths = (items) => {
  //           let paths = [];
  //           items.forEach(item => {
  //             if (item.path) {
  //               paths.push(item.path);
  //             }
  //             if (item.children) {
  //               paths = paths.concat(getAllPaths(item.children));
  //             }
  //           });
  //           return paths;
  //         };
  //         const sidebarPaths = getAllPaths(data.sidebarMenuItems);
  //         const profilePaths = getAllPaths(data.profileMenuItems);
  //         // Объединяем и удаляем дубликаты
  //         setAllowedRoutes([...new Set([...sidebarPaths, ...profilePaths])]);
  //
  //       } else {
  //         throw new Error(data.message || 'Ошибка при получении меню.');
  //       }
  //     } catch (error) {
  //       setMenuError(error.message);
  //     } finally {
  //       setIsLoadingMenu(false);
  //     }
  //   };
  //
  //   fetchMenuItems();
  // }, [user, API_BASE, setAllowedRoutes]);

  // Add an effect to fetch menu items if they are not yet loaded and user is authenticated
  useEffect(() => {
    if (user && !sidebarMenuItems.length && !isLoadingMenu && !menuError) {
      fetchAllowedRoutes();
    }
    if (user) {
        loadUserChatHistories();
    }
  }, [user, sidebarMenuItems, isLoadingMenu, menuError, fetchAllowedRoutes]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActiveRoute = (path) => {
    if (path === "/assistant") {
      // Для кнопки "Ассистент" активна только если мы точно на /assistant, а не на /assistant/multi-chat
      return location.pathname === path;
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const renderChatHistory = () => {
    if (!userChatHistories || userChatHistories.length === 0) {
      return null;
    }

    const groupedByMonth = userChatHistories.reduce((acc, chat) => {
      const month = new Date(chat.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(chat);
      return acc;
    }, {});

    const handleChatClick = (chatId) => {
        selectChat(chatId);
        navigate('/assistant/multi-chat');
    };

    return (
      <div className="mt-4 pt-4 border-t">
        <h2 className="px-4 text-lg font-semibold tracking-tight mb-2 flex items-center">
            <History className="h-5 w-5 mr-2" />
            История
        </h2>
        <div className="space-y-2">
            {Object.entries(groupedByMonth).map(([month, chats]) => (
                <div key={month}>
                    <h3 className="px-4 text-sm font-medium text-gray-500 my-2">{month}</h3>
                    {chats.map(chat => (
                         <Button
                            key={chat.chatId}
                            variant={currentChatId === chat.chatId ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start text-sm mb-1",
                                isSidebarCollapsed && "px-2"
                            )}
                            onClick={() => handleChatClick(chat.chatId)}
                         >
                            {!isSidebarCollapsed && <span className="truncate">{chat.chatTitle || `Чат ${chat.chatId.substring(0,8)}`}</span>}
                         </Button>
                    ))}
                </div>
            ))}
        </div>
        {!isSidebarCollapsed && (
            <Button variant="link" className="w-full mt-2" onClick={() => {/* TODO: Implement show all */}}>
                Показать всё
            </Button>
        )}
      </div>
    );
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

    return sidebarMenuItems.map((item) => {
      // Используем sidebarMenuItems
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
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "hover:bg-blue-50",
                    isSidebarCollapsed && "px-2"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isSidebarCollapsed ? "mx-auto" : "mr-3"
                      )}
                    />
                  )}
                  {!isSidebarCollapsed && item.label}
                </Button>

                {/* Кнопка разворачивания/сворачивания */}
                {!isSidebarCollapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-blue-50"
                    onClick={() => {
                      if (item.id === "agents") {
                        updateInterfaceSettings({
                          agentsExpanded: !agentsExpanded,
                        });
                      } else if (item.id === "generations") {
                        updateInterfaceSettings({
                          generationsExpanded: !generationsExpanded,
                        });
                      }
                    }}
                  >
                    {(
                      item.id === "agents"
                        ? agentsExpanded
                        : generationsExpanded
                    ) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>

              {/* Render children if expanded */}
              {hasChildren &&
                ((item.id === "agents" && agentsExpanded) ||
                  (item.id === "generations" && generationsExpanded)) && (
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
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "hover:bg-blue-50",
                            isSidebarCollapsed && "px-2"
                          )}
                          onClick={() => navigate(child.path)}
                        >
                          {ChildIcon && (
                            <ChildIcon
                              className={cn(
                                "h-4 w-4",
                                isSidebarCollapsed ? "mx-auto" : "mr-3"
                              )}
                            />
                          )}
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
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "hover:bg-blue-50",
                isSidebarCollapsed && "px-2"
              )}
              onClick={() => navigate(item.path)}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isSidebarCollapsed ? "mx-auto" : "mr-3"
                  )}
                />
              )}
              {!isSidebarCollapsed && item.label}
              
            </Button>
          )}
        </div>
      );
    });
  };

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
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className={cn(
              "flex h-16 shrink-0 items-center border-b bg-gradient-to-r from-blue-50 to-indigo-50 px-4",
              isSidebarCollapsed ? "justify-center" : "justify-between"
            )}
          >
            <div
              className="flex cursor-pointer items-center transition-opacity hover:opacity-80"
              onClick={() => navigate("/assistant")}
            >
              <img
                src="/neurotask-logo.jpg"
                alt="Neurotask Logo"
                className="h-10 w-10 rounded-lg object-cover"
              />
              {!isSidebarCollapsed && (
                <div className="ml-3">
                  <h1 className="text-lg font-bold text-gray-900">Neurotask</h1>
                  <p className="text-xs text-gray-600">AI Agents</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            {renderMenuItems()}
            <ChatHistoryMenu onShowHistory={() => setHistoryModalOpen(true)} />
            
            {/* Test Timeout Button */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <TestTimeoutButton />
            </div>
          </nav>

          {/* User Profile Section & Collapse button */}
          <div className="border-t">
            <div
              className={cn(
                "flex",
                isSidebarCollapsed
                  ? "flex-col items-center space-y-1 py-2"
                  : "items-center bg-gray-50 p-4"
              )}
            >
              <div className={cn(!isSidebarCollapsed && "order-1 flex-1")}>
                <ProfileDropdown
                  direction="up"
                  user={user}
                  tokenBalance={tokenBalance}
                  bonusBalance={bonusBalance}
                  profileMenuItems={profileMenuItems}
                  isLoading={isLoadingMenu}
                  error={menuError}
                  onLogout={handleLogout}
                  onContactUsClick={() => setContactModalOpen(true)}
                  onReferralClick={() => setReferralModalOpen(true)}
                  trigger={
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start p-3 hover:bg-white transition-colors group",
                        isSidebarCollapsed && "p-2 justify-center"
                      )}
                    >
                      <div className="flex items-center w-full">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        {!isSidebarCollapsed && (
                          <div className="ml-3 text-left flex-1 max-w-28">
                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {user?.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user?.email}
                            </p>
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

              <div className={cn(!isSidebarCollapsed && "order-2")}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex"
                  onClick={() => updateSidebarState(!isSidebarCollapsed)}
                >
                  {isSidebarCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
                </Button>
              </div>
            </div>
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

          <div className="flex-1 flex justify-center items-center">
            {user && user.isTeamOwner && (!user.tariffId || user.tariffId.name === 'Бесплатно') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/assistant/plans")}
                className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                Перейти на Plus
                <Info className="h-4 w-4 text-gray-500" />
              </Button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/assistant/token-history")}
              className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
            >
              <Wallet className="h-4 w-4 text-green-600" />
              <div className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <span>{tokenBalance.toLocaleString()}</span>
                {/* <span className="text-xs text-blue-500">(+{bonusBalance.toLocaleString()})</span> */}
              </div>
            </Button>

            <ProfileDropdown
              direction="down"
              user={user}
              tokenBalance={tokenBalance}
              bonusBalance={bonusBalance}
              profileMenuItems={profileMenuItems}
              isLoading={isLoadingMenu}
              error={menuError}
              onLogout={handleLogout}
              onContactUsClick={() => setContactModalOpen(true)}
              onReferralClick={() => setReferralModalOpen(true)}
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
      <ContactUsModal isOpen={isContactModalOpen} onClose={() => setContactModalOpen(false)} />
      <ChatHistoryModal isOpen={isHistoryModalOpen} onClose={() => setHistoryModalOpen(false)} />
      <ReferralModal isOpen={isReferralModalOpen} onClose={() => setReferralModalOpen(false)} />
    </div>
  );
};

export default Layout;
