# What2Eat (چی بخورم) - AI Cooking Assistant

What2Eat is an AI-powered cooking assistant built with Node.js, Express, and PostgreSQL. It helps users find recipes and manage their cooking preferences using AI integration.

## 🚀 Tech Stack
- **Backend:** Node.js (LTS), Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Cache & Session:** Redis
- **Testing:** Jest & Supertest
- **AI:** DeepSeek API

## 🏛 Architecture
The project follows **Clean Architecture** principles:
- `src/domain`: Enterprise business rules (Entities, Interface definitions).
- `src/application`: Application business rules (Use cases).
- `src/infrastructure`: Frameworks and drivers (DB, External APIs, Redis).
- `src/interfaces`: Interface adapters (Controllers, Routes, Middlewares).

## 🛠 Setup

### Prerequisites
- Node.js (LTS)
- Docker & Docker Compose
- PostgreSQL & Redis

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start infrastructure with Docker:
   ```bash
   docker-compose up -d
   ```
5. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

## 🧪 Testing
Run tests using:
```bash
npm test
```
