import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, allowedRoutes, user } = useAuth();
  const location = useLocation();

  // Маршруты, которые доступны всегда для залогиненного пользователя
  const alwaysAllowedPaths = ['/settings', '/user-settings']; 

  if (loading) {
    // Можно показать спиннер загрузки
    return <div>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    // Если не аутентифицирован, перенаправляем на страницу входа
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const isOwnerOrAdmin = user && (user.isTeamOwner || user.role === 'admin');

  // Владельцу команды/админу можно все
  if (isOwnerOrAdmin) {
    return children;
  }

  // Проверяем, есть ли у пользователя доступ к текущему маршруту
  const isAllowed = allowedRoutes.includes(location.pathname) || alwaysAllowedPaths.includes(location.pathname);

  if (!isAllowed && allowedRoutes.length > 0) {
    // Если маршруты загружены и текущего среди них нет, перенаправляем
    return <Navigate to="/access-denied" replace />;
  }

  // Если маршруты еще не загрузились (allowedRoutes.length === 0), 
  // или если доступ разрешен, показываем компонент.
  // Эта задержка нужна, чтобы Layout успел загрузить и установить маршруты.
  return children;
};

export default ProtectedRoute;

