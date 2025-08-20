import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShieldAlert } from 'lucide-react';

const AccessDenied = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldAlert className="w-16 h-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Доступ запрещен</CardTitle>
          <CardDescription>У вас нет необходимых прав для просмотра этой страницы.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Если вы считаете, что это ошибка, пожалуйста, свяжитесь с администратором вашей команды.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDenied;
