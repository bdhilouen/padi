# Backend Rules - CitizenHub

Technical convention guide for the NestJS + PostgreSQL backend. The AI agent must follow these rules unless there are explicit instructions overriding them in a specific conversation or task.

## 1. Tech Stack

- Framework: NestJS
- Database: PostgreSQL (via TypeORM)
- Cache: Redis (optional for the prototype, see section 9)
- Message queue: **not used** (do not add RabbitMQ or other queue libraries unless explicitly requested again, see section 9)
- Package manager: npm
- Environment: monorepo (`apps/backend`), npm workspaces

## 2. Entity & Database Conventions

- **Primary key is always UUID**, generated via `@PrimaryGeneratedColumn('uuid')` or `default: () => 'gen_random_uuid()'`. Do not use auto-increment integers. Guessable IDs are risky for sensitive data like NIK and identity documents.
- **Soft delete** using TypeORM's `@DeleteDateColumn()` (`deleted_at` column), not a direct hard delete from the repository. Permanent hard deletes may only be executed by scheduled jobs (cron), not from regular endpoints.
- Specifically for `users`: The SRS Disposal policy requires a hard delete a maximum of 24 hours after a soft delete. A cron job must clean up rows where `deleted_at < now() - interval '24 hours'`.


- **All timestamps are timezone-aware**: use the `timestamptz` column type in Postgres (not `timestamp` without a timezone). In TypeORM, use `@CreateDateColumn({ type: 'timestamptz' })` and similar decorators. The backend always operates in UTC; conversion to WIB/WITA/WIT is the frontend's responsibility.
- **Native Postgres Enums** for fields with fixed values (`service_name`, `status`, `role`, etc.), rather than free-text `varchar`, to prevent typos and dirty data.
- **Do not store statuses that can be calculated from other data.** Example: `deadlines.status` is not stored; it is calculated from `due_date` at query time (see the `deadlines_with_status` VIEW). Conversely, `service_status.status` is stored because it originates from external synchronization results that cannot be deterministically recalculated.
- Additional indexes (partial indexes, GIN for JSONB) are already defined in `database/schema.sql`. Do not remove them without a strong reason.

## 3. Data Security

- **NIK is never stored or logged in plain text.** Always use the pair `nik_encrypted` (pgcrypto `pgp_sym_encrypt`, to be displayed back to the respective user) and `nik_hash` (SHA-256, for lookups & uniqueness). The encryption key is **always** from an environment variable and never hardcoded in the code or migration files.
- **Passwords** are hashed with bcrypt (or argon2) and are never stored or returned in any response.
- **Refresh tokens are stateful.** Store their hash (SHA-256) in the `refresh_tokens` table, not the original token. Every refresh validation must check `revoked_at IS NULL AND expires_at > now()`.
- **Sensitive fields never enter the response DTO**, including `nik_encrypted`, `nik_hash`, `password_hash`, `token_hash`, and `encrypted_url` (for documents, only temporary signed URLs are returned).
- Every access to external services (Mock API) **must** first verify the existence of a valid `consent_records` (`status = GRANTED`) for the related `service_name` before the request is forwarded to the Adapter Service.
- All access to sensitive data is logged to `audit_logs`. This table is immutable at the database level (triggers block UPDATE/DELETE). Never attempt to create an endpoint that edits or deletes audit logs, even for administrators.

## 4. Authentication & Authorization (RBAC)

- Roles are limited to two: `USER` (default upon registration) and `ADMINISTRATOR` (created manually, not via public endpoints).
- Use standard NestJS Guard and Decorator patterns: `JwtAuthGuard` to ensure token validity, and `RolesGuard` + `@Roles('ADMINISTRATOR')` to restrict admin endpoints.
- The JWT payload contains at least `{ sub: user_id, email, role }` so `RolesGuard` does not need to requery the database for every request.
- Short-lived access tokens (approx. 15 minutes). Longer-lived refresh tokens (approx. 7 days), stored in `refresh_tokens`, and optionally linked to `user_sessions` via `user_session_id` (nullable).
- When a password is changed (`PATCH /users/me/password`) or an admin suspends an account (`PATCH /admin/users/:id/status`), revoke all `refresh_tokens` belonging to that user so that other devices are automatically logged out.

## 5. Module Structure

One NestJS module per feature domain, following the FR mapping in the SRS: `auth`, `users`, `consent`, `dashboard`, `deadlines`, `notifications`, `life-events`, `documents`, `admin`, and `mock-external`. Each module has its own folder: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, and `entities/`.

Do not place cross-domain logic into one massive service. For example, NIK encryption/hashing logic should be in a separate `CryptoService` injected into whichever module needs it, rather than duplicated across modules.

## 6. Mock API & Adapter Service

- The Mock API is an **internal module** (`mock-external/`), not a separate service. Each agency (Coretax, BPJS, SAMSAT, etc.) has its own controller within this module, for example: `mock-external/coretax.controller.ts`.
- Data returned by the Mock API must be **deterministic** (based on the user's hash/ID), not fully random, to ensure demos are consistent every time they are run.
- The Adapter Service (in the `dashboard` module or a separate `sync` module) is responsible for calling the Mock API via `HttpModule`, normalizing the result into a `Unified JSON` format, and saving it to `service_status`.
- Calls to the Mock API **must be wrapped in try/catch per service**. If one "agency" fails to respond, other services must continue running (NFR-004, graceful degradation); it must not cause the entire dashboard request to fail.
- **Do not implement RabbitMQ or any other message queue** for this synchronization during the prototype phase. Synchronization is simply done synchronously (direct request/response) because the Mock API is internal and responses are instant. This is a deliberate architectural decision (see `prd.md` section 4.2 for the reasoning).

## 7. API Response Convention

- Consistent success responses: data is directly in the body (no `{ success: true, data: ... }` wrapper unless the frontend team explicitly requests it).
- Error responses follow the default NestJS exception filter format: `{ statusCode, message, error }`.
- Fields not used by the UI **do not need** to be sent raw. Prune them at the DTO/serializer level (example: `raw_data` in the dashboard, `encrypted_url` in the document vault).
- Pagination uses `page` and `limit` query parameters, and the response includes metadata `{ total, page, limit }`.

## 8. Input Validation

- All DTOs use `class-validator` + a global `ValidationPipe`.
- File uploads: validate the `mime_type` from the **file content** (not just from the file name/header sent by the client), whitelist allowed types (PDF, JPEG, PNG), and limit `file_size` at the middleware level (`multer` limits) in addition to storing it in the database column to display to the user.

## 9. Redis (optional, can be deferred)

Redis caching for `service_status` can be implemented simply (TTL of 1 day per `user_id` + `service_name`), but this is **not a prerequisite** for other features to run. If time is tight, this can be skipped initially, and the Dashboard can query the `service_status` table directly. Add Redis later as an optimization, not as a blocker for core features.

## 10. Environment Variables

Must be present in `.env` (and registered without values in `.env.example`): `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `REDIS_HOST`, `REDIS_PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NIK_ENCRYPTION_KEY`. No secrets may ever be hardcoded in the codebase or committed to git.

## 11. Deliberately Undecided Matters

Some of the following decisions are deferred pending real needs from the frontend team. Do not make your own assumptions in the code; ask first if the agent needs to make a decision regarding these:

- The final shape of the Dashboard response (summary count, display_name, etc.).
- Notification icons/visual representation (the `type` is sufficient from the backend; mapping to icons is better handled on the frontend).

## Notes on overriding installed skills

- The `api-design` and `backend-patterns` skills suggest a response envelope `{ success, data }` or `{ data, meta }`. This project DOES NOT use that. Follow the flat response convention in section 7 of this document.
- The `backend-patterns` skill demonstrates manual auth (`verifyToken()`, `requireAuth()` as regular functions). This project uses native NestJS `JwtAuthGuard` + `RolesGuard` (see the `nestjs-patterns` skill and section 4 of this document). Do not create manual auth checking in controllers/services.
- The `database-migrations` skill does not have specific TypeORM examples. Use native commands: `typeorm migration:generate`, `migration:run`, `migration:revert`. Zero-downtime principles (CONCURRENTLY index, expand-contract) may be ignored for this prototype unless stated otherwise.