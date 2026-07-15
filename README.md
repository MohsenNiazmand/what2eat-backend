# What2Eat (چی بخورم)

What2Eat is a REST API backend for an AI-powered Persian cooking assistant. Users authenticate with a mobile OTP, manage dietary preferences, generate recipes from available ingredients using an AI provider, browse and search saved recipes, and maintain a favorites list.

The project follows **Clean Architecture** with **TDD** (Test-Driven Development) and is designed for incremental, phase-based development.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [Features](#features)
- [API Reference](#api-reference)
- [Authentication Flow](#authentication-flow)
- [AI Recipe Generation](#ai-recipe-generation)
- [Environment Variables](#environment-variables)
- [Setup](#setup)
- [Testing](#testing)
- [Postman Collection](#postman-collection)
- [Error Handling](#error-handling)
- [Development Conventions](#development-conventions)
- [Development History](#development-history)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (LTS), ES Modules (`"type": "module"`) |
| HTTP Framework | Express 5 |
| Database | PostgreSQL 15 |
| ORM | Prisma 6 |
| Cache / OTP | Redis 7 |
| Authentication | JWT (`jsonwebtoken`) + bcryptjs |
| AI | OpenAI-compatible chat-completions API (default: DeepSeek) |
| HTTP Client | Axios |
| Security | Helmet, CORS, compression |
| Testing | Jest 30 + Supertest |
| Dev Tools | Nodemon, ESLint, Prettier |

Infrastructure is containerized via **Docker Compose** (PostgreSQL + Redis).

---

## Architecture

The codebase is organized into four layers with strict dependency direction: **interfaces → application → domain ← infrastructure**.

```
┌─────────────────────────────────────────────────────────────┐
│  interfaces/http                                            │
│  Routes, Controllers, Middlewares, Express app              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  application                                                │
│  Use Cases, Services, Port interfaces (IRecipeGenerator…)   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  domain                                                     │
│  AppError hierarchy (ValidationError, NotFoundError, …)     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  infrastructure                                             │
│  Prisma repositories, Redis OTP, AI clients, TokenService   │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Path | Responsibility |
|-------|------|----------------|
| **Domain** | `src/domain/` | Shared error types and enterprise rules |
| **Application** | `src/application/` | Business logic: use cases, services, repository/generator ports |
| **Infrastructure** | `src/infrastructure/` | External adapters: Prisma, Redis, JWT, AI HTTP client |
| **Interfaces** | `src/interfaces/http/` | HTTP entry point: routes, controllers, middlewares |

### Key Design Patterns

- **Ports & Adapters**: `IRecipeGenerator`, `IRecipeRepository`, `IPreferenceRepository`, `IFavoriteRepository` define contracts; infrastructure provides implementations.
- **Use Cases**: Single-purpose classes (`GenerateRecipeUseCase`, `ListRecipesUseCase`, etc.) encapsulate one operation each.
- **Factory**: `createRecipeGenerator()` wires the AI client from environment config.
- **Centralized Error Handling**: `errorHandler` middleware maps `AppError` subclasses to HTTP status codes.

---

## Project Structure

```
what2eat-backend/
├── prisma/
│   ├── schema.prisma          # Database schema (User, Session, Preference, Recipe, Favorite)
│   └── migrations/            # Prisma migration history
├── postman/
│   ├── What2Eat-API.postman_collection.json
│   └── What2Eat-Local.postman_environment.json
├── src/
│   ├── domain/
│   │   └── errors/
│   │       └── AppError.js    # ValidationError, UnauthorizedError, NotFoundError, ConflictError, ExternalServiceError
│   ├── application/
│   │   ├── auth/
│   │   │   └── AuthService.js           # OTP request/verify, token refresh, logout
│   │   ├── user/
│   │   │   └── UpdateProfileUseCase.js  # Update user display name
│   │   ├── preference/
│   │   │   ├── IPreferenceRepository.js
│   │   │   └── PreferenceService.js     # CRUD for dietary preferences
│   │   ├── favorite/
│   │   │   ├── IFavoriteRepository.js
│   │   │   └── FavoriteService.js       # Add, remove, list favorites
│   │   └── recipe/
│   │       ├── IRecipeGenerator.js      # AI generation port
│   │       ├── IRecipeRepository.js     # Recipe persistence port
│   │       ├── PromptBuilder.js         # Builds Persian AI prompts
│   │       ├── GenerateRecipeUseCase.js
│   │       ├── ListRecipesUseCase.js
│   │       └── GetRecipeUseCase.js
│   ├── infrastructure/
│   │   ├── ai/
│   │   │   ├── aiConfig.js              # Reads AI_* env vars
│   │   │   ├── OpenAICompatibleClient.js # Chat-completions client + JSON validation
│   │   │   ├── DeepSeekClient.js        # Alias of OpenAICompatibleClient
│   │   │   └── recipeGeneratorFactory.js
│   │   ├── auth/
│   │   │   └── TokenService.js          # JWT access/refresh token lifecycle
│   │   ├── database/
│   │   │   ├── prisma.js
│   │   │   ├── UserRepository.js
│   │   │   ├── SessionRepository.js
│   │   │   ├── PreferenceRepository.js
│   │   │   ├── RecipeRepository.js
│   │   │   └── FavoriteRepository.js
│   │   └── redis/
│   │       ├── client.js
│   │       └── OtpRepository.js         # OTP + deviceId storage
│   └── interfaces/http/
│       ├── app.js             # Express setup (helmet, cors, morgan, routes)
│       ├── server.js          # Entry point, reads PORT from env
│       ├── controllers/       # authController, recipeController, preferenceController, favoriteController
│       ├── middlewares/
│       │   ├── auth.middleware.js
│       │   └── errorHandler.js
│       └── routes/
│           ├── index.js       # Route aggregator
│           ├── health.js
│           ├── auth.js
│           ├── recipes.js
│           ├── preferences.js
│           └── favorites.js
├── tests/
│   ├── setup.js               # Sets JWT_SECRET for test runs
│   ├── health.test.js
│   ├── integration/           # End-to-end API tests (auth, recipes, preferences, favorites, profile)
│   └── unit/                  # Isolated tests (use cases, services, AI config, prompt builder)
├── .env.example
├── docker-compose.yml
├── jest.config.js
├── package.json
└── AGENT_GUIDE.md             # Internal development guide for AI agents
```

---

## Data Models

Defined in `prisma/schema.prisma`:

### User
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `mobile` | String | Unique, Iranian format `09XXXXXXXXX` |
| `name` | String? | Optional display name |
| `createdAt` / `updatedAt` | DateTime | Auto-managed |

Relations: `sessions`, `preferences` (1:1), `favorites` (1:N).

### Session
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `token` | String | Unique refresh token value |
| `deviceId` | String | Tied to client device |
| `userId` | UUID | FK → User (cascade delete) |
| `expiresAt` | DateTime | Refresh token expiry |

**Single-session policy**: On each successful OTP verification, all existing sessions for that user are deleted before creating a new one.

### Preference
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `userId` | UUID | Unique FK → User |
| `dietaryRestrictions` | String[] | e.g. `["Vegan", "Gluten-free"]` |
| `preferredCuisines` | String[] | e.g. `["Persian", "Italian"]` |
| `updatedAt` | DateTime | Auto-managed |

### Recipe
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `title` | String | Persian dish name |
| `description` | String? | Short description |
| `ingredients` | JSON | `[{ "name": "string", "amount": "string" }]` |
| `instructions` | String[] | Ordered cooking steps |
| `category` | String? | e.g. `"پاستا"` |
| `prepTime` / `cookTime` | Int? | Minutes |
| `servings` | Int? | Number of portions |
| `calories` | Int? | Total calories for the whole dish |
| `image` | String? | Reserved for future use |
| `createdAt` / `updatedAt` | DateTime | Auto-managed |

### Favorite
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `userId` | UUID | FK → User |
| `recipeId` | UUID | FK → Recipe |
| `createdAt` | DateTime | Auto-managed |

Unique constraint on `(userId, recipeId)` — a user cannot favorite the same recipe twice.

---

## Features

### 1. Health Check
- `GET /health` — No authentication required.
- Probes PostgreSQL (`SELECT 1`) and Redis (`PING`).
- Returns `status: UP` when both are healthy, `DEGRADED` when one is down.

### 2. Authentication (OTP + JWT)
- **OTP Request**: Validates Iranian mobile number (`^09\d{9}$`), stores OTP and `deviceId` in Redis (TTL: 5 minutes).
- **OTP Verify**: Validates OTP and `deviceId` match, auto-registers new users, issues JWT tokens, creates session.
- **Dev mode**: When `NODE_ENV !== 'production'`, OTP is always `123456` (no SMS gateway).
- **Token Refresh**: Issues a new access token from a valid refresh token + matching `deviceId`.
- **Logout**: Deletes the session for the current user + device.
- **Protected routes**: Require `Authorization: Bearer <accessToken>` header.

### 3. User Profile
- **GET /api/auth/me**: Returns authenticated user's `id`, `mobileNumber`, `name`.
- **PATCH /api/auth/me**: Updates the user's display `name`.

### 4. Preferences
- Per-user dietary restrictions and preferred cuisines.
- **GET**: Returns existing preferences (404 if none set).
- **PUT**: Creates or updates preferences (upsert).
- **DELETE**: Removes preferences record.

### 5. AI Recipe Generation
- **POST /api/recipes/generate**: Accepts available ingredients and optional constraints; calls AI; persists and returns the recipe.
- Input: `ingredients` (required), `tools`, `calorieLimit`, `servings` (all optional).
- Output is always in **Persian** with traditional Iranian dish names when applicable.
- AI response is validated against a strict JSON schema before saving.

### 6. Recipe Listing & Search
- **GET /api/recipes**: Paginated list with optional text search (`q`) and category filter.
- Search matches `title` and `description` (case-insensitive).
- Default pagination: `page=1`, `limit=20` (max 100).
- Results ordered by `createdAt` descending.

### 7. Recipe Detail
- **GET /api/recipes/:id**: Returns full recipe by UUID.

### 8. Favorites
- **GET /api/favorites**: Lists user's favorites with embedded recipe data.
- **POST /api/favorites**: Adds a recipe to favorites (`recipeId` in body). Returns 409 if already favorited.
- **DELETE /api/favorites/:recipeId**: Removes a favorite. Returns 404 if not found.

---

## API Reference

Base URL: `http://localhost:3000` (configurable via `PORT`).

### Response Envelope

Most endpoints return:

```json
{
  "success": true,
  "data": { }
}
```

Auth endpoints (`otp/verify`, `refresh`) return tokens at the top level without the `success` wrapper.

Errors:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

### Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Service health check |
| `POST` | `/api/auth/otp/request` | No | Request OTP |
| `POST` | `/api/auth/otp/verify` | No | Verify OTP, get tokens |
| `POST` | `/api/auth/refresh` | No | Refresh access token |
| `POST` | `/api/auth/logout` | Yes | Invalidate session |
| `GET` | `/api/auth/me` | Yes | Get current user |
| `PATCH` | `/api/auth/me` | Yes | Update user name |
| `GET` | `/api/recipes` | Yes | List/search recipes |
| `GET` | `/api/recipes/:id` | Yes | Get recipe by ID |
| `POST` | `/api/recipes/generate` | Yes | Generate recipe via AI |
| `GET` | `/api/preferences` | Yes | Get user preferences |
| `PUT` | `/api/preferences` | Yes | Create/update preferences |
| `DELETE` | `/api/preferences` | Yes | Delete preferences |
| `GET` | `/api/favorites` | Yes | List favorites |
| `POST` | `/api/favorites` | Yes | Add favorite |
| `DELETE` | `/api/favorites/:recipeId` | Yes | Remove favorite |

---

### `GET /health`

**Response 200:**
```json
{
  "status": "UP",
  "timestamp": "2026-07-15T10:00:00.000Z",
  "database": "UP",
  "redis": "UP"
}
```

---

### `POST /api/auth/otp/request`

**Request:**
```json
{
  "mobileNumber": "09123456789",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Validation:**
- `mobileNumber` must match `^09\d{9}$`
- `deviceId` is required

---

### `POST /api/auth/otp/verify`

**Request:**
```json
{
  "mobileNumber": "09123456789",
  "otpCode": "123456",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "mobileNumber": "09123456789"
  }
}
```

**Token payload** (JWT): `{ userId, deviceId, jti }`  
- Access token TTL: **15 minutes**  
- Refresh token TTL: **7 days**

---

### `POST /api/auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJ...",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJ..."
}
```

---

### `POST /api/auth/logout`

**Headers:** `Authorization: Bearer <accessToken>`

**Response 200:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### `GET /api/auth/me`

**Headers:** `Authorization: Bearer <accessToken>`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "mobileNumber": "09123456789",
    "name": "Ali"
  }
}
```

---

### `PATCH /api/auth/me`

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "name": "Ali"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "mobileNumber": "09123456789",
    "name": "Ali"
  }
}
```

---

### `POST /api/recipes/generate`

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "ingredients": ["گوجه", "پیاز", "تخم‌مرغ"],
  "tools": ["تابه", "قاشق"],
  "calorieLimit": 500,
  "servings": 2
}
```

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `ingredients` | Yes | `string[]` | Non-empty array of ingredient names |
| `tools` | No | `string[]` | Available cooking tools |
| `calorieLimit` | No | `number` | Max total calories for the whole dish |
| `servings` | No | `integer` | Target number of portions |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "کوکو سبزی",
    "description": "توضیح کوتاه",
    "ingredients": [
      { "name": "گوجه", "amount": "۲ عدد" }
    ],
    "instructions": ["مرحله اول...", "مرحله دوم..."],
    "category": "غذای اصلی",
    "prepTime": 15,
    "cookTime": 30,
    "servings": 2,
    "calories": 450,
    "createdAt": "2026-07-15T10:00:00.000Z",
    "updatedAt": "2026-07-15T10:00:00.000Z"
  }
}
```

---

### `GET /api/recipes`

**Headers:** `Authorization: Bearer <accessToken>`

**Query parameters:**

| Param | Default | Notes |
|-------|---------|-------|
| `q` | — | Search in title and description |
| `category` | — | Exact category match (case-insensitive) |
| `page` | `1` | Positive integer |
| `limit` | `20` | 1–100 |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [ { "id": "...", "title": "...", "...": "..." } ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3
    }
  }
}
```

---

### `GET /api/recipes/:id`

**Headers:** `Authorization: Bearer <accessToken>`

**Response 200:** Full recipe object (same shape as generate response).

**Response 404:** `{ "success": false, "message": "Recipe not found" }`

---

### `GET /api/preferences`

**Headers:** `Authorization: Bearer <accessToken>`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "dietaryRestrictions": ["Vegan"],
    "preferredCuisines": ["Persian", "Italian"],
    "updatedAt": "2026-07-15T10:00:00.000Z"
  }
}
```

---

### `PUT /api/preferences`

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "dietaryRestrictions": ["Vegan", "Gluten-free"],
  "preferredCuisines": ["Persian"]
}
```

Both fields are required arrays of strings. Creates or updates the user's preference record.

---

### `DELETE /api/preferences`

**Headers:** `Authorization: Bearer <accessToken>`

**Response 200:**
```json
{
  "success": true,
  "message": "Preferences deleted successfully"
}
```

---

### `GET /api/favorites`

**Headers:** `Authorization: Bearer <accessToken>`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "favorite-uuid",
      "recipeId": "recipe-uuid",
      "createdAt": "2026-07-15T10:00:00.000Z",
      "recipe": {
        "id": "recipe-uuid",
        "title": "...",
        "description": "...",
        "ingredients": [],
        "instructions": [],
        "category": "...",
        "prepTime": 10,
        "cookTime": 20,
        "servings": 2,
        "calories": 300
      }
    }
  ]
}
```

---

### `POST /api/favorites`

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "recipeId": "recipe-uuid"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "favorite-uuid",
    "recipeId": "recipe-uuid",
    "createdAt": "2026-07-15T10:00:00.000Z"
  }
}
```

---

### `DELETE /api/favorites/:recipeId`

**Headers:** `Authorization: Bearer <accessToken>`

**Response 200:**
```json
{
  "success": true,
  "message": "Favorite removed successfully"
}
```

---

## Authentication Flow

```
Client                          Server                         Redis / DB
  │                               │                               │
  │── POST /otp/request ─────────►│                               │
  │   { mobileNumber, deviceId }  │── save OTP + deviceId ───────►│ Redis
  │◄── { success: true } ─────────│                               │
  │                               │                               │
  │── POST /otp/verify ──────────►│                               │
  │   { mobileNumber, otpCode,    │── validate OTP ──────────────►│ Redis
  │     deviceId }                │── find/create user ──────────►│ PostgreSQL
  │                               │── delete old sessions ───────►│ PostgreSQL
  │                               │── create new session ────────►│ PostgreSQL
  │◄── { accessToken,            │                               │
  │      refreshToken, user } ────│                               │
  │                               │                               │
  │── GET /api/recipes ──────────►│                               │
  │   Authorization: Bearer ...   │── verify JWT + session ──────►│ PostgreSQL
  │◄── { success, data } ─────────│                               │
```

**Auth middleware** (`auth.middleware.js`):
1. Extracts Bearer token from `Authorization` header.
2. Verifies JWT signature and expiry.
3. Confirms an active session exists for `userId` + `deviceId`.
4. Loads user and attaches `req.user`.

---

## AI Recipe Generation

### Provider Configuration

The AI layer supports **any OpenAI-compatible** chat-completions endpoint via environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `AI_PROVIDER` | `deepseek` | Provider identifier (informational) |
| `AI_BASE_URL` | `https://api.deepseek.com` | API base URL |
| `AI_API_KEY` | — | API key (falls back to `DEEPSEEK_API_KEY`) |
| `AI_MODEL` | `deepseek-chat` | Model name |
| `AI_TEMPERATURE` | `0.3` | Sampling temperature |

Legacy `DEEPSEEK_API_KEY` and `DEEPSEEK_BASE_URL` are supported as fallbacks.

### Generation Pipeline

```
Request body
    │
    ▼
GenerateRecipeUseCase._validate()
    │
    ▼
PromptBuilder.build()          → { system, user } Persian prompts
    │
    ▼
OpenAICompatibleClient.generate()
    │  POST /chat/completions
    │  response_format: json_object
    │  temperature from AI_TEMPERATURE
    │
    ▼
JSON parse + schema validation + Persian digit normalization
    │
    ▼
RecipeRepository.create()      → persisted in PostgreSQL
    │
    ▼
Response to client
```

### AI Output Schema

The AI must return JSON matching:

```json
{
  "title": "string — Persian dish name",
  "description": "string — short description",
  "ingredients": [{ "name": "string", "amount": "string" }],
  "instructions": ["string — step by step"],
  "calories": 0,
  "prepTime": 0,
  "cookTime": 0,
  "servings": 0,
  "category": "string"
}
```

**Prompt rules** (enforced by `PromptBuilder`):
- Responses must be in Persian.
- Dish names should be traditional Iranian names when applicable.
- Only user-provided ingredients plus basic staples (salt, pepper, oil, water).
- Cooking tools must come from the user's `tools` list (basic utensils like knife/spoon are always allowed).
- Amounts use Persian digits (۰–۹).
- `calories` is total for all servings, not per-portion.

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP port (default: `3000`) |
| `NODE_ENV` | No | `development` enables fixed OTP `123456` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `JWT_ACCESS_EXPIRES_IN` | No | Documented in `.env.example` (code uses `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | No | Documented in `.env.example` (code uses `7d`) |
| `AI_PROVIDER` | No | AI provider name |
| `AI_BASE_URL` | No | OpenAI-compatible API base URL |
| `AI_API_KEY` | Yes* | API key for recipe generation |
| `AI_MODEL` | No | Model identifier |
| `AI_TEMPERATURE` | No | Float, default `0.3` |
| `DEEPSEEK_API_KEY` | Yes* | Fallback for `AI_API_KEY` |
| `DEEPSEEK_BASE_URL` | No | Fallback for `AI_BASE_URL` |
| `OTP_EXPIRY_SECONDS` | No | Documented in `.env.example` (Redis TTL is 300s in code) |

\* At least one of `AI_API_KEY` or `DEEPSEEK_API_KEY` must be set for recipe generation.

---

## Setup

### Prerequisites

- Node.js (LTS)
- Docker & Docker Compose
- npm

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values (especially JWT_SECRET and AI_API_KEY)

# 3. Start PostgreSQL and Redis
docker-compose up -d

# 4. Run database migrations
npx prisma migrate dev

# 5. Start development server (with hot reload)
npm run dev
```

### Production

```bash
npm start
```

Server entry point: `src/interfaces/http/server.js`

### NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `node src/interfaces/http/server.js` | Production server |
| `dev` | `nodemon src/interfaces/http/server.js` | Development with reload |
| `test` | Jest | Run all tests |
| `test:watch` | Jest `--watch` | Watch mode |
| `test:coverage` | Jest `--coverage` | Coverage report |

---

## Testing

The project uses **TDD**: write failing tests first, implement minimal code, refactor.

```bash
npm test
```

### Test Structure

| Directory | Scope |
|-----------|-------|
| `tests/integration/` | Full HTTP request/response cycle via Supertest |
| `tests/unit/` | Isolated use cases, services, AI config, prompt builder |
| `tests/health.test.js` | Health endpoint smoke test |

Integration tests require running PostgreSQL and Redis (same as `docker-compose up -d`).

Tests run sequentially (`maxWorkers: 1`) to avoid database conflicts.

Coverage output is written to `coverage/`.

---

## Postman Collection

A complete Postman collection is provided in `postman/`:

- **`What2Eat-API.postman_collection.json`** — All 17 endpoints with test scripts and auto-token saving.
- **`What2Eat-Local.postman_environment.json`** — Local environment variables (`baseUrl`, `mobileNumber`, `deviceId`, etc.).

**Quick start:**
1. Import both files into Postman.
2. Set `deepseekApiKey` in the environment from your `.env`.
3. Run **Health → GET /health**.
4. Run **Auth → Request OTP** then **Verify OTP** (tokens are saved automatically).
5. Use protected routes with the saved `accessToken`.

In development, OTP is always `123456`.

---

## Error Handling

All application errors extend `AppError`:

| Error Class | HTTP Status | When |
|-------------|-------------|------|
| `ValidationError` | 400 | Invalid input (missing fields, wrong types) |
| `UnauthorizedError` | 401 | Invalid/expired OTP, token, or session |
| `NotFoundError` | 404 | Resource not found (recipe, preference, favorite) |
| `ConflictError` | 409 | Duplicate favorite |
| `ExternalServiceError` | 502 | AI provider failure or invalid response |
| Unhandled | 500 | Unexpected server error |

---

## Development Conventions

1. **Clean Architecture**: New features add a use case in `application/`, a repository in `infrastructure/`, and a route + controller in `interfaces/`.
2. **TDD**: Write tests in `tests/` before implementing logic.
3. **ES Modules**: All source files use `import`/`export` (`.js` extension required).
4. **Persian content**: AI-generated recipes and prompts are in Persian; API field names and error messages are in English.
5. **Single session**: Only one active session per user; new login invalidates previous tokens.
6. **No Persian comments in code**: Comments and identifiers are in English.
7. **Dependency injection**: Controllers instantiate repositories and wire use cases at module level.

For agent-specific development guidelines, see [`AGENT_GUIDE.md`](./AGENT_GUIDE.md).

---

## Development History

The project was built in phases:

| Phase | Scope | Key Commits |
|-------|-------|-------------|
| **Phase 0** | Project infrastructure, Docker, Prisma, health check, base Express setup | `feat(setup): complete Phase 0` |
| **Phase 1** | OTP authentication (Redis), JWT tokens, refresh, logout, auth middleware | `feat(auth): implement OTP request logic`, `feat(auth): implement OTP verification`, `feat(auth): finalise Phase 1` |
| **Phase 2** | User profile update, preferences CRUD | `feat(preferences): add preferences CRUD and user profile update` |
| **Phase 3** | AI recipe generation, PromptBuilder, DeepSeek/OpenAI-compatible client | `feat(recipe): add PromptBuilder service`, `feat(recipes): add POST /api/recipes/generate` |
| **Phase 4** | Recipe listing, search, get-by-id, favorites | `feat(recipes): add recipe listing, search, and get-by-id`, `feat(favorites): add favorites add/remove/list API` |
| **Refactor** | Provider-agnostic AI layer, improved prompts, Postman collection | `Refactor AI layer to support any OpenAI-compatible provider`, `feat: Improve PromptBuilder and AI client` |
