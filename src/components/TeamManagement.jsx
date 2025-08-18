import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserPlus,
  Settings,
  Crown,
  Shield,
  User,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Plus,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

const TeamManagement = () => {
  const { user, API_BASE, csrfToken } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Состояния для модальных окон
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  // Состояния для форм
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [selectedMember, setSelectedMember] = useState(null);
  const [newRole, setNewRole] = useState('member');
  
  // Состояния для настроек команды
  const [teamSettings, setTeamSettings] = useState({
    name: '',
    description: '',
    maxMembers: 10,
    allowGuestAccess: false,
    defaultRole: 'member',
    autoApproveInvitations: false
  });

  useEffect(() => {
    if (user?.teamId) {
      loadTeamData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Загружаем информацию о команде
      const teamResponse = await fetch(`${API_BASE}/api/teams/${user.teamId}`, {
        credentials: 'include'
      });
      
      if (!teamResponse.ok) {
        throw new Error('Ошибка загрузки команды');
      }
      
      const teamData = await teamResponse.json();
      setTeam(teamData.team);
      setTeamSettings({
        name: teamData.team.name,
        description: teamData.team.description,
        maxMembers: teamData.team.settings?.maxMembers || 10,
        allowGuestAccess: teamData.team.settings?.allowGuestAccess || false,
        defaultRole: teamData.team.settings?.defaultRole || 'member',
        autoApproveInvitations: teamData.team.settings?.autoApproveInvitations || false
      });
      
      // Загружаем участников команды
      const membersResponse = await fetch(`${API_BASE}/api/teams/${user.teamId}/members`, {
        credentials: 'include'
      });
      
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData.members);
      }
      
      // Загружаем приглашения
      const invitationsResponse = await fetch(`${API_BASE}/api/teams/${user.teamId}/invitations`, {
        credentials: 'include'
      });
      
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setInvitations(invitationsData.invitations);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE}/api/teams/${user.teamId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });
      
      if (response.ok) {
        setInviteEmail('');
        setInviteRole('member');
        setShowInviteModal(false);
        await loadTeamData(); // Перезагружаем данные
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка отправки приглашения');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateMemberRole = async () => {
    if (!selectedMember) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/teams/${user.teamId}/members/${selectedMember._id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        setShowRoleModal(false);
        setSelectedMember(null);
        setNewRole('member');
        await loadTeamData(); // Перезагружаем данные
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка обновления роли');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Вы уверены, что хотите удалить этого участника из команды?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/teams/${user.teamId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        await loadTeamData(); // Перезагружаем данные
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка удаления участника');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTeamSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/teams/${user.teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          name: teamSettings.name,
          description: teamSettings.description,
          settings: {
            maxMembers: teamSettings.maxMembers,
            allowGuestAccess: teamSettings.allowGuestAccess,
            defaultRole: teamSettings.defaultRole,
            autoApproveInvitations: teamSettings.autoApproveInvitations
          }
        })
      });
      
      if (response.ok) {
        setShowSettingsModal(false);
        await loadTeamData(); // Перезагружаем данные
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка обновления настроек');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'manager':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'member':
        return <User className="h-4 w-4 text-gray-600" />;
      case 'guest':
        return <UserX className="h-4 w-4 text-orange-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner':
        return 'Владелец';
      case 'admin':
        return 'Администратор';
      case 'manager':
        return 'Менеджер';
      case 'member':
        return 'Участник';
      case 'guest':
        return 'Гость';
      default:
        return role;
    }
  };

  const canManageTeam = user?.teamRole === 'owner' || user?.teamRole === 'admin';
  const canInviteMembers = user?.teamRole === 'owner' || user?.teamRole === 'admin';
  const canManageMembers = user?.teamRole === 'owner' || user?.teamRole === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user?.teamId) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Вы не состоите в команде</h3>
        <p className="text-gray-500 mb-6">Присоединитесь к существующей команде или создайте новую</p>
        <Button onClick={() => navigate('/teams/create')}>
          Создать команду
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ошибка загрузки</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <Button onClick={loadTeamData}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Заголовок команды */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team?.name}</h1>
            <p className="text-gray-600 mt-1">{team?.description}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-sm text-gray-500">
                {members.length} участников
              </span>
              <span className="text-sm text-gray-500">
                Максимум: {team?.settings?.maxMembers || 10}
              </span>
            </div>
          </div>
          
          {canManageTeam && (
            <Button
              onClick={() => setShowSettingsModal(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Настройки
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Участники команды */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Участники команды</h2>
                {canInviteMembers && (
                  <Button
                    onClick={() => setShowInviteModal(true)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Пригласить
                  </Button>
                )}
              </div>
            </div>
            
            <div className="divide-y">
              {members.map((member) => (
                <div key={member._id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.user?.username || member.user?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleIcon(member.role)}
                        <span className="text-sm text-gray-600">{getRoleLabel(member.role)}</span>
                        {member.user?._id === team?.ownerId && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            Владелец
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {canManageMembers && member.user?._id !== team?.ownerId && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setSelectedMember(member);
                          setNewRole(member.role);
                          setShowRoleModal(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleRemoveMember(member._id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Приглашения */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Приглашения</h3>
            </div>
            
            <div className="p-6">
              {invitations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Нет активных приглашений</p>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div key={invitation._id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Роль: {getRoleLabel(invitation.role)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Отправлено: {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно приглашения */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Пригласить участника</h3>
              <Button
                onClick={() => setShowInviteModal(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Роль
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Участник</option>
                  <option value="manager">Менеджер</option>
                  <option value="guest">Гость</option>
                </select>
              </div>
              
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  Отправить приглашение
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно изменения роли */}
      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Изменить роль</h3>
              <Button
                onClick={() => setShowRoleModal(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Участник: <span className="font-medium">{selectedMember.user?.username || selectedMember.user?.email}</span>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Новая роль
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Участник</option>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                  <option value="guest">Гость</option>
                </select>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={handleUpdateMemberRole} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Сохранить
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно настроек команды */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Настройки команды</h3>
              <Button
                onClick={() => setShowSettingsModal(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название команды
                </label>
                <input
                  type="text"
                  value={teamSettings.name}
                  onChange={(e) => setTeamSettings({...teamSettings, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={teamSettings.description}
                  onChange={(e) => setTeamSettings({...teamSettings, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Максимальное количество участников
                </label>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={teamSettings.maxMembers}
                  onChange={(e) => setTeamSettings({...teamSettings, maxMembers: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Роль по умолчанию для новых участников
                </label>
                <select
                  value={teamSettings.defaultRole}
                  onChange={(e) => setTeamSettings({...teamSettings, defaultRole: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Участник</option>
                  <option value="manager">Менеджер</option>
                  <option value="guest">Гость</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowGuestAccess"
                  checked={teamSettings.allowGuestAccess}
                  onChange={(e) => setTeamSettings({...teamSettings, allowGuestAccess: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allowGuestAccess" className="text-sm text-gray-700">
                  Разрешить гостевой доступ
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoApproveInvitations"
                  checked={teamSettings.autoApproveInvitations}
                  onChange={(e) => setTeamSettings({...teamSettings, autoApproveInvitations: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoApproveInvitations" className="text-sm text-gray-700">
                  Автоматически одобрять приглашения
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button onClick={handleUpdateTeamSettings} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Сохранить
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
