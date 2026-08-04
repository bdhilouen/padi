# PADI Backend Service

Backend service for **PADI (Portal Administrasi Indonesia)** built with NestJS, TypeORM, and PostgreSQL.

## Prerequisites

- Node.js (v20+)
- Running PostgreSQL & Redis containers (`padi-postgres`, `padi-redis`)

## Setup & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Migrations
```bash
npm run migration:run
```

### 3. Start Application
```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### 4. Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```
