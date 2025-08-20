import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

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

// API base URL
const API_BASE = (() => {
  // Приоритет переменным окружения Vite
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  
  // Fallback для production
  if (process.env.NODE_ENV === 'production') {
    return 'https://neurotask.ru';
  }
  
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
        setUser(userData.user);
        setIsAuthenticated(true);
        // Get CSRF token after successful authentication
        await getCsrfToken();
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
        setUser(data.user);
        setIsAuthenticated(true);
        debugCookies(); // Debug cookies after successful login
        
        // Get CSRF token after successful login
        await getCsrfToken();
        
        return { success: true };
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

  const register = async (username, email, password) => {
    try {
      debugCookies(); // Debug cookies before registration
      
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
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
          setUser(data.user);
          setIsAuthenticated(true);
          setTempUserData(null); // Очищаем временные данные
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

