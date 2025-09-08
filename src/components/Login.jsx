import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, resendVerificationCode, verifyEmail, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [tempUserData, setTempUserData] = useState(null);

  // Этот useEffect больше не нужен, ProtectedRoute справится с редиректом
  // авторизованного пользователя со страницы логина.
  /*
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/assistant');
    }
  }, [isAuthenticated, navigate]);
  */

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      if (result.allowedRoutes && result.allowedRoutes.includes('/assistant')) {
        navigate('/assistant');
      } else {
        const firstAllowedRoute = result.allowedRoutes && result.allowedRoutes[0];
        navigate(firstAllowedRoute || '/user-settings');
      }
    } else if (result.needsVerification) {
      setTempUserData({ id: result.userId });
      setVerificationStep(true);
    } else {
      setError(result.message || 'Ошибка входа');
    }

    setLoading(false);
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (verificationCode.length !== 6) {
      setError('Введите 6-значный код подтверждения');
      setLoading(false);
      return;
    }

    const result = await verifyEmail(tempUserData.id, formData.email, verificationCode);

    if (result.success && result.isAuthenticated) {
      if (result.allowedRoutes && result.allowedRoutes.includes('/assistant')) {
        navigate('/assistant');
      } else {
        const firstAllowedRoute = result.allowedRoutes && result.allowedRoutes[0];
        navigate(firstAllowedRoute || '/user-settings');
      }
    } else {
      setError(result.message || 'Неверный код подтверждения');
    }

    setLoading(false);
  };

  const resendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await resendVerificationCode(tempUserData.id, formData.email);
      
      if (result.success) {
        setError('Код подтверждения отправлен повторно');
      } else {
        setError(result.message || 'Ошибка при отправке кода');
      }
    } catch (error) {
      setError('Ошибка при отправке кода');
    }

    setLoading(false);
  };

  if (verificationStep) {
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
            <p className="text-gray-600 mt-2">Подтверждение email</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Подтверждение</CardTitle>
              <CardDescription className="text-center">
                Введите код подтверждения, отправленный на ваш email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerification} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Код подтверждения</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="verificationCode"
                      type="text"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="pl-10 text-center text-lg tracking-widest"
                      required
                      maxLength={6}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Подтверждение...
                    </>
                  ) : (
                    'Подтвердить'
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resendCode}
                    disabled={loading}
                    className="text-sm"
                  >
                    Отправить код повторно
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">NeuroTask</h1>
          
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Войдите в свой аккаунт</CardTitle>
            <CardDescription className="text-center">
              Введите ваши данные для входа в систему
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">Сохраните данные, чтобы всегда были под рукой</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-sm text-gray-600">
                  <Link
                    to="/password-reset"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Забыли пароль? Восстановите за 30 секунд.
                  </Link>
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Вход...
                  </>
                  ) : (
                    'Войти'
                  )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              
              <p className="text-sm text-gray-600">
                Ещё не зарегистрированы?{' '}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;

