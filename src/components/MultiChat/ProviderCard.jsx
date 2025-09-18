import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  RotateCcw,
  Minimize2,
  Maximize2,
  Plus,
  GripVertical,
  X,
  Copy,
  Trash2,
} from 'lucide-react';

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
  onSendMessage,
  onImageUpload,
  balance,
  setMainError,
  ...props
}, ref) => {
  const [showHistory, setShowHistory] = useState(true);
  const [individualMessage, setIndividualMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const [showInputField, setShowInputField] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageUploadButtonRef = useRef(null);

  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [droppedFile, setDroppedFile] = useState(null);
  const [dragDropError, setDragDropError] = useState('');

  useEffect(() => {
    localStorage.removeItem(`multichat_input_collapsed_${provider}`);
  }, [provider]);

  useEffect(() => {
    if (showInputField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInputField]);

  useEffect(() => {
    setSelectedImageFile(null);
    setSelectedImageUrl(null);
  }, [provider]);

  const getProviderIcon = (prov) => {
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
    return icons[prov] || '🤖';
  };

  const getProviderName = (prov) => {
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
      soraVideo: 'OpenAI Sora Video',
      soraImage: 'OpenAI Sora Image',
      'stable-video': 'Stable Video Diffusion',
      luma: 'Luma AI',
      midjourney: 'Midjourney',
      dalle: 'DALL-E 3',
      'stable-diffusion': 'Stable Diffusion XL',
      firefly: 'Adobe Firefly',
      leonardo: 'Leonardo AI',
    };
    return names[prov] || prov;
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
      setSelectedImageUrl(URL.createObjectURL(file));
      setIsUploadingImage(true);
      try {
        const uploadedUrl = await onImageUpload(provider, file);
        setSelectedImageUrl(uploadedUrl);
      } catch (error) {
        console.error('Ошибка при загрузке изображения:', error);
        setSelectedImageFile(null);
        setSelectedImageUrl(null);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleClearImage = () => {
    setSelectedImageFile(null);
    setSelectedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (individualMessage.trim() || selectedImageFile) {
      setIsSending(true);
      let imageUrlToUse = selectedImageUrl;
      let fileToUpload = selectedImageFile;

      try {
        if (fileToUpload && (!imageUrlToUse || !/^https?:\/\//i.test(imageUrlToUse))) {
          setIsUploadingImage(true);
          try {
            const uploadedUrl = await onImageUpload(provider, fileToUpload);
            imageUrlToUse = uploadedUrl;
          } catch (uploadErr) {
            console.error('Ошибка при загрузке выбранного файла перед отправкой:', uploadErr);
            setIsUploadingImage(false);
            setDragDropError('Ошибка при загрузке файла. Попробуйте еще раз.');
            setTimeout(() => setDragDropError(''), 3000);
            return;
          } finally {
            setIsUploadingImage(false);
          }
        }

        if (droppedFile) {
          fileToUpload = droppedFile;
          setIsUploadingImage(true);
          try {
            const uploadedUrl = await onImageUpload(provider, droppedFile);
            imageUrlToUse = uploadedUrl;
          } catch (error) {
            console.error('Ошибка при загрузке перетащенного файла:', error);
            setIsUploadingImage(false);
            setDragDropError('Ошибка при загрузке файла. Попробуйте еще раз.');
            setTimeout(() => setDragDropError(''), 3000);
            return;
          } finally {
            setIsUploadingImage(false);
          }
        }

        const result = await onSendMessage(provider, individualMessage.trim(), imageUrlToUse);
        
        if (result && result.status === 'error') {
          setLocalError(result.error);
        } else {
          setIndividualMessage('');
          handleClearImage();
          setLocalError(''); // Очищаем ошибку при успешной отправке
        }
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    setDragDropError('');
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setDroppedFile(file);
        setSelectedImageFile(file);
        setSelectedImageUrl(URL.createObjectURL(file));
        setIndividualMessage('');
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

  return (
    <Card
      ref={ref}
      {...props}
      data-provider={provider}
      className={cn(
        `${getStatusColor(response?.status || 'idle')} relative transition-all duration-200 ease-in-out flex flex-col !py-2 !gap-2 overflow-hidden`,
        {
          'border-2 border-dashed border-blue-500 bg-blue-50': isDraggingOver,
        }
      )}
      style={{
        width: isExpanded ? '100%' : (size.width ? `${size.width}px` : 'min(100%, 320px)'),
        height: isExpanded ? 'auto' : (size.height ? `${size.height}px` : 'auto'),
        minWidth: isExpanded ? '100%' : 'auto',
        minHeight: isExpanded ? 'auto' : 'auto',
        maxHeight: isExpanded ? 'auto' : '800px',
        order: isExpanded ? -1 : 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        ...props.style,
      }}
    >
      <CardHeader className="pb-1 pt-2 !px-2 !gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span {...dragHandleListeners} className="cursor-grab touch-none">
              <GripVertical size={18} className="text-gray-400" />
            </span>
            <span className="text-lg">{getProviderIcon(provider)}</span>
            <span className="font-medium">{getProviderName(provider)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn('pt-0 pb-0 !px-2 flex flex-col flex-1 min-h-0', {
          'border-2 border-dashed border-blue-500 bg-blue-50': isDraggingOver,
        })}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto border rounded p-1 bg-gray-50 min-h-[150px] flex flex-col justify-between"
        >
          {history && history.length > 0 ? (
            <>
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
                  <div key={msg._id || index} className={`p-1 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 ml-2' : 'bg-green-100 mr-2'}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium mt-1">
                        {msg.role === 'user' ? '👤' : '🤖'}
                      </span>
                      <div className="flex-1 min-w-0">
                        {msg.role === 'user' && (() => {
                          const tagMatch = (msg.content || '').match(/<IMAGE_URL:([^>]+)>/i);
                          const imageMatch = (msg.content || '').match(/https?:\/\/\S+\.(?:jpeg|jpg|png|gif|webp|svg)(?:\?\S*)?/i);
                          const userImageUrl = msg.imageUrl || (tagMatch ? tagMatch[1] : (imageMatch ? imageMatch[0] : null));
                          return userImageUrl ? (
                            <div className="mb-2">
                              <img src={userImageUrl} alt="User uploaded image" className="max-w-full h-auto rounded-md" style={{ width: '360px' }} />
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => window.open(userImageUrl, '_blank')}
                                className="p-0 h-auto text-blue-600 hover:text-blue-800"
                              >
                                Открыть оригинал
                              </Button>
                            </div>
                          ) : null;
                        })()}
                        {(msg.role === 'user') ? (
                          (() => {
                            const tagMatch = (msg.content || '').match(/<IMAGE_URL:([^>]+)>/i);
                            const imageMatch = (msg.content || '').match(/https?:\/\/\S+\.(?:jpeg|jpg|png|gif|webp|svg)(?:\?\S*)?/i);
                            const urlToStrip = msg.imageUrl || (tagMatch ? tagMatch[1] : (imageMatch ? imageMatch[0] : ''));
                            const textOnly = (msg.content || '')
                              .replace(urlToStrip || '', '')
                              .replace(/<IMAGE_URL:.*?>/gi, '')
                              .trim();
                            return textOnly ? (
                              <p className="text-sm whitespace-pre-wrap break-words">{textOnly}</p>
                            ) : null;
                          })()
                        ) : (
                          msg.content.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
                            <div className="mb-2">
                              <video controls src={msg.content} className="max-w-full h-auto rounded-md" style={{ width: '360px' }} />
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => window.open(msg.content, '_blank')}
                                className="p-0 h-auto text-blue-600 hover:text-blue-800"
                              >
                                Открыть оригинал
                              </Button>
                            </div>
                          ) : msg.content.match(/\.(jpeg|jpg|png|gif|webp|svg)(\?.*)?$/i) ? (
                            <div className="mb-2">
                              <img src={msg.content} alt="Generated image" className="max-w-full h-auto rounded-md" style={{ width: '360px' }} />
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => window.open(msg.content, '_blank')}
                                className="p-0 h-auto text-blue-600 hover:text-blue-800"
                              >
                                Открыть оригинал
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          )
                        )}
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
            </>
          ) : (
            <div className="text-center text-gray-500 py-4 flex-1 flex flex-col items-center justify-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Начните новый чат или выберите существующий.</p>
            </div>
          )}
          {localError && (
            <Alert variant="destructive" className="mt-2 p-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">{localError}</AlertDescription>
            </Alert>
          )}
        </div>
        {response?.status === 'loading' && (
          <div className="flex items-center gap-2 text-gray-600 py-1 mt-auto flex-shrink-0">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Обработка запроса...</span>
          </div>
        )}
        {isSending && (
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
        {dragDropError && (
          <Alert variant="destructive" className="mt-2 p-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">{dragDropError}</AlertDescription>
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

      {showInputField ? (
        <div className="p-2 border-t">
          {balance < 1 && (
            <Alert variant="destructive" className="mb-2 py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">⚠️ Недостаточно токенов для отправки сообщения</AlertDescription>
            </Alert>
          )}
          {(selectedImageUrl || isUploadingImage) && (
            <div className="flex justify-end mb-2 relative h-[100px]">
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

          {isSending ? (
            <div className="flex items-center justify-center gap-2 text-gray-600 h-[40px] border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Загрузка...</span>
            </div>
          ) : (
            <div className="flex gap-2 items-center relative">
              {(provider === 'veo3' || provider === 'imagen' || provider === 'soraImage' || provider === 'soraVideo' || provider === 'dalle') && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleImageSelect}
                    disabled={balance < 1 || isLoading}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3"
                    title="Загрузить изображение или видео"
                    ref={imageUploadButtonRef}
                    disabled={balance < 1 || isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Textarea
                ref={inputRef}
                placeholder={balance < 1 ? 'Недостаточно токенов. Пополните баланс.' : `Запрос для ${getProviderName(provider)}...`}
                value={individualMessage}
                onChange={(e) => {
                  setIndividualMessage(e.target.value);
                  setLocalError(''); // Очищаем ошибку при вводе
                }}
                onKeyPress={handleKeyPress}
                onBlur={(e) => {
                  if (
                    !individualMessage.trim() &&
                    !selectedImageFile &&
                    e.relatedTarget !== fileInputRef.current &&
                    e.relatedTarget !== imageUploadButtonRef.current
                  ) {
                    setShowInputField(false);
                  }
                }}
                className="min-h-[40px] resize-none text-sm flex-1"
                rows={1}
                disabled={isLoading || balance < 1}
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={(!individualMessage.trim() && !selectedImageFile) || isLoading || isUploadingImage || balance < 1}
                className="px-6"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
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

export default ProviderCard;


