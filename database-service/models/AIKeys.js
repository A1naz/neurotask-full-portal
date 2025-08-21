const mongoose = require('mongoose');

const aiKeysSchema = new mongoose.Schema(
  {
    aiProvider: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    apiKey: {
      type: String,
      required: true,
      trim: true,
    },
    folderId: {
      type: String,
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsed: {
      type: Date,
    },
    failCount: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    disabledReason: {
      type: String,
    },
    disabledUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'aikeys',
    toJSON: {
      transform: (_doc, ret) => {
        // Prevent raw apiKey leakage by default
        if (ret.apiKey) {
          delete ret.apiKey;
        }
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        if (ret.apiKey) {
          delete ret.apiKey;
        }
        return ret;
      },
    },
  }
);

// Compound and helpful indexes
aiKeysSchema.index({ aiProvider: 1, apiKey: 1 }, { unique: true });
aiKeysSchema.index({ aiProvider: 1, isActive: 1, priority: 1 });

// Returns the next active key for provider by priority, least-recently-used, then by lowest fail count
aiKeysSchema.statics.getNextActiveKey = async function (aiProvider) {
  const provider = (aiProvider || '').toLowerCase();
  const now = new Date();
  return this.findOne({
    aiProvider: provider,
    isActive: true,
    $or: [
      { disabledUntil: { $exists: false } },
      { disabledUntil: null },
      { disabledUntil: { $lte: now } },
    ],
  })
    .sort({ priority: 1, lastUsed: 1, failCount: 1 })
    .exec();
};

aiKeysSchema.methods.markSuccess = async function () {
  this.successCount += 1;
  this.lastUsed = new Date();
  if (this.failCount > 0) this.failCount = 0;
  await this.save();
};

aiKeysSchema.methods.markFailure = async function (reason) {
  this.failCount += 1;
  this.lastUsed = new Date();
  if (reason) this.disabledReason = reason;
  await this.save();
};

aiKeysSchema.statics.disableKey = async function (id, reason) {
  return this.findByIdAndUpdate(
    id,
    { isActive: false, disabledReason: reason || 'disabled' },
    { new: true }
  ).exec();
};

aiKeysSchema.statics.enableKey = async function (id) {
  return this.findByIdAndUpdate(
    id,
    { isActive: true, disabledReason: undefined },
    { new: true }
  ).exec();
};

module.exports = mongoose.model('AIKey', aiKeysSchema);

