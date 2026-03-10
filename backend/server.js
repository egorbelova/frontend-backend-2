const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { products: initialProducts } = require('./data/products');
let products = [...initialProducts];
let users = [];

const app = express();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

const BASE_URL = `http://localhost:${port}`;

// настройка хранилища для загружаемых файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // генерация уникального имени с помощью nanoid, времени и расширения
    const uniqueName = `${Date.now()}-${nanoid(6)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// проверка типа файла
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

app.use('/uploads', express.static('uploads'));
app.use('/images', express.static('public/images'));

const makeAbsolutePhotoUrl = (photoPath) => {
  if (!photoPath) return `${BASE_URL}/images/placeholder.svg`;
  if (photoPath.startsWith('http')) return photoPath;
  if (photoPath.startsWith('/')) return `${BASE_URL}${photoPath}`;
  return `${BASE_URL}/${photoPath}`;
};

const processProducts = (products) => {
  return products.map((product) => ({
    ...product,
    photo: makeAbsolutePhotoUrl(product.photo),
  }));
};

const processProduct = (product) => {
  if (!product) return null;
  return {
    ...product,
    photo: makeAbsolutePhotoUrl(product.photo),
  };
};

app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));

async function hashPassword(password) {
  const rounds = 10;
  return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'Authorization header with Bearer token required' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

// Swagger: описание API
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API управления товарами',
      version: '1.0.0',
      description: 'REST API для CRUD-операций с товарами интернет-магазина',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Локальный сервер',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Токен из POST /api/auth/login',
        },
      },
    },
  },
  apis: ['./server.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// логирование запросов
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(
      `[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`,
    );
  });
  next();
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный ID товара (генерируется автоматически)
 *         name:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Описание товара
 *         price:
 *           type: number
 *           description: Цена
 *         stock:
 *           type: integer
 *           description: Количество на складе
 *         photo:
 *           type: string
 *           description: URL или путь к изображению
 *       example:
 *         id: "abc123"
 *         name: "Floral Maxi Dress"
 *         category: "Dresses"
 *         description: "Beautiful floral print maxi dress"
 *         price: 127
 *         stock: 15
 *         photo: "/images/floral_maxi_dress.webp"
 */

// поиск товара
function findProductOr404(id, res) {
  const product = products.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

function findUserByEmailOr404(email, res) {
  const user = users.find((u) => u.email === email);
  if (!user) {
    res.status(404).json({ error: 'user not found' });
    return null;
  }
  return user;
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, first_name, last_name]
 *             properties:
 *               email: { type: string, example: trump@truthsocial.com }
 *               password: { type: string, example: password123 }
 *               first_name: { type: string, example: Donald }
 *               last_name: { type: string, example: Trump }
 *     responses:
 *       201: { description: Пользователь создан }
 *       400: { description: Некорректные данные или email занят }
 */
app.post('/api/auth/register', async (req, res) => {
  const { email, password, first_name, last_name } = req.body;
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({
      error: 'email, password, first_name and last_name are required',
    });
  }
  if (users.some((u) => u.email === email)) {
    return res.status(400).json({ error: 'email already registered' });
  }
  const newUser = {
    id: nanoid(),
    email,
    first_name,
    last_name,
    hashedPassword: await hashPassword(password),
  };
  users.push(newUser);
  const { hashedPassword, ...publicUser } = newUser;
  res.status(201).json(publicUser);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Авторизация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: trump@truthsocial.com }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *       400: { description: Нет обязательных полей }
 *       401: { description: Неверные учетные данные }
 *       404: { description: Пользователь не найден }
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const user = findUserByEmailOr404(email, res);
  if (!user) return;
  const ok = await verifyPassword(password, user.hashedPassword);
  if (!ok) return res.status(401).json({ error: 'not authenticated' });

  const accessToken = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '15m',
  });
  res.status(200).json({ accessToken });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Текущий пользователь
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Данные пользователя }
 *       401: { description: Нет/неверный токен }
 *       404: { description: Пользователь не найден }
 */
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = users.find((u) => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'user not found' });
  const { hashedPassword, ...publicUser } = user;
  res.status(200).json(publicUser);
});

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Загрузка изображения
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Файл успешно загружен
 *       400:
 *         description: Файл не передан или неверный тип
 */
app.post('/api/upload', requireAuth, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `${BASE_URL}/uploads/images/${req.file.filename}`;
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               photo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка в теле запроса (не все поля указаны)
 */
app.post('/api/products', requireAuth, (req, res) => {
  const { name, category, description, price, stock, photo } = req.body;
  if (
    !name ||
    !category ||
    !description ||
    price === undefined ||
    stock === undefined
  ) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const newProduct = {
    id: nanoid(6),
    name: name?.trim(),
    category: category?.trim(),
    description: description?.trim(),
    price: Number(price),
    stock: Number(stock),
    photo: photo || '/images/placeholder.svg',
  };

  products.push(newProduct);
  res.status(201).json(processProduct(newProduct));
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
  res.json(processProducts(products));
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (product) {
    res.json(processProduct(product));
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить данные товара
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               photo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Обновлённый товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.patch('/api/products/:id', requireAuth, (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;

  const { name, category, description, price, stock, photo } = req.body;

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (photo !== undefined) product.photo = photo;

  res.json(processProduct(product));
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар успешно удалён (тела ответа нет)
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', requireAuth, (req, res) => {
  const exists = products.some((p) => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Product not found' });

  products = products.filter((p) => p.id !== req.params.id);
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max 5MB' });
  }

  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running on ${BASE_URL}`);
  console.log(`Swagger UI: ${BASE_URL}/api-docs`);
});
