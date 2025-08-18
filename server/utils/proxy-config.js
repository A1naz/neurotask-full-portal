const { HttpsProxyAgent } = require('https-proxy-agent');
const fetch = require('node-fetch');

// Настройки прокси
const PROXY_URL = "http://A89SeQ:024Xuh@196.17.249.159:8000";
const TIMEOUT = 30000;

// Создание агента прокси
const createProxyAgent = () => {
  return new HttpsProxyAgent(PROXY_URL);
};

// Настройки axios с прокси
const getAxiosConfig = () => {
  return {
    timeout: TIMEOUT,
    httpsAgent: createProxyAgent(),
    proxy: false
  };
};

// Настройки для OpenAI fetch
const getOpenAIFetchConfig = () => {
  const agent = createProxyAgent();
  return (url, options = {}) => {
    return fetch(url, { ...options, agent });
  };
};

module.exports = {
  PROXY_URL,
  TIMEOUT,
  createProxyAgent,
  getAxiosConfig,
  getOpenAIFetchConfig
}; 