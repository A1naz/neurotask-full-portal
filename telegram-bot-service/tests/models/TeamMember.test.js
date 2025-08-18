const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const TeamMember = require('../../models/TeamMember');
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
  await TeamMember.deleteMany({});
  await Team.deleteMany({});
  await User.deleteMany({});
});

describe('TeamMember Model Test', () => {
  it('should create a team member with valid data', async () => {
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

    const memberData = {
      teamId: team._id,
      userId: user._id,
      role: 'member',
      permissions: {
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: false,
        canInviteMembers: false,
        canManageTeam: false
      }
    };

    const member = new TeamMember(memberData);
    const savedMember = await member.save();

    expect(savedMember._id).toBeDefined();
    expect(savedMember.teamId.toString()).toBe(team._id.toString());
    expect(savedMember.userId.toString()).toBe(user._id.toString());
    expect(savedMember.role).toBe('member');
    expect(savedMember.permissions.canCreateTasks).toBe(true);
    expect(savedMember.permissions.canEditTasks).toBe(true);
    expect(savedMember.permissions.canDeleteTasks).toBe(false);
    expect(savedMember.joinedAt).toBeDefined();
  });

  it('should require team reference', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123',
      teamRole: 'member'
    });
    await user.save();

    const memberData = {
      userId: user._id,
      role: 'member'
    };

    const member = new TeamMember(memberData);
    let err;
    
    try {
      await member.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.teamId).toBeDefined();
  });

  it('should require user reference', async () => {
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

    const memberData = {
      teamId: team._id,
      role: 'member'
    };

    const member = new TeamMember(memberData);
    let err;
    
    try {
      await member.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.userId).toBeDefined();
  });

  it('should validate role values', async () => {
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

    const memberData = {
      teamId: team._id,
      userId: user._id,
      role: 'invalid_role'
    };

    const member = new TeamMember(memberData);
    let err;
    
    try {
      await member.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.role).toBeDefined();
  });

  it('should set default permissions based on role', async () => {
    const user1 = new User({
      telegramId: '123456789',
      username: 'testuser1',
      email: 'test1@example.com',
      password: 'testpassword123',
      teamRole: 'member'
    });
    await user1.save();

    const user2 = new User({
      telegramId: '987654321',
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'testpassword123',
      teamRole: 'member'
    });
    await user2.save();

    const team = new Team({
      name: 'Test Team',
      ownerId: user1._id
    });
    await team.save();

    // Test admin role
    const adminMember = new TeamMember({
      teamId: team._id,
      userId: user1._id,
      role: 'admin'
    });
    const savedAdmin = await adminMember.save();

    expect(savedAdmin.permissions.canCreateTasks).toBe(true);
    expect(savedAdmin.permissions.canEditTasks).toBe(true);
    expect(savedAdmin.permissions.canDeleteTasks).toBe(false);
    expect(savedAdmin.permissions.canInviteMembers).toBe(false);
    expect(savedAdmin.permissions.canManageTeam).toBe(false);

    // Test member role
    const memberMember = new TeamMember({
      teamId: team._id,
      userId: user2._id,
      role: 'member'
    });
    const savedMember = await memberMember.save();

    expect(savedMember.permissions.canCreateTasks).toBe(true);
    expect(savedMember.permissions.canEditTasks).toBe(true);
    expect(savedMember.permissions.canDeleteTasks).toBe(false);
    expect(savedMember.permissions.canInviteMembers).toBe(false);
    expect(savedMember.permissions.canManageTeam).toBe(false);
  });

  it('should set joinedAt timestamp on creation', async () => {
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

    const memberData = {
      teamId: team._id,
      userId: user._id,
      role: 'member'
    };

    const member = new TeamMember(memberData);
    const savedMember = await member.save();

    expect(savedMember.joinedAt).toBeDefined();
    expect(savedMember.joinedAt instanceof Date).toBe(true);
  });

  it('should prevent duplicate team members', async () => {
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

    const memberData = {
      teamId: team._id,
      userId: user._id,
      role: 'member'
    };

    const member1 = new TeamMember(memberData);
    await member1.save();

    const member2 = new TeamMember(memberData);
    let err;
    
    try {
      await member2.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // Duplicate key error
  });
});
