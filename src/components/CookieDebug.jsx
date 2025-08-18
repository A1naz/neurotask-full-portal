import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const CookieDebug = () => {
  const { debugCookies, API_BASE } = useAuth();
  const [cookieInfo, setCookieInfo] = useState(null);

  const checkCookies = () => {
    debugCookies();
    
    const info = {
      cookies: document.cookie,
      domain: window.location.hostname,
      protocol: window.location.protocol,
      apiBase: API_BASE,
      userAgent: navigator.userAgent,
      cookieEnabled: navigator.cookieEnabled,
      timestamp: new Date().toISOString(),
    };
    
    setCookieInfo(info);
  };

  const clearCookies = () => {
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    setCookieInfo(null);
    };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Диагностика куки
          <Badge variant="outline">Debug</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkCookies} variant="outline">
            Проверить куки
          </Button>
          <Button onClick={clearCookies} variant="destructive">
            Очистить куки
          </Button>
        </div>

        {cookieInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Основная информация:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Домен:</strong> {cookieInfo.domain}</p>
                  <p><strong>Протокол:</strong> {cookieInfo.protocol}</p>
                  <p><strong>API Base:</strong> {cookieInfo.apiBase}</p>
                  <p><strong>Куки включены:</strong> {cookieInfo.cookieEnabled ? 'Да' : 'Нет'}</p>
                  <p><strong>Время:</strong> {cookieInfo.timestamp}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Куки:</h4>
                <div className="bg-muted p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                  {cookieInfo.cookies || 'Куки отсутствуют'}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">User Agent:</h4>
              <div className="bg-muted p-2 rounded text-xs font-mono max-h-20 overflow-y-auto">
                {cookieInfo.userAgent}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Возможные причины проблем с куки:</h4>
          <ul className="text-sm space-y-1">
            <li>• <strong>CORS настройки:</strong> Сервер должен разрешать credentials</li>
            <li>• <strong>SameSite:</strong> Куки должны иметь правильные настройки SameSite</li>
            <li>• <strong>Домены:</strong> Куки должны быть доступны для вашего домена</li>
            <li>• <strong>HTTPS:</strong> В продакшене куки требуют HTTPS</li>
            <li>• <strong>Браузерные настройки:</strong> Проверьте настройки приватности</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CookieDebug; 