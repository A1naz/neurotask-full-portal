const fs = require('fs');
const path = require('path');

// Функция для рекурсивного поиска файлов
function findFiles(dir, pattern) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findFiles(fullPath, pattern));
    } else if (pattern.test(item)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Функция для замены путей в файле
function fixApiPaths(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Паттерны для замены
  const patterns = [
    // Заменяем fetch(`${API_BASE}/path` на fetch(`${API_BASE}/api/path`
    {
      regex: /fetch\(\`\${API_BASE}\/([^`]+)\`/g,
      replacement: 'fetch(`${API_BASE}/api/$1`',
      description: 'Добавляем /api/ префикс к fetch запросам'
    },
    // Заменяем fetch(`${API_BASE}/api/api/path` на fetch(`${API_BASE}/api/path` (убираем дублирование)
    {
      regex: /fetch\(\`\${API_BASE}\/api\/api\/([^`]+)\`/g,
      replacement: 'fetch(`${API_BASE}/api/$1`',
      description: 'Убираем дублирование /api/api/'
    }
  ];
  
  // Применяем все паттерны
  for (const pattern of patterns) {
    const newContent = content.replace(pattern.regex, pattern.replacement);
    if (newContent !== content) {
      content = newContent;
      hasChanges = true;
      }
  }
  
  // Записываем файл только если были изменения
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } else {
    return false;
  }
}

// Основная функция
function main() {
  const srcDir = path.join(__dirname, 'src');
  
  if (!fs.existsSync(srcDir)) {
    process.exit(1);
  }
  
  // Ищем все JSX и JS файлы
  const files = findFiles(srcDir, /\.(jsx|js)$/);
  let totalFixed = 0;
  
  // Обрабатываем каждый файл
  for (const file of files) {
    try {
      if (fixApiPaths(file)) {
        totalFixed++;
      }
    } catch (error) {
      }
    // Пустая строка для разделения
  }
  
  }

// Запускаем скрипт
if (require.main === module) {
  main();
}

module.exports = { fixApiPaths, findFiles };
