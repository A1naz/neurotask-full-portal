const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const Team = require('../../models/Team');
const TeamMember = require('../../models/TeamMember');
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

describe('Team Permissions API', () => {
  describe('GET /api/teams/:id/permissions', () => {
    it('should get user permissions for team member', async () => {
      const response = await request(app)
        .get(`/api/teams/${testTeam._id}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.permissions).toBeDefined();
      expect(response.body.permissions.canCreateTasks).toBe(true);
      expect(response.body.permissions.canEditTasks).toBe(true);
      expect(response.body.permissions.canDeleteTasks).toBe(true);
      expect(response.body.permissions.canInviteMembers).toBe(true);
      expect(response.body.permissions.canManageTeam).toBe(true);
    });

    it('should return 403 for non-member user', async () => {
      const otherUser = new User({
        telegramId: '987654321',
        username: 'otheruser',
        email: 'other@example.com'
      });
      await otherUser.save();

      await request(app)
        .get(`/api/teams/${testTeam._id}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent team', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/teams/${fakeId}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/teams/:id/permissions/check', () => {
    it('should check specific permission for team member', async () => {
      const response = await request(app)
        .get(`/api/teams/${testTeam._id}/permissions/check`)
        .query({ permission: 'canCreateTasks' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hasPermission).toBe(true);
    });

    it('should check multiple permissions for team member', async () => {
      const response = await request(app)
        .get(`/api/teams/${testTeam._id}/permissions/check`)
        .query({ permissions: 'canCreateTasks,canEditTasks,canDeleteTasks' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.permissions.canCreateTasks).toBe(true);
      expect(response.body.permissions.canEditTasks).toBe(true);
      expect(response.body.permissions.canDeleteTasks).toBe(true);
    });

    it('should return false for permission user does not have', async () => {
      // Change user role to member (which has limited permissions)
      await TeamMember.findOneAndUpdate(
        { team: testTeam._id, user: testUser._id },
        { role: 'member' }
      );

      const response = await request(app)
        .get(`/api/teams/${testTeam._id}/permissions/check`)
        .query({ permission: 'canDeleteTasks' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hasPermission).toBe(false);
    });

    it('should return 400 for invalid permission name', async () => {
      await request(app)
        .get(`/api/teams/${testTeam._id}/permissions/check`)
        .query({ permission: 'invalidPermission' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 403 for non-member user', async () => {
      const otherUser = new User({
        telegramId: '987654321',
        username: 'otheruser',
        email: 'other@example.com'
      });
      await otherUser.save();

      await request(app)
        .get(`/api/teams/${testTeam._id}/permissions/check`)
        .query({ permission: 'canCreateTasks' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('POST /api/teams/:id/permissions/validate', () => {
    it('should validate user has required permissions', async () => {
      const requiredPermissions = ['canCreateTasks', 'canEditTasks'];

      const response = await request(app)
        .post(`/api/teams/${testTeam._id}/permissions/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ permissions: requiredPermissions })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hasAllPermissions).toBe(true);
      expect(response.body.missingPermissions).toEqual([]);
    });

    it('should return false when user lacks required permissions', async () => {
      // Change user role to member (which has limited permissions)
      await TeamMember.findOneAndUpdate(
        { team: testTeam._id, user: testUser._id },
        { role: 'member' }
      );

      const requiredPermissions = ['canCreateTasks', 'canDeleteTasks'];

      const response = await request(app)
        .post(`/api/teams/${testTeam._id}/permissions/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ permissions: requiredPermissions })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hasAllPermissions).toBe(false);
      expect(response.body.missingPermissions).toContain('canDeleteTasks');
    });

    it('should return 400 for invalid permissions array', async () => {
      const invalidPermissions = ['canCreateTasks', 'invalidPermission'];

      await request(app)
        .post(`/api/teams/${testTeam._id}/permissions/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ permissions: invalidPermissions })
        .expect(400);
    });

    it('should return 403 for non-member user', async () => {
      const otherUser = new User({
        telegramId: '987654321',
        username: 'otheruser',
        email: 'other@example.com'
      });
      await otherUser.save();

      const requiredPermissions = ['canCreateTasks'];

      await request(app)
        .post(`/api/teams/${testTeam._id}/permissions/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ permissions: requiredPermissions })
        .expect(403);
    });
  });

  describe('GET /api/teams/:id/permissions/roles', () => {
    it('should get available roles and their permissions', async () => {
      const response = await request(app)
        .get(`/api/teams/${testTeam._id}/permissions/roles`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.roles).toBeDefined();
      expect(response.body.roles.owner).toBeDefined();
      expect(response.body.roles.admin).toBeDefined();
      expect(response.body.roles.member).toBeDefined();
      expect(response.body.roles.guest).toBeDefined();
    });

    it('should return 403 for non-member user', async () => {
      const otherUser = new User({
        telegramId: '987654321',
        username: 'otheruser',
        email: 'other@example.com'
      });
      await otherUser.save();

      await request(app)
        .get(`/api/teams/${testTeam._id}/permissions/roles`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('POST /api/teams/:id/permissions/override', () => {
    it('should allow admin/owner to override member permissions', async () => {
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

    it('should return 403 for non-admin user', async () => {
      // Change user role to member
      await TeamMember.findOneAndUpdate(
        { team: testTeam._id, user: testUser._id },
        { role: 'member' }
      );

      const overrideData = {
        userId: testUser._id,
        permissions: {
          canDeleteTasks: true
        }
      };

      await request(app)
        .post(`/api/teams/${testTeam._id}/permissions/override`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(overrideData)
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const overrideData = {
        userId: fakeId,
        permissions: {
          canDeleteTasks: true
        }
      };

      await request(app)
        .post(`/api/teams/${testTeam._id}/permissions/override`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(overrideData)
        .expect(404);
    });

    it('should validate permission names', async () => {
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

      const overrideData = {
        userId: memberUser._id,
        permissions: {
          invalidPermission: true
        }
      };

      await request(app)
        .post(`/api/teams/${testTeam._id}/permissions/override`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(overrideData)
        .expect(400);
    });
  });

  describe('DELETE /api/teams/:id/permissions/override', () => {
    it('should remove permission overrides for admin/owner', async () => {
      // Create another user as member with custom permissions
      const memberUser = new User({
        telegramId: '111111111',
        username: 'memberuser',
        email: 'member@example.com'
      });
      await memberUser.save();

      const memberMember = new TeamMember({
        team: testTeam._id,
        user: memberUser._id,
        role: 'member',
        permissions: {
          canCreateTasks: true,
          canEditTasks: true,
          canDeleteTasks: false,
          canInviteMembers: true, // Override
          canManageTeam: false
        }
      });
      await memberMember.save();

      const response = await request(app)
        .delete(`/api/teams/${testTeam._id}/permissions/override/${memberUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.member.permissions.canInviteMembers).toBe(false); // Back to default
    });

    it('should return 403 for non-admin user', async () => {
      // Change user role to member
      await TeamMember.findOneAndUpdate(
        { team: testTeam._id, user: testUser._id },
        { role: 'member' }
      );

      await request(app)
        .delete(`/api/teams/${testTeam._id}/permissions/override/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .delete(`/api/teams/${testTeam._id}/permissions/override/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
