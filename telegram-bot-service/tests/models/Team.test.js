const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Team = require('../../models/Team');
const User = require('../../models/User');

let mongoServer;

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
  await User.deleteMany({});
});

describe('Team Model Test', () => {
  it('should create a team with valid data', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123',
      teamRole: 'member'
    });
    await user.save();

    const teamData = {
      name: 'Test Team',
      description: 'A test team',
      ownerId: user._id,
      settings: {
        maxMembers: 10,
        allowGuestAccess: true,
        defaultRole: 'member',
        autoApproveInvitations: true
      }
    };

    const team = new Team(teamData);
    const savedTeam = await team.save();

    expect(savedTeam._id).toBeDefined();
    expect(savedTeam.name).toBe(teamData.name);
    expect(savedTeam.description).toBe(teamData.description);
    expect(savedTeam.ownerId.toString()).toBe(user._id.toString());
    expect(savedTeam.settings.maxMembers).toBe(10);
    expect(savedTeam.settings.allowGuestAccess).toBe(true);
    expect(savedTeam.settings.defaultRole).toBe('member');
    expect(savedTeam.settings.autoApproveInvitations).toBe(true);
    expect(savedTeam.createdAt).toBeDefined();
    expect(savedTeam.updatedAt).toBeDefined();
  });

  it('should require team name', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123',
      teamRole: 'member'
    });
    await user.save();

    const teamData = {
      description: 'A test team',
      ownerId: user._id
    };

    const team = new Team(teamData);
    let err;
    
    try {
      await team.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.name).toBeDefined();
  });

  it('should require team owner', async () => {
    const teamData = {
      name: 'Test Team',
      description: 'A test team'
    };

    const team = new Team(teamData);
    let err;
    
    try {
      await team.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.ownerId).toBeDefined();
  });

  it('should set default values for settings', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123',
      teamRole: 'member'
    });
    await user.save();

    const teamData = {
      name: 'Test Team',
      ownerId: user._id
    };

    const team = new Team(teamData);
    const savedTeam = await team.save();

    expect(savedTeam.settings.maxMembers).toBe(10);
    expect(savedTeam.settings.allowGuestAccess).toBe(false);
    expect(savedTeam.settings.defaultRole).toBe('member');
    expect(savedTeam.settings.autoApproveInvitations).toBe(false);
  });

  it('should update timestamps on save', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123',
      teamRole: 'member'
    });
    await user.save();

    const teamData = {
      name: 'Test Team',
      ownerId: user._id
    };

    const team = new Team(teamData);
    const savedTeam = await team.save();
    const originalUpdatedAt = savedTeam.updatedAt;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));

    savedTeam.name = 'Updated Team Name';
    const updatedTeam = await savedTeam.save();

    expect(updatedTeam.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
