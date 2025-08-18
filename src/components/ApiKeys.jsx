import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Plus, Trash2, Edit, Eye, EyeOff, BookOpen, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ApiDocumentation from './ApiDocumentation';

const ApiKeys = () => {
  const { API_BASE, csrfToken } = useAuth();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [createdKey, setCreatedKey] = useState(null);
  const [showCreatedKeyDialog, setShowCreatedKeyDialog] = useState(false);
  const [activeView, setActiveView] = useState('keys'); // 'keys' или 'docs'
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    permissions: {
      multiChat: true,
      assistant: true,
      readOnly: false
    },
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000
    }
  });

  // Загружаем API ключи
  const loadApiKeys = async () => {
    if (!csrfToken) {
      setError('Ошибка: CSRF токен не найден');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/api-keys`, {
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys || []);
      } else if (response.status === 403) {
        setError('Ошибка доступа: проверьте авторизацию');
      } else {
        setError('Ошибка загрузки API ключей');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (csrfToken) {
      loadApiKeys();
    }
  }, [csrfToken]);

  // Создание нового API ключа
  const createApiKey = async () => {
    if (!csrfToken) {
      alert('Ошибка: CSRF токен не найден');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/api-keys`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(newKeyData)
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(prev => [data.apiKey, ...prev]);
        setShowCreateDialog(false);
        setNewKeyData({
          name: '',
          permissions: { multiChat: true, assistant: true, readOnly: false },
          rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }
        });
        
        // Показываем новый ключ в модальном окне
        setCreatedKey(data.apiKey.plainKey);
        setShowCreatedKeyDialog(true);
      } else {
        const errorData = await response.json();
        alert(`Ошибка создания API ключа: ${errorData.message}`);
      }
    } catch (error) {
      alert('Ошибка сети');
    }
  };

  // Обновление API ключа
  const updateApiKey = async (keyId, updates) => {
    if (!csrfToken) {
      alert('Ошибка: CSRF токен не найден');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/api-keys/${keyId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(prev => prev.map(key => 
          key._id === keyId ? data.apiKey : key
        ));
        setShowEditDialog(false);
        setEditingKey(null);
        alert('API ключ обновлен');
      } else {
        const errorData = await response.json();
        alert(`Ошибка обновления API ключа: ${errorData.message}`);
      }
    } catch (error) {
      alert('Ошибка сети');
    }
  };

  // Удаление API ключа
  const deleteApiKey = async (keyId) => {
    if (!confirm('Вы уверены, что хотите удалить этот API ключ?')) {
      return;
    }

    if (!csrfToken) {
      alert('Ошибка: CSRF токен не найден');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/api-keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken
        }
      });

      if (response.ok) {
        setApiKeys(prev => prev.filter(key => key._id !== keyId));
        alert('API ключ удален');
      } else {
        const errorData = await response.json();
        alert(`Ошибка удаления API ключа: ${errorData.message}`);
      }
    } catch (error) {
      alert('Ошибка сети');
    }
  };

  // Копирование API ключа
  const copyApiKey = (key) => {
    navigator.clipboard.writeText(key);
    alert('API ключ скопирован в буфер обмена');
  };

  // Копирование созданного ключа
  const copyCreatedKey = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      alert('API ключ скопирован в буфер обмена');
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  // Получение статуса ключа
  const getKeyStatus = (key) => {
    if (!key.isActive) return { text: 'Неактивен', variant: 'secondary' };
    if (key.lastUsed) return { text: 'Активен', variant: 'default' };
    return { text: 'Не использовался', variant: 'outline' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">API Ключи</h2>
          <p className="text-gray-600">Управляйте API ключами и изучите документацию</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={activeView === 'keys' ? 'default' : 'outline'}
            onClick={() => setActiveView('keys')}
          >
            <Key className="w-4 h-4 mr-2" />
            Ключи
          </Button>
          <Button
            variant={activeView === 'docs' ? 'default' : 'outline'}
            onClick={() => setActiveView('docs')}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Документация
          </Button>
        </div>
      </div>

      {activeView === 'keys' && (
        <>
          <div className="flex justify-end">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать API ключ
                </Button>
              </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Создать новый API ключ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">Название ключа</Label>
                <Input
                  id="keyName"
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Например: Мой бот"
                />
              </div>
              
              <div>
                <Label className="text-base font-medium">Разрешения</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="multiChat">Multi-Chat</Label>
                      <p className="text-sm text-gray-500">Доступ к мульти-чату</p>
                    </div>
                    <Switch
                      id="multiChat"
                      checked={newKeyData.permissions.multiChat}
                      onCheckedChange={(checked) => setNewKeyData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, multiChat: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="assistant">Assistant</Label>
                      <p className="text-sm text-gray-500">Доступ к ассистенту</p>
                    </div>
                    <Switch
                      id="assistant"
                      checked={newKeyData.permissions.assistant}
                      onCheckedChange={(checked) => setNewKeyData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, assistant: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="readOnly">Только чтение</Label>
                      <p className="text-sm text-gray-500">Запретить создание новых ключей</p>
                    </div>
                    <Switch
                      id="readOnly"
                      checked={newKeyData.permissions.readOnly}
                      onCheckedChange={(checked) => setNewKeyData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, readOnly: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-base font-medium">Лимиты запросов</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="perMinute">Запросов в минуту</Label>
                    <Input
                      id="perMinute"
                      type="number"
                      value={newKeyData.rateLimit.requestsPerMinute}
                      onChange={(e) => setNewKeyData(prev => ({
                        ...prev,
                        rateLimit: { ...prev.rateLimit, requestsPerMinute: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="perHour">Запросов в час</Label>
                    <Input
                      id="perHour"
                      type="number"
                      value={newKeyData.rateLimit.requestsPerHour}
                      onChange={(e) => setNewKeyData(prev => ({
                        ...prev,
                        rateLimit: { ...prev.rateLimit, requestsPerHour: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Отмена
              </Button>
              <Button onClick={createApiKey} disabled={!newKeyData.name.trim()}>
                Создать
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">У вас пока нет API ключей</p>
            <p className="text-sm text-gray-400 mt-1">Создайте первый ключ для доступа к API</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => {
            const status = getKeyStatus(key);
            return (
              <Card key={key._id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{key.name}</h3>
                        <Badge variant={status.variant}>{status.text}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Создан:</span> {formatDate(key.createdAt)}
                        </div>
                        {key.lastUsed && (
                          <div>
                            <span className="font-medium">Последнее использование:</span> {formatDate(key.lastUsed)}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">Разрешения:</span>
                            {key.permissions.multiChat && <Badge variant="outline" className="text-xs">Multi-Chat</Badge>}
                            {key.permissions.assistant && <Badge variant="outline" className="text-xs">Assistant</Badge>}
                            {key.permissions.readOnly && <Badge variant="outline" className="text-xs">Read-Only</Badge>}
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">Лимиты:</span>
                            <span className="text-xs">{key.rateLimit.requestsPerMinute}/мин, {key.rateLimit.requestsPerHour}/час</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingKey(key);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteApiKey(key._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Диалог редактирования */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактировать API ключ</DialogTitle>
          </DialogHeader>
          {editingKey && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editKeyName">Название ключа</Label>
                <Input
                  id="editKeyName"
                  value={editingKey.name}
                  onChange={(e) => setEditingKey(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label className="text-base font-medium">Разрешения</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="editMultiChat">Multi-Chat</Label>
                    </div>
                    <Switch
                      id="editMultiChat"
                      checked={editingKey.permissions.multiChat}
                      onCheckedChange={(checked) => setEditingKey(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, multiChat: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="editAssistant">Assistant</Label>
                    </div>
                    <Switch
                      id="editAssistant"
                      checked={editingKey.permissions.assistant}
                      onCheckedChange={(checked) => setEditingKey(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, assistant: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="editReadOnly">Только чтение</Label>
                    </div>
                    <Switch
                      id="editReadOnly"
                      checked={editingKey.permissions.readOnly}
                      onCheckedChange={(checked) => setEditingKey(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, readOnly: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="editActive">Активен</Label>
                    </div>
                    <Switch
                      id="editActive"
                      checked={editingKey.isActive}
                      onCheckedChange={(checked) => setEditingKey(prev => ({
                        ...prev,
                        isActive: checked
                      }))}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-base font-medium">Лимиты запросов</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="editPerMinute">Запросов в минуту</Label>
                    <Input
                      id="editPerMinute"
                      type="number"
                      value={editingKey.rateLimit.requestsPerMinute}
                      onChange={(e) => setEditingKey(prev => ({
                        ...prev,
                        rateLimit: { ...prev.rateLimit, requestsPerMinute: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPerHour">Запросов в час</Label>
                    <Input
                      id="editPerHour"
                      type="number"
                      value={editingKey.rateLimit.requestsPerHour}
                      onChange={(e) => setEditingKey(prev => ({
                        ...prev,
                        rateLimit: { ...prev.rateLimit, requestsPerHour: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Отмена
            </Button>
            <Button onClick={() => updateApiKey(editingKey._id, editingKey)}>
              Сохранить
            </Button>
                     </div>
         </DialogContent>
       </Dialog>

       {/* Модальное окно с созданным ключом */}
       <Dialog open={showCreatedKeyDialog} onOpenChange={setShowCreatedKeyDialog}>
         <DialogContent className="sm:max-w-[500px]">
           <DialogHeader>
             <DialogTitle>API ключ создан!</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <Alert>
               <AlertDescription>
                 <strong>Внимание!</strong> Скопируйте этот ключ сейчас, так как он больше не будет показан.
               </AlertDescription>
             </Alert>
             
             <div>
               <Label htmlFor="createdKey">Ваш API ключ</Label>
               <div className="flex items-center space-x-2 mt-2">
                 <Input
                   id="createdKey"
                   value={createdKey || ''}
                   readOnly
                   className="font-mono text-sm"
                 />
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={copyCreatedKey}
                 >
                   <Copy className="w-4 h-4" />
                 </Button>
               </div>
             </div>
             
             <div className="text-sm text-gray-600">
               <p>Используйте этот ключ для доступа к API:</p>
               <ul className="list-disc list-inside mt-2 space-y-1">
                 <li>Добавьте заголовок: <code className="bg-gray-100 px-1 rounded">Authorization: Bearer YOUR_KEY</code></li>
                 <li>Отправляйте запросы на: <code className="bg-gray-100 px-1 rounded">http://localhost:3001/api/public/</code></li>
               </ul>
             </div>
           </div>
           
           <div className="flex justify-end space-x-2">
             <Button onClick={() => setShowCreatedKeyDialog(false)}>
               Понятно
             </Button>
           </div>
         </DialogContent>
       </Dialog>
         </>
       )}

       {activeView === 'docs' && (
         <ApiDocumentation />
       )}
     </div>
   );
 };

export default ApiKeys;
