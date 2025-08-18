# 📋 Техническое задание: Система команд

## 🎯 Обзор проекта

### Цель
Создать систему команд для портала с разными уровнями прав доступа, позволяющую пользователям создавать команды и управлять доступом членов к различным разделам портала.

### Архитектура
- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React + Vite
- **Микросервисы**: Разделение по функциональности
- **База данных**: MongoDB с Mongoose ODM

---

## 🏗️ Структура данных

### 1. Модель Team
```javascript
const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  settings: {
    maxMembers: { type: Number, default: 10, min: 1, max: 100 },
    allowGuestAccess: { type: Boolean, default: false },
    defaultRole: { type: String, enum: ['member', 'guest'], default: 'member' }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### 2. Модель TeamMember
```javascript
const teamMemberSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { 
    type: String, 
    enum: ['owner', 'admin', 'manager', 'member', 'guest'], 
    default: 'member' 
  },
  permissions: [String], // Детальные права доступа
  joinedAt: { type: Date, default: Date.now },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
});
```

### 3. Модель TeamPermission
```javascript
const teamPermissionSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  role: { type: String, required: true },
  section: { type: String, required: true }, // dashboard, tasks, bots, ai-settings, etc.
  permissions: [String], // read, write, delete, manage
  createdAt: { type: Date, default: Date.now }
});
```

### 4. Обновленная модель User
```javascript
// Добавить в существующую модель User.js:
teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
isTeamOwner: { type: Boolean, default: false },
teamRole: { type: String, enum: ['owner', 'admin', 'manager', 'member', 'guest'] }
```

---

## 🔐 Система ролей и прав

### Роли пользователей
1. **Owner** - владелец команды
   - Полный доступ ко всем функциям
   - Управление командой и участниками
   - Настройка прав доступа

2. **Admin** - администратор команды
   - Управление командой
   - Приглашение/удаление участников
   - Настройка прав (кроме owner)

3. **Manager** - менеджер
   - Управление проектами и задачами
   - Ограниченное управление командой
   - Доступ к большинству функций

4. **Member** - участник
   - Базовый доступ к рабочим инструментам
   - Создание и редактирование задач
   - Использование AI и ботов

5. **Guest** - гость
   - Ограниченный доступ только для просмотра
   - Минимальные функции

### Права доступа по разделам

#### Dashboard
- **Owner/Admin**: Полный доступ, управление виджетами
- **Manager**: Просмотр статистики, ограниченное редактирование
- **Member**: Просмотр собственных метрик
- **Guest**: Только публичная статистика

#### Tasks
- **Owner/Admin**: Создание проектов, управление статусами
- **Manager**: Создание задач, назначение исполнителей
- **Member**: Создание личных задач, обновление статусов
- **Guest**: Только просмотр публичных задач

#### Telegram Bots
- **Owner/Admin**: Полное управление ботами
- **Manager**: Редактирование существующих ботов
- **Member**: Использование ботов
- **Guest**: Только просмотр публичных ботов

#### AI Settings
- **Owner/Admin**: Управление API ключами
- **Manager**: Настройка AI для проектов
- **Member**: Использование AI
- **Guest**: Ограниченное использование

---

## 🚀 API Endpoints

### Teams API
```
POST   /api/teams                    - Создание команды
GET    /api/teams                    - Список команд пользователя
GET    /api/teams/:id               - Получение команды
PUT    /api/teams/:id               - Обновление команды
DELETE /api/teams/:id               - Удаление команды
```

### Team Members API
```
POST   /api/teams/:id/members       - Добавление участника
GET    /api/teams/:id/members       - Список участников
PUT    /api/teams/:id/members/:memberId - Обновление роли
DELETE /api/teams/:id/members/:memberId - Удаление участника
```

### Team Permissions API
```
GET    /api/teams/:id/permissions   - Получение прав команды
PUT    /api/teams/:id/permissions   - Обновление прав команды
POST   /api/teams/:id/permissions/roles - Создание роли
```

### Team Invitations API
```
POST   /api/teams/:id/invitations   - Создание приглашения
GET    /api/teams/:id/invitations   - Список приглашений
PUT    /api/teams/:id/invitations/:invitationId/accept - Принятие приглашения
DELETE /api/teams/:id/invitations/:invitationId - Отмена приглашения
```

---

## 🔧 Middleware и утилиты

### 1. checkTeamPermission
```javascript
const checkTeamPermission = (section, requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.session.userId;
      const teamId = req.params.teamId || req.body.teamId;
      
      // Проверка существования команды
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
      
      // Проверка прав доступа
      const hasPermission = await checkUserPermission(userId, teamId, section, requiredPermission);
      if (!hasPermission) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: 'Permission check failed' });
    }
  };
};
```

### 2. validateTeamAccess
```javascript
const validateTeamAccess = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const teamId = req.params.teamId || req.body.teamId;
    
    // Проверка членства в команде
    const membership = await TeamMember.findOne({ userId, teamId, isActive: true });
    if (!membership) {
      return res.status(403).json({ message: 'Not a team member' });
    }
    
    req.teamMembership = membership;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Team access validation failed' });
  }
};
```

### 3. checkTeamOwnership
```javascript
const checkTeamOwnership = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const teamId = req.params.teamId || req.body.teamId;
    
    // Проверка владения командой
    const team = await Team.findOne({ _id: teamId, ownerId: userId });
    if (!team) {
      return res.status(403).json({ message: 'Team ownership required' });
    }
    
    req.team = team;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Team ownership check failed' });
  }
};
```

---

## 🎨 Frontend компоненты

### 1. TeamManagement.jsx
- Управление командой
- Список участников
- Управление ролями
- Настройки команды
- Приглашения

### 2. TeamSelector.jsx
- Выбор активной команды
- Переключение между командами
- Информация о команде

### 3. TeamMemberList.jsx
- Список участников команды
- Управление ролями
- Приглашение новых участников

### 4. TeamSettings.jsx
- Настройки команды
- Управление правами доступа
- Настройки уведомлений

---

## 🔄 Интеграция с существующими сервисами

### 1. TaskBoard API
```javascript
// Добавить проверку прав для всех endpoints
app.get('/api/tasks', requireAuth, checkTeamPermission('tasks', 'read'), async (req, res) => {
  // Фильтрация задач по команде
  const teamId = req.user.teamId;
  const tasks = await Task.find({ teamId });
  res.json(tasks);
});
```

### 2. TelegramBot API
```javascript
// Добавить проверку прав для всех endpoints
app.get('/api/telegram-bot', requireAuth, checkTeamPermission('bots', 'read'), async (req, res) => {
  // Фильтрация ботов по команде
  const teamId = req.user.teamId;
  const bots = await TelegramBot.find({ teamId });
  res.json(bots);
});
```

### 3. AI Settings API
```javascript
// Добавить проверку прав для всех endpoints
app.get('/api/ai-settings', requireAuth, checkTeamPermission('ai-settings', 'read'), async (req, res) => {
  // Возврат настроек команды или пользователя
  const teamId = req.user.teamId;
  const settings = await AISettings.findOne({ teamId }) || await AISettings.findOne({ userId: req.user.id });
  res.json(settings);
});
```

---

## 📊 Миграция данных

### 1. Создание команд для существующих пользователей
```javascript
const createDefaultTeams = async () => {
  const users = await User.find({ teamId: { $exists: false } });
  
  for (const user of users) {
    const team = await Team.create({
      name: `Команда ${user.username}`,
      description: 'Автоматически созданная команда',
      ownerId: user._id
    });
    
    await User.findByIdAndUpdate(user._id, { 
      teamId: team._id, 
      isTeamOwner: true,
      teamRole: 'owner'
    });
    
    await TeamMember.create({
      teamId: team._id,
      userId: user._id,
      role: 'owner',
      permissions: ['*']
    });
  }
};
```

### 2. Создание базовых прав доступа
```javascript
const createDefaultPermissions = async () => {
  const teams = await Team.find();
  
  for (const team of teams) {
    const defaultPermissions = [
      { role: 'owner', section: '*', permissions: ['*'] },
      { role: 'admin', section: '*', permissions: ['read', 'write', 'delete', 'manage'] },
      { role: 'manager', section: 'tasks', permissions: ['read', 'write', 'manage'] },
      { role: 'manager', section: 'bots', permissions: ['read', 'write'] },
      { role: 'member', section: 'tasks', permissions: ['read', 'write'] },
      { role: 'member', section: 'bots', permissions: ['read'] },
      { role: 'guest', section: 'tasks', permissions: ['read'] }
    ];
    
    for (const permission of defaultPermissions) {
      await TeamPermission.create({
        teamId: team._id,
        ...permission
      });
    }
  }
};
```

---

## 🧪 Тестирование

### 1. Unit тесты
- Тесты моделей Team, TeamMember, TeamPermission
- Тесты middleware функций
- Тесты утилит

### 2. Integration тесты
- Тесты API endpoints
- Тесты взаимодействия с базой данных
- Тесты прав доступа

### 3. E2E тесты
- Тесты создания команды
- Тесты управления участниками
- Тесты прав доступа

---

## 🚀 Развертывание

### 1. Переменные окружения
```bash
TEAM_FEATURES_ENABLED=true
DEFAULT_TEAM_ROLE=member
MAX_TEAM_MEMBERS=50
TEAM_INVITATION_EXPIRY=7d
```

### 2. Docker конфигурация
```yaml
environment:
  - TEAM_FEATURES_ENABLED=true
  - DEFAULT_TEAM_ROLE=member
```

### 3. Миграция
```bash
npm run migrate:teams
npm run verify:teams
```

---

## 📈 Мониторинг и метрики

### 1. Метрики команд
- Количество команд
- Количество участников по командам
- Активность команд

### 2. Логирование
- Создание/удаление команд
- Изменение ролей
- Доступ к разделам

### 3. Алерты
- Превышение лимита участников
- Попытки несанкционированного доступа
- Ошибки в системе команд

---

## 🔒 Безопасность

### 1. Валидация данных
- Проверка входных данных
- Санитизация данных
- Валидация прав доступа

### 2. Аудит
- Логирование всех действий
- Отслеживание изменений
- История доступа

### 3. Rate Limiting
- Ограничение количества запросов
- Защита от спама
- Блокировка подозрительной активности

---

## 📅 План реализации

### Фаза 1: Базовая инфраструктура (1-2 недели)
- Создание моделей данных
- Базовые API endpoints
- Middleware для проверки прав

### Фаза 2: Интеграция (2-3 недели)
- Обновление существующих API
- Интеграция с микросервисами
- Создание frontend компонентов

### Фаза 3: Тестирование и развертывание (1-2 недели)
- Тестирование всех компонентов
- Миграция данных
- Развертывание в продакшене

---

## ✅ Критерии готовности

1. Все модели созданы и протестированы
2. API endpoints работают корректно
3. Frontend компоненты интегрированы
4. Права доступа работают
5. Миграция данных завершена
6. Все тесты проходят
7. Документация готова
8. Производительность не ухудшилась
9. Безопасность обеспечена
10. UI/UX соответствует требованиям
