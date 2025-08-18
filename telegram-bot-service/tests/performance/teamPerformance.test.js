const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const Team = require('../../models/Team');
const TeamMember = require('../../models/TeamMember');
const User = require('../../models/User');

let mongoServer;
let testUser;
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

  // Mock authentication token
  authToken = 'test-auth-token';
});

describe('Team Performance Tests', () => {
  describe('Bulk Operations Performance', () => {
    it('should create multiple teams efficiently', async () => {
      const startTime = Date.now();
      const teamCount = 100;

      // Create teams in parallel
      const teamPromises = [];
      for (let i = 0; i < teamCount; i++) {
        const teamData = {
          name: `Performance Team ${i}`,
          description: `Team for performance testing ${i}`
        };

        const promise = request(app)
          .post('/api/teams')
          .set('Authorization', `Bearer ${authToken}`)
          .send(teamData);

        teamPromises.push(promise);
      }

      const responses = await Promise.all(teamPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all teams were created
      expect(responses).toHaveLength(teamCount);
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Performance assertion: should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      });

    it('should handle large team member lists efficiently', async () => {
      // Create a team
      const teamResponse = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Large Team',
          description: 'Team with many members'
        })
        .expect(201);

      const teamId = teamResponse.body.team._id;
      const memberCount = 500;

      const startTime = Date.now();

      // Create users and add them to team
      const users = [];
      for (let i = 0; i < memberCount; i++) {
        const user = new User({
          telegramId: `user${i}`,
          username: `user${i}`,
          email: `user${i}@example.com`
        });
        users.push(user);
      }

      // Save users in batches
      const batchSize = 50;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        await User.insertMany(batch);
      }

      // Add users to team in batches
      const memberPromises = [];
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const batchPromises = batch.map(user => {
          const member = new TeamMember({
            team: teamId,
            user: user._id,
            role: 'member'
          });
          return member.save();
        });
        memberPromises.push(...batchPromises);
      }

      await Promise.all(memberPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify team members were added
      const membersResponse = await request(app)
        .get(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(membersResponse.body.members.length).toBe(memberCount + 1); // +1 for owner

      // Performance assertion: should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
      });
  });

  describe('Database Query Performance', () => {
    it('should query teams with populated members efficiently', async () => {
      // Create multiple teams with members
      const teamCount = 50;
      const teamsPerMember = 5;

      for (let i = 0; i < teamCount; i++) {
        const teamResponse = await request(app)
          .post('/api/teams')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Query Team ${i}`,
            description: `Team for query testing ${i}`
          });

        const teamId = teamResponse.body.team._id;

        // Add some members to each team
        for (let j = 0; j < teamsPerMember; j++) {
          const user = new User({
            telegramId: `user_${i}_${j}`,
            username: `user_${i}_${j}`,
            email: `user_${i}_${j}@example.com`
          });
          await user.save();

          const member = new TeamMember({
            team: teamId,
            user: user._id,
            role: 'member'
          });
          await member.save();
        }
      }

      const startTime = Date.now();

      // Query all teams
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.teams).toHaveLength(teamCount);

      // Performance assertion: should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
      });

    it('should handle complex team searches efficiently', async () => {
      // Create teams with different characteristics
      const teams = [];
      for (let i = 0; i < 100; i++) {
        const teamData = {
          name: `Search Team ${i}`,
          description: `Team ${i} for search testing`,
          settings: {
            allowMemberInvites: i % 2 === 0,
            maxMembers: 10 + (i % 20)
          }
        };

        const teamResponse = await request(app)
          .post('/api/teams')
          .set('Authorization', `Bearer ${authToken}`)
          .send(teamData);

        teams.push(teamResponse.body.team);
      }

      const startTime = Date.now();

      // Perform complex search (this would be implemented in the API)
      // For now, we'll test the basic query performance
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.teams).toHaveLength(100);

      // Performance assertion: should complete within 3 seconds
      expect(duration).toBeLessThan(3000);
      });
  });

  describe('Memory Usage Performance', () => {
    it('should handle large team objects without memory leaks', async () => {
      const startMemory = process.memoryUsage().heapUsed;
      
      // Create a team with extensive data
      const teamData = {
        name: 'Memory Test Team',
        description: 'A'.repeat(1000), // Long description
        settings: {
          allowMemberInvites: true,
          maxMembers: 1000,
          customFields: {}
        }
      };

      // Add many custom fields
      for (let i = 0; i < 100; i++) {
        teamData.settings.customFields[`field${i}`] = {
          name: `Custom Field ${i}`,
          value: `Value ${i}`,
          metadata: {
            type: 'string',
            required: false,
            description: `Description for field ${i}`.repeat(10)
          }
        };
      }

      const teamResponse = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send(teamData)
        .expect(201);

      // Retrieve the team multiple times to test memory usage
      for (let i = 0; i < 10; i++) {
        await request(app)
          .get(`/api/teams/${teamResponse.body.team._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }

      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      .toFixed(2)}MB`);
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle multiple concurrent team operations', async () => {
      const concurrentRequests = 50;
      const startTime = Date.now();

      // Create concurrent requests for different operations
      const requests = [];
      
      // Mix of GET and POST requests
      for (let i = 0; i < concurrentRequests; i++) {
        if (i % 3 === 0) {
          // Create team
          requests.push(
            request(app)
              .post('/api/teams')
              .set('Authorization', `Bearer ${authToken}`)
              .send({
                name: `Concurrent Team ${i}`,
                description: `Team created during concurrent test ${i}`
              })
          );
        } else {
          // Get teams
          requests.push(
            request(app)
              .get('/api/teams')
              .set('Authorization', `Bearer ${authToken}`)
          );
        }
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500); // No server errors
      });

      // Performance assertion: should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      });

    it('should maintain performance under load', async () => {
      // Create baseline performance measurement
      const baselineStart = Date.now();
      await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const baselineDuration = Date.now() - baselineStart;

      // Create load by making many requests
      const loadRequests = 100;
      const loadPromises = [];
      
      for (let i = 0; i < loadRequests; i++) {
        loadPromises.push(
          request(app)
            .get('/api/teams')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      await Promise.all(loadPromises);

      // Measure performance after load
      const afterLoadStart = Date.now();
      await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const afterLoadDuration = Date.now() - afterLoadStart;

      // Performance should not degrade significantly (within 2x baseline)
      const performanceRatio = afterLoadDuration / baselineDuration;
      expect(performanceRatio).toBeLessThan(2);

      }`);
    });
  });
});
