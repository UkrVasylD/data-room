# Data Room

Безпечна платформа для обміну та управління конфіденційними документами з деталізованим контролем доступу, поділом та попередженням файлів.

## 🎯 Особливості

- **Аутентифікація**: JWT-based система реєстрації та логіну
- **Управління DataRoom**: Створення, редагування, видалення приватних кімнат документів
- **Управління файлами**: Загрузка, завантаження, переніменування, переміщення, видалення
- **Управління папками**: Вложені папки, структуровані сховища документів
- **Поділ документів**: Публічні посилання та поділ з конкретними користувачами
- **Контроль доступу**: Деталізована валідація прав доступу на рівні DataRoom/папки/файлу
- **Попередження файлів**: Вбудовані вьюери для PDF, зображень, текстових файлів
- **Безпечне зберігання**: Інтеграція з Supabase Storage для надійного зберігання файлів

## 🛠️ Технологічний стек

### Backend
- **Runtime**: Node.js v20.11.0
- **Framework**: Express 5.2.1
- **ORM**: Prisma 6.19.3
- **Database**: PostgreSQL 15
- **Auth**: JWT (jsonwebtoken 7-day expiry)
- **Password Hashing**: bcryptjs (10 salt rounds)
- **File Storage**: Supabase Storage
- **Development**: nodemon (auto-reload)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 8.2.2
- **Router**: React Router v6
- **HTTP Client**: Axios
- **PDF Viewer**: react-pdf 10.5.0 + pdfjs-dist 5.4.296
- **Styling**: Tailwind CSS / Custom CSS

### Infrastructure
- **Storage**: Supabase (PostgreSQL + Storage)
- **Local Dev**: Docker Compose (PostgreSQL)
- **Environment**: .env configuration

## 📋 Вимоги

- Node.js v20.11.0
- npm v10.8.2
- Docker & Docker Compose (для локального PostgreSQL)
- Supabase account (для Storage)

## 🚀 Встановлення та запуск

### 1. Клонування репозиторія

```bash
git clone <repository-url>
cd data-room
```

### 2. Встановлення залежностей

```bash
# Backend
cd backend
npm install

# Frontend (окремий терміналл)
cd ../frontend
npm install
```

### 3. Налаштування середовища

#### Backend (.env)

```env
# Database (local PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/data_room?schema=public"

# JWT Configuration
JWT_SECRET="your-secret-key-change-this-in-production"
PORT=3001
NODE_ENV="development"

# Supabase Configuration
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Налаштування бази даних

```bash
# Перейти до папки Database
cd Database

# Запустити Docker контейнер PostgreSQL
docker-compose up -d

# Мігрувати схему (з backend папки)
cd ../Backend
npx prisma migrate dev --name init
```

### 5. Запуск розробного сервера

#### Backend
```bash
cd Backend
npm run dev
# Буде доступний на http://localhost:3001
```

#### Frontend
```bash
cd frontend
npm run dev
# Буде доступний на http://localhost:5173
```

## 📁 Структура проекту

```
data-room/
├── Backend/                          # Node.js Express сервер
│   ├── src/
│   │   ├── controllers/              # MVC Controllers (business logic)
│   │   │   ├── authController.js
│   │   │   ├── dataRoomsController.js
│   │   │   ├── foldersController.js
│   │   │   ├── filesController.js
│   │   │   └── sharesController.js
│   │   ├── routes/                   # API endpoints (minimal)
│   │   │   ├── auth.js
│   │   │   ├── dataRooms.js
│   │   │   ├── folders.js
│   │   │   ├── files.js
│   │   │   └── shares.js
│   │   ├── helpers/                  # Utility functions
│   │   │   └── accessControl.js      # Permission validators
│   │   ├── middleware/               # Express middleware
│   │   │   └── authMiddleware.js
│   │   ├── utils/
│   │   │   └── prisma.js             # Prisma client
│   │   └── server.js                 # Entry point
│   ├── .env                          # Environment variables
│   ├── .env.example                  # Example env template
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/                         # React + Vite application
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                    # Page components
│   │   ├── services/                 # API service layer (axios)
│   │   ├── utils/                    # Helper functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
│
├── Database/                         # PostgreSQL Docker setup
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── init-replica.sh
│
└── README.md                         # This file
```
## 🔌 API Документація

### Аутентифікація

#### Реєстрація
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: 201 Created
{
  "id": "user-id",
  "email": "user@example.com",
  "token": "jwt-token",
  "expiresIn": "7d"
}
```

#### Логін
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "id": "user-id",
  "email": "user@example.com",
  "token": "jwt-token",
  "expiresIn": "7d"
}
```

### DataRooms (Кімнати документів)

#### Створити DataRoom
```http
POST /api/data-rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Board Meeting Docs"
}
```

#### Отримати всі DataRooms
```http
GET /api/data-rooms
Authorization: Bearer <token>
```

#### Отримати DataRoom за ID
```http
GET /api/data-rooms/:id
Authorization: Bearer <token>
```

#### Оновити DataRoom
```http
PUT /api/data-rooms/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name"
}
```

#### Видалити DataRoom
```http
DELETE /api/data-rooms/:id
Authorization: Bearer <token>
```

### Файли

#### Загрузити файл
```http
POST /api/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

- file: <binary>
- dataRoomId: "room-id"
- folderId: "folder-id" (optional)
```

#### Отримати файл за ID
```http
GET /api/files/:id
Authorization: Bearer <token>
```

#### Завантажити файл
```http
GET /api/files/:id/download
Authorization: Bearer <token>
```

#### Переніменувати файл
```http
PUT /api/files/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "new-name.pdf"
}
```

#### Переміщити файл
```http
PUT /api/files/:id/move
Authorization: Bearer <token>
Content-Type: application/json

{
  "folderId": "new-folder-id"
}
```

#### Видалити файл
```http
DELETE /api/files/:id
Authorization: Bearer <token>
```

### Папки

#### Створити папку
```http
POST /api/folders
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Subfolder",
  "dataRoomId": "room-id",
  "parentId": "parent-folder-id" (optional)
}
```

#### Отримати папку за ID
```http
GET /api/folders/:id
Authorization: Bearer <token>
```

#### Оновити папку
```http
PUT /api/folders/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Folder Name"
}
```

#### Видалити папку
```http
DELETE /api/folders/:id
Authorization: Bearer <token>
```

### Поділ документів

#### Створити поділ
```http
POST /api/shares
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemId": "file-or-folder-id",
  "itemType": "file|folder",
  "isPublic": true,
  "users": ["user-email@example.com"] (optional)
}
```

#### Отримати публічне посилання
```http
GET /api/shares/public/:token
```

#### Отримати всі поділи користувача
```http
GET /api/shares
Authorization: Bearer <token>
```

#### Отримати поділи, що поділені зі мною
```http
GET /api/shares/shared-with-me
Authorization: Bearer <token>
```

#### Видалити поділ
```http
DELETE /api/shares/:id
Authorization: Bearer <token>
```

## 🔒 Контроль доступу

Система використовує три рівні валідації доступу:

### 1. DataRoom Access
```javascript
hasDataRoomAccess(dataRoomId, userId)
// Перевіряє чи користувач є власником DataRoom
```

### 2. Folder Access
```javascript
hasFolderAccess(folderId, userId)
// Перевіряє чи користувач має доступ до папки
```

### 3. File Access
```javascript
hasFileAccess(fileId, userId)
// Перевіряє чи користувач має доступ до файлу
```

Всі захищені маршрути вимагають валідний JWT токен в заголовку `Authorization: Bearer <token>`.

## 📁 Безпека файлів

### Supabase Storage RLS Policies
- **SELECT**: Public (для генерації публічних URL)
- **INSERT**: Authenticated users only
- **DELETE**: Authenticated users only

### Валідація при переміщенні
При переміщенні файлу система перевіряє:
1. Файл належить поточному користувачу
2. Цільова папка існує
3. Цільова папка належить тій же DataRoom (запобігає cross-DataRoom moves)

## 🐳 Docker Deployment

### Локальний розвиток
```bash
cd Database
docker-compose up -d
```

### Production Deployment

#### Backend Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "src/server.js"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

## 🚀 Production Deployment

### Render.com (Backend)
1. Підключити GitHub репозиторій до Render
2. Налаштувати Build Command: `npm install && npx prisma migrate deploy`
3. Налаштувати Start Command: `node src/server.js`
4. Встановити environment variables з production .env
5. Підключити PostgreSQL базу даних

### Vercel (Frontend)
cd frontend
vercel deploy
```

### Backend (Railway/Render)
- Connect your GitHub repository
- Set environment variables (DATABASE_URL, JWT_SECRET)
- Deploy automatically on push

1. Підключити GitHub репозиторій до Vercel
2. Налаштувати Build Settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Встановити VITE_API_URL на production backend URL
4. Deploy

## 🛠️ Development

### Доступні скрипти (Backend)

```bash
npm run dev      # Запустити розробний сервер з nodemon
npm run build    # Закомпілювати (якщо використовуються TypeScript)
npm test         # Запустити тести (якщо налаштовані)
```

### Доступні скрипти (Frontend)

```bash
npm run dev      # Запустити Vite розробний сервер
npm run build    # Закомпілювати для production
npm run preview  # Попередження production build локально
npm run lint     # Запустити linter (якщо налаштований)
```

## 📝 Git Workflow

### Feature Branch
```bash
git checkout -b feature/feature-name
git commit -m "feat: description"
git push origin feature/feature-name
```

### Pull Request
1. Створити PR на GitHub
2. Code review
3. Merge на main branch
4. Deploy

## 🐛 Debugging

### Backend Logs
```bash
npm run dev
# Logs видимі в терміналі з nodemon
```

### Frontend DevTools
```bash
# React DevTools browser extension
# Vite HMR (Hot Module Replacement)
```

### Database Debugging
```bash
# Prisma Studio (web UI для бази)
npx prisma studio

# Подивитись поточну схему
npx prisma schema view

# Миграція схеми
npx prisma migrate dev --name migration-name
```

## ⚠️ Відомі обмеження

1. **Розмір файлу**: Обмежено 5GB (Supabase free tier - 1GB)
2. **Максимальна кількість користувачів**: Залежить від план Supabase
3. **Версіонування файлів**: Поточна реалізація перезаписує файли з тим же іменем
4. **Офлайн режим**: Потребує інтернет-з'єднання для доступу до файлів

## 🔮 Майбутні розширення

- [ ] Пошук по документах (full-text search)
- [ ] Версіонування файлів з історією змін
- [ ] Коментарі до файлів
- [ ] Активність логи (audit trail)
- [ ] Email notifications
- [ ] Two-factor authentication (2FA)
- [ ] API rate limiting
- [ ] Webhook integration
- [ ] File compression
- [ ] Advanced permission roles (viewer, editor, admin)

## 📄 Ліцензія

MIT License - див. LICENSE файл

## 👨‍💻 Контакт

Для запитань та пропозицій: [your-email@example.com]

---

**Останнє оновлення**: 2024-01-15
