import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
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
  ShoppingCart,
  Headphones,
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
  Settings
} from 'lucide-react';

const AuthContext = createContext();

const iconComponents = {
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
  ShoppingCart,
  Headphones,
  Home,
  ListChecks,
  Calendar,
  Landmark,
  History,
  Cpu,
  Settings,
  ChevronDown,
  ChevronRight,
  Wand2,
  Video,
  Image,
  Music,
  CheckSquare,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tempUserData, setTempUserData] = useState(null);
  const [allowedRoutes, setAllowedRoutes] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [agentsExpanded, setAgentsExpanded] = useState(true);
  const [generationsExpanded, setGenerationsExpanded] = useState(true);
  // New state for menu items and loading
  const [sidebarMenuItems, setSidebarMenuItems] = useState([]);
  const [profileMenuItems, setProfileMenuItems] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false); // Change to false
  const [menuError, setMenuError] = useState(null);
  const [userChatHistories, setUserChatHistories] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);


// API base URL
const API_BASE = (() => {
  // Приоритет переменным окружения Vite
  if (import.meta.env.VITE_API_BASE) {
    
    return import.meta.env.VITE_API_BASE;
    console.log(import.meta.env.VITE_API_BASE);
  }
  
  // Fallback для production
  if (process.env.NODE_ENV === 'production') {
    console.log('https://neurotask.ru');
    return 'https://neurotask.ru';
  }
  
  console.log('http://localhost:3001');
  // Development
  return 'http://localhost:3001';
})();

  // Debug function to check cookies
  const debugCookies = () => {
    };

  // Function to get CSRF token
  const getCsrfToken = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/csrf-token`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.csrfToken);
        return data.csrfToken;
      }
    } catch (error) {
      }
    return null;
  };

  // Function to map icons to menu items - moved outside fetchAllowedRoutes for optimization
  const mapIcons = useCallback((items) => {
    return items.map(item => ({
      ...item,
      icon: iconComponents[item.iconName],
      children: item.children ? mapIcons(item.children) : [],
    }));
  }, []);

  const fetchAllowedRoutes = useCallback(async (user) => {
    // Ensure this function is only called if a user is present
    if (!user) return [];

    setIsLoadingMenu(true);
    setMenuError(null);

    try {
      const response = await fetch(`${API_BASE}/api/menu`, {
        credentials: 'include',
      });
      if (response.ok) {
        const menuConfig = await response.json();

        // Use the globally defined mapIcons
        setSidebarMenuItems(mapIcons(menuConfig.sidebarMenuItems || []));
        setProfileMenuItems(mapIcons(menuConfig.profileMenuItems || []));
        
        // Устанавливаем состояние сайдбара
        setIsSidebarCollapsed(menuConfig.isSidebarCollapsed || false);
        setAgentsExpanded(menuConfig.agentsExpanded ?? true);
        setGenerationsExpanded(menuConfig.generationsExpanded ?? true);

        // Рекурсивно извлекаем все пути
        const getAllPaths = (items) => {
          let paths = [];
          for (const item of items) {
            if (item.path) {
              paths.push(item.path);
            }
            if (item.children) {
              paths = paths.concat(getAllPaths(item.children));
            }
          }
          return paths;
        };
        
        const sidebarPaths = getAllPaths(menuConfig.sidebarMenuItems || []);
        const profilePaths = getAllPaths(menuConfig.profileMenuItems || []);
        // Объединяем и удаляем дубликаты
        const allAllowedPaths = [...new Set([...sidebarPaths, ...profilePaths])];
        setAllowedRoutes(allAllowedPaths);
        return allAllowedPaths;
      } else {
        throw new Error('Не удалось загрузить конфигурацию меню.');
      }
    } catch (error) {
      console.error('Failed to fetch allowed routes:', error);
      setMenuError(error.message || 'Ошибка при получении меню.');
      setAllowedRoutes([]);
      return [];
    } finally {
      setIsLoadingMenu(false);
    }
  }, [API_BASE, mapIcons]);

  const updateSidebarState = useCallback(async (isCollapsed) => {
    if (!user) return;

    try {
      // Оптимистичное обновление UI
      setIsSidebarCollapsed(isCollapsed);

      await fetch(`${API_BASE}/api/users/${user._id}/settings/sidebar`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ isCollapsed }),
      });
    } catch (error) {
      console.error('Failed to update sidebar state:', error);
      // В случае ошибки можно откатить состояние, если это необходимо
      setIsSidebarCollapsed(!isCollapsed);
    }
  }, [user, csrfToken, API_BASE]);

  const updateInterfaceSettings = useCallback(async (settings) => {
    if (!user) return;

    const oldSettings = {
      agentsExpanded,
      generationsExpanded,
    };

    // Оптимистичное обновление
    if (typeof settings.agentsExpanded === 'boolean') {
      setAgentsExpanded(settings.agentsExpanded);
    }
    if (typeof settings.generationsExpanded === 'boolean') {
      setGenerationsExpanded(settings.generationsExpanded);
    }

    try {
      await fetch(`${API_BASE}/api/users/${user._id}/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ interfaceSettings: settings }),
      });
    } catch (error) {
      console.error('Failed to update interface settings:', error);
      // Откат в случае ошибки
      setAgentsExpanded(oldSettings.agentsExpanded);
      setGenerationsExpanded(oldSettings.generationsExpanded);
    }
  }, [user, csrfToken, API_BASE, agentsExpanded, generationsExpanded]);

  const loadUserChatHistories = useCallback(async () => {
    if (!user || !csrfToken) return;
    try {
      const response = await fetch(`${API_BASE}/api/multi-chat/all-chat-histories`, {
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserChatHistories(data.chatHistories || []);
      } else {
        console.error('Ошибка загрузки истории чатов пользователя');
      }
    } catch (error) {
      console.error('Ошибка загрузки истории чатов пользователя:', error);
    }
  }, [user, csrfToken, API_BASE]);
  
  const selectChat = useCallback(async (chatId) => {
      if (!user || !csrfToken) return;
      try {
          await fetch(`${API_BASE}/api/multi-chat/ai-settings/${user._id}/current-chat`, {
              method: 'PATCH',
              credentials: 'include',
              headers: {
                  'Content-Type': 'application/json',
                  'X-CSRF-Token': csrfToken,
                  'x-user-id': user._id,
              },
              body: JSON.stringify({ currentChatId: chatId }),
          });
          setCurrentChatId(chatId);
      } catch (error) {
          console.error('Ошибка при выборе чата:', error);
      }
  }, [user, csrfToken, API_BASE]);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      debugCookies(); // Debug cookies before request
      
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user); // Store the full user object
        setIsAuthenticated(true);
        // Get CSRF token after successful authentication
        await getCsrfToken();
        // No longer returning, just await
        await fetchAllowedRoutes(userData.user); 
      } else {
        setUser(null);
        setIsAuthenticated(false);
        }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      debugCookies(); // Debug cookies before login
      
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const loggedInUser = data.user;
        setUser(loggedInUser); // Store the full user object
        setIsAuthenticated(true);
        debugCookies(); // Debug cookies after successful login
        
        // Get CSRF token after successful login
        await getCsrfToken();
        const routes = await fetchAllowedRoutes(loggedInUser); 
        
        return { success: true, allowedRoutes: routes }; // Возвращаем маршруты для редиректа
      } else if (response.status === 403 && data.needsVerification) {
        return { 
          success: false, 
          message: data.message,
          needsVerification: true,
          userId: data.userId
        };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Ошибка подключения к серверу' };
    }
  };

  const register = async (email, password) => {
    try {
      debugCookies(); // Debug cookies before registration
      
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Don't set user yet - wait for email verification
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Ошибка подключения к серверу' };
    }
  };

  const verifyEmail = async (userId, email, code) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-email`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        // Автоматически входим в систему после успешной верификации
        if (data.isAuthenticated && data.user) {
          const verifiedUser = data.user;
          setUser(verifiedUser);
          setIsAuthenticated(true);
          setTempUserData(null); // Очищаем временные данные
          await fetchAllowedRoutes(verifiedUser);
        }
        
        // Get CSRF token after successful email verification
        await getCsrfToken();
        
        return { success: true, isAuthenticated: data.isAuthenticated, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Ошибка подключения к серверу' };
    }
  };

  const resendVerificationCode = async (userId, email) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Ошибка подключения к серверу' };
    }
  };

  const logout = async () => {
    try {
      debugCookies(); // Debug cookies before logout
      
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      } catch (error) {
      } finally {
      setUser(null);
      setIsAuthenticated(false);
      setCsrfToken(null); // Clear CSRF token on logout
      setAllowedRoutes([]); // Сбрасываем разрешенные маршруты при выходе
      debugCookies(); // Debug cookies after logout
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Ошибка подключения к серверу' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/password`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Ошибка подключения к серверу' };
    }
  };

  // Re-fetch user data when isAuthenticated becomes true
  useEffect(() => {
    const refreshUserData = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await fetch(`${API_BASE}/api/auth/me`, {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          }
        } catch (error) {
          console.error("Failed to refresh user data:", error);
        }
      }
    };
    refreshUserData();
  }, [isAuthenticated]);


  const value = {
    user,
    loading,
    csrfToken,
    isAuthenticated,
    tempUserData,
    setTempUserData,
    login,
    register,
    logout,
    verifyEmail,
    resendVerificationCode,
    updateProfile,
    changePassword,
    checkAuth,
    API_BASE,
    debugCookies, // Expose debug function
    allowedRoutes,
    setAllowedRoutes,
    isSidebarCollapsed,
    updateSidebarState,
    agentsExpanded,
    generationsExpanded,
    updateInterfaceSettings,
    // Export new menu states
    sidebarMenuItems,
    profileMenuItems,
    isLoadingMenu,
    menuError,
    fetchAllowedRoutes, // Expose fetchAllowedRoutes
    userChatHistories,
    currentChatId,
    selectChat,
    loadUserChatHistories,
  };

  // Fetch menu items when user changes or on initial load if not already loaded
  useEffect(() => {
    if (user && !sidebarMenuItems.length && !isLoadingMenu && !menuError) {
      fetchAllowedRoutes();
    }
  }, [user, sidebarMenuItems, isLoadingMenu, menuError, fetchAllowedRoutes]); // Add fetchAllowedRoutes to dependencies

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

