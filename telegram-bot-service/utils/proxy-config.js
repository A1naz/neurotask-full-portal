const fetch = require('node-fetch');

function getOpenAIFetchConfig() {
  // Базовая конфигурация fetch для OpenAI
  return fetch;
}

module.exports = {
  getOpenAIFetchConfig
}; 