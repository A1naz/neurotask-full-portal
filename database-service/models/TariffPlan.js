const mongoose = require('mongoose');

const FeatureSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  iconKey: {
    type: String,
    required: true,
  },
}, { _id: false });

const TariffPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    type: String,
    required: true,
  },
  priceDetails: {
    type: String,
    default: 'USD / месяц',
  },
  requestLimit: {
    type: Number,
    default: 5,
  },
  requestLimitDetails: {
    type: String,
    default: 'Безлимитные запросы',
  },
  LLMLimit: {
    type: Number,
    default: 2,
  },
  description: {
    type: String,
    required: true,
  },
  buttonText: {
    type: String,
    required: true,
  },
  buttonVariant: {
    type: String,
    default: 'default',
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  features: {
    type: [mongoose.Schema.Types.Mixed], // Can be strings or objects for business plan
    required: true,
  },
}, {
  timestamps: true,
});

const TariffPlan = mongoose.model('TariffPlan', TariffPlanSchema);

module.exports = TariffPlan;
