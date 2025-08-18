const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const Team = require('../../models/Team');
const TeamMember = require('../../models/TeamMember');
const TeamInvitation = require('../../models/TeamInvitation');
const User = require('../../models/User');

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

describe('Team Members API', () => {
  describe('GET /api/teams/:id/members', () => {
    it('should get all team members', async () => {
      const response = await request(app)
        .get(`/api/teams/${testTeam._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.members)).toBe(true);
      expect(response.body.members.length).toBe(1);
      expect(response.body.members[0].user).toBe(testUser._id.toString());
      expect(response.body.members[0].role).toBe('owner');
    });

    it('should return 403 for non-member user', async () => {
      const otherUser = new User({
        telegramId: '987654321',
        username: 'otheruser',
        email: 'other@example.com'
      });
      await otherUser.save();

      await request(app)
        .get(`/api/teams/${testTeam._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent team', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/teams/${fakeId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/teams/:id/members', () => {
    it('should invite new member for admin/owner', async () => {
      const newMemberData = {
        email: 'newmember@example.com',
        role: 'member'
      };

      const response = await request(app)
        .post(`/api/teams/${testTeam._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newMemberData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.invitation.team).toBe(testTeam._id.toString());
      expect(response.body.invitation.recipientEmail).toBe(newMemberData.email);
      expect(response.body.invitation.role).toBe(newMemberData.role);
      expect(response.body.invitation.status).toBe('pending');
      expect(response.body.invitation.inviter).toBe(testUser._id.toString());
    });

    it('should return 403 for non-admin user', async () => {
      // Change user role to member
      await TeamMember.findOneAndUpdate(
        { team: testTeam._id, user: testUser._id },
        { role: 'member' }
      );

      const newMemberData = {
        email: 'newmember@example.com',
        role: 'member'
      };

      await request(app)
        .post(`/api/teams/${testTeam._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newMemberData)
        .expect(403);
    });

    it('should require email and role', async () => {
      const newMemberData = {
        email: 'newmember@example.com'
        // Missing role
      };

      await request(app)
        .post(`/api/teams/${testTeam._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newMemberData)
        .expect(400);
    });

    it('should validate email format', async () => {
      const newMemberData = {
        email: 'invalid-email',
        role: 'member'
      };

      await request(app)
        .post(`/api/teams/${testTeam._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newMemberData)
        .expect(400);
    });

    it('should validate role values', async () => {
      const newMemberData = {
        email: 'newmember@example.com',
        role: 'invalid_role'
      };

      await request(app)
        .post(`/api/teams/${testTeam._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newMemberData)
        .expect(400);
    });

    it('should prevent duplicate invitations', async () => {
      const newMemberData = {
        email: 'newmember@example.com',
        role: 'member'
      };

      // Create first invitation
      await request(app)
        .post(`/api/teams/${testTeam._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newMemberData)
        .expect(201);

      // Try to create duplicate invitation
      await request(app)
        .post(`/api/teams/${testTeam._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newMemberData)
        .expect(400);
    });
  });

  describe('PUT /api/teams/:id/members/:memberId', () => {
    it('should update member role for admin/owner', async () => {
      const member = await TeamMember.findOne({ team: testTeam._id, user: testUser._id });
      
      const updateData = {
        role: 'admin'
      };

      const response = await request(app)
        .put(`/api/teams/${testTeam._id}/members/${member._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.member.role).toBe('admin');
    });

    it('should update member permissions for admin/owner', async () => {
      const member = await TeamMember.findOne({ team: testTeam._id, user: testUser._id });
      
      const updateData = {
        permissions: {
          canCreateTasks: false,
          canEditTasks: true,
          canDeleteTasks: false,
          canInviteMembers: false,
          canManageTeam: false
        }
      };

      const response = await request(app)
        .put(`/api/teams/${testTeam._id}/members/${member._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.member.permissions.canCreateTasks).toBe(false);
      expect(response.body.member.permissions.canEditTasks).toBe(true);
    });

    it('should return 403 for non-admin user', async () => {
      // Change user role to member
      await TeamMember.findOneAndUpdate(
        { team: testTeam._id, user: testUser._id },
        { role: 'member' }
      );

      const member = await TeamMember.findOne({ team: testTeam._id, user: testUser._id });
      
      const updateData = {
        role: 'admin'
      };

      await request(app)
        .put(`/api/teams/${testTeam._id}/members/${member._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should return 404 for non-existent member', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const updateData = {
        role: 'admin'
      };

      await request(app)
        .put(`/api/teams/${testTeam._id}/members/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);
    });

    it('should validate role values', async () => {
      const member = await TeamMember.findOne({ team: testTeam._id, user: testUser._id });
      
      const updateData = {
        role: 'invalid_role'
      };

      await request(app)
        .put(`/api/teams/${testTeam._id}/members/${member._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('DELETE /api/teams/:id/members/:memberId', () => {
    it('should remove member for admin/owner', async () => {
      const member = await TeamMember.findOne({ team: testTeam._id, user: testUser._id });
      
      await request(app)
        .delete(`/api/teams/${testTeam._id}/members/${member._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify member is removed
      const removedMember = await TeamMember.findById(member._id);
      expect(removedMember).toBeNull();
    });

    it('should return 403 for non-admin user', async () => {
      // Change user role to member
      await TeamMember.findOneAndUpdate(
        { team: testTeam._id, user: testUser._id },
        { role: 'member' }
      );

      const member = await TeamMember.findOne({ team: testTeam._id, user: testUser._id });
      
      await request(app)
        .delete(`/api/teams/${testTeam._id}/members/${member._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent member', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .delete(`/api/teams/${testTeam._id}/members/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should prevent owner from removing themselves', async () => {
      const member = await TeamMember.findOne({ team: testTeam._id, user: testUser._id });
      
      await request(app)
        .delete(`/api/teams/${testTeam._id}/members/${member._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Verify member still exists
      const existingMember = await TeamMember.findById(member._id);
      expect(existingMember).toBeDefined();
    });
  });

  describe('GET /api/teams/:id/invitations', () => {
    it('should get team invitations for admin/owner', async () => {
      // Create an invitation
      const invitation = new TeamInvitation({
        team: testTeam._id,
        recipientEmail: 'invitee@example.com',
        role: 'member',
        inviter: testUser._id
      });
      await invitation.save();

      const response = await request(app)
        .get(`/api/teams/${testTeam._id}/invitations`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.invitations)).toBe(true);
      expect(response.body.invitations.length).toBe(1);
      expect(response.body.invitations[0].recipientEmail).toBe('invitee@example.com');
    });

    it('should return 403 for non-admin user', async () => {
      // Change user role to member
      await TeamMember.findOneAndUpdate(
        { team: testTeam._id, user: testUser._id },
        { role: 'member' }
      );

      await request(app)
        .get(`/api/teams/${testTeam._id}/invitations`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/teams/:id/invitations/:invitationId', () => {
    it('should update invitation status for admin/owner', async () => {
      // Create an invitation
      const invitation = new TeamInvitation({
        team: testTeam._id,
        recipientEmail: 'invitee@example.com',
        role: 'member',
        inviter: testUser._id
      });
      await invitation.save();

      const updateData = {
        status: 'accepted'
      };

      const response = await request(app)
        .put(`/api/teams/${testTeam._id}/invitations/${invitation._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.invitation.status).toBe('accepted');
    });

    it('should return 403 for non-admin user', async () => {
      // Change user role to member
      await TeamMember.findOneAndUpdate(
        { team: testTeam._id, user: testUser._id },
        { role: 'member' }
      );

      // Create an invitation
      const invitation = new TeamInvitation({
        team: testTeam._id,
        recipientEmail: 'invitee@example.com',
        role: 'member',
        inviter: testUser._id
      });
      await invitation.save();

      const updateData = {
        status: 'accepted'
      };

      await request(app)
        .put(`/api/teams/${testTeam._id}/invitations/${invitation._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);
    });
  });
});
