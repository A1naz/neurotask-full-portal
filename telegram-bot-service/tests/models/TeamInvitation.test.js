const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const TeamInvitation = require('../../models/TeamInvitation');
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
  await TeamInvitation.deleteMany({});
  await Team.deleteMany({});
  await User.deleteMany({});
});

describe('TeamInvitation Model Test', () => {
  it('should create a team invitation with valid data', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123',
      teamRole: 'member'
    });
    await user.save();

    const team = new Team({
      name: 'Test Team',
      ownerId: user._id
    });
    await team.save();

    const invitationData = {
      teamId: team._id,
      email: 'invitee@example.com',
      role: 'member',
      invitedBy: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    const invitation = new TeamInvitation(invitationData);
    const savedInvitation = await invitation.save();

    expect(savedInvitation._id).toBeDefined();
    expect(savedInvitation.teamId.toString()).toBe(team._id.toString());
    expect(savedInvitation.email).toBe(invitationData.email);
    expect(savedInvitation.role).toBe(invitationData.role);
    expect(savedInvitation.invitedBy.toString()).toBe(user._id.toString());
    expect(savedInvitation.status).toBe('pending');
    expect(savedInvitation.expiresAt).toEqual(invitationData.expiresAt);
    expect(savedInvitation.createdAt).toBeDefined();
    expect(savedInvitation.updatedAt).toBeDefined();
  });

  it('should require team reference', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const invitationData = {
      recipientEmail: 'invitee@example.com',
      role: 'member',
      inviter: user._id
    };

    const invitation = new TeamInvitation(invitationData);
    let err;
    
    try {
      await invitation.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.team).toBeDefined();
  });

  it('should require recipient email', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const team = new Team({
      name: 'Test Team',
      owner: user._id
    });
    await team.save();

    const invitationData = {
      team: team._id,
      role: 'member',
      inviter: user._id
    };

    const invitation = new TeamInvitation(invitationData);
    let err;
    
    try {
      await invitation.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.recipientEmail).toBeDefined();
  });

  it('should validate email format', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const team = new Team({
      name: 'Test Team',
      owner: user._id
    });
    await team.save();

    const invitationData = {
      team: team._id,
      recipientEmail: 'invalid-email',
      role: 'member',
      inviter: user._id
    };

    const invitation = new TeamInvitation(invitationData);
    let err;
    
    try {
      await invitation.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.recipientEmail).toBeDefined();
  });

  it('should require inviter reference', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const team = new Team({
      name: 'Test Team',
      owner: user._id
    });
    await team.save();

    const invitationData = {
      team: team._id,
      recipientEmail: 'invitee@example.com',
      role: 'member'
    };

    const invitation = new TeamInvitation(invitationData);
    let err;
    
    try {
      await invitation.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.inviter).toBeDefined();
  });

  it('should validate role values', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const team = new Team({
      name: 'Test Team',
      owner: user._id
    });
    await team.save();

    const invitationData = {
      team: team._id,
      recipientEmail: 'invitee@example.com',
      role: 'invalid_role',
      inviter: user._id
    };

    const invitation = new TeamInvitation(invitationData);
    let err;
    
    try {
      await invitation.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.role).toBeDefined();
  });

  it('should set default status to pending', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const team = new Team({
      name: 'Test Team',
      owner: user._id
    });
    await team.save();

    const invitationData = {
      team: team._id,
      recipientEmail: 'invitee@example.com',
      role: 'member',
      inviter: user._id
    };

    const invitation = new TeamInvitation(invitationData);
    const savedInvitation = await invitation.save();

    expect(savedInvitation.status).toBe('pending');
  });

  it('should set default expiration to 7 days from now', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const team = new Team({
      name: 'Test Team',
      owner: user._id
    });
    await team.save();

    const invitationData = {
      team: team._id,
      recipientEmail: 'invitee@example.com',
      role: 'member',
      inviter: user._id
    };

    const invitation = new TeamInvitation(invitationData);
    const savedInvitation = await invitation.save();

    const expectedExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const actualExpiry = savedInvitation.expiresAt;
    
    // Allow 1 second difference for test execution time
    expect(Math.abs(actualExpiry.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
  });

  it('should update timestamps on save', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const team = new Team({
      name: 'Test Team',
      owner: user._id
    });
    await team.save();

    const invitationData = {
      team: team._id,
      recipientEmail: 'invitee@example.com',
      role: 'member',
      inviter: user._id
    };

    const invitation = new TeamInvitation(invitationData);
    const savedInvitation = await invitation.save();
    const originalUpdatedAt = savedInvitation.updatedAt;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));

    savedInvitation.status = 'accepted';
    const updatedInvitation = await savedInvitation.save();

    expect(updatedInvitation.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should prevent duplicate invitations to same email for same team', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const team = new Team({
      name: 'Test Team',
      owner: user._id
    });
    await team.save();

    const invitationData = {
      team: team._id,
      recipientEmail: 'invitee@example.com',
      role: 'member',
      inviter: user._id
    };

    const invitation1 = new TeamInvitation(invitationData);
    await invitation1.save();

    const invitation2 = new TeamInvitation(invitationData);
    let err;
    
    try {
      await invitation2.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // Duplicate key error
  });
});
