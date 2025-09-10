import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  Sparkles, 
  ArrowRightLeft, 
  ImageIcon, 
  Cpu, 
  Search,
  FolderKanban,
  Video,
  Bot,
  ShieldCheck,
  Link,
  ClipboardList,
  Briefcase,
  Layers,
  Star,
  Users
} from 'lucide-react';

const iconMapping = {
  'Доступ к GPT-5': Sparkles,
  'Ограниченная загрузка файлов': ArrowRightLeft,
  'Ограниченная и более медленная генерация изображений': ImageIcon,
  'Ограниченная память и контекст': Cpu,
  'Ограниченное глубокое исследование': Search,
  'GPT-5 с продвинутым рассуждением': Sparkles,
  'Расширенное количество сообщений и загрузок': ArrowRightLeft,
  'Расширенная и более быстрая генерация изображений': ImageIcon,
  'Расширенная память и контекст': Cpu,
  'Расширенное глубокое исследование и режим агента': Search,
  'Проекты, задачи, пользовательские GPT': FolderKanban,
  'Генерация видео Sora': Video,
  'Агент Codex': Bot,
  'GPT-5 с профессиональным рассуждением': Sparkles,
  'Неограниченное количество сообщений и загрузок': ArrowRightLeft,
  'Неограниченная и более быстрая генерация изображений': ImageIcon,
  'Максимальная память и контекст': Cpu,
  'Максимально глубокое исследование и режим агента': Search,
  'Расширенные проекты, задачи и пользовательские GPT': FolderKanban,
  'Расширенная генерация видео Sora': Video,
  'Расширенный агент Codex': Bot,
  'Предварительный обзор новых функций': Star,
  'Все в Plus и даже больше': Users,
  'Подключите знания своей компании': Link,
  'Безопасность, необходимая для бизнеса': ShieldCheck,
  'Режим записок': ClipboardList,
  'Бизнес-функции': Briefcase,
  'Встроенные агенты': Bot,
  'Мультимодальное создание': Layers,
};


const Plans = () => {
  const personalPlans = [
    {
      name: 'Бесплатно',
      baseId: 'free',
      price: '$0',
      priceDetails: 'USD / месяц',
      description: 'Интеллект для повседневных задач',
      buttonText: 'Ваш текущий план',
      buttonVariant: 'outline',
      features: [
        'Доступ к GPT-5',
        'Ограниченная загрузка файлов',
        'Ограниченная и более медленная генерация изображений',
        'Ограниченная память и контекст',
        'Ограниченное глубокое исследование',
      ],
      footerText: 'У вас уже есть действующий план? См. справку по оплате'
    },
    {
      name: 'Plus',
      baseId: 'plus',
      price: '$20',
      priceDetails: 'USD / месяц',
      description: 'Больше доступа к передовому интеллекту',
      buttonText: 'Перейти на Plus',
      isPopular: true,
      features: [
        'GPT-5 с продвинутым рассуждением',
        'Расширенное количество сообщений и загрузок',
        'Расширенная и более быстрая генерация изображений',
        'Расширенная память и контекст',
        'Расширенное глубокое исследование и режим агента',
        'Проекты, задачи, пользовательские GPT',
        'Генерация видео Sora',
        'Агент Codex',
      ],
    },
    {
      name: 'Pro',
      baseId: 'pro',
      price: '$200',
      priceDetails: 'USD / месяц',
      description: 'Полный доступ и лучшее из ChatGPT',
      buttonText: 'Перейти на Pro',
      features: [
        'GPT-5 с профессиональным рассуждением',
        'Неограниченное количество сообщений и загрузок',
        'Неограниченная и более быстрая генерация изображений',
        'Максимальная память и контекст',
        'Максимально глубокое исследование и режим агента',
        'Расширенные проекты, задачи и пользовательские GPT',
        'Расширенная генерация видео Sora',
        'Расширенный агент Codex',
        'Предварительный обзор новых функций',
      ],
      footerText: 'Мне нужна помощь с выставлением счетов Без ограничений с учетом защиты от злоупотреблений. Узнать больше'
    },
  ];

  const businessPlan = {
    name: 'Business',
    baseId: 'business',
    price: '$25',
    priceDetails: 'USD / месяц',
    description: 'Улучшите работу своей команды с помощью безопасной рабочей области для совместной работы',
    buttonText: 'Перейти на Business',
    features: [
      { text: 'Все в Plus и даже больше', description: 'неограниченное количество сообщений GPT-5, широкий доступ к мышлению GPT-5, доступ к GPT-5 pro и дополнительные кредиты, которые можно масштабировать вместе с вашей командой.', iconKey: 'Все в Plus и даже больше' },
      { text: 'Подключите знания своей компании', description: 'Google Диск, SharePoint, Dropbox, GitHub, Outlook и пользовательские интеграции', iconKey: 'Подключите знания своей компании' },
      { text: 'Безопасность, необходимая для бизнеса', description: 'SSO SAML, MFA, SOC 2 Type 2, шифрование при передаче и хранении, данные исключены из обучения', iconKey: 'Безопасность, необходимая для бизнеса' },
      { text: 'Режим записок', description: 'записывайте собрания и голосовые заметки на рабочем столе macOS, а затем ищите и используйте их расшифровки в любом чате', iconKey: 'Режим записок' },
      { text: 'Бизнес-функции', description: 'такие как проекты, задачи, загрузка файлов и настраиваемые GPT для рабочей области', iconKey: 'Бизнес-функции' },
      { text: 'Встроенные агенты', description: 'глубокое исследование, агент ChatGPT и Codex могут анализировать ваши документы, инструменты и кодовые базы, чтобы сэкономить ваше время', iconKey: 'Встроенные агенты' },
      { text: 'Мультимодальное создание', description: 'создавайте видео с помощью Sora, генерируйте изображения, создавайте холсты, запускайте расширенный анализ данных и выполняйте встроенный код', iconKey: 'Мультимодальное создание' },
    ],
  };

  const PlanCard = ({ plan }) => {
    const isBusiness = plan.name === 'Business';

    const getIconColor = () => {
        switch (plan.name) {
            case 'Бесплатно':
                return 'text-gray-500';
            case 'Plus':
                return 'text-gray-800';
            case 'Pro':
            case 'Business':
                return 'text-gray-800';
            default:
                return 'text-gray-500';
        }
    };

    const getButtonClass = () => {
        switch (plan.name) {
            case 'Бесплатно':
                return 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50';
            case 'Plus':
                return 'bg-indigo-600 text-white hover:bg-indigo-700';
            case 'Pro':
                return 'bg-gray-900 text-white hover:bg-gray-800';
            case 'Business':
                return 'bg-indigo-600 text-white hover:bg-indigo-700';
            default:
                return '';
        }
    };

    return (
      <Card 
        className={`flex flex-col h-full rounded-2xl ${
          plan.isPopular ? 'border-indigo-500 bg-indigo-50/50' : 'bg-white'
        }`}
      >
        <CardHeader className="pt-8 px-8">
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
            {plan.isPopular && (
              <div className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                популярный
              </div>
            )}
          </div>
          <div className="flex items-baseline pt-4">
            <p className="text-4xl font-bold">{plan.price}</p>
            <p className="text-sm text-gray-500 ml-1">{plan.priceDetails}</p>
          </div>
          <p className="mt-4 text-gray-600 h-10">{plan.description}</p>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow px-8 pb-8">
          <Button className={`w-full mb-6 rounded-lg h-10 ${getButtonClass()}`}>
            {plan.buttonText}
          </Button>
          <ul className="space-y-4 text-sm">
            {plan.features.map((feature, index) => {
              const iconColor = getIconColor();

              if (isBusiness) {
                const IconComponent = iconMapping[feature.iconKey] || CheckCircle2;
                return (
                  <li key={index} className="flex items-start">
                    <IconComponent className={`h-5 w-5 ${iconColor} mr-3 shrink-0 mt-0.5`} />
                    <div>
                      <span className="font-semibold">{feature.text}:</span>
                      <span className="text-gray-600 ml-1">{feature.description}</span>
                    </div>
                  </li>
                )
              }
              
              const IconComponent = iconMapping[feature] || CheckCircle2;
              return (
                <li key={index} className="flex items-start">
                  <IconComponent className={`h-4 w-4 ${iconColor} mr-3 shrink-0 mt-1`} />
                  <span className="text-gray-800">{feature}</span>
                </li>
              );
            })}
          </ul>
          {plan.footerText && (
            <div className="mt-auto pt-6 text-xs text-gray-500">
              <p>{plan.footerText.split(' ').slice(0, 6).join(' ')} <a href="#" className="underline hover:text-gray-700">{plan.footerText.split(' ').slice(6).join(' ')}</a></p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12">
      <div className="w-full max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Обновите свой план</h1>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
            <TabsTrigger value="personal">Личный план</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
          </TabsList>
          <TabsContent value="personal">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              {personalPlans.map((plan) => (
                <PlanCard key={plan.name} plan={plan} />
              ))}
            </div>
            <div className="text-center mt-12">
              <p className="text-gray-600">Вам нужны дополнительные возможности для вашего бизнеса?</p>
              <Button variant="link" className="text-purple-600">Смотреть ChatGPT Enterprise</Button>
            </div>
          </TabsContent>
          <TabsContent value="business">
             <div className="mt-8 max-w-3xl mx-auto">
                <PlanCard plan={businessPlan} />
             </div>
             <div className="text-center mt-8 text-sm text-gray-500">
                <p>Для 2+ пользователей, ежегодное выставление счетов</p>
                <p>Без ограничений с учетом защиты от злоупотреблений. <Button variant="link" className="p-0 h-auto text-sm">Узнать больше.</Button></p>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Plans;
