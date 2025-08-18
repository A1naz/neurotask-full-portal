const fs = require('fs');
const path = require('path');

// Функция для проверки синтаксиса файла
function checkFileSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Пытаемся скомпилировать файл для проверки синтаксиса
    require('vm').compileFunction(content, [], {
      filename: filePath,
      lineOffset: 0,
      columnOffset: 0
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Функция для рекурсивного поиска файлов
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
      findJsFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.cjs')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Основная функция
function checkAllFiles() {
  console.log('🔍 Проверяю синтаксис всех JavaScript файлов...\n');
  
  const jsFiles = findJsFiles('.');
  const results = [];
  
  jsFiles.forEach(filePath => {
    const result = checkFileSyntax(filePath);
    if (!result.success) {
      results.push({
        file: filePath,
        error: result.error
      });
    }
  });
  
  if (results.length === 0) {
    console.log('✅ Все файлы прошли проверку синтаксиса!');
  } else {
    console.log(`❌ Найдено ${results.length} файлов с синтаксическими ошибками:\n`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.file}`);
      console.log(`   Ошибка: ${result.error}\n`);
    });
  }
  
  console.log(`📊 Всего проверено файлов: ${jsFiles.length}`);
  console.log(`✅ Успешно: ${jsFiles.length - results.length}`);
  console.log(`❌ С ошибками: ${results.length}`);
}

// Запускаем проверку
checkAllFiles();
