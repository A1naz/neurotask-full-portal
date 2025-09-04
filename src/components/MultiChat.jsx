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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
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
  Music
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { aiModelsConfig } from '@/config/ai-models'; // Import aiModelsConfig

const ProviderCard = React.forwardRef(({ 
  provider, 
  response, 
  history, 
  onResend, 
  onClearHistory, 
  isLoading, 
  isExpanded, 
  onToggleExpand,
  size = {},
  onResizeStart,
  chatRef,
  dragHandleListeners,
  onSendMessage, // Новое свойство для отправки сообщения
  onImageUpload, // Новое свойство для обработки загрузки изображения
  ...props 
}, ref) => {
  const [showHistory, setShowHistory] = useState(true);
  const [individualMessage, setIndividualMessage] = useState(''); // Состояние для индивидуального сообщения
  const [showInputField, setShowInputField] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null); // Добавляем ref для скрытого input file
  const imageUploadButtonRef = useRef(null); // Добавляем ref для кнопки загрузки изображения

  const [selectedImageFile, setSelectedImageFile] = useState(null); // Новое состояние для файла изображения
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);   // Новое состояние для URL изображения
  const [isUploadingImage, setIsUploadingImage] = useState(false); // Новое состояние для отслеживания загрузки изображения

  useEffect(() => {
    // Remove the old localStorage item if it exists
    localStorage.removeItem(`multichat_input_collapsed_${provider}`);
  }, [provider]);

  useEffect(() => {
    if (showInputField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInputField]);

  // Очистка выбранного изображения при смене провайдера
  useEffect(() => {
    setSelectedImageFile(null);
    setSelectedImageUrl(null);
  }, [provider]);

  const getProviderIcon = (provider) => {
    const icons = {
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
      sora: '🎥',
      'stable-video': '🎞️',
      luma: '🎭',
      midjourney: '🎨',
      dalle: '🖼️',
      'stable-diffusion': '🎭',
      firefly: '✨',
      leonardo: '🎪',
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
      deepseek: 'DeepSeek',
      veo3: 'Google Veo3',
      imagen: 'Google Imagen',
      elevenlabs: 'ElevenLabs',
      suno: 'Suno AI',
      udio: 'Udio',
      mubert: 'Mubert',
      'openai-tts': 'OpenAI TTS',
      runway: 'Runway Gen-3',
      pika: 'Pika Labs',
      sora: 'OpenAI Sora',
      'stable-video': 'Stable Video Diffusion',
      luma: 'Luma AI',
      midjourney: 'Midjourney',
      dalle: 'DALL-E 3',
      'stable-diffusion': 'Stable Diffusion XL',
      firefly: 'Adobe Firefly',
      leonardo: 'Leonardo AI',
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

  const copyResponse = (content) => {
    navigator.clipboard.writeText(content);
  };
  
  const handleImageSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImageFile(file);
      setSelectedImageUrl(URL.createObjectURL(file)); // Для немедленного предпросмотра
      setIsUploadingImage(true); // Начинаем загрузку
      try {
        const uploadedUrl = await onImageUpload(provider, file); // Вызываем родительскую функцию загрузки
        setSelectedImageUrl(uploadedUrl); // Обновляем URL на тот, что вернул бэкенд
      } catch (error) {
        console.error("Ошибка при загрузке изображения:", error);
        setSelectedImageFile(null);
        setSelectedImageUrl(null);
        // Можно добавить отображение ошибки пользователю
      } finally {
        setIsUploadingImage(false); // Загрузка завершена
      }
    }
  };

  const handleClearImage = () => {
    setSelectedImageFile(null);
    setSelectedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Очищаем input file
    }
  };

  const handleSend = () => {
    if (individualMessage.trim() || selectedImageFile) {
      onSendMessage(provider, individualMessage.trim(), selectedImageUrl); // Передаем URL изображения
      setIndividualMessage(''); // Очищаем поле после отправки
      handleClearImage(); // Очищаем выбранное изображение
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <Card 
      ref={ref}
      {...props}
      data-provider={provider}
      className={`${getStatusColor(response?.status || 'idle')} relative flex-shrink-0 transition-all duration-200 ease-in-out flex flex-col !py-2 !gap-2 overflow-hidden`}
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
        flexShrink: 0,
        ...props.style
      }}
    >
      <CardHeader className="pb-1 pt-2 !px-2 !gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span {...dragHandleListeners} className="cursor-grab touch-none">
              <GripVertical size={18} className="text-gray-400" />
            </span>
            <span className="text-lg">{getProviderIcon(provider)}</span>
            <span className="font-medium">{getProviderName(provider)}</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(response?.status || 'idle')}
            <Badge variant="outline" className="text-xs">
              {response?.status || 'idle'}
            </Badge>
            {size && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResizeStart(provider)}
                className="h-6 w-6 p-0 hover:bg-blue-50"
                title="Сбросить размер"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="h-6 w-6 p-0 hover:bg-blue-50"
            >
              {isExpanded ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInputField(true)}
              className="h-6 w-6 p-0 hover:bg-blue-50"
              title="Отправить индивидуальное сообщение"
            >
              <Send className="h-3 w-3" />
            </Button> */}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-0 !px-2 flex flex-col flex-1 min-h-0">
        {history && history.length > 0 && (
          <div 
            ref={chatRef}
            className="flex-1 overflow-y-auto border rounded p-1 bg-gray-50 min-h-0" 
          >
            <div className="text-xs text-gray-500 mb-1 flex items-center justify-between">
              <span>История чата ({history.length} сообщений)</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearHistory}
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1 overflow-y-auto flex-1 min-h-0">
              {history.map((msg, index) => (
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
        {response?.status === 'loading' && (
          <div className="flex items-center gap-2 text-gray-600 py-1 mt-auto flex-shrink-0">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Обработка запроса...</span>
          </div>
        )}
        {response?.status === 'error' && response?.error && (
          <Alert variant="destructive" className="py-2 mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">{response.error}</AlertDescription>
            {response?.insufficientBalance && (
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
                  Текущий баланс: {response?.currentBalance || 0} токенов
                </span>
              </div>
            )}
          </Alert>
        )}
      </CardContent>
      {!isExpanded && (
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nw-resize bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded-tl flex items-center justify-center z-10"
          onMouseDown={(e) => onResizeStart(e, provider)}
          title="Изменить размер"
          style={{ transform: 'translate(50%, 50%)' }}
        >
          <div className="w-2 h-2 bg-gray-400 rounded-sm" />
        </div>
      )}

      {/* Поле ввода для индивидуального сообщения */}
      {showInputField ? (
        <div className="p-2 border-t">
          {(selectedImageUrl || isUploadingImage) && (
            <div className="flex justify-end mb-2 relative h-[100px]"> {/* Добавлена фиксированная высота для загрузки */}
              {isUploadingImage ? (
                <div className="flex items-center justify-center w-[100px] h-[100px] bg-gray-100 rounded-md">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                </div>
              ) : (
                <>
                  <img src={selectedImageUrl} alt="Preview" className="max-w-[100px] max-h-[100px] object-cover rounded-md" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/70 hover:bg-white"
                    onClick={handleClearImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          )}
          <div className="flex gap-2 items-center">
            {(provider === 'veo3' || provider === 'imagen') && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3"
                  title="Загрузить изображение"
                  ref={imageUploadButtonRef} // Привязываем ref к кнопке
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </>
            )}
            <Textarea
              ref={inputRef}
              placeholder={`Запрос для ${getProviderName(provider)}...`}
              value={individualMessage}
              onChange={(e) => setIndividualMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              onBlur={(e) => {
                // Проверяем, куда ушел фокус
                if (
                  !individualMessage.trim() &&
                  !selectedImageFile &&
                  e.relatedTarget !== fileInputRef.current &&
                  e.relatedTarget !== imageUploadButtonRef.current
                ) {
                  setShowInputField(false);
                }
              }}
              className="min-h-[40px] resize-none text-sm"
              rows={1}
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={(!individualMessage.trim() && !selectedImageFile) || isLoading || isUploadingImage} // Добавляем isUploadingImage
              className="px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          onClick={() => setShowInputField(true)}
          className="absolute bottom-2 right-2 px-6"
          title="Отправить индивидуальное сообщение"
        >
          <Send className="h-4 w-4" />
        </Button>
      )}
    </Card>
  );
});

const SortableProviderCard = ({ provider, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: provider});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ProviderCard 
      ref={setNodeRef} 
      style={style} 
      provider={provider} 
      dragHandleListeners={listeners}
      {...attributes}
      {...props}
    />
  );
};


const MultiChat = () => {
  const { API_BASE, csrfToken, user } = useAuth();
  const { balance, updateBalance } = useTokenBalance();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [responses, setResponses] = useState({});
  const [activeProviders, setActiveProviders] = useState([]);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);

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
  const [currentChatId, setCurrentChatId] = useState(null);
  const [userChatHistories, setUserChatHistories] = useState([]); // Новое состояние для истории чатов пользователя
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Состояние для управления видимостью сайдбара
  const [isFirstMessage, setIsFirstMessage] = useState(true); // Состояние для отслеживания первого сообщения в новом чате

  const [providerImageFiles, setProviderImageFiles] = useState({}); // Новое состояние для файлов изображений

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
  }, [csrfToken, user?._id, selectedCategory]);

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

        if (!fetchedCurrentChatId) {
          // Если currentChatId нет, генерируем новый и сохраняем его
          const newChatId = uuidv4();
          setCurrentChatId(newChatId);
          // Отправляем PATCH запрос на бэкенд, чтобы сохранить новый currentChatId
          await fetch(`${API_BASE}/api/multi-chat/ai-settings/${user._id}/current-chat`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
              'x-user-id': user._id
            },
            body: JSON.stringify({ currentChatId: newChatId }),
          });
          fetchedCurrentChatId = newChatId; // Используем новый chatId для текущей сессии
        }
        
        setCurrentChatId(fetchedCurrentChatId);
        
        // Use locally stored order if available
        const savedOrder = localStorage.getItem('multichat_selected_providers');
        if (savedOrder) {
          try {
            const orderedProviders = JSON.parse(savedOrder);
            // Filter out any providers that are no longer active
            const validOrderedProviders = orderedProviders.filter(p => allActiveProviders.includes(p));
            // Add any new active providers that were not in the saved order
            const newProviders = allActiveProviders.filter(p => !validOrderedProviders.includes(p));
            const finalProviders = [...validOrderedProviders, ...newProviders];
            setSelectedProviders(finalProviders);
          } catch (e) {
            // Если парсинг не удался, возвращаемся ко всем активным провайдерам
            setSelectedProviders(allActiveProviders); // Инициализируем всеми активными провайдерами
          }
        } else {
          setSelectedProviders(allActiveProviders); // Инициализируем всеми активными провайдерами, если нет сохраненного порядка
        }
        
        // После обновления selectedProviders (из localStorage или по умолчанию),
        // фильтруем их по текущей выбранной категории для инициализации ответов.
        const providersToInitialize = selectedProviders.filter(p => aiModelsConfig[p]?.type === selectedCategory);
        
        const initialResponses = {};
        // Инициализируем ответы только для текущих выбранных провайдеров
        providersToInitialize.forEach(provider => {
          initialResponses[provider] = { status: 'idle', content: '', error: '' };
          if (fetchedCurrentChatId) {
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

  const sendToProvider = async (provider, messageToSend) => {
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
              message: messageToSend.trim(),
              provider: provider, // Используем текущего провайдера для названия чата
            }),
          });
          setIsFirstMessage(false); // Сбрасываем флаг после первого сообщения
          loadUserChatHistories(); // Обновляем список чатов, чтобы увидеть новое название
        } catch (namingError) {
          console.error('Error generating chat name for single provider:', namingError);
          // Не блокируем отправку сообщения, даже если название не сгенерировалось
        }
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
          message: messageToSend.trim(),
          systemPrompt: systemPrompt,
          chatId: currentChatId // Передаем currentChatId
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
          loadChatHistory(provider, currentChatId);
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
      const promises = providersInCurrentCategory.map(provider => sendToProvider(provider, message));
      
      // Используем Promise.allSettled для обработки всех результатов, даже если есть ошибки
      const results = await Promise.allSettled(promises);
      
      // Обновляем ответы для каждого провайдера на основе результатов Promise.allSettled
      results.forEach((result, index) => {
        const provider = providersInCurrentCategory[index];
        if (result.status === 'fulfilled') {
          // Предполагаем, что sendToProvider уже обновил responses, если был успех
          // Если sendToProvider возвращает что-то, это можно обработать здесь.
          // В текущей реализации sendToProvider обновляет состояние напрямую,
          // поэтому здесь, по сути, не нужно делать ничего, кроме сброса общей ошибки.
        } else {
          // Обработка отклоненных промисов (т.е. ошибок, которые не были пойманы sendToProvider)
          // В данном случае sendToProvider должен был поймать большинство ошибок и обновить состояние responses.
          // Но если по какой-то причине промис отклонился здесь, мы можем установить общую ошибку сети.
          setResponses(prev => ({
            ...prev,
            [provider]: {
              status: 'error',
              content: '',
              error: 'Ошибка сети'
            }
          }));
        }
      });

      // Общая обработка ошибок, если все провайдеры вернули ошибку сети
      const anyError = Object.values(responses).some(r => r.status === 'error');
      if (anyError) {
        setError('Ошибка при отправке запросов');
      } else {
        setError('');
      }

      // Обновляем историю чата для успешных провайдеров
      // Эта часть должна быть внутри sendToProvider или Promise.allSettled результата
      // Так как sendToProvider уже вызывает loadChatHistory при успехе, этот блок не нужен.
      
      // Очищаем поле ввода после отправки
      setMessage('');
      
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
      const response = await fetch(`${API_BASE}/api/multi-chat/ai-settings/${user._id}/current-chat`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id
        },
        body: JSON.stringify({ currentChatId: newChatId }),
      });

      if (response.ok) {
        // Очищаем локальную историю и сбрасываем currentChatId
        setChatHistories({});
        setMessage('');
        setResponses({});
        setCurrentChatId(newChatId); // Устанавливаем новый currentChatId
        setIsFirstMessage(true); // Сбрасываем флаг, так как это новый чат

        setError(`✅ Начат новый чат.`);
        setTimeout(() => setError(''), 3000);

        loadUserChatHistories(); // Обновляем историю чатов после создания нового

      } else {
        const errorData = await response.json();
        setError(`Ошибка начала нового чата: ${errorData.message || 'Неизвестная ошибка'}`);
      }
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
      sora: '🎥',
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
    if (!csrfToken || !user?._id) return;
    try {
      // Обновляем currentChatId на бэкенде
      await fetch(`${API_BASE}/api/multi-chat/ai-settings/${user._id}/current-chat`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'x-user-id': user._id
        },
        body: JSON.stringify({ currentChatId: chatId }),
      });

      // Обновляем локальное состояние
      setCurrentChatId(chatId);
      setChatHistories({}); // Очищаем текущие истории для загрузки новых

      // Загружаем историю для каждого активного провайдера с новым chatId
      selectedProviders.forEach(provider => {
        loadChatHistory(provider, chatId);
      });

      setIsSidebarOpen(false); // Закрываем сайдбар
      setError(`✅ Переключено на чат с ID: ${chatId}`);
      setTimeout(() => setError(''), 3000);

    } catch (error) {
      console.error('Ошибка при выборе чата:', error);
      setError(`Ошибка при выборе чата: ${error.message}`);
    }
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
        setProviderImageFiles(prev => ({ ...prev, [provider]: imageFile }));
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

  return (
    <div className="flex flex-col h-full p-6 relative">
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
                <Button
                  key={chat.chatId}
                  variant={currentChatId === chat.chatId ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left overflow-hidden whitespace-nowrap text-ellipsis",
                    currentChatId === chat.chatId ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-gray-700 hover:bg-gray-100 "
                  )}
                  onClick={() => handleChatSelect(chat.chatId)}
                >
                  {chat.chatTitle}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

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
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={() => setIsSidebarOpen(true)}
                   className="ml-2"
                   title="История чатов"
                 >
                   <Menu className="h-5 w-5" />
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
             <Tabs defaultValue="chat" className="w-full" value={selectedCategory} onValueChange={setSelectedCategory}>
               <TabsList className="grid w-full grid-cols-4">
                 <TabsTrigger value="chat" className="flex items-center gap-2">
                   <MessageSquare className="w-4 h-4" />
                   Основные
                 </TabsTrigger>
                 <TabsTrigger value="video" className="flex items-center gap-2">
                   <Video className="w-4 h-4" />
                   Видео
                 </TabsTrigger>
                 <TabsTrigger value="audio" className="flex items-center gap-2">
                   <Music className="w-4 h-4" />
                   Аудио
                 </TabsTrigger>
                 <TabsTrigger value="image" className="flex items-center gap-2">
                   <Image className="w-4 h-4" />
                   Изображения
                 </TabsTrigger>
               </TabsList>

               {/* Контент вкладок */}
               <TabsContent value="chat" className="mt-6">
                 <Label className="text-sm font-medium mb-2 block">Выберите основные провайдеры:</Label>
                 <div className="flex flex-wrap gap-2">
                   {chatProviders.map(provider => (
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
               </TabsContent>

               <TabsContent value="video" className="mt-6">
                 <Label className="text-sm font-medium mb-2 block">Выберите видео провайдеры:</Label>
                 <div className="flex flex-wrap gap-2">
                   {videoProviders.map(provider => (
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
               </TabsContent>

               <TabsContent value="audio" className="mt-6">
                 <Label className="text-sm font-medium mb-2 block">Выберите аудио провайдеры:</Label>
                 <div className="flex flex-wrap gap-2">
                   {audioProviders.length > 0 ? (
                     audioProviders.map(provider => (
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
                     ))
                   ) : (
                     <p className="text-gray-500 text-sm">Аудио провайдеры пока недоступны.</p>
                   )}
                 </div>
               </TabsContent>

               <TabsContent value="image" className="mt-6">
                 <Label className="text-sm font-medium mb-2 block">Выберите провайдеры изображений:</Label>
                 <div className="flex flex-wrap gap-2">
                   {imageProviders.map(provider => (
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
               </TabsContent>
             </Tabs>
                        {/* Статистика */}
           {stats.total > 0 && (
             <div className="flex items-center gap-4 mb-4 mt-6">
               <Badge variant="secondary">{stats.total} провайдеров</Badge>
               {stats.success > 0 && <Badge variant="default" className="bg-green-100 text-green-800">{stats.success} успешно</Badge>}
               {stats.error > 0 && <Badge variant="destructive">{stats.error} ошибок</Badge>}
               {stats.loading > 0 && <Badge variant="outline" className="bg-blue-100 text-blue-800">{stats.loading} загрузка</Badge>}
             </div>
           )}

             {/* Выбор провайдеров */}
             {/* Этот блок заменен Tabs UI, поэтому он больше не нужен */}
             {/* <div className="space-y-2">
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
             </div> */}
             
             {selectedProviders.length > 0 && ( // Показываем только если есть выбранные провайдеры
               <div className="space-y-2 mt-4">
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
                      items={selectedProviders.filter(p => aiModelsConfig[p]?.type === selectedCategory)}
                      strategy={verticalListSortingStrategy}
                    >
                      {selectedProviders.filter(p => aiModelsConfig[p]?.type === selectedCategory).map(provider => (
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
                          onImageUpload={handleImageUpload} // Передаем функцию
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