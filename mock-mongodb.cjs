// Простая эмуляция MongoDB для тестирования
class MockMongoDB {
  constructor() {
    this.collections = {
      users: [],
      tokenTransactions: [],
      aiSettings: []
    };
    this.readyState = 1; // connected
  }

  // Эмуляция подключения
  connect() {
    console.log('✅ Mock MongoDB connected');
    return Promise.resolve();
  }

  // Эмуляция модели
  model(name, schema) {
    return class MockModel {
      constructor() {
        this.collection = name;
      }

      // Найти все документы
      static find(query = {}) {
        const collection = mockDB.collections[name];
        let results = [...collection];
        
        // Простая фильтрация
        if (query.email) {
          results = results.filter(item => item.email === query.email);
        }
        if (query._id) {
          results = results.filter(item => item._id === query._id);
        }
        
        return {
          select: (fields) => {
            if (fields === '-password') {
              results = results.map(item => {
                const { password, ...rest } = item;
                return rest;
              });
            }
            return this;
          },
          exec: () => Promise.resolve(results),
          then: (callback) => Promise.resolve(results).then(callback)
        };
      }

      // Найти один документ
      static findById(id) {
        const collection = mockDB.collections[name];
        const result = collection.find(item => item._id === id);
        return {
          select: (fields) => {
            if (fields === '-password' && result) {
              const { password, ...rest } = result;
              return { ...rest };
            }
            return result;
          },
          exec: () => Promise.resolve(result),
          then: (callback) => Promise.resolve(result).then(callback)
        };
      }

      // Найти один документ
      static findOne(query) {
        const collection = mockDB.collections[name];
        let result = null;
        
        if (query.email) {
          result = collection.find(item => item.email === query.email);
        }
        
        return {
          select: (fields) => {
            if (fields === '-password' && result) {
              const { password, ...rest } = result;
              return { ...rest };
            }
            return result;
          },
          exec: () => Promise.resolve(result),
          then: (callback) => Promise.resolve(result).then(callback)
        };
      }

      // Создать новый документ
      static create(data) {
        const collection = mockDB.collections[name];
        const newDoc = {
          _id: Date.now().toString(),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        collection.push(newDoc);
        return Promise.resolve(newDoc);
      }

      // Обновить документ
      static findByIdAndUpdate(id, update, options = {}) {
        const collection = mockDB.collections[name];
        const index = collection.findIndex(item => item._id === id);
        
        if (index !== -1) {
          collection[index] = {
            ...collection[index],
            ...update,
            updatedAt: new Date()
          };
          return Promise.resolve(collection[index]);
        }
        return Promise.resolve(null);
      }

      // Удалить документ
      static findByIdAndDelete(id) {
        const collection = mockDB.collections[name];
        const index = collection.findIndex(item => item._id === id);
        
        if (index !== -1) {
          const deleted = collection.splice(index, 1)[0];
          return Promise.resolve(deleted);
        }
        return Promise.resolve(null);
      }
    };
  }
}

// Создаем глобальный экземпляр
const mockDB = new MockMongoDB();

// Добавляем тестовые данные
mockDB.collections.users = [
  {
    _id: '1',
    username: 'testuser',
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    tokens: 100,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

mockDB.collections.tokenTransactions = [
  {
    _id: '1',
    userId: '1',
    type: 'purchase',
    amount: 50,
    description: 'Initial tokens',
    createdAt: new Date()
  }
];

mockDB.collections.aiSettings = [
  {
    _id: '1',
    userId: '1',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

module.exports = mockDB; 