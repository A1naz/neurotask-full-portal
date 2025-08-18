const express = require('express');
const router = express.Router();
const axios = require('axios');
const { 
  checkTeamPermission, 
  validateTeamAccess, 
  checkTeamOwnership,
  checkSectionAccess 
} = require('../middleware/teamAuth');

// Database Service configuration
const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL || 'http://localhost:3012';
const DATABASE_SERVICE_API_KEY = process.env.DATABASE_SERVICE_API_KEY || 'database-service-secure-api-key-2024';

// Создать команду
router.post('/', async (req, res) => {
  try {
    const { name, description, settings } = req.body;
    const ownerId = req.user._id;

    // Проверяем, не состоит ли пользователь уже в команде
    const existingMemberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/user/${ownerId}/active`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    
    if (existingMemberResponse.data) {
      return res.status(400).json({ message: 'Пользователь уже состоит в команде' });
    }

    // Создаем команду
    const teamResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/teams`, {
      name,
      description,
      ownerId,
      settings: settings || {}
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const team = teamResponse.data;

    // Добавляем владельца как участника команды
    const teamMemberResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/team-members`, {
      teamId: team._id,
      userId: ownerId,
      role: 'owner',
      permissions: {
        canManageTeam: true,
        canInviteMembers: true,
        canManageMembers: true,
        canViewTasks: true,
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: true,
        canViewBots: true,
        canManageBots: true,
        canViewAISettings: true,
        canManageAISettings: true
      }
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    // Обновляем пользователя
    await axios.put(`${DATABASE_SERVICE_URL}/api/users/${ownerId}`, {
      teamId: team._id,
      teamRole: 'owner',
      isTeamOwner: true
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.status(201).json({
      success: true,
      message: 'Команда создана успешно',
      team: team
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка создания команды' });
  }
});

// Получить команду
router.get('/:id', validateTeamAccess, async (req, res) => {
  try {
    const teamResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${req.teamId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const team = teamResponse.data;

    if (!team) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }

    res.json({
      success: true,
      team: team
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения команды' });
  }
});

// Обновить команду
router.put('/:id', checkTeamOwnership, async (req, res) => {
  try {
    const { name, description, settings } = req.body;
    
    const updatedTeamResponse = await axios.put(`${DATABASE_SERVICE_URL}/api/teams/${req.teamId}`, {
      name, description, settings
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const updatedTeam = updatedTeamResponse.data;

    res.json({
      success: true,
      message: 'Команда обновлена успешно',
      team: updatedTeam
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления команды' });
  }
});

// Удалить команду
router.delete('/:id', checkTeamOwnership, async (req, res) => {
  try {
    // Удаляем всех участников команды
    await axios.delete(`${DATABASE_SERVICE_URL}/api/team-members/team/${req.teamId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    
    // Удаляем все приглашения
    await axios.delete(`${DATABASE_SERVICE_URL}/api/team-invitations/team/${req.teamId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    
    // Обновляем пользователей
    await axios.put(`${DATABASE_SERVICE_URL}/api/users/team/${req.teamId}`, {
      teamId: null, 
      teamRole: null, 
      isTeamOwner: false 
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    
    // Удаляем команду
    await axios.delete(`${DATABASE_SERVICE_URL}/api/teams/${req.teamId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      message: 'Команда удалена успешно'
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления команды' });
  }
});

// Получить участников команды
router.get('/:id/members', validateTeamAccess, async (req, res) => {
  try {
    const membersResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/team/${req.teamId}?isActive=true`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const members = membersResponse.data;

    res.json({
      success: true,
      members: members
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения участников команды' });
  }
});

// Добавить участника в команду
router.post('/:id/members', checkTeamPermission('canInviteMembers'), async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    
    // Проверяем, существует ли пользователь
    const userResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/users/email/${email}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    
    const user = userResponse.data;
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем, не состоит ли пользователь уже в команде
    const existingMemberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/user/${user._id}/active`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    
    if (existingMemberResponse.data) {
      return res.status(400).json({ message: 'Пользователь уже состоит в команде' });
    }

    // Создаем приглашение
    const invitationResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/team-invitations`, {
      teamId: req.teamId,
      email,
      role,
      invitedBy: req.user._id
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const invitation = invitationResponse.data;

    res.status(201).json({
      success: true,
      message: 'Приглашение отправлено успешно',
      invitation: invitation
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка добавления участника' });
  }
});

// Удалить участника из команды
router.delete('/:id/members/:memberId', checkTeamPermission('canManageMembers'), async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const memberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/id/${memberId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    
    const member = memberResponse.data;
    if (!member || member.teamId.toString() !== req.teamId) {
      return res.status(404).json({ message: 'Участник не найден' });
    }

    // Нельзя удалить владельца команды
    if (member.role === 'owner') {
      return res.status(400).json({ message: 'Нельзя удалить владельца команды' });
    }

    // Деактивируем участника
    await axios.put(`${DATABASE_SERVICE_URL}/api/team-members/${req.teamId}/${member.userId}`, {
      isActive: false
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    // Обновляем пользователя
    await axios.put(`${DATABASE_SERVICE_URL}/api/users/${member.userId}`, {
      teamId: null,
      teamRole: null,
      isTeamOwner: false
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      message: 'Участник удален из команды'
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления участника' });
  }
});

// Изменить роль участника
router.put('/:id/members/:memberId/role', checkTeamPermission('canManageMembers'), async (req, res) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;
    
    const memberResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-members/id/${memberId}`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });
    
    const member = memberResponse.data;
    if (!member || member.teamId.toString() !== req.teamId) {
      return res.status(404).json({ message: 'Участник не найден' });
    }

    // Нельзя изменить роль владельца команды
    if (member.role === 'owner') {
      return res.status(400).json({ message: 'Нельзя изменить роль владельца команды' });
    }

    // Обновляем роль участника
    await axios.put(`${DATABASE_SERVICE_URL}/api/team-members/${req.teamId}/${member.userId}`, {
      role
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    // Обновляем пользователя
    await axios.put(`${DATABASE_SERVICE_URL}/api/users/${member.userId}`, {
      teamRole: role
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    res.json({
      success: true,
      message: 'Роль участника изменена успешно',
      member: { ...member, role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка изменения роли участника' });
  }
});

// Получить приглашения команды
router.get('/:id/invitations', validateTeamAccess, async (req, res) => {
  try {
    const invitationsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-invitations/team/${req.teamId}?status=pending`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const invitations = invitationsResponse.data;

    res.json({
      success: true,
      invitations: invitations
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения приглашений' });
  }
});

// Отправить приглашение
router.post('/:id/invitations', checkTeamPermission('canInviteMembers'), async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    
    // Проверяем, не отправлено ли уже приглашение
    const existingInvitationResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/team-invitations/team/${req.teamId}/email/${email}?status=pending`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    if (existingInvitationResponse.data) {
      return res.status(400).json({ message: 'Приглашение уже отправлено этому пользователю' });
    }

    // Создаем приглашение
    const invitationResponse = await axios.post(`${DATABASE_SERVICE_URL}/api/team-invitations`, {
      teamId: req.teamId,
      email,
      role,
      invitedBy: req.user._id
    }, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const invitation = invitationResponse.data;

    res.status(201).json({
      success: true,
      message: 'Приглашение отправлено успешно',
      invitation: invitation
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка отправки приглашения' });
  }
});

// Статистика команды
router.get('/:id/stats', validateTeamAccess, async (req, res) => {
  try {
    const statsResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/teams/${req.teamId}/stats`, {
      headers: { 'Authorization': `Bearer ${DATABASE_SERVICE_API_KEY}` }
    });

    const stats = statsResponse.data;

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения статистики команды' });
  }
});

module.exports = router;
