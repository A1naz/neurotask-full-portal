// Global test setup for Jest
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Helper to create test user
  createTestUser: (userData = {}) => {
    const User = require('../models/User');
    return new User({
      telegramId: userData.telegramId || `test_${Date.now()}`,
      username: userData.username || 'testuser',
      email: userData.email || 'test@example.com',
      ...userData
    });
  },

  // Helper to create test team
  createTestTeam: (teamData = {}, ownerId) => {
    const Team = require('../models/Team');
    return new Team({
      name: teamData.name || 'Test Team',
      description: teamData.description || 'A test team',
      owner: ownerId || teamData.owner,
      ...teamData
    });
  },

  // Helper to create test team member
  createTestTeamMember: (memberData = {}) => {
    const TeamMember = require('../models/TeamMember');
    return new TeamMember({
      team: memberData.team,
      user: memberData.user,
      role: memberData.role || 'member',
      ...memberData
    });
  },

  // Helper to create test team invitation
  createTestTeamInvitation: (invitationData = {}) => {
    const TeamInvitation = require('../models/TeamInvitation');
    return new TeamInvitation({
      team: invitationData.team,
      recipientEmail: invitationData.recipientEmail || 'invitee@example.com',
      role: invitationData.role || 'member',
      inviter: invitationData.inviter,
      ...invitationData
    });
  },

  // Helper to generate valid ObjectId
  generateObjectId: () => {
    const mongoose = require('mongoose');
    return new mongoose.Types.ObjectId();
  },

  // Helper to generate invalid ObjectId
  generateInvalidObjectId: () => {
    return 'invalid-id-string';
  }
};
