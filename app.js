const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Auth & Products',
      version: '1.0.0',
      description: 'API для регистрации, авторизации и управления товарами',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'local server',
      },
    ],
  },
  apis: ['./app.js'],
};

let users = [];
let products = [];

function findUserByEmail(email, res) {
  const user = users.find((u) => u.email === email);
  if (!user) {
    res.status(404).json({ error: 'user not found' });
    return null;
  }
  return user;
}

function findProductById(id, res) {
  const product = products.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'product not found' });
    return null;
  }
  return product;
}

async function hashPassword(password) {
  const rounds = 10;
  return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

// Swagger
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(
      `[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`,
    );
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      console.log('Body:', req.body);
    }
  });
  next();
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     description: Создает нового пользователя с хешированным паролем (логин — email)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 example: trump@truthsocial.com
 *               password:
 *                 type: string
 *                 example: password123
 *               first_name:
 *                 type: string
 *                 example: Donald
 *               last_name:
 *                 type: string
 *                 example: Trump
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *       400:
 *         description: Некорректные данные или email уже занят
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
  const { hashedPassword, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Авторизация пользователя
 *     description: Вход по email и паролю
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: trump@truthsocial.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *       400:
 *         description: Отсутствуют обязательные поля
 *       401:
 *         description: Неверные учетные данные
 *       404:
 *         description: Пользователь не найден
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const user = findUserByEmail(email, res);
  if (!user) return;
  const isAuthenticated = await verifyPassword(password, user.hashedPassword);
  if (isAuthenticated) {
    res.status(200).json({ login: true });
  } else {
    res.status(401).json({ error: 'not authenticated' });
  }
});

// ==================== PRODUCTS ====================

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Make America Great Again Cap"
 *               category:
 *                 type: string
 *                 example: "Clothing"
 *               description:
 *                 type: string
 *                 example: "A cap with the slogan 'Make America Great Again'"
 *               price:
 *                 type: number
 *                 example: 19
 *     responses:
 *       201:
 *         description: Товар создан
 *       400:
 *         description: Некорректные данные
 */
app.post('/api/products', (req, res) => {
  const { title, category, description, price } = req.body;
  if (
    title === undefined ||
    category === undefined ||
    description === undefined ||
    price === undefined
  ) {
    return res.status(400).json({
      error: 'title, category, description and price are required',
    });
  }
  const newProduct = {
    id: nanoid(),
    title: String(title),
    category: String(category),
    description: String(description),
    price: Number(price),
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 */
app.get('/api/products', (req, res) => {
  res.status(200).json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар найден
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', (req, res) => {
  const product = findProductById(req.params.id, res);
  if (!product) return;
  res.status(200).json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить параметры товара
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Make America Great Again Cap (Black)"
 *               category:
 *                 type: string
 *                 example: "Clothing"
 *               description:
 *                 type: string
 *                 example: "A black cap with the slogan 'Make America Great Again'"
 *               price:
 *                 type: number
 *                 example: 20
 *     responses:
 *       200:
 *         description: Товар обновлен
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', (req, res) => {
  const product = findProductById(req.params.id, res);
  if (!product) return;
  const { title, category, description, price } = req.body;
  if (title !== undefined) product.title = String(title);
  if (category !== undefined) product.category = String(category);
  if (description !== undefined) product.description = String(description);
  if (price !== undefined) product.price = Number(price);
  res.status(200).json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар удален
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'product not found' });
  }
  const [deleted] = products.splice(index, 1);
  res.status(200).json(deleted);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
});
