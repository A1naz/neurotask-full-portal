export const aiModelsConfig = {
  yandexgpt: {
    label: "YandexGPT",
    models: ["yandexgpt-lite", "yandexgpt"],
    type: 'chat',
  },
  xai: {
    label: "Grok",
    models: ["grok-4", "grok-3", "grok-3-mini"],
    type: 'chat',
  },
  openai: {
    label: "OpenAI",
    models: [
      "gpt-5",
      "gpt-5-mini",
      "gpt-5-nano",
      "gpt-4.1",
      "gpt-4.1-nano",
      "gpt-4.1-mini",
    ],
    type: 'chat',
  },
  gigachat: {
    label: "GigaChat",
    models: ["GigaChat-2-Pro", "GigaChat-2", "GigaChat-2-Max"],
    type: 'chat',
  },
  gemini: {
    label: "Gemini",
    models: [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.5-flash-image-preview",
      "gemini-2.0-flash",
    ],
    type: 'chat',
  },
  deepseek: {
    label: "DeepSeek",
    models: ["deepseek-chat", "deepseek-reasoner"],
    type: 'chat',
  },
  anthropic: {
    label: "Anthropic",
    models: [
      "claude-opus-4-1-20250805",
      "claude-opus-4-20250514",
      "claude-sonnet-4-20250514",
      "claude-3-7-sonnet-latest",
      "claude-3-5-haiku-latest",
      "claude-3-haiku-20240307",
    ],
    type: 'chat',
  },
  veo3: {
    label: "Google Veo3",
    models: ["veo-3.0-generate-001"],
    type: 'video',
  },
  imagen: {
    label: "Google Imagen",
    models: ["imagen-4.0-generate-001", "imagen-3.0-generate-002"],
    type: 'image',
  },
  dalle: {
    label: "DALL-E",
    models: ["dall-e-3"],
    type: 'image',
  },
};
