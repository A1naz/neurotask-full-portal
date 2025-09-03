import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock } from 'lucide-react';
import axios from 'axios'; // Import axios

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code, 3: Set new password
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState(null); // To store user ID from initial reset request

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'; // Adjust as needed

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/request-password-reset`, {
        email,
      }, {
        withCredentials: true,
      });

      if (response.data.success) {
        setUserId(response.data.userId); // Assuming backend sends back userId for subsequent steps
        setStep(2);
        setSuccess(response.data.message);
      } else {
        setError(response.data.message || 'Ошибка при запросе сброса пароля.');
      }
    } catch (err) {
      console.error('Request password reset error:', err);
      setError(err.response?.data?.message || 'Ошибка сервера при запросе сброса пароля.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-reset-code`, {
        userId,
        code,
      }, {
        withCredentials: true,
      });

      if (response.data.success) {
        setStep(3);
        setSuccess(response.data.message);
      } else {
        setError(response.data.message || 'Неверный или просроченный код подтверждения.');
      }
    } catch (err) {
      console.error('Verify reset code error:', err);
      setError(err.response?.data?.message || 'Ошибка сервера при проверке кода.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают.');
      setLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setError('Пароль должен быть не менее 8 символов.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        userId,
        code,
        newPassword,
      }, {
        withCredentials: true,
      });

      if (response.data.success) {
        setSuccess(response.data.message + ' Вы можете войти, используя новый пароль.');
        // Optionally redirect to login page after a short delay
        // setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(response.data.message || 'Ошибка при сбросе пароля.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || 'Ошибка сервера при сбросе пароля.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/neurotask-logo.jpg" 
              alt="Neurotask Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Neurotask</h1>
          <p className="text-gray-600 mt-2">Сброс пароля</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Сброс пароля</CardTitle>
            <CardDescription className="text-center">
              {step === 1 && 'Введите ваш email для сброса пароля'}
              {step === 2 && 'Введите код подтверждения, отправленный на ваш email'}
              {step === 3 && 'Введите ваш новый пароль'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4 bg-green-100 text-green-800 border-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {step === 1 && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Отправка кода...
                    </>
                  ) : (
                    'Отправить код'
                  )}
                </Button>
                <div className="mt-4 text-center">
                  <Link
                    to="/login"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Вернуться к входу
                  </Link>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Код подтверждения</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="code"
                      type="text"
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="pl-10 text-center text-lg tracking-widest"
                      required
                      maxLength={6}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Проверка кода...
                    </>
                  ) : (
                    'Подтвердить код'
                  )}
                </Button>
                <div className="mt-4 text-center">
                  <Link
                    to="/login"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Вернуться к входу
                  </Link>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Новый пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading || !newPassword || !confirmPassword}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение пароля...
                    </>
                  ) : (
                    'Сохранить новый пароль'
                  )}
                </Button>
                <div className="mt-4 text-center">
                  <Link
                    to="/login"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Вернуться к входу
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasswordReset;
