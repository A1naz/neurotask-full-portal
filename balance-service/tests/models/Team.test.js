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

describe('Team Model Test - Balance Service', () => {
  it('should create a team with valid data', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const teamData = {
      name: 'Balance Team',
      description: 'A team for balance management',
      owner: user._id,
      settings: {
        allowMemberInvites: true,
        maxMembers: 20,
        billing: {
          plan: 'pro',
          monthlyLimit: 1000,
          autoRecharge: true,
          paymentMethod: 'card'
        }
      }
    };

    const team = new Team(teamData);
    const savedTeam = await team.save();

    expect(savedTeam._id).toBeDefined();
    expect(savedTeam.name).toBe(teamData.name);
    expect(savedTeam.description).toBe(teamData.description);
    expect(savedTeam.owner.toString()).toBe(user._id.toString());
    expect(savedTeam.settings.billing.plan).toBe('pro');
    expect(savedTeam.settings.billing.monthlyLimit).toBe(1000);
    expect(savedTeam.settings.billing.autoRecharge).toBe(true);
  });

  it('should set default billing settings for new teams', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const teamData = {
      name: 'Default Billing Team',
      owner: user._id
    };

    const team = new Team(teamData);
    const savedTeam = await team.save();

    expect(savedTeam.settings.billing.plan).toBe('free');
    expect(savedTeam.settings.billing.monthlyLimit).toBe(100);
    expect(savedTeam.settings.billing.autoRecharge).toBe(false);
    expect(savedTeam.settings.billing.paymentMethod).toBe('none');
  });

  it('should validate billing plan values', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const teamData = {
      name: 'Invalid Billing Team',
      owner: user._id,
      settings: {
        billing: {
          plan: 'invalid-plan'
        }
      }
    };

    const team = new Team(teamData);
    let err;
    
    try {
      await team.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors['settings.billing.plan']).toBeDefined();
  });

  it('should enforce billing limits', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const teamData = {
      name: 'Limited Billing Team',
      owner: user._id,
      settings: {
        billing: {
          monthlyLimit: 10000 // Should be capped at 5000
        }
      }
    };

    const team = new Team(teamData);
    const savedTeam = await team.save();

    expect(savedTeam.settings.billing.monthlyLimit).toBe(5000);
  });

  it('should track team spending', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const teamData = {
      name: 'Spending Team',
      owner: user._id,
      spending: {
        currentMonth: 150,
        lastMonth: 200,
        total: 500
      }
    };

    const team = new Team(teamData);
    const savedTeam = await team.save();

    expect(savedTeam.spending.currentMonth).toBe(150);
    expect(savedTeam.spending.lastMonth).toBe(200);
    expect(savedTeam.spending.total).toBe(500);
  });

  it('should handle team subscription status', async () => {
    const user = new User({
      telegramId: '123456789',
      username: 'testuser',
      email: 'test@example.com'
    });
    await user.save();

    const teamData = {
      name: 'Subscription Team',
      owner: user._id,
      subscription: {
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        autoRenew: true
      }
    };

    const team = new Team(teamData);
    const savedTeam = await team.save();

    expect(savedTeam.subscription.status).toBe('active');
    expect(savedTeam.subscription.autoRenew).toBe(true);
    expect(savedTeam.subscription.startDate).toBeDefined();
    expect(savedTeam.subscription.endDate).toBeDefined();
  });
});
