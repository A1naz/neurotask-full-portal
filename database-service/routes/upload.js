const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Конфигурация multer для хранения файла в памяти
const upload = multer({ storage: multer.memoryStorage() });

// Маршрут для загрузки файла в VK Cloud Storage
router.post('/vk-cloud', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Изображение не найдено' });
  }

  const { VK_ACCESS_KEY, VK_SECRET_KEY, VK_CLOUD_BUCKET, VK_CLOUD_ENDPOINT } = process.env;

  if (!VK_ACCESS_KEY || !VK_SECRET_KEY || !VK_CLOUD_BUCKET || !VK_CLOUD_ENDPOINT) {
    console.error('VK Cloud Storage credentials are not set.');
    return res.status(500).json({ message: 'Ошибка конфигурации VK Cloud Storage.' });
  }

  const s3Client = new S3Client({
    region: 'us-east-1', // Регион по умолчанию, VK Cloud не использует его активно
    endpoint: VK_CLOUD_ENDPOINT,
    credentials: {
      accessKeyId: VK_ACCESS_KEY,
      secretAccessKey: VK_SECRET_KEY,
    },
  });

  const fileName = `images/${uuidv4()}-${req.file.originalname}`;

  const params = {
    Bucket: VK_CLOUD_BUCKET,
    Key: fileName,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
    ACL: 'public-read', // Чтобы файл был публично доступен
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    const imageUrl = `${VK_CLOUD_ENDPOINT}/${VK_CLOUD_BUCKET}/${fileName}`;
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Ошибка загрузки в VK Cloud Storage:', error);
    res.status(500).json({ message: 'Ошибка загрузки изображения в VK Cloud Storage', error: error.message });
  }
});

module.exports = router;
