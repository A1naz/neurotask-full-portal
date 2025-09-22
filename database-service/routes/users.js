const express = require("express");
const router = express.Router();
const { requireApiKey } = require("../middleware/auth");
const User = require("../models/User");
const TokenTransaction = require("../models/TokenTransaction");
const mongoose = require("mongoose");
const crypto = require("crypto");

// ===== USER MANAGEMENT ENDPOINTS =====

// Создать пользователя
router.post("/", requireApiKey, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role = "user",
      verificationCode,
      verificationExpires,
      emailVerified = false,
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Username, email и password обязательны",
      });
    }

    // Проверяем, существует ли пользователь с таким email или username
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Пользователь с таким email или username уже существует",
      });
    }

    // Создаем пользователя
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      balance: 0,
      isTeamOwner: true,
      interface: {
        agentsExpanded: false,
        generationsExpanded: false,
        providerOrder: [],
        isSidebarCollapsed: false,
      },
      verificationCode,
      verificationExpires,
      emailVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Пользователь создан",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        balance: user.balance,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка создания пользователя",
    });
  }
});

// Получить всех пользователей
router.get("/", requireApiKey, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения пользователей",
    });
  }
});

// Получить пользователя по ID
router.get("/:userId", requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { populate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    let query = User.findById(userId).select("-password");

    if (populate) {
      const fields = populate.split(',').join(' ');
      query = query.populate(fields);
    }

    const user = await query.exec();

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения пользователя",
    });
  }
});

// Получить баланс пользователя
router.get("/:userId/balance", requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    let user = await User.findById(userId);

    if (user.teamId) {
      user = await User.findById(user.teamId);
    }
    
    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    res.json({
      success: true,
      balance: user.balance || 0,
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения баланса пользователя",
    });
  }
});

// Обновить баланс пользователя
router.post("/:userId/balance", requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, type, description, metadata = {} } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    if (typeof amount !== "number") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Amount должен быть числом",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    const oldBalance = user.balance || 0;

    if (type === "spend") {
      if (oldBalance < amount) {
        return res.status(400).json({
          error: "Insufficient Balance",
          message: "Недостаточно средств на балансе",
        });
      }
      user.balance = oldBalance - amount;
    } else if (type === "top_up" || type === "refund" || type === "bonus") {
      user.balance = oldBalance + amount;
    } else {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неизвестный тип операции",
      });
    }

    await user.save();

    // Создаем запись о транзакции
    const transaction = new TokenTransaction({
      userId: user._id,
      type: type,
      amount: amount,
      description:
        description ||
        `${type === "spend" ? "Списание" : "Пополнение"} токенов`,
      metadata: metadata,
      balanceBefore: oldBalance,
      balanceAfter: user.balance,
    });

    await transaction.save();

    res.json({
      success: true,
      message: "Баланс обновлен",
      newBalance: user.balance,
      transaction: transaction,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка обновления баланса",
    });
  }
});

// Получить транзакции пользователя
router.get("/:userId/transactions", requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, type, period, startDate, endDate, fetchAll } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    const query = { userId };
    if (type) query.type = type;
    
    // Фильтрация по периоду
    if (period && period !== 'all') {
      let startDateValue;
      let endDateValue;

      switch (period) {
        case 'today':
          startDateValue = new Date();
          startDateValue.setHours(0, 0, 0, 0);
          query.createdAt = { $gte: startDateValue };
          break;
        case 'yesterday':
          startDateValue = new Date();
          startDateValue.setDate(startDateValue.getDate() - 1);
          startDateValue.setHours(0, 0, 0, 0);
          
          endDateValue = new Date();
          endDateValue.setDate(endDateValue.getDate() - 1);
          endDateValue.setHours(23, 59, 59, 999);
          
          query.createdAt = { $gte: startDateValue, $lte: endDateValue };
          break;
        case '3days':
          startDateValue = new Date();
          startDateValue.setDate(startDateValue.getDate() - 3);
          query.createdAt = { $gte: startDateValue };
          break;
        case '7days':
          startDateValue = new Date();
          startDateValue.setDate(startDateValue.getDate() - 7);
          query.createdAt = { $gte: startDateValue };
          break;
        case '30days':
          startDateValue = new Date();
          startDateValue.setDate(startDateValue.getDate() - 30);
          query.createdAt = { $gte: startDateValue };
          break;
        case 'custom':
          if (startDate) {
            startDateValue = new Date(startDate);
            startDateValue.setHours(0, 0, 0, 0);
            query.createdAt = { ...query.createdAt, $gte: startDateValue };
          }
          if (endDate) {
            endDateValue = new Date(endDate);
            endDateValue.setHours(23, 59, 59, 999);
            query.createdAt = { ...query.createdAt, $lte: endDateValue };
          }
          break;
      }
    }


    const queryBuilder = TokenTransaction.find(query).sort({ createdAt: -1 });

    if (fetchAll !== 'true') {
      queryBuilder.limit(limit * 1).skip((page - 1) * limit);
    }

    const transactions = await queryBuilder;
    const total = await TokenTransaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      totalPages: fetchAll === 'true' ? 1 : Math.ceil(total / limit),
      currentPage: fetchAll === 'true' ? 1 : page,
      total,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения транзакций",
    });
  }
});

// Получить API ключи пользователя
router.get("/:userId/api-keys", requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    res.json({
      success: true,
      apiKeys: user.apiKeys || [],
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения API ключей",
    });
  }
});

// Создать API ключ для пользователя
router.post("/:userId/api-keys", requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, permissions = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    if (!name) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Название API ключа обязательно",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    // Генерируем API ключ
    const apiKey = crypto.randomBytes(32).toString("hex");
    const keyId = crypto.randomBytes(16).toString("hex");

    const newApiKey = {
      id: keyId,
      name,
      key: apiKey,
      permissions,
      createdAt: new Date(),
      lastUsed: null,
      isActive: true,
    };

    if (!user.apiKeys) user.apiKeys = [];
    user.apiKeys.push(newApiKey);
    await user.save();

    res.status(201).json({
      success: true,
      message: "API ключ создан",
      apiKey: {
        id: keyId,
        name,
        key: apiKey,
        permissions,
        createdAt: newApiKey.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка создания API ключа",
    });
  }
});

// Обновить API ключ пользователя
router.put("/:userId/api-keys/:keyId", requireApiKey, async (req, res) => {
  try {
    const { userId, keyId } = req.params;
    const { name, permissions, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    const apiKey = user.apiKeys?.find((key) => key.id === keyId);

    if (!apiKey) {
      return res.status(404).json({
        error: "Not Found",
        message: "API ключ не найден",
      });
    }

    if (name !== undefined) apiKey.name = name;
    if (permissions !== undefined) apiKey.permissions = permissions;
    if (isActive !== undefined) apiKey.isActive = isActive;

    apiKey.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: "API ключ обновлен",
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка обновления API ключа",
    });
  }
});

// Удалить API ключ пользователя
router.delete("/:userId/api-keys/:keyId", requireApiKey, async (req, res) => {
  try {
    const { userId, keyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    const apiKeyIndex = user.apiKeys?.findIndex((key) => key.id === keyId);

    if (apiKeyIndex === -1) {
      return res.status(404).json({
        error: "Not Found",
        message: "API ключ не найден",
      });
    }

    const deletedKey = user.apiKeys[apiKeyIndex];
    user.apiKeys.splice(apiKeyIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: "API ключ удален",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка удаления API ключа",
    });
  }
});

// Валидация API ключа
router.post("/validate-api-key", async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        error: "Bad Request",
        message: "API ключ обязателен",
      });
    }

    // Ищем пользователя с таким API ключом
    const user = await User.findOne({
      "apiKeys.key": apiKey,
      "apiKeys.isActive": true,
    });

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Неверный API ключ",
      });
    }

    // Находим конкретный API ключ
    const foundApiKey = user.apiKeys.find((key) => key.key === apiKey);

    // Обновляем время последнего использования
    foundApiKey.lastUsed = new Date();
    await user.save();

    res.json({
      success: true,
      message: "API ключ валиден",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      permissions: foundApiKey.permissions,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка валидации API ключа",
    });
  }
});

// Получить AI настройки пользователя
router.get("/:userId/ai-settings", requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    res.json({
      success: true,
      aiSettings: user.aiSettings || {},
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения AI настроек",
    });
  }
});

// Обновить AI настройки пользователя
router.put("/:userId/ai-settings", requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const aiSettings = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    user.aiSettings = { ...user.aiSettings, ...aiSettings };
    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "AI настройки обновлены",
      aiSettings: user.aiSettings,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка обновления AI настроек",
    });
  }
});

// Частично обновить AI настройки пользователя
router.patch(
  "/:userId/ai-settings/:setting",
  requireApiKey,
  async (req, res) => {
    try {
      const { userId, setting } = req.params;
      const value = req.body.value;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Неверный ID пользователя",
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          error: "Not Found",
          message: "Пользователь не найден",
        });
      }

      if (!user.aiSettings) user.aiSettings = {};
      user.aiSettings[setting] = value;
      user.updatedAt = new Date();
      await user.save();

      res.json({
        success: true,
        message: "AI настройка обновлена",
        setting: { [setting]: value },
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Ошибка обновления AI настройки",
      });
    }
  }
);

// Обновить пользователя
router.put("/:userId", requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    // Убираем поля, которые нельзя обновлять напрямую
    delete updateData.password;
    delete updateData.balance;
    delete updateData.apiKeys;
    delete updateData.aiSettings;
    delete updateData.createdAt;

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    res.json({
      success: true,
      message: "Пользователь обновлен",
      user,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка обновления пользователя",
    });
  }
});

// Удалить пользователя
router.delete("/:userId", requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    res.json({
      success: true,
      message: "Пользователь удален",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка удаления пользователя",
    });
  }
});

// Найти пользователя по email
router.get("/email/:email", requireApiKey, async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Email обязателен",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка поиска пользователя",
    });
  }
});

// Получить настройки пользователя
router.get("/:userId/settings", requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    res.json({
      success: true,
      settings: user.preferences || {},
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения настроек пользователя",
    });
  }
});

// Обновить настройки пользователя
router.put("/:userId/settings", requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { interfaceSettings } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    if (!user.preferences) user.preferences = {};
    if (!user.preferences.interface) user.preferences.interface = {};

    user.preferences.interface = {
      ...user.preferences.interface,
      ...interfaceSettings,
    };
    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Настройки обновлены",
      settings: user.preferences,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка обновления настроек",
    });
  }
});

// Update sidebar collapsed state
router.patch("/:userId/settings/sidebar", requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isCollapsed } = req.body;

    if (typeof isCollapsed !== "boolean") {
      return res.status(400).json({
        error: "Bad Request",
        message: "isCollapsed must be a boolean",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "Пользователь не найден",
      });
    }

    if (!user.preferences) user.preferences = {};
    if (!user.preferences.interface) user.preferences.interface = {};

    user.preferences.interface.isSidebarCollapsed = isCollapsed;
    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Sidebar state updated",
      isSidebarCollapsed: user.preferences.interface.isSidebarCollapsed,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка обновления состояния сайдбара",
    });
  }
});

// Получить задачи пользователя
router.get("/:userId/tasks", requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, status, priority, type } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Неверный ID пользователя",
      });
    }

    const query = { $or: [{ reporter: userId }, { assignee: userId }] };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;

    // Здесь нужно импортировать модель Task
    // const tasks = await Task.find(query)
    //   .sort({ createdAt: -1 })
    //   .limit(limit * 1)
    //   .skip((page - 1) * limit);

    // const total = await Task.countDocuments(query);

    // Временно возвращаем заглушку
    res.json({
      success: true,
      tasks: [],
      totalPages: 0,
      currentPage: page,
      total: 0,
      message: "Модель Task не импортирована",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка получения задач пользователя",
    });
  }
});

module.exports = router;
