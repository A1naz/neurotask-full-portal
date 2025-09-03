import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Lock, User, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [tempUserData, setTempUserData] = useState(null);

  const { register, verifyEmail, resendVerificationCode } = useAuth();
  const navigate = useNavigate();

  // Password validation rules
  const passwordRules = {
    length: { min: 8, max: 128 },
    hasUppercase: /[A-Z]/,
    hasLowercase: /[a-z]/,
    hasNumber: /\d/,
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
  };

  const validatePassword = (password) => {
    return {
      length: password.length >= passwordRules.length.min && password.length <= passwordRules.length.max,
      hasUppercase: passwordRules.hasUppercase.test(password),
      hasLowercase: passwordRules.hasLowercase.test(password),
      hasNumber: passwordRules.hasNumber.test(password),
      hasSpecialChar: passwordRules.hasSpecialChar.test(password),
    };
  };

  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setMessage(''); // Очищаем сообщения при изменении формы
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate username - REMOVED
    // if (formData.username.length < 3) {
    //   setError('Имя пользователя должно содержать минимум 3 символа');
    //   setLoading(false);
    //   return;
    // }

    // if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
    //   setError('Имя пользователя может содержать только буквы, цифры и подчеркивания');
    //   setLoading(false);
    //   return;
    // }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Введите корректный email адрес');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 10) { // Changed minimum length to 10
      setError('Пароль должен содержать минимум 10 символов');
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData.email, formData.password); // Removed username

      if (result.success) {
        setTempUserData(result.user);
        setVerificationStep(true);
      } else {
        setError(result.message || 'Ошибка регистрации');
      }
    } catch (error) {
      setError('Ошибка при регистрации. Попробуйте еще раз.');
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

    try {
      const result = await verifyEmail(tempUserData.id, tempUserData.email, verificationCode);

      if (result.success) {
        if (result.isAuthenticated) {
          // Автоматически перенаправляем в профиль после верификации
          setMessage('Email успешно верифицирован! Вы автоматически вошли в систему.');
          setError(''); // Очищаем ошибки
          
          // Небольшая задержка чтобы пользователь увидел сообщение об успехе
          setTimeout(() => {
            navigate('/assistant');
          }, 1500);
        } else {
          setError(result.message || 'Неверный код подтверждения');
        }
      } else {
        setError(result.message || 'Неверный код подтверждения');
      }
    } catch (error) {
      setError('Ошибка при подтверждении email');
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

  const generateStrongPassword = () => {
    const length = 16; // Default length
    const uppercase = true;
    const lowercase = true;
    const numbers = true;
    const symbols = true;

    let password = '';
    const characters = [];

    if (uppercase) {
      characters.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    }
    if (lowercase) {
      characters.push('abcdefghijklmnopqrstuvwxyz');
    }
    if (numbers) {
      characters.push('0123456789');
    }
    if (symbols) {
      characters.push('!@#$%^&*()_+-=[]{}|;:,.<>?');
    }

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      password += characters[randomIndex][Math.floor(Math.random() * characters[randomIndex].length)];
    }
    setFormData(prev => ({ ...prev, password, confirmPassword: password }));
    setError(''); // Clear any previous error
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
                Введите код подтверждения, отправленный на {tempUserData?.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerification} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {message && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{message}</AlertDescription>
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
            <CardTitle className="text-2xl text-center">Регистрация</CardTitle>
            <CardDescription className="text-center">
              Создайте аккаунт для начала работы
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
              </div>

              <div className="space-y-2">
              <Button
                    type="button"
                    variant="outline"
                    onClick={generateStrongPassword}
                    className="w-full mt-2"
                  >
                    Сгенерировать надежный пароль
                  </Button>
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
                    minLength={10} // Changed minLength to 10
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {/* Password strength indicator */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Требования к паролю:</span>
                    {isPasswordValid && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-1 ${passwordValidation.length ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.length ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Минимум 10 символов
                    </div>
                    <div className={`flex items-center gap-1 ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.hasUppercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Заглавная буква
                    </div>
                    <div className={`flex items-center gap-1 ${passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.hasLowercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Строчная буква
                    </div>
                    <div className={`flex items-center gap-1 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.hasNumber ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Цифра
                    </div>
                    <div className={`flex items-center gap-1 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.hasSpecialChar ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Спецсимвол
                    </div>
                  </div>
                  {!isPasswordValid && formData.password && (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      ⚠️ Рекомендуется использовать пароль, соответствующий всем требованиям безопасности
                    </div>
                  )}
              
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
                    minLength={10} // Changed minLength to 10
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-red-600">Пароли не совпадают</p>
                )}
              </div>

              <p className="text-sm text-gray-600 text-center mb-4">
                После регистрации на вашу почту будет отправлен код подтверждения, который необходимо ввести для активации аккаунта.
              </p>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !isPasswordValid || formData.password !== formData.confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Регистрация...
                  </>
                ) : (
                  'Зарегистрироваться'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Уже есть аккаунт?{' '}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Войти
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;

