import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useTokenBalance } from '@/contexts/TokenBalanceContext';
import { 
  Send, 
  Loader2, 
  Bot, 
  CheckCircle2, 
  AlertTriangle,
  MessageSquare,
  Sparkles,
  Settings,
  Download,
  Copy,
  Trash2,
  BarChart3,
  FileText,
  Zap,
  Maximize2,
  Minimize2,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Plus
} from 'lucide-react';

const MultiChat = () => {
  const { API_BASE, csrfToken, user } = useAuth();
  const { balance, updateBalance } = useTokenBalance();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [responses, setResponses] = useState({});
  const [activeProviders, setActiveProviders] = useState([]);
  const [error, setError] = useState('');

  const [customSystemPrompt, setCustomSystemPrompt] = useState(() => {
    const saved = localStorage.getItem('multichat_custom_system_prompt');
    return saved || '';
  });
  const [defaultSystemPrompt, setDefaultSystemPrompt] = useState('Ты полезный ассистент. Отвечай на вопросы пользователя кратко и по делу.');
  const [useCustomPrompt, setUseCustomPrompt] = useState(() => {
    const saved = localStorage.getItem('multichat_use_custom_prompt');
    return saved ? JSON.parse(saved) : false;
  });

  // 🔍 ОБНОВЛЕННАЯ ФУНКЦИЯ ДЛЯ ИЗМЕНЕНИЯ useCustomPrompt С СОХРАНЕНИЕМ
  const handleUseCustomPromptChange = (checked) => {
    setUseCustomPrompt(checked);
    localStorage.setItem('multichat_use_custom_prompt', JSON.stringify(checked));
  };
  const [selectedProviders, setSelectedProviders] = useState(() => {
    const saved = localStorage.getItem('multichat_selected_providers');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSettings, setShowSettings] = useState(() => {
    const saved = localStorage.getItem('multichat_show_settings');
    return saved ? JSON.parse(saved) : false;
  });
  const [autoScroll, setAutoScroll] = useState(() => {
    const saved = localStorage.getItem('multichat_auto_scroll');
    return saved ? JSON.parse(saved) : true;
  });
  const [expandedProviders, setExpandedProviders] = useState(() => {
    const saved = localStorage.getItem('multichat_expanded_providers');
    return saved ? JSON.parse(saved) : {};
  });
  const [chatHistories, setChatHistories] = useState({});
  const [providerSizes, setProviderSizes] = useState(() => {
    const saved = localStorage.getItem('multichat_provider_sizes');
    return saved ? JSON.parse(saved) : {};
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeTarget, setResizeTarget] = useState(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(() => {
    const saved = localStorage.getItem('multichat_header_collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isClearingChats, setIsClearingChats] = useState(false);
  const scrollAreaRef = useRef(null);
  const chatRefs = useRef({});

  useEffect(() => {
    if (csrfToken && user?._id) {
      loadActiveProviders();
      loadSystemPrompt();
      loadCustomPrompt();
    }
  }, [csrfToken, user?._id]);

  // Загружаем системный промпт из базы данных
  const loadSystemPrompt = async () => {
    if (!csrfToken || !user?._id) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/multi-chat/system-prompt/active`, {
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDefaultSystemPrompt(data.prompt);
      } else {
        }
    } catch (error) {
      }
  };

  // Загружаем кастомный промпт пользователя
  const loadCustomPrompt = async () => {
    if (!csrfToken || !user?._id) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/multi-chat/user/custom-prompt`, {
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomSystemPrompt(data.customPrompt);
      }
    } catch (error) {
      }
  };

  // Сохраняем кастомный промпт пользователя
  const saveCustomPrompt = async (prompt) => {
    try {
      if (!csrfToken) {
        return;
      }

      const response = await fetch(`${API_BASE}/api/multi-chat/user/custom-prompt`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id
        },
        body: JSON.stringify({ customPrompt: prompt }),
      });

      if (response.ok) {
    
      } else {
        }
    } catch (error) {
      }
  };

  // Функция для прокрутки чата к концу
  const scrollToBottom = (provider) => {
    const chatRef = chatRefs.current[provider];
    if (chatRef) {
      setTimeout(() => {
        chatRef.scrollTop = chatRef.scrollHeight;
      }, 100);
    }
  };

  // Загружаем историю чата для провайдера
  const loadChatHistory = async (provider) => {
    if (!csrfToken || !user?._id) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/multi-chat/history/${provider}`, {
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistories(prev => ({
          ...prev,
          [provider]: data.messages || []
        }));
        
        // Прокручиваем к концу после загрузки истории
        setTimeout(() => scrollToBottom(provider), 200);
      }
    } catch (error) {
      }
  };

  // Очищаем историю чата для провайдера
  const clearChatHistory = async (provider) => {
    try {
      if (!csrfToken || !user?._id) {
        return;
      }

      const response = await fetch(`${API_BASE}/api/multi-chat/history/${provider}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id
        },
      });

      if (response.ok) {
        setChatHistories(prev => ({
          ...prev,
          [provider]: []
        }));
      }
    } catch (error) {
      }
  };

  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [responses, autoScroll]);

  // Автоматическая прокрутка чатов к концу при изменении истории
  useEffect(() => {
    Object.keys(chatHistories).forEach(provider => {
      if (chatHistories[provider] && chatHistories[provider].length > 0) {
        scrollToBottom(provider);
      }
    });
  }, [chatHistories]);

  // Сохранение состояния свернутого блока
  useEffect(() => {
    localStorage.setItem('multichat_header_collapsed', JSON.stringify(isHeaderCollapsed));
  }, [isHeaderCollapsed]);

  // Сохранение размеров провайдеров
  useEffect(() => {
    localStorage.setItem('multichat_provider_sizes', JSON.stringify(providerSizes));
  }, [providerSizes]);

  // Сохранение состояния развернутых провайдеров
  useEffect(() => {
    localStorage.setItem('multichat_expanded_providers', JSON.stringify(expandedProviders));
  }, [expandedProviders]);

  useEffect(() => {
    if (useCustomPrompt && customSystemPrompt.trim()) {
      saveCustomPrompt(customSystemPrompt);
    }
  }, [customSystemPrompt, useCustomPrompt]);

  useEffect(() => {
    localStorage.setItem('multichat_use_custom_prompt', JSON.stringify(useCustomPrompt));
  }, [useCustomPrompt]);

  useEffect(() => {
    localStorage.setItem('multichat_show_settings', JSON.stringify(showSettings));
  }, [showSettings]);

  useEffect(() => {
    localStorage.setItem('multichat_auto_scroll', JSON.stringify(autoScroll));
  }, [autoScroll]);

  const loadActiveProviders = async () => {
    if (!csrfToken || !user?._id) {
      console.log('🔍 No CSRF token or user ID, skipping provider load');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/multi-chat/providers`, {
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id
        }
      });

      if (response.ok) {
        const data = await response.json();
        const providers = data.activeProviders || [];
        setActiveProviders(providers);
        
        // 🔍 ВОССТАНАВЛИВАЕМ ВЫБРАННЫХ ПРОВАЙДЕРОВ ИЗ БД
        try {
          const selectedResponse = await fetch(`${API_BASE}/api/selected-providers/${user._id}`, {
            credentials: 'include',
            headers: {
              'X-CSRF-Token': csrfToken,
              'x-user-id': user._id,
              'x-api-key': 'database-service-secure-api-key-2024'
            }
          });
          
          if (selectedResponse.ok) {
            const selectedData = await selectedResponse.json();
            const savedProviders = selectedData.selectedProviders || [];
            
            // Фильтруем только активные провайдеры
            const validProviders = savedProviders.filter(p => providers.includes(p));
            if (validProviders.length > 0) {
              setSelectedProviders(validProviders);
              // Сохраняем в localStorage для быстрого доступа
              await saveSelectedProviders(validProviders);
            } else {
              // Если сохраненные провайдеры неактивны, выбираем все активные
              setSelectedProviders(providers);
              await saveSelectedProviders(providers);
            }
          } else {
            // Если не удалось загрузить из БД, используем localStorage
            const savedProviders = localStorage.getItem('multichat_selected_providers');
            if (savedProviders) {
              const parsedProviders = JSON.parse(savedProviders);
              const validProviders = parsedProviders.filter(p => providers.includes(p));
              if (validProviders.length > 0) {
                setSelectedProviders(validProviders);
              } else {
                setSelectedProviders(providers);
                await saveSelectedProviders(providers);
              }
            } else {
              // Если нет сохраненных, выбираем все активные
              setSelectedProviders(providers);
              await saveSelectedProviders(providers);
            }
          }
        } catch (error) {
          // Fallback к localStorage
          const savedProviders = localStorage.getItem('multichat_selected_providers');
          if (savedProviders) {
            const parsedProviders = JSON.parse(savedProviders);
            const validProviders = parsedProviders.filter(p => providers.includes(p));
            if (validProviders.length > 0) {
              setSelectedProviders(validProviders);
              console.log('🔍 Using valid providers from localStorage:', validProviders);
            } else {
              setSelectedProviders(validProviders);
              await saveSelectedProviders(providers);
            }
          } else {
            setSelectedProviders(providers);
            await saveSelectedProviders(providers);
          }
        }
        
        // Инициализируем пустые ответы для каждого провайдера
        const initialResponses = {};
        providers.forEach(provider => {
          initialResponses[provider] = { status: 'idle', content: '', error: '' };
          // Загружаем историю чата для каждого провайдера
          loadChatHistory(provider);
        });
        setResponses(initialResponses);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        setError(errorData.message || 'Ошибка загрузки активных провайдеров');
      }
    } catch (error) {
      setError('Ошибка загрузки активных провайдеров');
    }
  };

  const sendToProvider = async (provider) => {
    try {
      const systemPrompt = useCustomPrompt ? customSystemPrompt : defaultSystemPrompt;
      
      if (!csrfToken || !user?._id) {
        setResponses(prev => ({
          ...prev,
          [provider]: {
            status: 'error',
            content: '',
            error: 'Ошибка безопасности: CSRF токен или пользователь не найден'
          }
        }));
        return;
      }

      // 🔒 ПРОВЕРЯЕМ БАЛАНС ПЕРЕД ОТПРАВКОЙ
      if (balance < 1) {
        setResponses(prev => ({
          ...prev,
          [provider]: {
            status: 'error',
            content: '',
            error: 'Недостаточно токенов для отправки сообщения. Пополните баланс.'
          }
        }));
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/multi-chat/${provider}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'x-user-id': user?._id || '',
        },
        body: JSON.stringify({ 
          message: message.trim(),
          systemPrompt: systemPrompt
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Обновляем ответ для конкретного провайдера
        setResponses(prev => ({
          ...prev,
          [provider]: {
            status: data.status,
            content: data.content,
            error: data.error,
            context: data.context
          }
        }));
        
        // Обновляем баланс если есть информация о токенах
        if (data.tokensDeducted && data.newBalance !== undefined) {
          updateBalance(data.newBalance);
        }
        
        // Обновляем историю чата если успешно
        if (data.status === 'success') {
          loadChatHistory(provider);
          setTimeout(() => scrollToBottom(provider), 300);
        }
      } else {
        const errorData = await response.json();
        
        // 🔒 Специальная обработка ошибки недостаточного баланса
        if (response.status === 402 && errorData.error === 'INSUFFICIENT_BALANCE') {
          setResponses(prev => ({
            ...prev,
            [provider]: {
              status: 'error',
              content: '',
              error: 'Недостаточно токенов для отправки сообщения. Пополните баланс.',
              insufficientBalance: true,
              currentBalance: errorData.currentBalance,
              requiredTokens: errorData.requiredTokens
            }
          }));
          
          // Показываем общую ошибку
          setError('Недостаточно токенов для отправки сообщения. Пополните баланс.');
        } else {
          setResponses(prev => ({
            ...prev,
            [provider]: {
              status: 'error',
              content: '',
              error: errorData.message || 'Ошибка запроса'
            }
          }));
        }
      }
    } catch (error) {
      setResponses(prev => ({
        ...prev,
        [provider]: {
          status: 'error',
          content: '',
          error: 'Ошибка сети'
        }
      }));
    }
  };

  const sendToAllProviders = async () => {
    if (!message.trim() || selectedProviders.length === 0) {
      return;
    }

    if (!csrfToken || !user?._id) {
      setError('Ошибка безопасности: CSRF токен или пользователь не найден');
      return;
    }

    // 🔒 ПРОВЕРЯЕМ БАЛАНС ПЕРЕД ОТПРАВКОЙ
    if (balance < 1) {
      setError('Недостаточно токенов для отправки сообщения. Пополните баланс.');
      return;
    }

    // Проверяем лимит сообщений
    const limitedProvider = checkMessageLimit();
    if (limitedProvider) {
      setError(`Достигнут лимит в 50 сообщений в чате ${getProviderName(limitedProvider)}. Очистите контекст для продолжения.`);
      return;
    }

    setLoading(true);
    setError('');

    // Сбрасываем ответы для всех выбранных провайдеров
    const resetResponses = {};
    selectedProviders.forEach(provider => {
      resetResponses[provider] = { status: 'loading', content: '', error: '' };
    });
    setResponses(resetResponses);

    try {
      const systemPrompt = useCustomPrompt ? customSystemPrompt : defaultSystemPrompt;
      
      // Отправляем сообщения всем провайдерам по отдельности
      const promises = selectedProviders.map(provider => 
        fetch(`${API_BASE}/api/multi-chat/${provider}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            'x-user-id': user?._id || '',
          },
          body: JSON.stringify({ 
            message: message.trim(),
            systemPrompt: systemPrompt
          }),
        }).then(res => res.json()).then(data => ({
          provider,
          success: data.success,
          content: data.content || '',
          error: data.error || ''
        }))
      );

      const results = await Promise.all(promises);
      
      // Обновляем ответы для каждого провайдера
      const newResponses = {};
      results.forEach(result => {
        newResponses[result.provider] = {
          status: result.success ? 'success' : 'error',
          content: result.content || '',
          error: result.error || ''
        };
      });
      setResponses(newResponses);
      
      // Обновляем историю чата для успешных провайдеров
      results.forEach(result => {
        if (result.success) {
          loadChatHistory(result.provider);
          setTimeout(() => scrollToBottom(result.provider), 300);
        }
      });
      
      // Очищаем поле ввода после отправки
      setMessage('');
      
      // Обработка ошибок
      setError('');
    } catch (error) {
      setError('Ошибка при отправке запросов');
      
      // Устанавливаем ошибку для всех провайдеров
      const errorResponses = {};
      selectedProviders.forEach(provider => {
        errorResponses[provider] = {
          status: 'error',
          content: '',
          error: 'Ошибка сети'
        };
      });
      setResponses(errorResponses);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendToAllProviders();
    }
  };

  // 🔍 ФУНКЦИЯ ДЛЯ СОХРАНЕНИЯ ВЫБРАННЫХ ПРОВАЙДЕРОВ
  const saveSelectedProviders = async (providers) => {
    // Сохраняем в localStorage для быстрого доступа
    localStorage.setItem('multichat_selected_providers', JSON.stringify(providers));
    
    // Сохраняем в БД для синхронизации между устройствами
    try {
      if (csrfToken && user?._id) {
        await fetch(`${API_BASE}/api/selected-providers/${user._id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            'x-user-id': user._id,
            'x-api-key': 'database-service-secure-api-key-2024'
          },
          body: JSON.stringify({ selectedProviders: providers })
        });
      }
    } catch (error) {
      console.error('❌ Error saving selected providers to database:', error);
    }
  };

  // 🔍 ФУНКЦИЯ ДЛЯ СБРОСА ВЫБРАННЫХ ПРОВАЙДЕРОВ К ЗНАЧЕНИЯМ ПО УМОЛЧАНИЮ
  const resetSelectedProviders = async () => {
    setSelectedProviders(activeProviders);
    await saveSelectedProviders(activeProviders);
  };

  const toggleProvider = async (provider) => {
    setSelectedProviders(prev => {
      const newProviders = prev.includes(provider) 
        ? prev.filter(p => p !== provider)
        : [...prev, provider];
      
      // Сохраняем в localStorage и БД
      saveSelectedProviders(newProviders).catch(error => {
        console.error('❌ Error saving providers in toggle:', error);
      });
      return newProviders;
    });
  };

  const toggleExpanded = (provider) => {
    setExpandedProviders(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const clearAllChats = async () => {
    try {
      if (!csrfToken || !user?._id) {
        setError('Ошибка безопасности: CSRF токен или пользователь не найден');
        return;
      }

      setIsClearingChats(true);
      const response = await fetch(`${API_BASE}/api/multi-chat/history`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Очищаем локальную историю
        setChatHistories({});
        setMessage('');
        setResponses({});
        
        // Показываем уведомление об успехе
        if (data.clearedCount > 0) {
          setError(`✅ Очищено ${data.clearedCount} историй чата`);
          // Убираем уведомление через 3 секунды
          setTimeout(() => setError(''), 3000);
        } else {
          setError('✅ История чата очищена');
          setTimeout(() => setError(''), 3000);
        }
        
      } else {
        const errorData = await response.json();
        setError(`Ошибка очистки чатов: ${errorData.message || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      setError('Ошибка при очистке чатов: ' + error.message);
    } finally {
      setIsClearingChats(false);
    }
  };

  const copyResponse = (content) => {
    navigator.clipboard.writeText(content);
  };

  // Функции для изменения размера
  const handleResizeStart = (e, provider) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeTarget(provider);
    document.body.style.cursor = 'nw-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResizeMove = (e) => {
    if (!isResizing || !resizeTarget) return;

    // Получаем позицию относительно viewport
    const x = e.clientX;
    const y = e.clientY;

    // Находим карточку провайдера
    const providerCard = document.querySelector(`[data-provider="${resizeTarget}"]`);
    if (!providerCard) return;

    const rect = providerCard.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;

              // Минимальный размер
      const minWidth = 400;
      const minHeight = 350;

     // Максимальный размер (80% от ширины экрана)
     const maxWidth = Math.min(window.innerWidth * 0.8, 800);
     const maxHeight = Math.min(window.innerHeight * 0.8, 600);

    const newWidth = Math.max(minWidth, Math.min(maxWidth, relativeX));
    const newHeight = Math.max(minHeight, Math.min(maxHeight, relativeY));

    setProviderSizes(prev => ({
      ...prev,
      [resizeTarget]: {
        width: newWidth,
        height: newHeight
      }
    }));
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeTarget(null);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const resetProviderSize = (provider) => {
    setProviderSizes(prev => {
      const newSizes = { ...prev };
      delete newSizes[provider];
      return newSizes;
    });
  };

  // Добавляем обработчики событий мыши
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeTarget]);

  const exportResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      message: message,
      responses: responses,
      systemPrompt: useCustomPrompt ? customSystemPrompt : 'Ты полезный ассистент. Отвечай на вопросы пользователя кратко и по делу.'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multichat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getProviderIcon = (provider) => {
    const icons = {
      openai: '🤖',
      gemini: '🌟',
      xai: '🚀',
      yandexgpt: '🔍',
      gigachat: '💼',
      anthropic: '🧠',
      deepseek: '🔍'
    };
    return icons[provider] || '🤖';
  };

  const getProviderName = (provider) => {
    const names = {
      openai: 'OpenAI',
      gemini: 'Google Gemini',
      xai: 'xAI',
      yandexgpt: 'Yandex GPT',
      gigachat: 'GigaChat',
      anthropic: 'Anthropic',
      deepseek: 'DeepSeek'
    };
    return names[provider] || provider;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'loading':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getResponseStats = () => {
    const total = Object.keys(responses).length;
    const success = Object.values(responses).filter(r => r.status === 'success').length;
    const error = Object.values(responses).filter(r => r.status === 'error').length;
    const loading = Object.values(responses).filter(r => r.status === 'loading').length;
    
    return { total, success, error, loading };
  };

  // Проверяем, достигнут ли лимит сообщений в каком-либо чате
  const checkMessageLimit = () => {
    for (const provider of selectedProviders) {
      const history = chatHistories[provider] || [];
      if (history.length >= 50) {
    
        return provider;
      }
    }
    return null;
  };

  // Получаем количество сообщений в самом длинном чате
  const getMaxMessageCount = () => {
    let maxCount = 0;
    for (const provider of selectedProviders) {
      const history = chatHistories[provider] || [];
      maxCount = Math.max(maxCount, history.length);
    }
    return maxCount;
  };

  const stats = getResponseStats();

  return (
    <div className="flex flex-col h-full p-6">
             {/* Основная область с прокруткой */}
       <div className="flex-1 overflow-y-auto pb-4">
        {/* Фиксированная область сверху */}
        <div className="flex-shrink-0">
                 {/* Заголовок с кнопками управления */}
                  <Card className="mb-4">
                    <CardHeader className="pb-2">
             <div className="flex items-center justify-between">
               <CardTitle className="flex items-center gap-2">
                 <Sparkles className="w-5 h-5" />
                 Мульти-чат AI
               </CardTitle>
               <div className="flex items-center gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                   title={isHeaderCollapsed ? "Развернуть панель" : "Свернуть панель"}
                 >
                   {isHeaderCollapsed ? (
                     <ChevronDown className="h-4 w-4" />
                   ) : (
                     <ChevronUp className="h-4 w-4" />
                   )}
                 </Button>

                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => {
                     // Разворачиваем заголовок, если он свернут
                     if (isHeaderCollapsed) {
                       setIsHeaderCollapsed(false);
                     }
                     setShowSettings(!showSettings);
                   }}
                 >
                   <Settings className="h-4 w-4 mr-2" />
                   Настройки
                 </Button>
                 {Object.keys(responses).length > 0 && (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={exportResults}
                   >
                     <Download className="h-4 w-4 mr-2" />
                     Экспорт
                   </Button>
                 )}
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => {
                     if (window.confirm('Вы уверены, что хотите очистить все чаты? Это действие нельзя отменить.')) {
                       clearAllChats();
                     }
                   }}
                   disabled={isClearingChats}
                   className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                   title="Очистить все чаты и начать новый"
                 >
                   {isClearingChats ? (
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   ) : (
                     <Plus className="h-4 w-4 mr-2" />
                   )}
                   {isClearingChats ? 'Очистка...' : 'Новый чат'}
                 </Button>
               </div>
             </div>
           </CardHeader>
                      {!isHeaderCollapsed && (
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-2">
               Отправьте запрос одновременно во все подключенные AI сервисы и получите ответы в реальном времени.
             </p>
             
                        {/* Статистика */}
           {stats.total > 0 && (
             <div className="flex items-center gap-4 mb-4">
               <Badge variant="secondary">{stats.total} провайдеров</Badge>
               {stats.success > 0 && <Badge variant="default" className="bg-green-100 text-green-800">{stats.success} успешно</Badge>}
               {stats.error > 0 && <Badge variant="destructive">{stats.error} ошибок</Badge>}
               {stats.loading > 0 && <Badge variant="outline" className="bg-blue-100 text-blue-800">{stats.loading} загрузка</Badge>}
             </div>
           )}

             {/* Выбор провайдеров */}
             <div className="space-y-2">
               <Label className="text-sm font-medium">Выберите провайдеры:</Label>
               {activeProviders.length > 0 ? (
                 <div className="space-y-3">
                   <div className="flex flex-wrap gap-2">
                     {activeProviders.map(provider => (
                       <Button
                         key={provider}
                         variant={selectedProviders.includes(provider) ? "default" : "outline"}
                         size="sm"
                         onClick={() => toggleProvider(provider)}
                         className="flex items-center gap-2"
                       >
                         <span>{getProviderIcon(provider)}</span>
                         {getProviderName(provider)}
                       </Button>
                     ))}
                   </div>
                   
                   {selectedProviders.length > 0 && (
                     <div className="space-y-2">
                       <div className="flex items-center gap-2 text-sm text-gray-600">
                         <Zap className="h-4 w-4" />
                         <span>
                           Будет списано: <strong>{selectedProviders.length} токенов</strong> 
                           (по 1 за каждый провайдер)
                         </span>
                       </div>
                       
                       <div className="flex items-center gap-2 text-sm text-gray-600">
                         <MessageSquare className="h-4 w-4" />
                         <span>
                           Максимум сообщений в чате: <strong>{getMaxMessageCount()}/50</strong>
                         </span>
                       </div>
                       
                       {checkMessageLimit() && (
                         <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                           <AlertTriangle className="h-4 w-4" />
                           <span>
                             Достигнут лимит в 50 сообщений. Очистите контекст для продолжения.
                           </span>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="text-center py-4">
                   <p className="text-gray-500 mb-2">Нет активных AI провайдеров</p>
                   <p className="text-sm text-gray-400">
                     Перейдите в раздел "Настройки AI" и включите нужные провайдеры
                   </p>
                 </div>
               )}
             </div>
                    </CardContent>
            )}
       </Card>

                             {/* Настройки */}
         {showSettings && !isHeaderCollapsed && (
           <Card className="mb-4">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Settings className="w-5 h-5" />
               Настройки
             </CardTitle>
           </CardHeader>
                      <CardContent className="space-y-3">
             <div className="flex items-center space-x-2">
               <Switch
                 id="custom-prompt"
                 checked={useCustomPrompt}
                 onCheckedChange={handleUseCustomPromptChange}
               />
               <Label htmlFor="custom-prompt">Использовать кастомный системный промпт</Label>
             </div>
             
             {useCustomPrompt && (
               <div className="space-y-2">
                 <Label htmlFor="system-prompt">Системный промпт:</Label>
                 <Textarea
                   id="system-prompt"
                   value={customSystemPrompt}
                   onChange={(e) => setCustomSystemPrompt(e.target.value)}
                   placeholder={defaultSystemPrompt}
                   rows={3}
                 />
               </div>
             )}

             <div className="flex items-center space-x-2">
               <Switch
                 id="auto-scroll"
                 checked={autoScroll}
                 onCheckedChange={setAutoScroll}
               />
               <Label htmlFor="auto-scroll">Автопрокрутка к новым ответам</Label>
             </div>

             {/* 🔍 УПРАВЛЕНИЕ ВЫБРАННЫМИ ПРОВАЙДЕРАМИ */}
             <div className="pt-2 border-t">
               <div className="flex items-center justify-between mb-2">
                 <Label className="text-sm font-medium">Выбранные провайдеры</Label>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => resetSelectedProviders()}
                   className="text-xs"
                 >
                   Сбросить к умолчанию
                 </Button>
               </div>
               <div className="text-xs text-gray-500">
                 Выбрано: {selectedProviders.length} из {activeProviders.length}
               </div>
               <div className="flex flex-wrap gap-1 mt-2">
                 {activeProviders.map(provider => (
                   <div
                     key={provider}
                     className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                       selectedProviders.includes(provider)
                         ? 'bg-blue-100 text-blue-800 border border-blue-200'
                         : 'bg-gray-100 text-gray-600 border border-gray-200'
                     }`}
                     onClick={() => toggleProvider(provider)}
                   >
                     {getProviderIcon(provider)} {getProviderName(provider)}
                   </div>
                 ))}
               </div>
             </div>
           </CardContent>
         </Card>
       )}

       </div>

                                                       {/* Область с ответами */}
         <div className="flex-1 mb-2">
          <div className="h-full">
           <div className="h-full">
             {selectedProviders.length === 0 ? (
               <Card>
                 <CardContent className="pt-6">
                   <div className="text-center text-gray-500">
                     <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                     <p>Нет выбранных AI провайдеров</p>
                     <p className="text-sm">Выберите провайдеры выше для отправки запроса</p>
                   </div>
                 </CardContent>
               </Card>
             ) : (
                                                                                               <div className="flex flex-wrap gap-4 h-full items-start">
                    {selectedProviders.map(provider => {
                      const size = providerSizes[provider] || {};
                      const isExpanded = expandedProviders[provider];
                      
                      return (
                                                                                                   <Card 
                            key={provider} 
                            data-provider={provider}
                                                       className={`${getStatusColor(responses[provider]?.status || 'idle')} relative flex-shrink-0 transition-all duration-200 ease-in-out flex flex-col !py-2 !gap-2 overflow-hidden`}
                                                          style={{
                                width: isExpanded ? '100%' : (size.width ? `${size.width}px` : '400px'),
                                height: isExpanded ? 'auto' : (size.height ? `${size.height}px` : '500px'),
                                minWidth: isExpanded ? '100%' : '400px',
                                minHeight: isExpanded ? 'auto' : '400px',
                                maxHeight: isExpanded ? 'auto' : '800px',
                                order: isExpanded ? -1 : 0,
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                flexShrink: 0
                              }}
                         >
                                            <CardHeader className="pb-1 pt-2 px-3 !px-2 !gap-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getProviderIcon(provider)}</span>
                            <span className="font-medium">{getProviderName(provider)}</span>
                          </div>
                                                     <div className="flex items-center gap-2">
                             {getStatusIcon(responses[provider]?.status || 'idle')}
                             <Badge variant="outline" className="text-xs">
                               {responses[provider]?.status || 'idle'}
                             </Badge>
                                                           {providerSizes[provider] && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => resetProviderSize(provider)}
                                  className="h-6 w-6 p-0 hover:bg-blue-50"
                                  title="Сбросить размер"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              )}
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => toggleExpanded(provider)}
                               className="h-6 w-6 p-0 hover:bg-blue-50"
                             >
                               {expandedProviders[provider] ? (
                                 <Minimize2 className="h-3 w-3" />
                               ) : (
                                 <Maximize2 className="h-3 w-3" />
                               )}
                             </Button>
                           </div>
                                                 </div>
                       </CardHeader>
                                                                                               <CardContent className="pt-0 pb-0 !px-2 flex flex-col flex-1 min-h-0">

                                                                                                   {/* История чата */}
                                                      {chatHistories[provider] && chatHistories[provider].length > 0 && (
                              <div 
                                ref={(el) => chatRefs.current[provider] = el}
                                className="flex-1 overflow-y-auto border rounded p-1 bg-gray-50 min-h-0" 
                                style={{ 
                                  minHeight: '200px'
                                }}
                              >
                             <div className="text-xs text-gray-500 mb-1 flex items-center justify-between">
                               <span>История чата ({chatHistories[provider].length} сообщений)</span>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => clearChatHistory(provider)}
                                 className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                               >
                                 <Trash2 className="h-3 w-3" />
                               </Button>
                             </div>
                                                           <div className="space-y-1 overflow-y-auto flex-1 min-h-0">
                                {chatHistories[provider].map((msg, index) => (
                                  <div key={index} className={`p-1 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 ml-2' : 'bg-green-100 mr-2'}`}>
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs font-medium mt-1">
                                        {msg.role === 'user' ? '👤' : '🤖'}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {new Date(msg.timestamp).toLocaleTimeString()}
                                        </p>
                                      </div>
                                      {msg.role === 'assistant' && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => copyResponse(msg.content)}
                                          className="h-6 w-6 p-0 ml-2"
                                          title="Копировать ответ"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                           </div>
                         )}

                                                   {/* Индикатор загрузки */}
                          {responses[provider]?.status === 'loading' && (
                            <div className="flex items-center gap-2 text-gray-600 py-1 mt-auto flex-shrink-0">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Обработка запроса...</span>
                            </div>
                          )}
                        
                                                 {responses[provider]?.status === 'error' && responses[provider]?.error && (
                           <Alert variant="destructive" className="py-2 mt-2">
                             <AlertTriangle className="h-4 w-4" />
                             <AlertDescription className="text-sm">{responses[provider].error}</AlertDescription>
                             
                             {/* 🔒 Кнопка пополнения баланса при ошибке недостаточного баланса */}
                             {responses[provider]?.insufficientBalance && (
                               <div className="mt-2 flex items-center gap-2">
                                 <Button
                                   size="sm"
                                   onClick={() => window.location.href = '/tokens'}
                                   className="bg-green-600 hover:bg-green-700 text-white"
                                 >
                                   <Plus className="h-3 w-3 mr-1" />
                                   Пополнить баланс
                                 </Button>
                                 <span className="text-xs text-gray-500">
                                   Текущий баланс: {responses[provider]?.currentBalance || 0} токенов
                                 </span>
                               </div>
                             )}
                           </Alert>
                         )}
                      </CardContent>

                                             {/* Угол для изменения размера */}
                       {!isExpanded && (
                         <div 
                           className="absolute bottom-0 right-0 w-6 h-6 cursor-nw-resize bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded-tl flex items-center justify-center z-10"
                           onMouseDown={(e) => handleResizeStart(e, provider)}
                           title="Изменить размер"
                           style={{
                             transform: 'translate(50%, 50%)'
                           }}
                         >
                           <div className="w-2 h-2 bg-gray-400 rounded-sm" />
                         </div>
                       )}
                    </Card>
                   );
                 })}
                </div>
             )}
           </div>
         </div>
       </div>
      </div>

             {/* Поле ввода - закреплено внизу */}
       <Card className="flex-shrink-0">
           <div className="p-2">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
              
              {/* 🔒 Кнопка пополнения баланса при общей ошибке недостаточного баланса */}
              {error.includes('Недостаточно токенов') && (
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.location.href = '/tokens'}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Пополнить баланс
                  </Button>
                </div>
              )}
            </Alert>
          )}
          
                     <div className="flex gap-2">
                            <div className="flex-1">
               <Textarea
                 placeholder={balance < 1 ? "Недостаточно токенов. Пополните баланс." : "Введите ваш запрос..."}
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 onKeyPress={handleKeyPress}
                 className={`min-h-[50px] resize-none ${balance < 1 ? 'bg-gray-100 text-gray-500' : ''}`}
                 disabled={loading || selectedProviders.length === 0 || balance < 1}
               />
             </div>
             <Button
               onClick={sendToAllProviders}
               disabled={loading || !message.trim() || selectedProviders.length === 0 || balance < 1}
               className="px-6"
               title={`loading: ${loading}, message: ${!!message.trim()}, providers: ${selectedProviders.length}, balance: ${balance}`}
             >
               {loading ? (
                 <Loader2 className="h-4 w-4 animate-spin" />
               ) : (
                 <Send className="h-4 w-4" />
               )}
             </Button>
           </div>
          
                                                                                                                                   <div className="mt-0.5 text-xs text-gray-500">
                Нажмите Enter для отправки, Shift+Enter для новой строки
                {balance < 1 && (
                  <span className="ml-2 text-red-500 font-medium">
                    ⚠️ Недостаточно токенов для отправки сообщения
                  </span>
                )}
              </div>
                                         </div>
           </Card>
     </div>
   );
 };

export default MultiChat; 