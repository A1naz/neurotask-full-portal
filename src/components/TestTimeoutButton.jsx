import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TestTimeoutButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const handleLongRequest = async () => {
    setIsLoading(true);
    setStartTime(Date.now());
    
    toast.info('🕐 Запущен длительный запрос (120 секунд)...', {
      duration: 5000,
    });

    try {
      const response = await fetch('/api/test/long-request', {
        method: 'POST',
        timeout: 300000,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Важно для передачи cookies с сессией
        body: JSON.stringify({
          testData: 'Тестовый запрос на 120 секунд'
        }),
      });

      const data = await response.json();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      if (response.ok) {
        toast.success(`✅ Длительный запрос завершен за ${duration}с!`, {
          description: data.message,
          duration: 10000,
        });
      } else {
        toast.error(`❌ Ошибка запроса (${response.status}): ${data.message}`, {
          duration: 10000,
        });
      }
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (error.name === 'AbortError') {
        toast.error(`⏰ Запрос отменен через ${duration}с`, {
          duration: 10000,
        });
      } else {
        toast.error(`❌ Ошибка сети через ${duration}с: ${error.message}`, {
          duration: 10000,
        });
      }
    } finally {
      setIsLoading(false);
      setStartTime(null);
    }
  };

  const handleQuickTest = async () => {
    try {
      const response = await fetch('/api/test/quick-test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Важно для передачи cookies с сессией
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('⚡ Быстрый тест успешно выполнен!', {
          description: data.message,
          duration: 3000,
        });
      } else {
        toast.error(`❌ Ошибка быстрого теста: ${data.message}`);
      }
    } catch (error) {
      toast.error(`❌ Ошибка сети: ${error.message}`);
    }
  };

  const getElapsedTime = () => {
    if (!startTime) return 0;
    return ((Date.now() - startTime) / 1000).toFixed(1);
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-500 mb-2">
        🧪 Тестирование таймаутов
      </div>
      
      {/* Длительный запрос */}
      <Button
        onClick={handleLongRequest}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="w-full justify-start text-xs"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            {getElapsedTime()}s / 120s
          </>
        ) : (
          <>
            <Clock className="h-3 w-3 mr-2" />
            Длительный запрос (120с)
          </>
        )}
      </Button>

      {/* Быстрый тест */}
      <Button
        onClick={handleQuickTest}
        variant="ghost"
        size="sm"
        className="w-full justify-start text-xs"
      >
        <CheckCircle className="h-3 w-3 mr-2" />
        Быстрый тест
      </Button>

      {isLoading && (
        <div className="text-xs text-gray-500 text-center">
          <div className="animate-pulse">
            ⏳ Ожидание ответа от сервера...
          </div>
          <div className="mt-1">
            Прошло: {getElapsedTime()}с из 120с
          </div>
        </div>
      )}
    </div>
  );
};

export default TestTimeoutButton;
