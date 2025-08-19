const menuItems = [
  {
    id: 'assistant',
    label: 'Ассистент',
    iconName: 'MessageSquare',
    path: '/assistant',
    description: 'Telegram календарь бот'
  },
  {
    id: 'multi-chat',
    label: 'Мульти-чат AI',
    iconName: 'Sparkles',
    path: '/assistant/multi-chat',
    description: 'Отправка запросов во все AI провайдеры'
  },
  {
    id: 'tasks',
    label: 'Задачи',
    iconName: 'CheckSquare',
    path: '/assistant/tasks',
    description: 'Управление задачами и проектами'
  },
  {
    id: 'generations',
    label: 'Генерации',
    iconName: 'Wand2',
    path: '/generations',
    description: 'AI генерация медиаконтента',
    children: [
      {
        id: 'video',
        label: 'Видео',
        iconName: 'Video',
        path: '/generations/video',
        description: 'Генерация видео контента'
      },
      {
        id: 'images',
        label: 'Изображения',
        iconName: 'Image',
        path: '/generations/images',
        description: 'Генерация изображений'
      },
      {
        id: 'audio',
        label: 'Аудио',
        iconName: 'Music',
        path: '/generations/audio',
        description: 'Генерация аудио контента'
      }
    ]
  },
  {
    id: 'agents',
    label: 'Агенты',
    iconName: 'Users',
    path: '/agents',
    description: 'AI агенты для различных задач',
    children: [
      {
        id: 'content-factory',
        label: 'Контент-завод',
        iconName: 'FileText',
        path: '/agents/content-factory',
        description: 'Автоматическая генерация и публикация контента'
      },
      {
        id: 'marketing',
        label: 'Маркетинг',
        iconName: 'TrendingUp',
        path: '/agents/marketing',
        description: 'Маркетинговые агенты'
      },
      {
        id: 'smm',
        label: 'SMM',
        iconName: 'Share2',
        path: '/agents/smm',
        description: 'SMM агенты'
      },
      {
        id: 'targetologist',
        label: 'Таргетолог',
        iconName: 'Target',
        path: '/agents/targetologist',
        description: 'Таргетированная реклама'
      },
      {
        id: 'directologist',
        label: 'Директолог',
        iconName: 'Megaphone',
        path: '/agents/directologist',
        description: 'Яндекс.Директ агенты'
      },
      {
        id: 'sales',
        label: 'Продажи',
        iconName: 'ShoppingCart',
        path: '/agents/sales',
        description: 'Агенты продаж'
      },
      {
        id: 'support',
        label: 'Тех. поддержка',
        iconName: 'Headphones',
        path: '/agents/support',
        description: 'Техническая поддержка'
      }
    ]
  }
];

module.exports = menuItems;
