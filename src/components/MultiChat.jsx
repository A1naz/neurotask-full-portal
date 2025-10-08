import React, { useState, useEffect, useRef } from 'react';
import NotificationPopup from './NotificationPopup'; // Импорт NotificationPopup
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
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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
  Plus,
  GripVertical,
  Menu,
  X,
  ChevronRight,
  Video,
  Image,
  Music,
  MoreVertical,
  Edit,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { aiModelsConfig } from '@/config/ai-models'; // Import aiModelsConfig
import ProviderCard from '@/components/MultiChat/ProviderCard';
import SortableProviderCard from '@/components/MultiChat/SortableProviderCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MultiChat = () => {
  const { API_BASE, csrfToken, user, currentChatId, selectChat } = useAuth();
  const { totalBalance, updateBalance } = useTokenBalance();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [responses, setResponses] = useState({});
  const [activeProviders, setActiveProviders] = useState([]);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [notification, setNotification] = useState(''); // Стейт для NotificationPopup

  // State для категорий провайдеров
  const [chatProviders, setChatProviders] = useState([]);
  const [videoProviders, setVideoProviders] = useState([]);
  const [imageProviders, setImageProviders] = useState([]);
  const [audioProviders, setAudioProviders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('chat'); // По умолчанию выбраны "Основные"

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
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [userChatHistories, setUserChatHistories] = useState([]); // Новое состояние для истории чатов пользователя
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Состояние для управления видимостью сайдбара
  const [isFirstMessage, setIsFirstMessage] = useState(true); // Состояние для отслеживания первого сообщения в новом чате
  const [editingChat, setEditingChat] = useState(null); // Состояние для редактирования чата
  const [newChatTitle, setNewChatTitle] = useState(""); // Состояние для нового названия чата

  const [providerImageFiles, setProviderImageFiles] = useState({}); // Новое состояние для файлов изображений

  const [mainInputImageUrl, setMainInputImageUrl] = useState(null);
  const [isUploadingMainImage, setIsUploadingMainImage] = useState(false);
  const mainFileInputRef = useRef(null);

  const loadUserChatHistories = async () => {
    if (!csrfToken || !user?._id) return;
    try {
      const response = await fetch(`${API_BASE}/api/multi-chat/all-chat-histories`, {
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserChatHistories(data.chatHistories);
      } else {
        console.error('Ошибка загрузки истории чатов пользователя');
      }
    } catch (error) {
      console.error('Ошибка загрузки истории чатов пользователя:', error);
    }
  };

  const handleMainImageUpload = async (imageFile) => {
    if (!imageFile) return;

    setIsUploadingMainImage(true);
    setMainInputImageUrl(null); // Reset previous

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await fetch(`${API_BASE}/api/upload/vk-cloud`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'X-CSRF-Token': csrfToken,
                'x-user-id': user._id,
            },
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            setMainInputImageUrl(data.imageUrl);
        } else {
            const errorData = await response.json();
            setError(`Ошибка загрузки изображения: ${errorData.message || 'Неизвестная ошибка'}`);
        }
    } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
        setError('Ошибка сети при загрузке изображения');
    } finally {
        setIsUploadingMainImage(false);
    }
  };

  const handleMainImageSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
          handleMainImageUpload(file);
      }
  };

  const handleClearMainImage = () => {
      setMainInputImageUrl(null);
      if(mainFileInputRef.current) {
          mainFileInputRef.current.value = '';
      }
  };

  useEffect(() => {
    localStorage.setItem('multichat_expanded_providers', JSON.stringify(expandedProviders));
  }, [expandedProviders]);

  useEffect(() => {
    localStorage.setItem('multichat_provider_sizes', JSON.stringify(providerSizes));
  }, [providerSizes]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (csrfToken && user?._id) {
      // Загружаем активных провайдеров и настройки AI, включая currentChatId
      loadActiveProviders();
      loadSystemPrompt();
      loadCustomPrompt();
      loadUserChatHistories(); // Загружаем историю чатов пользователя
    }
  }, [csrfToken, user?._id, selectedCategory, currentChatId]);

  const scrollToBottom = (provider) => {
    const chatRef = chatRefs.current[provider];
    if (chatRef) {
      setTimeout(() => {
        chatRef.scrollTop = chatRef.scrollHeight;
      }, 100);
    }
  };

  const loadChatHistory = async (provider, chatIdToLoad) => {
    if (!csrfToken || !user?._id || !chatIdToLoad) return;
    console.log(`[loadChatHistory] Attempting to load history for provider: ${provider}, chatId: ${chatIdToLoad}`);
    try {
      let url = `${API_BASE}/api/multi-chat/history/${provider}?chatId=${chatIdToLoad}`;
      const response = await fetch(url, {
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
        if (data.messages && data.messages.length > 0) {
          setIsFirstMessage(false); // Если есть история, значит это не первое сообщение
        }
        setTimeout(() => scrollToBottom(provider), 200);
      }
    } catch (error) {
      console.error(`Failed to load chat history for ${provider}`, error);
    }
  };

  const clearChatHistory = async (provider) => {
    if (!csrfToken || !user?._id) return;
    try {
      const response = await fetch(`${API_BASE}/api/multi-chat/history/${provider}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id
        },
      });
      if (response.ok) {
        setChatHistories(prev => ({ ...prev, [provider]: [] }));
      }
    } catch (error) {
      console.error(`Failed to clear chat history for ${provider}`, error);
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const {active, over} = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    if (active.id !== over.id) {
      setSelectedProviders((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('multichat_selected_providers', JSON.stringify(newOrder));
        return newOrder;
      });
    }
    setActiveId(null);
  }

  const loadActiveProviders = async () => {
    if (!csrfToken || !user?._id) return;
    try {
      const response = await fetch(`${API_BASE}/api/multi-chat/providers`, {
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken, 'x-user-id': user._id }
      });
      const aiSettingsResponse = await fetch(`${API_BASE}/api/multi-chat/ai-settings/${user._id}`, {
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken, 'x-user-id': user._id }
      });

      if (response.ok && aiSettingsResponse.ok) {
        const data = await response.json();
        const aiSettingsData = await aiSettingsResponse.json();

        const allActiveProviders = data.activeProviders || [];
        
        // Категоризация активных провайдеров
        const categorizedChatProviders = [];
        const categorizedVideoProviders = [];
        const categorizedImageProviders = [];
        const categorizedAudioProviders = [];

        allActiveProviders.forEach(providerKey => {
          const config = aiModelsConfig[providerKey];
          if (config) {
            if (config.type === 'chat') {
              categorizedChatProviders.push(providerKey);
            } else if (config.type === 'video') {
              categorizedVideoProviders.push(providerKey);
            } else if (config.type === 'image') {
              categorizedImageProviders.push(providerKey);
            } else if (config.type === 'audio') {
              categorizedAudioProviders.push(providerKey);
            }
          }
        });

        setChatProviders(categorizedChatProviders);
        setVideoProviders(categorizedVideoProviders);
        setImageProviders(categorizedImageProviders);
        setAudioProviders(categorizedAudioProviders);
        setActiveProviders(allActiveProviders); // Сохраняем все активные провайдеры для общей логики
        
        let fetchedCurrentChatId = aiSettingsData.aiSettings.currentChatId;

        if (!currentChatId && !fetchedCurrentChatId) {
          const newChatId = uuidv4();
          selectChat(newChatId);
          fetchedCurrentChatId = newChatId;
        } else {
            fetchedCurrentChatId = currentChatId || fetchedCurrentChatId;
        }
        
        // Use locally stored order if available
        const savedOrder = localStorage.getItem('multichat_selected_providers');
        let providersToFetchHistory = []; // Новая переменная для хранения списка провайдеров для загрузки истории

        if (savedOrder) {
          try {
            const orderedProviders = JSON.parse(savedOrder);
            // Filter out any providers that are no longer active
            const validOrderedProviders = orderedProviders.filter(p => allActiveProviders.includes(p));
            // Add any new active providers that were not in the saved order
            const newProviders = allActiveProviders.filter(p => !validOrderedProviders.includes(p));
            const finalProviders = [...validOrderedProviders, ...newProviders];
            setSelectedProviders(finalProviders);
            providersToFetchHistory = finalProviders; // Используем актуальный список
          } catch (e) {
            // Если парсинг не удался, возвращаемся ко всем активным провайдерам
            setSelectedProviders(allActiveProviders); // Инициализируем всеми активными провайдерами
            providersToFetchHistory = allActiveProviders; // Используем актуальный список
          }
        } else {
          setSelectedProviders(allActiveProviders); // Инициализируем всеми активными провайдерами, если нет сохраненного порядка
          providersToFetchHistory = allActiveProviders; // Используем актуальный список
        }
        
        const initialResponses = {};
        // Инициализируем ответы и загружаем историю для всех выбранных провайдеров
        providersToFetchHistory.forEach(provider => {
          initialResponses[provider] = { status: 'idle', content: '', error: '' };
          if (fetchedCurrentChatId) {
            console.log(`[loadActiveProviders] Loading history for provider: ${provider}, chatId: ${fetchedCurrentChatId}`);
            loadChatHistory(provider, fetchedCurrentChatId);
          }
        });
        setResponses(initialResponses);
      } else {
        setError('Ошибка загрузки активных провайдеров');
      }
    } catch (error) {
      setError('Ошибка загрузки активных провайдеров');
    }
  };

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

  const sendToProvider = async (provider, messageToSend, imageUrl = null) => {
    try {
      // Moved chat ID generation to the top to ensure it exists for the limit check.
      let finalChatId = currentChatId;
      if (!finalChatId) {
        finalChatId = uuidv4();
        selectChat(finalChatId); // Update chatId in the context
      }

      // Check limits before sending
      const limitCheckResponse = await fetch(`${API_BASE}/api/multi-chat/check-limit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          userId: user._id,
          chatId: finalChatId, // Use the guaranteed finalChatId
          provider: provider,
        }),
      });

      if (limitCheckResponse.ok) {
        const limitData = await limitCheckResponse.json();
        if (limitData.limitExceeded) {
          return { status: 'error', content: '', error: limitData.message };
        }
      } else {
        // If the limit check fails, log the error but continue sending the message
        const errorText = await limitCheckResponse.text();
        console.error(`Error checking limits for ${provider}:`, errorText);
      }

      const systemPrompt = useCustomPrompt ? customSystemPrompt : defaultSystemPrompt;
      
      if (!csrfToken || !user?._id) {
        return { status: 'error', content: '', error: 'Ошибка безопасности: CSRF токен или пользователь не найден' };
      }

      // If it's the first message in the chat, send a request to generate a title
      if (isFirstMessage && finalChatId) {
        try {
          await fetch(`${API_BASE}/api/chat-naming/generate-name`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
              'x-user-id': user._id,
            },
            body: JSON.stringify({
              chatId: finalChatId,
              message: messageToSend.trim(),
              provider: provider, // Используем текущего провайдера для названия чата
            }),
          });
          setIsFirstMessage(false); // Сбрасываем флаг после первого сообщения
          // Note: loadUserChatHistories will be called once after all providers respond
        } catch (namingError) {
          console.error('Error generating chat name for single provider:', namingError);
          // Не блокируем отправку сообщения, даже если название не сгенерировалось
        }
      }

      // 🔒 ПРОВЕРЯЕМ БАЛАНС ПЕРЕД ОТПРАВКОЙ
      if (totalBalance < 1) {
        return { status: 'error', content: '', error: 'Недостаточно токенов для отправки сообщения. Пополните баланс.' };
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
          message: messageToSend.trim(),
          systemPrompt: systemPrompt,
          chatId: finalChatId, // Передаем finalChatId
          ...(imageUrl && { imageUrl }), // Передаем imageUrl, если он есть
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // После успешного ответа обновляем историю чата для конкретного провайдера
        loadChatHistory(provider, finalChatId);
        setTimeout(() => scrollToBottom(provider), 200);
        return { status: data.status, content: data.content, error: data.error, context: data.context, tokensDeducted: data.tokensDeducted, newBalance: data.newBalance };
      } else {
        const errorData = await response.json();
        if (response.status === 402 && errorData.error === 'INSUFFICIENT_BALANCE') {
          return { status: 'error', content: '', error: 'Недостаточно токенов для отправки сообщения. Пополните баланс.', insufficientBalance: true, currentBalance: errorData.currentBalance, requiredTokens: errorData.requiredTokens };
        } else if (response.status === 429 && errorData.error === 'MESSAGE_LIMIT_EXCEEDED') {
          return { status: 'error', content: '', error: errorData.message };
        } else {
          return { status: 'error', content: '', error: errorData.message || 'Ошибка запроса' };
        }
      }
    } catch (error) {
      return { status: 'error', content: '', error: 'Ошибка сети' };
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
    if (totalBalance < 1) {
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

    // Если это первое сообщение в чате, отправляем запрос на создание названия
    if (isFirstMessage && currentChatId) {
      try {
        await fetch(`${API_BASE}/api/chat-naming/generate-name`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            'x-user-id': user._id,
          },
          body: JSON.stringify({
            chatId: currentChatId,
            message: message.trim(),
            provider: selectedProviders[0], // Используем первого провайдера для названия чата
          }),
        });
        setIsFirstMessage(false); // Сбрасываем флаг после первого сообщения
        loadUserChatHistories(); // Обновляем список чатов, чтобы увидеть новое название
      } catch (namingError) {
        console.error('Error generating chat name:', namingError);
        // Не блокируем отправку сообщения, даже если название не сгенерировалось
      }
    }

    // Сбрасываем ответы для всех выбранных провайдеров
    const resetResponses = {};
    selectedProviders.forEach(provider => {
      resetResponses[provider] = { status: 'loading', content: '', error: '' };
    });
    setResponses(resetResponses);

    try {
      // Отправляем сообщения только выбранным провайдерам в текущей категории
      const providersInCurrentCategory = selectedProviders.filter(p => aiModelsConfig[p]?.type === selectedCategory);
      const promises = providersInCurrentCategory.map(provider => {
        const messageContent = message.trim();
        // Pass imageUrl if it exists for this provider
        const imageUrl = mainInputImageUrl || providerImageFiles[provider]?.url || null;
        return sendToProvider(provider, messageContent, imageUrl);
      });
      
      // Используем Promise.allSettled для обработки всех результатов, даже если есть ошибки
      const results = await Promise.allSettled(promises);
      
      const newResponses = {};
      let anyError = false;
      let totalTokensDeducted = 0;
      let hasInsufficientBalance = false;
      let currentBalance = totalBalance;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const provider = providersInCurrentCategory[i];

        if (result.status === 'fulfilled') {
          const data = result.value;
          newResponses[provider] = { status: data.status, content: data.content, error: data.error, context: data.context };
          if (data.tokensDeducted) {
            totalTokensDeducted += data.tokensDeducted;
            currentBalance = data.newBalance !== undefined ? data.newBalance : currentBalance; // Update balance from successful response
          }
          if (data.status === 'success') {
            loadChatHistory(provider, currentChatId);
            setTimeout(() => scrollToBottom(provider), 300);
          }
        } else {
          // Handle rejected promises (network errors, etc.)
          newResponses[provider] = { status: 'error', content: '', error: 'Ошибка сети' };
          anyError = true;
        }

        // Special handling for insufficient balance, which might come as a fulfilled promise with error status
        if (newResponses[provider].error?.includes('Недостаточно токенов')) {
          hasInsufficientBalance = true;
          setError(newResponses[provider].error);
        }
      }

      setResponses(prev => ({ ...prev, ...newResponses }));

      if (!hasInsufficientBalance) {
        // Only update balance if no insufficient balance error occurred globally
        updateBalance(currentBalance);
      }
      
      // After all promises are settled and state is updated, load chat histories and update balance
      if (isFirstMessage && currentChatId) {
        loadUserChatHistories(); // Обновляем список чатов, чтобы увидеть новое название
      }

      if (anyError) {
        // Only set general error if it's not an insufficient balance error already handled
        if (!hasInsufficientBalance) {
          setError('Ошибка при отправке запросов');
        }
      } else {
        setError('');
      }

      // Очищаем поле ввода после отправки
      setMessage('');
      handleClearMainImage();
      
    } catch (error) {
      setError('Ошибка при отправке запросов');
      
      // Устанавливаем ошибку для всех провайдеров, которые были выбраны
      const errorResponses = {};
      selectedProviders.filter(p => aiModelsConfig[p]?.type === selectedCategory).forEach(provider => {
        errorResponses[provider] = {
          status: 'error',
          content: '',
          error: 'Ошибка сети'
        };
      });
      setResponses(prev => ({ ...prev, ...errorResponses }));
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

  const toggleProviderExpand = (provider) => {
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
      // Вместо удаления истории, мы устанавливаем currentChatId в null
      const newChatId = uuidv4(); // Генерируем новый chatId для новой сессии
      await selectChat(newChatId);

      // Очищаем локальную историю и сбрасываем currentChatId
      setChatHistories({});
      setMessage('');
      setResponses({});
      setIsFirstMessage(true); // Сбрасываем флаг, так как это новый чат

      setError(`✅ Начат новый чат.`);
      setTimeout(() => setError(''), 3000);

      loadUserChatHistories(); // Обновляем историю чатов после создания нового

    } catch (error) {
      setError('Ошибка при начале нового чата: ' + error.message);
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
      const minWidth = 320;
      const minHeight = 280;

     // Максимальный размер (80% от ширины экрана)
     const maxWidth = Math.min(window.innerWidth * 0.8, 640);
     const maxHeight = Math.min(window.innerHeight * 0.8, 480);

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

  const getProviderIcon = (providerKey) => {
    // Объединяем иконки из aiModelsConfig и дефолтные иконки
    const allIcons = {};
    for (const key in aiModelsConfig) {
      if (aiModelsConfig[key].icon) {
        allIcons[key] = aiModelsConfig[key].icon;
      }
    }
    
    const defaultIcons = {
      openai: '🤖',
      gemini: '🌟',
      xai: '🚀',
      yandexgpt: '🔍',
      gigachat: '💼',
      anthropic: '🧠',
      deepseek: '🔍',
      veo3: '🚀',
      imagen: '🌈',
      elevenlabs: '🎤',
      suno: '🎵',
      udio: '🎼',
      mubert: '🎧',
      'openai-tts': '🔊',
      runway: '🎬',
      pika: '⚡',
      soraVideo: '🎥',
      soraImage: '🖼️',
      'stable-video': '🎞️',
      luma: '🎭',
      midjourney: '🎨',
      dalle: '🖼️',
      'stable-diffusion': '🎭',
      firefly: '✨',
      leonardo: '🎪',
    };

    return allIcons[providerKey] || defaultIcons[providerKey] || '🤖';
  };

  const getProviderName = (providerKey) => {
    return aiModelsConfig[providerKey]?.label || providerKey;
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

  const handleChatSelect = async (chatId) => {
    await selectChat(chatId);
    setChatHistories({}); // Очищаем текущие истории для загрузки новых

    // Загружаем историю для каждого активного провайдера с новым chatId
    selectedProviders.forEach(provider => {
        loadChatHistory(provider, chatId);
    });

    setIsSidebarOpen(false); // Закрываем сайдбар
    setError(`✅ Переключено на чат.`);
    setTimeout(() => setError(''), 3000);
  };

  const handleRenameChat = async () => {
    if (!editingChat || !newChatTitle.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/api/multi-chat/${editingChat.chatId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id,
        },
        body: JSON.stringify({ chatTitle: newChatTitle.trim() }),
      });

      if (response.ok) {
        setEditingChat(null);
        setNewChatTitle("");
        loadUserChatHistories();
      } else {
        console.error('Ошибка переименования чата');
      }
    } catch (error) {
      console.error('Ошибка переименования чата:', error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот чат?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/multi-chat/${chatId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id,
        },
      });

      if (response.ok) {
        loadUserChatHistories();
        if (currentChatId === chatId) {
          clearAllChats(); // Если удаляем текущий чат, начинаем новый
        }
      } else {
        console.error('Ошибка удаления чата');
      }
    } catch (error) {
      console.error('Ошибка удаления чата:', error);
    }
  };

  const handleCategoryChange = (newCategory) => {
    if (newCategory === 'mix' && user?.tariffId?.name === 'Бесплатно') {
      setNotification('Режим "Микс" недоступен на бесплатном тарифе.');
      setTimeout(() => setNotification(''), 3000); // Скрываем уведомление через 3 секунды
      return;
    }
    setSelectedCategory(newCategory);
  };

  const handleImageUpload = async (provider, imageFile) => {
    if (!imageFile) return;

    // Удаляем предыдущую запись, чтобы не мешала новому состоянию загрузки
    setResponses(prev => ({ ...prev, [provider]: { ...prev[provider], imageUrl: null, error: '' } }));

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch(`${API_BASE}/api/upload/vk-cloud`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Обновляем состояние с URL изображения только после успешной загрузки
        setResponses(prev => ({
          ...prev,
          [provider]: { ...prev[provider], status: 'idle', imageUrl: data.imageUrl, error: '' }
        }));
        // Сохраняем файл изображения для этого провайдера, если нужно
        setProviderImageFiles(prev => ({ ...prev, [provider]: { url: data.imageUrl } }));
        return data.imageUrl; // Возвращаем URL
      } else {
        const errorData = await response.json();
        const errorMessage = `Ошибка загрузки изображения: ${errorData.message || 'Неизвестная ошибка'}`;
        setResponses(prev => ({
          ...prev,
          [provider]: { ...prev[provider], status: 'error', error: errorMessage }
        }));
        throw new Error(errorMessage); // Выбрасываем ошибку
      }
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      const errorMessage = 'Ошибка сети при загрузке изображения';
      setResponses(prev => ({
        ...prev,
        [provider]: { ...prev[provider], status: 'error', error: errorMessage }
      }));
      throw new Error(errorMessage); // Выбрасываем ошибку
    }
  };

  // Обработчики событий Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag Over', provider);
    setIsDraggingOver(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag Enter', provider);
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag Leave', provider);
    if (!e.currentTarget.contains(e.relatedTarget)) { // Проверяем, не перетаскиваем ли внутри элемента
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drop', provider);
    setIsDraggingOver(false);
    setDragDropError('');
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setDroppedFile(file);
        setSelectedImageFile(file); // Устанавливаем выбранный файл
        setSelectedImageUrl(URL.createObjectURL(file)); // Для немедленного предпросмотра
        setIndividualMessage(''); // Очищаем текстовое сообщение
      } else {
        setDragDropError('Поддерживаются только изображения и видеофайлы.');
        setTimeout(() => setDragDropError(''), 3000);
      }
    }
  };

  const handleClearDroppedFile = () => {
    setDroppedFile(null);
    setDragDropError('');
  };

  const handleProviderImageUpload = (provider, file) => {
    return handleImageUpload(provider, file);
  };

  return (
    <div className="flex flex-col h-full p-2 sm:p-6 relative">
      <NotificationPopup message={notification} onClose={() => setNotification('')} />
      {/* Боковая панель для истории чатов */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-64 bg-white text-gray-900 shadow-lg transform transition-transform duration-300 z-50",
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4 ml-3">История чатов</h2>
          <Button
            variant="ghost"
            className="absolute top-2 right-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setIsSidebarOpen(false)}
          >
            <ChevronRight className="h-5 w-5 mt-3 mr-2" />
          </Button>
          <ScrollArea className="h-[calc(100vh-100px)]">
            <div className="space-y-2">
              {userChatHistories.map(chat => (
                <div key={chat.chatId} className="flex items-center group">
                  <Button
                    variant={currentChatId === chat.chatId ? "default" : "ghost"}
                    className={cn(
                      "flex-1 justify-start text-left overflow-hidden whitespace-nowrap text-ellipsis max-w-48",
                      currentChatId === chat.chatId ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-gray-700 hover:bg-gray-100 "
                    )}
                    onClick={() => editingChat?.chatId !== chat.chatId && handleChatSelect(chat.chatId)}
                  >
                    {editingChat?.chatId === chat.chatId ? (
                      <Input
                        value={newChatTitle}
                        onChange={(e) => setNewChatTitle(e.target.value)}
                        onBlur={handleRenameChat}
                        onKeyPress={(e) => e.key === 'Enter' && handleRenameChat()}
                        autoFocus
                        className="h-8 text-black"
                        onClick={(e) => e.stopPropagation()} // Предотвращаем клик по кнопке
                      />
                    ) : (
                      chat.chatTitle
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => {
                        setEditingChat(chat);
                        setNewChatTitle(chat.chatTitle);
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Переименовать</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteChat(chat.chatId)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Удалить</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Основная область с прокруткой */}
       <div 
        className="flex-1 overflow-y-auto pb-4"
       >
        {/* Область сверху */}
        <div className="flex-shrink">
                 {/* Заголовок с кнопками управления */}
                  <Card className="mb-4">
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Мульти-чат AI
                        </CardTitle>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                            title={
                              isHeaderCollapsed
                                ? "Развернуть панель"
                                : "Свернуть панель"
                            }
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
                              if (
                                window.confirm(
                                  "Вы уверены, что хотите очистить все чаты? Это действие нельзя отменить."
                                )
                              ) {
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
                            {isClearingChats ? "Очистка..." : "Новый чат"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(true)}
                            title="История чатов"
                          >
                            <Menu className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {!isHeaderCollapsed && (
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap items-start justify-between gap-4 -mt-6">
                          <Tabs
                            defaultValue="chat"
                            className="w-full sm:w-auto"
                            value={selectedCategory}
                            onValueChange={handleCategoryChange}
                          >
                            <TabsList className="flex flex-col sm:flex-row w-full sm:w-auto flex-wrap h-auto gap-1">
                              
                              <TabsTrigger
                                value="chat"
                                className="flex items-center gap-2 justify-center w-full sm:w-auto"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Текст
                              </TabsTrigger>
                              <TabsTrigger
                                value="video"
                                className="flex items-center gap-2 justify-center"
                              >
                                <Video className="w-4 h-4" />
                                Видео
                              </TabsTrigger>
                              <TabsTrigger
                                value="audio"
                                className="flex items-center gap-2 justify-center"
                              >
                                <Music className="w-4 h-4" />
                                Аудио
                              </TabsTrigger>
                              <TabsTrigger
                                value="image"
                                className="flex items-center gap-2 justify-center"
                              >
                                <Image className="w-4 h-4" />
                                Изображения
                              </TabsTrigger>
                              <TabsTrigger
                                value="mix"
                                className="flex items-center gap-2 justify-center"
                              >
                                <Sparkles className="w-4 h-4" />
                                Микс
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>

                          <div className="flex-grow"></div>
                        </div>

                        {selectedProviders.length > 0 && ( // Показываем только если есть выбранные провайдеры
                          <div className="space-y-2 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Zap className="h-4 w-4" />
                              <span>
                                Будет списано: <strong>{selectedProviders.length} токенов</strong> 
                                (по 1 за каждый провайдер)
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

                        {activeProviders.length === 0 && (
                          <div className="text-center py-4">
                            <p className="text-gray-500 mb-2">Нет активных AI провайдеров</p>
                            <p className="text-sm text-gray-400">
                              Перейдите в раздел "Настройки AI" и включите нужные провайдеры
                            </p>
                          </div>
                        )}
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
                         <DndContext 
                           sensors={sensors}
                           collisionDetection={closestCenter}
                           onDragStart={handleDragStart}
                           onDragEnd={handleDragEnd}
                         >
                           <SortableContext 
                             items={selectedCategory === 'mix' ? selectedProviders : selectedProviders.filter(p => aiModelsConfig[p]?.type === selectedCategory)}
                             strategy={verticalListSortingStrategy}
                           >
                             {selectedCategory === 'mix' ? selectedProviders.map(provider => (
                               <SortableProviderCard 
                                 key={provider} 
                                 provider={provider}
                                 response={responses[provider]}
                                 history={chatHistories[provider]}
                                 onClearHistory={() => clearChatHistory(provider)}
                                 isLoading={loading && responses[provider]?.status === 'loading'}
                                 isExpanded={expandedProviders[provider]}
                                 onToggleExpand={() => toggleProviderExpand(provider)}
                                 size={providerSizes[provider]}
                                 onResizeStart={(e, p) => handleResizeStart(e, p)}
                                 chatRef={el => chatRefs.current[provider] = el}
                                 onSendMessage={sendToProvider} // Передаем функцию
                                 onImageUpload={handleProviderImageUpload} // Передаем функцию
                                 balance={totalBalance} // Передаем баланс
                               />
                             )) : selectedProviders.filter(p => aiModelsConfig[p]?.type === selectedCategory).map(provider => (
                               <SortableProviderCard 
                                 key={provider} 
                                 provider={provider}
                                 response={responses[provider]}
                                 history={chatHistories[provider]}
                                 onClearHistory={() => clearChatHistory(provider)}
                                 isLoading={loading} // Передаем глобальный loading
                                 isExpanded={expandedProviders[provider]}
                                 onToggleExpand={() => toggleProviderExpand(provider)}
                                 size={providerSizes[provider]}
                                 onResizeStart={(e, p) => handleResizeStart(e, p)}
                                 chatRef={el => chatRefs.current[provider] = el}
                                 onSendMessage={sendToProvider} // Передаем функцию
                                 onImageUpload={handleProviderImageUpload} // Передаем функцию
                                 balance={totalBalance} // Передаем баланс
                               />
                             ))}
                           </SortableContext>
                           <DragOverlay>
                             {activeId ? (
                               <ProviderCard 
                                 provider={activeId}
                                 response={responses[activeId]}
                                 history={chatHistories[activeId]}
                                 isExpanded={expandedProviders[activeId]}
                                 size={providerSizes[activeId]}
                                 onImageUpload={handleProviderImageUpload}
                                 balance={totalBalance} // Передаем баланс
                               />
                             ) : null}
                           </DragOverlay>
                         </DndContext>
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

          {mainInputImageUrl && (
            <div className="relative w-24 h-24 mb-2">
              <img src={mainInputImageUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/70 hover:bg-white"
                onClick={handleClearMainImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
           )}
          
          {selectedCategory !== 'mix' && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative flex items-center gap-2">
                {(selectedCategory === 'image' || selectedCategory === 'video') && (
                  <>
                    <input
                      type="file"
                      ref={mainFileInputRef}
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleMainImageSelect}
                      disabled={loading || totalBalance < 1}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => mainFileInputRef.current?.click()}
                      className="px-3"
                      title="Загрузить изображение или видео"
                      disabled={loading || totalBalance < 1 || isUploadingMainImage}
                    >
                      {isUploadingMainImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </>
                )}
                <Textarea
                  placeholder={totalBalance < 1 ? "Недостаточно токенов. Пополните баланс." : "Введите ваш запрос..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className={`min-h-[50px] resize-y w-full ${totalBalance < 1 ? 'bg-gray-100 text-gray-500' : ''}`}
                  disabled={loading || selectedProviders.length === 0 || totalBalance < 1}
                />
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 dark:bg-black dark:bg-opacity-80 rounded-md z-10">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Обработка запроса...</span>
                  </div>
                )}
              </div>
              <Button
                onClick={sendToAllProviders}
                disabled={loading || !message.trim() || selectedProviders.length === 0 || totalBalance < 1}
                className="px-6 w-full sm:w-auto"
                title={`loading: ${loading}, message: ${!!message.trim()}, providers: ${selectedProviders.length}, balance: ${totalBalance}`}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
          
          {selectedCategory !== 'mix' && (
            <div className="mt-0.5 text-xs text-gray-500">
              Нажмите Enter для отправки, Shift+Enter для новой строки
              {totalBalance < 1 && (
                <span className="ml-2 text-red-500 font-medium">
                  ⚠️ Недостаточно токенов для отправки сообщения
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MultiChat; 