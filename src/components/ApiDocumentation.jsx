import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, ExternalLink, Code, MessageSquare, Database, CreditCard } from 'lucide-react';

const ApiDocumentation = () => {
  const [copiedSection, setCopiedSection] = useState('');

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(''), 2000);
  };

  const codeBlocks = {
    multiChat: `curl -X POST http://localhost:3001/api/public/multi-chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "message": "Привет, как дела?",
    "providers": ["openai", "gemini", "xai"],
    "systemPrompt": "Ты полезный ассистент"
  }'`,

    singleProvider: `curl -X POST http://localhost:3001/api/public/chat/openai \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "message": "Расскажи о JavaScript",
    "systemPrompt": "Ты эксперт по программированию"
  }'`,

    chatHistory: `curl -X GET http://localhost:3001/api/public/chat-history/openai \\
  -H "Authorization: Bearer YOUR_API_KEY"`,

    balance: `curl -X GET http://localhost:3001/api/public/balance \\
  -H "Authorization: Bearer YOUR_API_KEY"`,

    postmanMultiChat: `POST http://localhost:3001/api/public/multi-chat
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_API_KEY

Body:
{
  "message": "Привет, как дела?",
  "providers": ["openai", "gemini", "xai"],
  "systemPrompt": "Ты полезный ассистент"
}`,

    postmanSingleProvider: `POST http://localhost:3001/api/public/chat/openai
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_API_KEY

Body:
{
  "message": "Расскажи о JavaScript",
  "systemPrompt": "Ты эксперт по программированию"
}`,

    responseExample: `{
  "success": true,
  "results": {
    "openai": {
      "content": "Привет! У меня все хорошо, спасибо что спросили. Как дела у вас?",
      "tokensUsed": 15
    },
    "gemini": {
      "content": "Привет! У меня все отлично, готов помочь вам с любыми вопросами.",
      "tokensUsed": 12
    },
    "xai": {
      "content": "Привет! Все хорошо, спасибо. Чем могу помочь?",
      "tokensUsed": 10
    }
  },
  "totalTokensDeducted": 37,
  "remainingBalance": 963
}`,

    errorExample: `{
  "success": false,
  "error": "Insufficient tokens",
  "message": "Недостаточно токенов для выполнения запроса",
  "requiredTokens": 50,
  "availableTokens": 25
}`
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Документация</h2>
        <p className="text-gray-600">
          Используйте ваши API ключи для интеграции с нашими AI сервисами
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="examples">Примеры</TabsTrigger>
          <TabsTrigger value="endpoints">Эндпоинты</TabsTrigger>
          <TabsTrigger value="errors">Ошибки</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Основы API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Базовый URL</h3>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  http://localhost:3001/api/public/
                </code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Аутентификация</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Все запросы требуют API ключ в заголовке Authorization:
                </p>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Доступные провайдеры</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">openai</Badge>
                  <Badge variant="outline">gemini</Badge>
                  <Badge variant="outline">xai</Badge>
                  <Badge variant="outline">anthropic</Badge>
                  <Badge variant="outline">deepseek</Badge>
                  <Badge variant="outline">gigachat</Badge>
                  <Badge variant="outline">yandexgpt</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Multi-Chat запрос
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">cURL</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{codeBlocks.multiChat}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(codeBlocks.multiChat, 'multiChat')}
                    >
                      <Copy className="w-4 h-4" />
                      {copiedSection === 'multiChat' ? 'Скопировано!' : 'Копировать'}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Postman</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{codeBlocks.postmanMultiChat}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(codeBlocks.postmanMultiChat, 'postmanMultiChat')}
                    >
                      <Copy className="w-4 h-4" />
                      {copiedSection === 'postmanMultiChat' ? 'Скопировано!' : 'Копировать'}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Пример ответа</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{codeBlocks.responseExample}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(codeBlocks.responseExample, 'responseExample')}
                    >
                      <Copy className="w-4 h-4" />
                      {copiedSection === 'responseExample' ? 'Скопировано!' : 'Копировать'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Multi-Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">POST</Badge>
                    <code className="text-sm">/api/public/multi-chat</code>
                  </div>
                  <p className="text-sm text-gray-600">
                    Отправляет запрос к нескольким AI провайдерам одновременно
                  </p>
                  <div className="text-xs text-gray-500">
                    <strong>Параметры:</strong> message, providers[], systemPrompt (опционально)
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Single Provider
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">POST</Badge>
                    <code className="text-sm">/api/public/chat/{'{provider}'}</code>
                  </div>
                  <p className="text-sm text-gray-600">
                    Отправляет запрос к конкретному AI провайдеру
                  </p>
                  <div className="text-xs text-gray-500">
                    <strong>Параметры:</strong> message, systemPrompt (опционально)
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Chat History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">GET</Badge>
                    <code className="text-sm">/api/public/chat-history/{'{provider}'}</code>
                  </div>
                  <p className="text-sm text-gray-600">
                    Получает историю чата для конкретного провайдера
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">GET</Badge>
                    <code className="text-sm">/api/public/balance</code>
                  </div>
                  <p className="text-sm text-gray-600">
                    Получает текущий баланс токенов
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Коды ошибок</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">401 - Unauthorized</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Неверный или отсутствующий API ключ
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
                      <code>{`{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}`}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">403 - Forbidden</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    API ключ неактивен или превышены лимиты
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
                      <code>{`{
  "success": false,
  "error": "Forbidden",
  "message": "API key is inactive or rate limit exceeded"
}`}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">402 - Insufficient Tokens</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Недостаточно токенов для выполнения запроса
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
                      <code>{codeBlocks.errorExample}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(codeBlocks.errorExample, 'errorExample')}
                    >
                      <Copy className="w-4 h-4" />
                      {copiedSection === 'errorExample' ? 'Скопировано!' : 'Копировать'}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">429 - Rate Limit Exceeded</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Превышен лимит запросов
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
                      <code>{`{
  "success": false,
  "error": "RateLimitExceeded",
  "message": "Too many requests",
  "retryAfter": 60
}`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiDocumentation;
