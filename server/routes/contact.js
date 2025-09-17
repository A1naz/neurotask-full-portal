const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { sendContactUsEmail } = require('../utils/emailService');

// POST /api/contact-us
router.post('/', requireAuth, async (req, res) => {
 
  try {
    const { message } = req.body;
    const user = req.session.user;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Сообщение не может быть пустым.' });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Пользователь не авторизован.' });
    }

    const result = await sendContactUsEmail(user.email, user.username, message.trim());

    if (result.success) {
      res.status(200).json({ success: true, message: 'Сообщение успешно отправлено.' });
    } else {
      res.status(500).json({ success: false, message: 'Не удалось отправить сообщение.', error: result.error });
    }
  } catch (error) {
    console.error('Ошибка на сервере при отправке сообщения:', error);
    res.status(5.0).json({ success: false, message: 'Внутренняя ошибка сервера.' });
  }
});

module.exports = router;
