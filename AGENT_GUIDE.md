# Agent Guide: What2Eat Backend Development

This document serves as a guide for AI agents and developers working on the What2Eat API.

## 🛠 Tech Stack & Standards
- **Node.js**: LTS version.
- **Express.js**: Framework for API.
- **Prisma**: ORM for PostgreSQL.
- **Redis**: For OTP and Session Management.
- **Jest/Supertest**: For TDD.
- **Persian Support**: All strings and responses must handle Farsi correctly.

## 🔑 Core Principles
1. **TDD Flow**: 
   - Write a failing test first.
   - Write the minimal code to make it pass.
   - Refactor.
2. **Modular Clean Architecture**:
   - Maintain strict separation between `domain`, `application`, `infrastructure`, and `interfaces`.
3. **Single Session Policy**:
   - Only one active session per mobile number. Invalidate previous tokens upon new login.
4. **Phased Development**:
   - Complete phases one by one as instructed.

## 📂 Folder Structure
- `src/domain`: Entities and Repository Interfaces.
- `src/application`: Use Cases and Service Interfaces.
- `src/infrastructure`: Database implementations (Prisma), Redis, AI Clients.
- `src/interfaces`: HTTP Controllers, Routes, and Express setup.

## 🚀 Development Roadmap
- **Phase 0**: Project Setup & Health Check (Current).
- **Phase 1**: Authentication (OTP & JWT).
- **Phase 2**: User Profiles & Preferences.
- **Phase 3**: Recipe Management & AI Integration.
- **Phase 4**: Favorites & Search.
