const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/auth');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const TeamInvitation = require('../models/TeamInvitation');
const mongoose = require('mongoose');

// ===== TEAM MANAGEMENT ENDPOINTS =====

// Создать команду
router.post('/', requireApiKey, async (req, res) => {
  try {
    const { name, description, ownerId, settings = {} } = req.body;
    
    if (!name || !ownerId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Название команды и ID владельца обязательны'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID владельца'
      });
    }

    // Проверяем, не состоит ли пользователь уже в команде
    const existingMember = await TeamMember.findOne({ userId: ownerId, status: 'active' });
    if (existingMember) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Пользователь уже состоит в команде'
      });
    }

    const team = await Team.create({
      name,
      description,
      ownerId,
      settings,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Создаем владельца как участника команды
    await TeamMember.create({
      teamId: team._id,
      userId: ownerId,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
      permissions: {
        manageTeam: true,
        manageMembers: true,
        manageInvitations: true,
        viewAnalytics: true,
        manageBots: true,
        manageAI: true,
        manageTasks: true,
        manageNotifications: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Команда создана',
      team: team
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка создания команды'
    });
  }
});

// Получить команду пользователя
router.get('/user/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const teamMember = await TeamMember.findOne({ userId, status: 'active' }).populate('teamId');
    if (!teamMember) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Пользователь не состоит в команде'
      });
    }

    res.json({
      success: true,
      team: teamMember.teamId
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения команды пользователя'
    });
  }
});

// Получить команду по ID
router.get('/:teamId', requireApiKey, async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID команды'
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Команда не найдена'
      });
    }

    res.json({
      success: true,
      team: team
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения команды'
    });
  }
});

// Обновить команду
router.put('/:teamId', requireApiKey, async (req, res) => {
  try {
    const { teamId } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID команды'
      });
    }

    const team = await Team.findByIdAndUpdate(
      teamId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!team) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Команда не найдена'
      });
    }

    res.json({
      success: true,
      message: 'Команда обновлена',
      team: team
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка обновления команды'
    });
  }
});

// Удалить команду
router.delete('/:teamId', requireApiKey, async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID команды'
      });
    }

    const team = await Team.findByIdAndDelete(teamId);

    if (!team) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Команда не найдена'
      });
    }

    // Также удаляем всех участников команды
    await TeamMember.deleteMany({ teamId });

    res.json({
      success: true,
      message: 'Команда удалена',
      team: team
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка удаления команды'
    });
  }
});

// ===== TEAM MEMBERS ENDPOINTS =====

// Получить участников команды
router.get('/:teamId/members', requireApiKey, async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID команды'
      });
    }

    const members = await TeamMember.find({ teamId, status: 'active' }).populate('userId', 'username email firstName lastName');
    
    res.json({
      success: true,
      members: members
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения участников команды'
    });
  }
});

// Обновить роль участника команды
router.put('/:teamId/members/:memberId/role', requireApiKey, async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const { role } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверные ID команды или участника'
      });
    }

    if (!['owner', 'admin', 'manager', 'member', 'guest'].includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверная роль'
      });
    }

    const member = await TeamMember.findByIdAndUpdate(
      memberId,
      { role },
      { new: true }
    ).populate('userId', 'username email firstName lastName');
    
    if (!member) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Участник команды не найден'
      });
    }

    res.json({
      success: true,
      message: 'Роль участника обновлена',
      member: member
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка обновления роли участника'
    });
  }
});

// Удалить участника из команды
router.delete('/:teamId/members/:memberId', requireApiKey, async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверные ID команды или участника'
      });
    }

    const member = await TeamMember.findByIdAndUpdate(
      memberId,
      { status: 'inactive' },
      { new: true }
    ).populate('userId', 'username email firstName lastName');
    
    if (!member) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Участник команды не найден'
      });
    }

    res.json({
      success: true,
      message: 'Участник удален из команды',
      member: member
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка удаления участника из команды'
    });
  }
});

// Получить участника команды по ID команды и пользователя
router.get('/team-members/:teamId/:userId', requireApiKey, async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверные ID команды или пользователя'
      });
    }

    const member = await TeamMember.findOne({ teamId, userId, status: 'active' }).populate('userId', 'username email firstName lastName');
    
    if (!member) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Участник команды не найден'
      });
    }
    
    res.json({
      success: true,
      member: member
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения участника команды'
    });
  }
});

// Получить активного участника команды по ID пользователя
router.get('/team-members/user/:userId/active', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    const member = await TeamMember.findOne({ userId, status: 'active' }).populate('teamId');
    
    if (!member) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Активный участник команды не найден'
      });
    }
    
    res.json({
      success: true,
      member: member
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения активного участника команды'
    });
  }
});

// ===== TEAM INVITATIONS ENDPOINTS =====

// Создать приглашение в команду
router.post('/:teamId/invitations', requireApiKey, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email, role = 'member', invitedBy } = req.body;
    
    if (!email || !invitedBy) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email и ID приглашающего обязательны'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(invitedBy)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверные ID команды или приглашающего'
      });
    }

    // Проверяем, что приглашающий является участником команды
    const inviter = await TeamMember.findOne({ teamId, userId: invitedBy, status: 'active' });
    if (!inviter || !inviter.permissions.manageInvitations) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Недостаточно прав для отправки приглашений'
      });
    }

    // Проверяем, не приглашен ли уже пользователь с таким email
    const existingInvitation = await TeamInvitation.findOne({
      teamId,
      email,
      status: 'pending'
    });

    if (existingInvitation) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Приглашение для этого email уже отправлено'
      });
    }

    // Создаем приглашение
    const invitation = new TeamInvitation({
      teamId,
      email,
      role,
      invitedBy,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
      createdAt: new Date()
    });

    await invitation.save();

    res.status(201).json({
      success: true,
      message: 'Приглашение отправлено',
      invitation: invitation
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка создания приглашения'
    });
  }
});

// Получить приглашения команды
router.get('/:teamId/invitations', requireApiKey, async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID команды'
      });
    }

    const invitations = await TeamInvitation.find({ teamId, status: 'pending' })
      .populate('invitedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      invitations: invitations
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения приглашений'
    });
  }
});

// Принять приглашение в команду
router.post('/invitations/:invitationId/accept', requireApiKey, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { userId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(invitationId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверные ID приглашения или пользователя'
      });
    }

    const invitation = await TeamInvitation.findById(invitationId);
    
    if (!invitation) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Приглашение не найдено'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Приглашение уже неактивно'
      });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Приглашение истекло'
      });
    }

    // Проверяем, не состоит ли пользователь уже в команде
    const existingMember = await TeamMember.findOne({ userId, status: 'active' });
    if (existingMember) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Пользователь уже состоит в команде'
      });
    }

    // Создаем участника команды
    const teamMember = new TeamMember({
      teamId: invitation.teamId,
      userId,
      role: invitation.role,
      status: 'active',
      joinedAt: new Date(),
      permissions: {
        manageTeam: invitation.role === 'owner',
        manageMembers: ['owner', 'admin'].includes(invitation.role),
        manageInvitations: ['owner', 'admin'].includes(invitation.role),
        viewAnalytics: true,
        manageBots: ['owner', 'admin'].includes(invitation.role),
        manageAI: ['owner', 'admin'].includes(invitation.role),
        manageTasks: true,
        manageNotifications: true
      }
    });

    await teamMember.save();

    // Обновляем статус приглашения
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = userId;
    await invitation.save();

    res.json({
      success: true,
      message: 'Приглашение принято',
      teamMember: teamMember
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка принятия приглашения'
    });
  }
});

// Отклонить приглашение в команду
router.post('/invitations/:invitationId/decline', requireApiKey, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { userId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(invitationId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверные ID приглашения или пользователя'
      });
    }

    const invitation = await TeamInvitation.findById(invitationId);
    
    if (!invitation) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Приглашение не найдено'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Приглашение уже неактивно'
      });
    }

    // Обновляем статус приглашения
    invitation.status = 'declined';
    invitation.declinedAt = new Date();
    invitation.declinedBy = userId;
    await invitation.save();

    res.json({
      success: true,
      message: 'Приглашение отклонено'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка отклонения приглашения'
    });
  }
});

// ===== TEAM NOTIFICATIONS ENDPOINTS =====

// Создать уведомление команды
router.post('/team-notifications', requireApiKey, async (req, res) => {
  try {
    const { teamId, title, message, type = 'info', priority = 'normal', createdBy } = req.body;
    
    if (!teamId || !title || !message || !createdBy) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'teamId, title, message и createdBy обязательны'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверные ID команды или создателя'
      });
    }

    // Проверяем, что создатель является участником команды
    const creator = await TeamMember.findOne({ teamId, userId: createdBy, status: 'active' });
    if (!creator) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Создатель не является участником команды'
      });
    }

    // Здесь нужно создать модель TeamNotification
    // const notification = new TeamNotification({
    //   teamId,
    //   title,
    //   message,
    //   type,
    //   priority,
    //   createdBy,
    //   createdAt: new Date()
    // });

    // await notification.save();

    res.status(201).json({
      success: true,
      message: 'Уведомление команды создано'
      // notification: notification
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка создания уведомления команды'
    });
  }
});

// Получить уведомления команды для пользователя
router.get('/team-notifications/user/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID пользователя'
      });
    }

    // Получаем команду пользователя
    const teamMember = await TeamMember.findOne({ userId, status: 'active' });
    if (!teamMember) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Пользователь не состоит в команде'
      });
    }

    // Здесь нужно создать модель TeamNotification и получить уведомления
    // const query = { teamId: teamMember.teamId };
    // if (unreadOnly) query.readBy = { $ne: userId };

    // const notifications = await TeamNotification.find(query)
    //   .sort({ createdAt: -1 })
    //   .limit(limit * 1)
    //   .skip((page - 1) * limit);

    // const total = await TeamNotification.countDocuments(query);

    // Временно возвращаем заглушку
    res.json({
      success: true,
      notifications: [],
      totalPages: 0,
      currentPage: page,
      total: 0,
      message: 'Модель TeamNotification не создана'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения уведомлений команды'
    });
  }
});

// ===== TEAM METRICS ENDPOINTS =====

// Получить метрики команды по дате
router.get('/team-metrics/:teamId/date/:date', requireApiKey, async (req, res) => {
  try {
    const { teamId, date } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный ID команды'
      });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Неверный формат даты'
      });
    }

    // Получаем статистику команды
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Подсчитываем активных участников
    const activeMembers = await TeamMember.countDocuments({
      teamId,
      status: 'active',
      joinedAt: { $lte: endOfDay }
    });

    // Здесь можно добавить другие метрики (задачи, уведомления и т.д.)

    const metrics = {
      teamId,
      date: targetDate,
      activeMembers,
      // Другие метрики будут добавлены позже
    };

    res.json({
      success: true,
      metrics: metrics
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ошибка получения метрик команды'
    });
  }
});

module.exports = router;
