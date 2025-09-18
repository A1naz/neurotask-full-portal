const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Настройки для отправки почты (замените на свои)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post('/enterprise-inquiry', requireApiKey, async (req, res) => {
  try {
    const { firstName, lastName, company, email, details } = req.body;

    const mailOptions = {
      from: `"NeuroTask Platform" <${process.env.EMAIL_FROM}>`,
      to: process.env.SALES_EMAIL, // Email отдела продаж
      subject: 'Новый запрос от предприятия',
      html: `
        <h2>Новый запрос от предприятия: ${company}</h2>
        <p><strong>Имя:</strong> ${firstName} ${lastName}</p>
        <p><strong>Компания:</strong> ${company}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Подробности:</strong></p>
        <p>${details}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Запрос успешно отправлен' });
  } catch (error) {
    console.error('Ошибка отправки запроса от предприятия:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера при отправке запроса' });
  }
});

module.exports = router;
