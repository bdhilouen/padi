# PADI (Portal Administrasi Indonesia)

PADI is a national-level unified administration dashboard platform that integrates various Indonesian government public services (Coretax DJP, BPJS Kesehatan, SATUSEHAT, SAMSAT, PLN, PDAM, ETLE, M-Paspor) into a single cohesive interface.

## Tech Stack

- **Backend**: NestJS, TypeORM, PostgreSQL, Redis
- **Monorepo**: npm workspaces

## Infrastructure Setup

Start local PostgreSQL and Redis containers using Docker Compose:

```bash
docker-compose up -d
```

Containers managed by Docker Compose:
- `padi-postgres` (PostgreSQL 16)
- `padi-redis` (Redis 7)

## Environment Configuration

Copy `.env.example` to `.env` and set appropriate local values:

```bash
cp .env.example .env
```

Default configuration values:
- `DB_NAME`: `padi_db`
- `DB_USERNAME`: `padi`

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run backend in development mode:
   ```bash
   npm run start:dev --workspace=apps/backend
   ```