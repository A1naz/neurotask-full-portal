import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Search,
  Filter,
  GripVertical,
  AlertCircle,
  User,
  Calendar,
  Clock,
  MessageSquare,
  MoreHorizontal,
  Eye,
  Edit3,
  CheckCircle,
  Trash2,
  Bell,
  Settings,
  Send,
  Tag,

} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const TaskBoard = () => {
  const { user, API_BASE, csrfToken } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    priority: 'all',
    type: 'all',
    project: '',
    search: '',
    team: 'all'
  });
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' или 'list'

  // Форма создания/редактирования задачи
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'backlog',
    priority: 'medium',
    type: 'task',
    assignee: '',
    dueDate: '',
    estimatedHours: '',
    labels: '',
    project: 'General',
    sprint: '',
    storyPoints: ''
  });

  // Статусы задач для Kanban
  const statuses = [
    { value: 'backlog', label: 'Бэклог', color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-50' },
    { value: 'todo', label: 'К выполнению', color: 'bg-blue-100 text-blue-800', bgColor: 'bg-blue-50' },
    { value: 'in-progress', label: 'В работе', color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-yellow-50' },
    { value: 'review', label: 'На проверке', color: 'bg-purple-100 text-purple-800', bgColor: 'bg-purple-50' },
    { value: 'done', label: 'Завершено', color: 'bg-green-100 text-green-800', bgColor: 'bg-green-50' }
  ];

  // Приоритеты
  const priorities = [
    { value: 'low', label: 'Низкий', color: 'bg-gray-100 text-gray-600' },
    { value: 'medium', label: 'Средний', color: 'bg-blue-100 text-blue-600' },
    { value: 'high', label: 'Высокий', color: 'bg-orange-100 text-orange-600' },
    { value: 'urgent', label: 'Срочно', color: 'bg-red-100 text-red-600' }
  ];

  // Типы задач
  const types = [
    { value: 'task', label: 'Задача', icon: '📋' },
    { value: 'bug', label: 'Ошибка', icon: '🐛' },
    { value: 'feature', label: 'Функция', icon: '✨' },
    { value: 'story', label: 'История', icon: '📖' },
    { value: 'epic', label: 'Эпик', icon: '🚀' }
  ];

  // Drag & Drop состояние
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  
  // Состояние для комментариев
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentForm, setCommentForm] = useState({
    content: '',
    attachments: []
  });
  
  // Состояние для уведомлений
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    telegramEnabled: true,
    emailEnabled: false,
    dueDateReminder: 24,
    overdueReminder: 12,
    statusChangeNotification: true,
    assigneeNotification: true,
    commentNotification: true,
    dailyReports: true,
    weeklyReports: true
  });
  
  // Список пользователей для назначения
  const [users, setUsers] = useState([]);
  
  // Состояние команды
  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  // Загрузить информацию о команде
  const loadTeamInfo = async () => {
    if (user?.teamId) {
      try {
        const response = await fetch(`${API_BASE}/api/teams/${user.teamId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setTeam(data.team);
        } else {
          }
      } catch (err) {
        }
    } else {
      }
  };

  // Загрузить задачи
  const loadTasks = async () => {
    if (!API_BASE) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/tasks`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки задач');
      }
      
      const data = await response.json();
      setTasks(data.tasks || []);
      setFilteredTasks(data.tasks || []);
    } catch (err) {
      setError(err.message);
      } finally {
      setLoading(false);
    }
  };

  // Создать задачу
  const createTask = async () => {
    if (!API_BASE) {
      return;
    }
    
    try {
      // Очищаем пустые строки для ObjectId полей
      const cleanTaskData = {
        ...taskForm,
        assignee: taskForm.assignee && taskForm.assignee.trim() !== '' ? taskForm.assignee : null,
        labels: taskForm.labels ? taskForm.labels.split(',').map(l => l.trim()) : [],
        teamId: user?.teamId || null
      };
      
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(cleanTaskData)
      });

      if (!response.ok) {
        throw new Error('Ошибка создания задачи');
      }

      const data = await response.json();
      setTasks(prev => [...prev, data.task]);
      setFilteredTasks(prev => [...prev, data.task]);
      setShowCreateDialog(false);
      resetTaskForm();
      loadTasks();
    } catch (err) {
      setError(err.message);
      }
  };

  // Обновить задачу
  const updateTask = async (taskId, updates) => {
    try {
      // Очищаем пустые строки для ObjectId полей
      const cleanUpdates = {
        ...updates,
        assignee: updates.assignee && updates.assignee.trim() !== '' ? updates.assignee : null,
        teamId: user?.teamId || null
      };
      
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(cleanUpdates)
      });

      if (!response.ok) {
        throw new Error('Ошибка обновления задачи');
      }

      const data = await response.json();
      setTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
      setFilteredTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
      setShowTaskDialog(false);
      setSelectedTask(null);
    } catch (err) {
      setError(err.message);
      }
  };

  // Удалить задачу
  const deleteTask = async (taskId) => {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Ошибка удаления задачи');
      }

      setTasks(prev => prev.filter(t => t._id !== taskId));
      setFilteredTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      setError(err.message);
      }
  };

  // Изменить статус задачи
  const changeTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Ошибка изменения статуса');
      }

      const data = await response.json();
      setTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
      setFilteredTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
    } catch (err) {
      setError(err.message);
      }
  };

  // Drag & Drop обработчики
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    setDragOverStatus(status);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      await changeTaskStatus(draggedTask._id, newStatus);
    }
    setDraggedTask(null);
    setDragOverStatus(null);
  };

  // Применить фильтры
  const applyFilters = () => {
    let filtered = [...tasks];

    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    if (filters.project) {
      filtered = filtered.filter(t => t.project === filters.project);
    }
    if (filters.team && filters.team !== 'all') {
      filtered = filtered.filter(t => t.teamId === filters.team);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        t.labels?.some(l => l.toLowerCase().includes(searchLower))
      );
    }

    setFilteredTasks(filtered);
  };

  // Сбросить форму задачи
  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      status: 'backlog',
      priority: 'medium',
      type: 'task',
      assignee: '',
      dueDate: '',
      estimatedHours: '',
      labels: '',
      project: 'General',
      sprint: '',
      storyPoints: '',
      teamId: user?.teamId || null
    });
  };

  // Открыть задачу для просмотра/редактирования
  const openTask = (task) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      type: task.type,
      assignee: task.assignee || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      estimatedHours: task.estimatedHours || '',
      labels: task.labels ? task.labels.join(', ') : '',
      project: task.project || 'General',
      sprint: task.sprint || '',
      storyPoints: task.storyPoints || '',
      teamId: task.teamId || user?.teamId || null
    });
    setShowTaskDialog(true);
  };

  // Получить цвет статуса
  const getStatusColor = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-800';
  };

  // Получить цвет приоритета
  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'bg-gray-100 text-gray-600';
  };

  // Получить иконку типа
  const getTypeIcon = (type) => {
    const typeObj = types.find(t => t.value === type);
    return typeObj ? typeObj.icon : '📋';
  };

  // Форматировать дату
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  // Проверить просроченность
  const isOverdue = (task) => {
    if (!task.dueDate || task.status === 'done') return false;
    return new Date() > new Date(task.dueDate);
  };

  // Получить задачи по статусу
  const getTasksByStatus = (status) => {
    return filteredTasks.filter(task => task.status === status);
  };
  
  // Загрузить пользователей для назначения
  const loadUsers = async () => {
    try {
      // Если пользователь в команде, загружаем только участников команды
      if (user?.teamId) {
        const response = await fetch(`${API_BASE}/api/teams/${user.teamId}/members`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const teamUsers = data.members.map(member => ({
            _id: member.user._id,
            username: member.user.username || member.user.email,
            email: member.user.email,
            role: member.role
          }));
          setUsers(teamUsers);
          setTeamMembers(teamUsers);
        }
      } else {
        // Если пользователь не в команде, загружаем всех пользователей
        const response = await fetch(`${API_BASE}/api/users`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      }
    } catch (err) {
      }
  };
  
  // Добавить комментарий к задаче
  const addComment = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(commentForm)
      });

      if (!response.ok) {
        throw new Error('Ошибка добавления комментария');
      }

      const data = await response.json();
      setTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
      setFilteredTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
      setShowCommentDialog(false);
      setCommentForm({ content: '', attachments: [] });
      
      // Обновить выбранную задачу
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask(data.task);
      }
    } catch (err) {
      setError(err.message);
      }
  };
  
  // Загрузить настройки уведомлений
  const loadNotificationSettings = async () => {
    if (!user || !user._id) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/notifications/settings`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotificationSettings(data.settings || notificationSettings);
      } else {
        }
    } catch (err) {
      }
  };
  
  // Сохранить настройки уведомлений
  const saveNotificationSettings = async () => {
    if (!user || !user._id) {
      setError('Пользователь не авторизован');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/notifications/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(notificationSettings)
      });

      if (response.ok) {
        setShowNotificationSettings(false);
        setError('Настройки уведомлений сохранены!');
        setTimeout(() => setError(null), 3000);
      } else {
        throw new Error('Ошибка сохранения настроек');
      }
    } catch (err) {
      setError(err.message);
      }
  };

  useEffect(() => {
    loadTasks();
    loadUsers();
    loadTeamInfo();
    if (user && user._id) {
      loadNotificationSettings();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [filters, tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ошибка загрузки</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Попробовать снова</Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Требуется авторизация</h3>
          <p className="text-gray-600">Пожалуйста, войдите в систему</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Заголовок и кнопки */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Задачи</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Управление задачами и проектами</p>
          {team && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-600 font-medium">{team.name}</span>
              <span className="text-xs text-gray-500">({teamMembers.length} участников)</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white rounded-lg border p-1 w-full sm:w-auto">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="flex-1 sm:flex-none"
            >
              Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex-1 sm:flex-none"
            >
              Список
            </Button>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Создать задачу
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowNotificationSettings(true)}
            className="border-orange-200 text-orange-700 hover:bg-orange-50 w-full sm:w-auto"
          >
            <Bell className="w-4 h-4 mr-2" />
            Уведомления
          </Button>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Фильтры и поиск
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск задач..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Приоритет" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все приоритеты</SelectItem>
                {priorities.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {types.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Проект"
              value={filters.project}
              onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
            />

            {user?.teamId && (
              <Select value={filters.team} onValueChange={(value) => setFilters(prev => ({ ...prev, team: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Команда" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все команды</SelectItem>
                  <SelectItem value={user.teamId}>{team?.name || 'Моя команда'}</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Button 
              variant="outline" 
              onClick={() => setFilters({
                priority: 'all',
                type: 'all',
                project: '',
                search: '',
                team: 'all'
              })}
            >
              Сбросить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statuses.map(status => {
          const count = filteredTasks.filter(t => t.status === status.value).length;
          return (
            <Card key={status.value} className="text-center">
              <CardContent className="pt-6">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color} mb-2`}>
                  {status.label}
                </div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban доска */}
      {viewMode === 'kanban' && (
        <div className="hidden lg:grid lg:grid-cols-5 gap-6">
          {statuses.map(status => (
            <div key={status.value} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold px-3 py-2 rounded-lg ${status.bgColor} ${status.color}`}>
                  {status.label}
                </h3>
                <Badge variant="secondary" className="ml-2">
                  {getTasksByStatus(status.value).length}
                </Badge>
              </div>
              
              <div
                className={`min-h-[500px] p-3 rounded-lg border-2 border-dashed transition-colors ${
                  dragOverStatus === status.value ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                }`}
                onDragOver={(e) => handleDragOver(e, status.value)}
                onDrop={(e) => handleDrop(e, status.value)}
              >
                {getTasksByStatus(status.value).map(task => (
                  <Card
                    key={task._id}
                    className={`mb-3 cursor-pointer hover:shadow-md transition-shadow ${
                      draggedTask?._id === task._id ? 'opacity-50' : ''
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onClick={() => openTask(task)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2 min-w-0">
                        <GripVertical className="w-4 h-4 text-gray-400 mt-1 cursor-grab flex-shrink-0" />
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xl flex-shrink-0">{getTypeIcon(task.type)}</span>
                            <h4 className="font-medium text-gray-900 line-clamp-2 min-w-0">{task.title}</h4>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 min-w-0">{task.description}</p>
                          )}
                          
                          {/* Последние комментарии */}
                          {task.comments && task.comments.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500 font-medium">Последние комментарии:</div>
                              {task.comments.slice(-2).map((comment, index) => (
                                <div key={comment._id || index} className="bg-gray-50 rounded p-2 text-xs">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-700">
                                      {comment.author?.username || 'Пользователь'}
                                    </span>
                                    <span className="text-gray-400">
                                      {comment.createdAt ? formatDate(comment.createdAt) : ''}
                                    </span>
                                  </div>
                                  <p className="text-gray-600 line-clamp-2">{comment.text}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getPriorityColor(task.priority)}>
                              {priorities.find(p => p.value === task.priority)?.label}
                            </Badge>
                            {isOverdue(task) && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Просрочено
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                            {task.assignee && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <User className="w-3 h-3" />
                                {task.assignee.username}
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Calendar className="w-3 h-3" />
                                {formatDate(task.dueDate)}
                              </div>
                            )}
                            {task.estimatedHours && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Clock className="w-3 h-3" />
                                {task.estimatedHours}ч
                              </div>
                            )}
                          </div>
                          
                          {/* Кнопки действий */}
                          <div className="flex items-center gap-2 pt-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                                setShowCommentDialog(true);
                              }}
                              className="h-6 px-2 text-xs flex-shrink-0"
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Комментарий
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowNotificationSettings(true);
                              }}
                              className="h-6 px-2 text-xs flex-shrink-0"
                            >
                              <Bell className="w-3 h-3 mr-1" />
                              Уведомления
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Действия</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openTask(task); }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Просмотр
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openTask(task); }}>
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Редактировать
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {task.status !== 'done' && (
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); changeTaskStatus(task._id, 'done'); }}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Завершить
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); deleteTask(task._id); }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Удалить
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {getTasksByStatus(status.value).length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    Нет задач
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Kanban View */}
      {viewMode === 'kanban' && (
        <div className="lg:hidden">
          <Select onValueChange={(value) => {
            const element = document.getElementById(`status-section-${value}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите статус для просмотра" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label} ({getTasksByStatus(status.value).length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="mt-4 space-y-8">
            {statuses.map(status => (
              <div key={status.value} id={`status-section-${status.value}`} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-semibold px-3 py-2 rounded-lg ${status.bgColor} ${status.color}`}>
                    {status.label}
                  </h3>
                  <Badge variant="secondary" className="ml-2">
                    {getTasksByStatus(status.value).length}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {getTasksByStatus(status.value).map(task => (
                    <Card
                      key={task._id}
                      className="cursor-pointer"
                      onClick={() => openTask(task)}
                    >
                      <CardContent className="p-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getTypeIcon(task.type)}</span>
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getPriorityColor(task.priority)}>
                              {priorities.find(p => p.value === task.priority)?.label}
                            </Badge>
                            {isOverdue(task) && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Просрочено
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 pt-2 border-t mt-2">
                            {task.assignee && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.assignee.username}
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(task.dueDate)}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {getTasksByStatus(status.value).length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      Нет задач
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Список задач (если выбран режим списка) */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {!filteredTasks || filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                {!tasks || tasks.length === 0 ? 'Задачи не найдены. Создайте первую задачу!' : 'По вашему запросу задачи не найдены.'}
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map(task => (
              <Card key={task._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openTask(task)}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between min-w-0">
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{getTypeIcon(task.type)}</span>
                        <h3 className="text-lg font-semibold text-gray-900 min-w-0">{task.title}</h3>
                        {isOverdue(task) && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Просрочено
                          </Badge>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 min-w-0">{task.description}</p>
                      )}
                      
                      {/* Последние комментарии */}
                      {task.comments && task.comments.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-500 font-medium">Последние комментарии:</div>
                          {task.comments.slice(-2).map((comment, index) => (
                            <div key={comment._id || index} className="bg-gray-50 rounded p-3 text-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-gray-700">
                                  {comment.author?.username || 'Пользователь'}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  {comment.createdAt ? formatDate(comment.createdAt) : ''}
                                </span>
                              </div>
                              <p className="text-gray-600 line-clamp-3">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <User className="w-4 h-4" />
                          {task.assignee ? task.assignee.username : 'Не назначено'}
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Calendar className="w-4 h-4" />
                            {formatDate(task.dueDate)}
                          </div>
                        )}
                        {task.estimatedHours && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-4 h-4" />
                            {task.estimatedHours}ч
                          </div>
                        )}
                        {task.comments && task.comments.length > 0 && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <MessageSquare className="w-4 h-4" />
                            {task.comments.length}
                          </div>
                        )}
                      </div>
                      
                      {/* Кнопки действий */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                            setShowCommentDialog(true);
                          }}
                          className="h-8 px-3 text-xs flex-shrink-0"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Комментарий
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowNotificationSettings(true);
                          }}
                          className="h-8 px-3 text-xs flex-shrink-0"
                        >
                          <Bell className="w-3 h-3 mr-1" />
                          Уведомления
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getStatusColor(task.status)}>
                          {statuses.find(s => s.value === task.status)?.label}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {priorities.find(p => p.value === task.priority)?.label}
                        </Badge>
                        {task.project && (
                          <Badge variant="outline">{task.project}</Badge>
                        )}
                        {task.labels && task.labels.map((label, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Действия</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openTask(task); }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Просмотр
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openTask(task); }}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {task.status !== 'done' && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); changeTaskStatus(task._id, 'done'); }}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Завершить
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); deleteTask(task._id); }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Диалог создания задачи */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать новую задачу</DialogTitle>
            <DialogDescription>
              Заполните форму для создания новой задачи
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Введите название задачи"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Опишите задачу подробно"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
              <Select value={taskForm.status} onValueChange={(value) => setTaskForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
              <Select value={taskForm.priority} onValueChange={(value) => setTaskForm(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
              <Select value={taskForm.type} onValueChange={(value) => setTaskForm(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Срок выполнения</label>
              <Input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Исполнитель</label>
              <Select value={taskForm.assignee} onValueChange={(value) => setTaskForm(prev => ({ ...prev, assignee: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите исполнителя" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    user._id && (
                      <SelectItem key={user._id} value={user._id}>
                        {user.username || user.email}
                      </SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Оценка часов</label>
              <Input
                type="number"
                value={taskForm.estimatedHours}
                onChange={(e) => setTaskForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                placeholder="0"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Проект</label>
              <Input
                value={taskForm.project}
                onChange={(e) => setTaskForm(prev => ({ ...prev, project: e.target.value }))}
                placeholder="General"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Спринт</label>
              <Input
                value={taskForm.sprint}
                onChange={(e) => setTaskForm(prev => ({ ...prev, sprint: e.target.value }))}
                placeholder="Sprint 1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Story Points</label>
              <Input
                type="number"
                value={taskForm.storyPoints}
                onChange={(e) => setTaskForm(prev => ({ ...prev, storyPoints: e.target.value }))}
                placeholder="0"
                min="0"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Теги (через запятую)</label>
              <Input
                value={taskForm.labels}
                onChange={(e) => setTaskForm(prev => ({ ...prev, labels: e.target.value }))}
                placeholder="frontend, backend, ui"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Отмена
            </Button>
            <Button onClick={createTask} disabled={!taskForm.title.trim()}>
              Создать задачу
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Диалог комментариев */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="max-w-2xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>Добавить комментарий</DialogTitle>
            <DialogDescription>
              Добавьте комментарий к задаче
            </DialogDescription>
          </DialogHeader>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Комментарий</label>
            <Textarea
              value={commentForm.content}
              onChange={(e) => setCommentForm({...commentForm, content: e.target.value})}
              placeholder="Введите комментарий"
              rows={4}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Вложения</label>
            <Input
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setCommentForm({...commentForm, attachments: files});
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCommentDialog(false)}>
              Отмена
            </Button>
            <Button onClick={() => addComment(selectedTask._id)}>
              Добавить комментарий
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Диалог настроек уведомлений */}
      <Dialog open={showNotificationSettings} onOpenChange={setShowNotificationSettings}>
        <DialogContent className="max-w-2xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>Настройки уведомлений</DialogTitle>
            <DialogDescription>
              Настройте параметры уведомлений для задач
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Включить уведомления</label>
              <Switch
                checked={notificationSettings.enabled}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, enabled: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Telegram уведомления</label>
              <Switch
                checked={notificationSettings.telegramEnabled}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, telegramEnabled: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Email уведомления</label>
              <Switch
                checked={notificationSettings.emailEnabled}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailEnabled: checked})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Напоминание о сроке (часы)</label>
                <Input
                  type="number"
                  value={notificationSettings.dueDateReminder}
                  onChange={(e) => setNotificationSettings({...notificationSettings, dueDateReminder: parseInt(e.target.value)})}
                  min="1"
                  max="168"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Напоминание о просрочке (часы)</label>
                <Input
                  type="number"
                  value={notificationSettings.overdueReminder}
                  onChange={(e) => setNotificationSettings({...notificationSettings, overdueReminder: parseInt(e.target.value)})}
                  min="1"
                  max="168"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Уведомления об изменении статуса</label>
                <Switch
                  checked={notificationSettings.statusChangeNotification}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, statusChangeNotification: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Уведомления о назначении</label>
                <Switch
                  checked={notificationSettings.assigneeNotification}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, assigneeNotification: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Уведомления о комментариях</label>
                <Switch
                  checked={notificationSettings.commentNotification}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, commentNotification: checked})}
                />
              </div>
                              <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Ежедневные отчеты</label>
                  <Switch
                    checked={notificationSettings.dailyReports}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, dailyReports: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Еженедельные отчеты</label>
                  <Switch
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, weeklyReports: checked})}
                  />
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowNotificationSettings(false)}>
              Отмена
            </Button>
            <Button onClick={saveNotificationSettings}>
              Сохранить настройки
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог просмотра/редактирования задачи */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Задача: {selectedTask?.title}</DialogTitle>
            <DialogDescription>
              {selectedTask ? `ID: ${selectedTask._id}` : ''}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6">
              {/* Основная информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                  <Input
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                  <Textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                  <Select value={taskForm.status} onValueChange={(value) => setTaskForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
                  <Select value={taskForm.priority} onValueChange={(value) => setTaskForm(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                  <Select value={taskForm.type} onValueChange={(value) => setTaskForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Срок выполнения</label>
                  <Input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Оценка часов</label>
                  <Input
                    type="number"
                    value={taskForm.estimatedHours}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Проект</label>
                  <Input
                    value={taskForm.project}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, project: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Спринт</label>
                  <Input
                    value={taskForm.sprint}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, sprint: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Story Points</label>
                  <Input
                    type="number"
                    value={taskForm.storyPoints}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, storyPoints: e.target.value }))}
                    min="0"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Теги (через запятую)</label>
                  <Input
                    value={taskForm.labels}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, labels: e.target.value }))}
                  />
                </div>
              </div>
              
              {/* Комментарии */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Комментарии</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    selectedTask.comments.map((comment, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                          <span className="font-medium text-sm">{comment.author?.username || 'Пользователь'}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.timestamp).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">Комментариев пока нет</p>
                  )}
                </div>
              </div>
              
              {/* История изменений */}
              <div>
                <h3 className="text-lg font-semibold mb-3">История изменений</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedTask.history && selectedTask.history.length > 0 ? (
                    selectedTask.history.map((change, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        <span className="font-medium">{change.field}:</span> {change.oldValue} → {change.newValue}
                        <span className="text-gray-400 ml-2">
                          {new Date(change.timestamp).toLocaleString('ru-RU')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">История изменений пуста</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
              Закрыть
            </Button>
            <Button onClick={() => updateTask(selectedTask._id, {
              ...taskForm,
              labels: taskForm.labels ? taskForm.labels.split(',').map(l => l.trim()) : []
            })}>
              Сохранить изменения
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
                  deleteTask(selectedTask._id);
                  setShowTaskDialog(false);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Обработка ошибок */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button 
            className="ml-4 text-red-700 hover:text-red-900"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
