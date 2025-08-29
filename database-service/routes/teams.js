const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const { requireApiKey } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// GET /api/teams - Получить список всех сотрудников для владельца
router.get('/:ownerId', requireApiKey, async (req, res) => {
  try {
    const { ownerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ success: false, message: 'Некорректный ID владельца.' });
    }

    const employees = await User.find({ teamId: ownerId });
    res.json({ success: true, employees });

  } catch (error) {
    console.error('Ошибка получения списка сотрудников:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера.' });
  }
});

// POST /api/teams - Создать нового сотрудника
router.post('/:ownerId', requireApiKey, async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { email, password, username, phoneNumber, position, permissions } = req.body;

    // Проверяем, существует ли уже пользователь с таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Пользователь с таким email уже существует.' });
    }

    const newUser = new User({
      username,
      email,
      password, // Пароль будет захэширован pre-save хуком в модели User
      teamId: ownerId,
      isOwner: false,
      interface: {
        agentsExpanded: false,
        generationsExpanded: false,
        providerOrder: [],
        isSidebarCollapsed: false
      },
      phoneNumber,
      position,
      permissions,
      emailVerified: true // Сотрудников создаем сразу верифицированными
    });

    await newUser.save();

    // Не возвращаем пароль
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, message: 'Сотрудник успешно создан.', employee: userResponse });

  } catch (error) {
    console.error('Ошибка создания сотрудника:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера.' });
  }
});

// PUT /api/teams/:employeeId - Обновить данные сотрудника
router.put('/:employeeId', requireApiKey, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { phoneNumber, position, permissions, password } = req.body;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ success: false, message: 'Некорректный ID сотрудника.' });
    }

    const updateData = { phoneNumber, position, permissions };

    // Если передан новый пароль, хэшируем и добавляем его
    if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedEmployee = await User.findByIdAndUpdate(
      employeeId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!updatedEmployee) {
      return res.status(404).json({ success: false, message: 'Сотрудник не найден.' });
    }

    res.json({ success: true, message: 'Данные сотрудника обновлены.', employee: updatedEmployee });

  } catch (error) {
    console.error('Ошибка обновления сотрудника:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера.' });
  }
});

// DELETE /api/teams/:employeeId - Удалить сотрудника
router.delete('/:employeeId', requireApiKey, async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ success: false, message: 'Некорректный ID сотрудника.' });
    }

    const deletedEmployee = await User.findByIdAndDelete(employeeId);

    if (!deletedEmployee) {
      return res.status(404).json({ success: false, message: 'Сотрудник не найден.' });
    }

    res.json({ success: true, message: 'Сотрудник успешно удален.' });

  } catch (error) {
    console.error('Ошибка удаления сотрудника:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера.' });
  }
});


module.exports = router;
