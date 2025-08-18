const mongoose = require('mongoose');
const ProjectSettings = require('./models/ProjectSettings');

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neurotask_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkProjectSettings() {
  try {
    // Получаем все ProjectSettings
    const allSettings = await ProjectSettings.find({});
    if (allSettings.length === 0) {
      const defaultSettings = new ProjectSettings({
        settingsId: 'global',
        aiApiKeys: {
          openai: 'REMOVED_KEY',
          gemini: 'REMOVED_KEY',
          anthropic: 'REMOVED_KEY',
          xai: 'REMOVED_KEY'
        }
      });
      
      await defaultSettings.save();
      } else {
      allSettings.forEach((settings, index) => {
        Object.entries(settings.aiApiKeys).forEach(([provider, key]) => {
          });
      });
    }
    
    // Тестируем метод getApiKey
    const globalSettings = await ProjectSettings.getGlobalSettings();
    ['openai', 'gemini', 'anthropic', 'xai'].forEach(provider => {
      const key = globalSettings.getApiKey(provider);
      });
    
  } catch (error) {
    } finally {
    mongoose.connection.close();
  }
}

checkProjectSettings();

