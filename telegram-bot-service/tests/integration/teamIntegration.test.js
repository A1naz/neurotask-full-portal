const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const Team = require('../../models/Team');
const TeamMember = require('../../models/TeamMember');
const TeamInvitation = require('../../models/TeamInvitation');
const User = require('../../models/User');
const Task = require('../../models/Task');

let mongoServer;
let testUser;
let testTeam;
let testMember;
let authToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Team.deleteMany({});
  await TeamMember.deleteMany({});
  await TeamInvitation.deleteMany({});
  await User.deleteMany({});
  await Task.deleteMany({});

  // Create test user
  testUser = new User({
    telegramId: '123456789',
    username: 'testuser',
    email: 'test@example.com'
  });
  await testUser.save();

  // Create test team
  testTeam = new Team({
    name: 'Test Team',
    description: 'A test team',
    owner: testUser._id
  });
  await testTeam.save();

  // Create team member
  testMember = new TeamMember({
    team: testTeam._id,
    user: testUser._id,
    role: 'owner'
  });
  await testMember.save();

  // Mock authentication token
  authToken = 'test-auth-token';
});

describe('Team Integration Tests', () => {
  describe('Team Creation and Management Flow', () => {
    it('should create team and automatically add creator as owner', async () => {
      const newTeamData = {
        name: 'New Integration Team',
        description: 'Testing team creation flow'
      };

      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTeamData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.team.name).toBe(newTeamData.name);

      // Verify team member was created
      const teamMember = await TeamMember.findOne({
        team: response.body.team._id,
        user: testUser._id
      });
      expect(teamMember).toBeDefined();
      expect(teamMember.role).toBe('owner');
    });

    it('should allow team owner to invite members', async () => {
      const invitationData = {
        email: 'newmember@example.com',
        role: 'member'
      };

      const response = await request(app)
        .post(`/api/teams/${testTeam._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invitationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.invitation.status).toBe('pending');

      // Verify invitation was created
      const invitation = await TeamInvitation.findById(response.body.invitation._id);
      expect(invitation).toBeDefined();
      expect(invitation.recipientEmail).toBe(invitationData.email);
    });

    it('should allow team owner to update team settings', async () => {
      const updateData = {
        settings: {
          allowMemberInvites: true,
          maxMembers: 25,
          allowTaskCreation: true,
          allowTaskEditing: true,
          allowTaskDeletion: false
        }
      };

      const response = await request(app)
        .put(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.team.settings.allowMemberInvites).toBe(true);
      expect(response.body.team.settings.maxMembers).toBe(25);
    });
  });

  describe('Team Member Management Flow', () => {
    it('should allow admin to change member roles', async () => {
      // Create another user
      const memberUser = new User({
        telegramId: '111111111',
        username: 'memberuser',
        email: 'member@example.com'
      });
      await memberUser.save();

      // Add user to team
      const memberMember = new TeamMember({
        team: testTeam._id,
        user: memberUser._id,
        role: 'member'
      });
      await memberMember.save();

      // Change role to admin
      const updateData = {
        role: 'admin'
      };

      const response = await request(app)
        .put(`/api/teams/${testTeam._id}/members/${memberMember._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.member.role).toBe('admin');
    });

    it('should enforce role-based permissions', async () => {
      // Create another user as member
      const memberUser = new User({
        telegramId: '111111111',
        username: 'memberuser',
        email: 'member@example.com'
      });
      await memberUser.save();

      const memberMember = new TeamMember({
        team: testTeam._id,
        user: memberUser._id,
        role: 'member'
      });
      await memberMember.save();

      // Member should not be able to invite others
      const invitationData = {
        email: 'another@example.com',
        role: 'member'
      };

      await request(app)
        .post(`/api/teams/${testTeam._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invitationData)
        .expect(403);
    });

    it('should allow admin to remove members', async () => {
      // Create another user
      const memberUser = new User({
        telegramId: '111111111',
        username: 'memberuser',
        email: 'member@example.com'
      });
      await memberUser.save();

      // Add user to team
      const memberMember = new TeamMember({
        team: testTeam._id,
        user: memberUser._id,
        role: 'member'
      });
      await memberMember.save();

      // Remove member
      await request(app)
        .delete(`/api/teams/${testTeam._id}/members/${memberMember._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify member was removed
      const removedMember = await TeamMember.findById(memberMember._id);
      expect(removedMember).toBeNull();
    });
  });

  describe('Team Permissions Integration', () => {
    it('should check permissions correctly for different roles', async () => {
      // Test owner permissions
      let response = await request(app)
        .get(`/api/teams/${testTeam._id}/permissions/check`)
        .query({ permission: 'canManageTeam' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.hasPermission).toBe(true);

      // Change user role to member
      await TeamMember.findOneAndUpdate(
        { team: testTeam._id, user: testUser._id },
        { role: 'member' }
      );

      // Test member permissions
      response = await request(app)
        .get(`/api/teams/${testTeam._id}/permissions/check`)
        .query({ permission: 'canManageTeam' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.hasPermission).toBe(false);
    });

    it('should validate multiple permissions at once', async () => {
      const requiredPermissions = ['canCreateTasks', 'canEditTasks', 'canDeleteTasks'];

      const response = await request(app)
        .post(`/api/teams/${testTeam._id}/permissions/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ permissions: requiredPermissions })
        .expect(200);

      expect(response.body.hasAllPermissions).toBe(true);
      expect(response.body.missingPermissions).toEqual([]);
    });

    it('should allow permission overrides for admin/owner', async () => {
      // Create another user as member
      const memberUser = new User({
        telegramId: '111111111',
        username: 'memberuser',
        email: 'member@example.com'
      });
      await memberUser.save();

      const memberMember = new TeamMember({
        team: testTeam._id,
        user: memberUser._id,
        role: 'member'
      });
      await memberMember.save();

      // Override permissions
      const overrideData = {
        userId: memberUser._id,
        permissions: {
          canDeleteTasks: true,
          canInviteMembers: true
        }
      };

      const response = await request(app)
        .post(`/api/teams/${testTeam._id}/permissions/override`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(overrideData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.member.permissions.canDeleteTasks).toBe(true);
      expect(response.body.member.permissions.canInviteMembers).toBe(true);
    });
  });

  describe('Team Data Consistency', () => {
    it('should maintain referential integrity when deleting teams', async () => {
      // Create some team data
      const invitation = new TeamInvitation({
        team: testTeam._id,
        recipientEmail: 'test@example.com',
        role: 'member',
        inviter: testUser._id
      });
      await invitation.save();

      // Delete team
      await request(app)
        .delete(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify related data was cleaned up
      const deletedTeam = await Team.findById(testTeam._id);
      expect(deletedTeam).toBeNull();

      const deletedMember = await TeamMember.findOne({ team: testTeam._id });
      expect(deletedMember).toBeNull();

      const deletedInvitation = await TeamInvitation.findOne({ team: testTeam._id });
      expect(deletedInvitation).toBeNull();
    });

    it('should handle team member removal correctly', async () => {
      // Create another user
      const memberUser = new User({
        telegramId: '111111111',
        username: 'memberuser',
        email: 'member@example.com'
      });
      await memberUser.save();

      // Add user to team
      const memberMember = new TeamMember({
        team: testTeam._id,
        user: memberUser._id,
        role: 'member'
      });
      await memberMember.save();

      // Remove member
      await request(app)
        .delete(`/api/teams/${testTeam._id}/members/${memberMember._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify member was removed but user still exists
      const removedMember = await TeamMember.findById(memberMember._id);
      expect(removedMember).toBeNull();

      const userStillExists = await User.findById(memberUser._id);
      expect(userStillExists).toBeDefined();
    });
  });

  describe('Team API Error Handling', () => {
    it('should handle invalid team IDs gracefully', async () => {
      const invalidId = 'invalid-id';

      await request(app)
        .get(`/api/teams/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should handle non-existent resources correctly', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/api/teams/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should validate required fields', async () => {
      const invalidTeamData = {
        // Missing name
        description: 'Team without name'
      };

      await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTeamData)
        .expect(400);
    });

    it('should enforce authentication on all endpoints', async () => {
      await request(app)
        .get('/api/teams')
        .expect(401);

      await request(app)
        .post('/api/teams')
        .send({ name: 'Test Team' })
        .expect(401);
    });
  });

  describe('Team Performance and Scalability', () => {
    it('should handle multiple team operations efficiently', async () => {
      // Create multiple teams
      const teams = [];
      for (let i = 0; i < 5; i++) {
        const teamData = {
          name: `Performance Team ${i}`,
          description: `Team for performance testing ${i}`
        };

        const response = await request(app)
          .post('/api/teams')
          .set('Authorization', `Bearer ${authToken}`)
          .send(teamData)
          .expect(201);

        teams.push(response.body.team);
      }

      // Get all teams
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.teams.length).toBeGreaterThanOrEqual(5);
    });

    it('should handle team member operations efficiently', async () => {
      // Create multiple users
      const users = [];
      for (let i = 0; i < 10; i++) {
        const user = new User({
          telegramId: `user${i}`,
          username: `user${i}`,
          email: `user${i}@example.com`
        });
        await user.save();
        users.push(user);
      }

      // Add users to team
      for (const user of users) {
        const member = new TeamMember({
          team: testTeam._id,
          user: user._id,
          role: 'member'
        });
        await member.save();
      }

      // Get team members
      const response = await request(app)
        .get(`/api/teams/${testTeam._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.members.length).toBe(11); // 10 + owner
    });
  });
});
