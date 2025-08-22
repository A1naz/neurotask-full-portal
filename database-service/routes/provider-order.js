const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/auth');
const User = require('../models/User');
const mongoose = require('mongoose');

// GET provider order for a user
router.get('/:userId', requireApiKey, async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Bad Request', message: 'Неверный ID пользователя' });
        }

        const user = await User.findById(userId).select('preferences.interface.providerOrder');
        if (!user) {
            return res.status(404).json({ error: 'Not Found', message: 'Пользователь не найден' });
        }

        const providerOrder = user.preferences?.interface?.providerOrder || [];
        res.json({ success: true, providerOrder });

    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', message: 'Ошибка получения порядка провайдеров' });
    }
});

// PUT (update) provider order for a user
router.put('/:userId', requireApiKey, async (req, res) => {
    try {
        const { userId } = req.params;
        const { providerOrder } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Bad Request', message: 'Неверный ID пользователя' });
        }
        if (!Array.isArray(providerOrder)) {
            return res.status(400).json({ error: 'Bad Request', message: 'providerOrder должен быть массивом' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Not Found', message: 'Пользователь не найден' });
        }

        if (!user.preferences) user.preferences = {};
        if (!user.preferences.interface) user.preferences.interface = {};

        user.preferences.interface.providerOrder = providerOrder;
        await user.save();

        res.json({ success: true, message: 'Порядок провайдеров обновлен' });

    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', message: 'Ошибка обновления порядка провайдеров' });
    }
});

module.exports = router;
