const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ChatHistory = require('../models/ChatHistory');
const TariffPlan = require('../models/TariffPlan');

router.post('/check-usage', async (req, res) => {
  try {
    const { userId, chatId, provider } = req.body;

    if (!userId || !chatId || !provider) {
      return res.status(400).json({ success: false, message: 'Необходимы ID пользователя, чата и провайдера.' });
    }

    // 1. Находим пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден.' });
    }
    
    let limit = 5;
    let tariffName = 'Бесплатно';

    if (user.tariffId) {
      const tariffPlan = await TariffPlan.findById(user.tariffId);
      if (tariffPlan) {
        limit = tariffPlan.requestLimit;
        tariffName = tariffPlan.name;
      }
    }

    if (limit < 0) { // Assuming a negative value in requestLimit means unlimited
        return res.json({ success: true, limitExceeded: false });
    }

    // 2. Находим историю чата и считаем сообщения
    const chat = await ChatHistory.findOne({ chatId, userId, provider });
    if (!chat) {
      // Если чата нет, значит, это первое сообщение и лимит не превышен
      return res.json({ success: true, limitExceeded: false });
    }

    const userMessagesCount = chat.messages.filter(m => m.role === 'user').length;

    console.log('userMessagesCount', userMessagesCount);
    console.log('limit', limit);
    // 3. Сравниваем и возвращаем результат
    if (userMessagesCount >= limit) {
      console.log('limitExceeded', true);
      return res.json({ 
        success: true, 
        limitExceeded: true,
        message: `Вы достигли лимита в ${limit} сообщений для тарифа "${tariffName}".`
      });
    }

    res.json({ success: true, limitExceeded: false });

  } catch (error) {
    console.error('Ошибка проверки лимитов:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера.' });
  }
});

module.exports = router;
