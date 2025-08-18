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
  const teamMember = new TeamMember({
    team: testTeam._id,
    user: testUser._id,
    role: 'owner'
  });
  await teamMember.save();

  // Mock authentication token
  authToken = 'test-auth-token';
});

describe('Teams API', () => {
  describe('GET /api/teams', () => {
    it('should get all teams for authenticated user', async () => {
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.teams)).toBe(true);
      expect(response.body.teams.length).toBe(1);
      expect(response.body.teams[0].name).toBe('Test Team');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/teams')
        .expect(401);
    });
  });

  describe('GET /api/teams/:id', () => {
    it('should get team by ID for team member', async () => {
      const response = await request(app)
        .get(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.team._id).toBe(testTeam._id.toString());
      expect(response.body.team.name).toBe('Test Team');
    });

    it('should return 404 for non-existent team', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/teams/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 for non-member user', async () => {
      const otherUser = new User({
        telegramId: '987654321',
        username: 'otheruser',
        email: 'other@example.com'
      });
      await otherUser.save();

      await request(app)
        .get(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('POST /api/teams', () => {
    it('should create a new team', async () => {
      const newTeamData = {
        name: 'New Team',
        description: 'A new team'
      };

      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTeamData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.team.name).toBe(newTeamData.name);
      expect(response.body.team.description).toBe(newTeamData.description);
      expect(response.body.team.owner).toBe(testUser._id.toString());
    });

    it('should require team name', async () => {
      const newTeamData = {
        description: 'A new team without name'
      };

      await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTeamData)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const newTeamData = {
        name: 'New Team',
        description: 'A new team'
      };

      await request(app)
        .post('/api/teams')
        .send(newTeamData)
        .expect(401);
    });
  });

  describe('PUT /api/teams/:id', () => {
    it('should update team for owner', async () => {
      const updateData = {
        name: 'Updated Team Name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.team.name).toBe(updateData.name);
      expect(response.body.team.description).toBe(updateData.description);
    });

    it('should return 403 for non-owner user', async () => {
      // Change user role to member
      await TeamMember.findOneAndUpdate(
        { team: testTeam._id, user: testUser._id },
        { role: 'member' }
      );

      const updateData = {
        name: 'Updated Team Name'
      };

      await request(app)
        .put(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should return 404 for non-existent team', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = {
        name: 'Updated Team Name'
      };

      await request(app)
        .put(`/api/teams/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/teams/:id', () => {
    it('should delete team for owner', async () => {
      await request(app)
        .delete(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify team is deleted
      const deletedTeam = await Team.findById(testTeam._id);
      expect(deletedTeam).toBeNull();
    });

    it('should return 403 for non-owner user', async () => {
      // Change user role to member
      await TeamMember.findOneAndUpdate(
        { team: testTeam._id, user: testUser._id },
        { role: 'member' }
      );

      await request(app)
        .delete(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent team', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/teams/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/teams/:id/members', () => {
    it('should get team members for team member', async () => {
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
  });

  describe('POST /api/teams/:id/members', () => {
    it('should add member for admin/owner', async () => {
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
  });
});
