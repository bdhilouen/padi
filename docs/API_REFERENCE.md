# PADI (Portal Administrasi Indonesia) — API Reference

Comprehensive, code-authoritative API documentation for frontend integration. Generated directly from the NestJS source code under `apps/backend/src/modules/`.

---

## 1. Overview & Setup

### Base URLs
- **Production**: `https://padi-api-cihuy.up.railway.app/api/v1`
- **Local Development**: `http://localhost:3001/api/v1`

---

### Authentication Architecture

All protected endpoints require an HTTP `Authorization` header containing a standard JWT Bearer Token:

```http
Authorization: Bearer <access_token>
```

#### How Authentication Works
1. **Registration & Login**:
   - Register via `POST /api/v1/auth/register` (using NIK, email, password, full name).
   - Log in via `POST /api/v1/auth/login` (using NIK and password).
2. **Token Lifetimes**:
   - **Access Token**: Short-lived (~15 minutes). Sent in the `Authorization: Bearer` header.
   - **Refresh Token**: Long-lived (~7 days). Returned during login and used via `POST /api/v1/auth/refresh` to obtain a fresh access/refresh token pair.
3. **Session ID (`sessionId`)**:
   - Embedded internally within the JWT payload (`req.user.sessionId`) when logging in.
   - **The client does NOT need to manually store or send `sessionId`** in request headers, query params, or body payloads.

---

### Response Conventions

Per `backend-rules.md` §7:

1. **Standard Endpoints (Flat Data)**:
   - Success responses directly return the data object or array without a `{ success: true, data: ... }` wrapper.
   - Example (single resource): `{ "id": "...", "full_name": "Jane Doe" }`
   - Example (flat array): `[ { "id": "...", "service_name": "CORETAX" } ]`

2. **Paginated List Endpoints (`{ data, meta }`)**:
   - List endpoints supporting `page` and `limit` parameters return a structured pagination wrapper.
   - Applicable endpoints:
     - `GET /api/v1/deadlines`
     - `GET /api/v1/admin/users`
     - `GET /api/v1/admin/audit-logs`
   - Response structure:
     ```json
     {
       "data": [ ... ],
       "meta": {
         "total": 42,
         "page": 1,
         "limit": 10
       }
     }
     ```

---

### Error Response Format

All error responses strictly follow the default NestJS Exception Filter format:

```json
{
  "statusCode": number,
  "message": string | string[],
  "error": string
}
```

#### Real Error Examples

##### 400 Bad Request (Validation Error)
Triggered when input validation fails in class-validator DTOs:
```json
{
  "statusCode": 400,
  "message": [
    "NIK must be exactly 16 digits",
    "password must contain at least one uppercase, one lowercase, one digit, and one special character"
  ],
  "error": "Bad Request"
}
```

##### 401 Unauthorized
Triggered when an access token is missing, expired, or credentials are invalid:
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

##### 403 Forbidden
Triggered when accessing a resource belonging to another user or lacking required RBAC roles:
```json
{
  "statusCode": 403,
  "message": "You do not have permission to access this document",
  "error": "Forbidden"
}
```

##### 404 Not Found
Triggered when the requested entity UUID does not exist or is soft-deleted:
```json
{
  "statusCode": 404,
  "message": "Document not found",
  "error": "Not Found"
}
```

##### 409 Conflict
Triggered when registering with an NIK or email that already exists:
```json
{
  "statusCode": 409,
  "message": "A user with this NIK or email already exists",
  "error": "Conflict"
}
```

---

## 2. API Endpoints by Module

---

### Module 1: Auth (`/api/v1/auth`)

#### 1. Register User
- **HTTP Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Auth**: Public (None)
- **Request Body** (`RegisterDto`):
  - `nik` (string, required): Exactly 16 digits (`/^\d{16}$/`).
  - `email` (string, required): Valid email format.
  - `password` (string, required): 8–100 characters. Must contain at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character (`/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/`).
  - `full_name` (string, required): 1–150 characters.
  - `phone_number` (string, optional): 1–20 characters.

**Example Request**:
```json
{
  "nik": "3171012345670001",
  "email": "user@padi.go.id",
  "password": "Password123!",
  "full_name": "Budi Santoso",
  "phone_number": "081234567890"
}
```

**Example Success Response (201 Created)**:
```json
{
  "id": "e4a2d810-777b-4d2c-88bf-91923456789a",
  "email": "user@padi.go.id",
  "full_name": "Budi Santoso",
  "phone_number": "081234567890",
  "role": "USER",
  "created_at": "2026-08-08T10:00:00.000Z"
}
```

**Error Cases**:
- `400 Bad Request`: NIK not 16 digits or password strength check failed.
- `409 Conflict`: NIK or email is already registered.

---

#### 2. User Login
- **HTTP Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Auth**: Public (None)
- **Request Body** (`LoginDto`):
  - `nik` (string, required): Exactly 16 digits.
  - `password` (string, required): Plaintext password.

**Example Request**:
```json
{
  "nik": "3171012345670001",
  "password": "Password123!"
}
```

**Example Success Response (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "7d9e2a1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f"
}
```

**Error Cases**:
- `401 Unauthorized`: Invalid credentials (NIK not found, wrong password, or user suspended).

---

#### 3. Refresh Access Token
- **HTTP Method**: `POST`
- **Path**: `/api/v1/auth/refresh`
- **Auth**: Public (None)
- **Request Body** (`RefreshTokenDto`):
  - `refreshToken` (string, required): Raw refresh token string.

**Example Request**:
```json
{
  "refreshToken": "7d9e2a1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f"
}
```

**Example Success Response (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b"
}
```

**Error Cases**:
- `401 Unauthorized`: Refresh token revoked, expired, or invalid.

---

#### 4. User Logout
- **HTTP Method**: `POST`
- **Path**: `/api/v1/auth/logout`
- **Auth**: Public (None)
- **Request Body** (`RefreshTokenDto`):
  - `refreshToken` (string, required): Raw refresh token string.

**Example Request**:
```json
{
  "refreshToken": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b"
}
```

**Example Success Response (200 OK)**:
```json
{
  "message": "Logged out successfully"
}
```

---

### Module 2: User Profile (`/api/v1/users`)

#### 1. Get My Profile
- **HTTP Method**: `GET`
- **Path**: `/api/v1/users/me`
- **Auth**: Bearer Token (`JwtAuthGuard`)

**Example Success Response (200 OK)**:
```json
{
  "id": "e4a2d810-777b-4d2c-88bf-91923456789a",
  "email": "user@padi.go.id",
  "full_name": "Budi Santoso",
  "phone_number": "081234567890",
  "role": "USER",
  "is_active": true,
  "created_at": "2026-08-08T10:00:00.000Z",
  "updated_at": "2026-08-08T10:00:00.000Z"
}
```

---

#### 2. Update Profile
- **HTTP Method**: `PATCH`
- **Path**: `/api/v1/users/me`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Request Body** (`UpdateProfileDto`):
  - `full_name` (string, optional): 1–150 characters.
  - `phone_number` (string, optional): 1–20 characters.

**Example Request**:
```json
{
  "full_name": "Budi Santoso, S.Kom",
  "phone_number": "081999888777"
}
```

**Example Success Response (200 OK)**:
```json
{
  "id": "e4a2d810-777b-4d2c-88bf-91923456789a",
  "email": "user@padi.go.id",
  "full_name": "Budi Santoso, S.Kom",
  "phone_number": "081999888777",
  "role": "USER",
  "is_active": true,
  "created_at": "2026-08-08T10:00:00.000Z",
  "updated_at": "2026-08-08T10:15:00.000Z"
}
```

---

#### 3. Change Password
- **HTTP Method**: `PATCH`
- **Path**: `/api/v1/users/me/password`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Request Body** (`ChangePasswordDto`):
  - `old_password` (string, required): Current plaintext password.
  - `new_password` (string, required): 8–100 characters with complexity rules.
  - `confirm_password` (string, required): Must match `new_password`.

**Example Request**:
```json
{
  "old_password": "Password123!",
  "new_password": "NewSecurePassword456!",
  "confirm_password": "NewSecurePassword456!"
}
```

**Example Success Response (200 OK)**:
```json
{
  "message": "Password updated successfully"
}
```

**Error Cases**:
- `400 Bad Request`: `confirm_password` does not match `new_password`.
- `401 Unauthorized`: `old_password` is incorrect.

---

#### 4. List Active Sessions
- **HTTP Method**: `GET`
- **Path**: `/api/v1/users/me/sessions`
- **Auth**: Bearer Token (`JwtAuthGuard`)

**Example Success Response (200 OK)**:
```json
[
  {
    "id": "c1f2e3d4-5678-90ab-cdef-1234567890ab",
    "device_name": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    "ip_address": "127.0.0.1",
    "is_active": true,
    "login_at": "2026-08-08T10:00:00.000Z",
    "last_activity_at": "2026-08-08T10:30:00.000Z",
    "logout_at": null
  }
]
```

---

#### 5. Revoke Specific Session
- **HTTP Method**: `DELETE`
- **Path**: `/api/v1/users/me/sessions/:sessionId`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Path Params**:
  - `sessionId` (UUID, required): The target session ID.

**Example Success Response (200 OK)**:
```json
{
  "message": "Session revoked successfully"
}
```

---

#### 6. Soft Delete Account
- **HTTP Method**: `DELETE`
- **Path**: `/api/v1/users/me`
- **Auth**: Bearer Token (`JwtAuthGuard`)

**Example Success Response (200 OK)**:
```json
{
  "message": "Account successfully deactivated. Your data will be permanently deleted according to the retention policy."
}
```

---

### Module 3: Consent Management (`/api/v1/consent`)

#### Supported Service Enums (`ServiceNameEnum`)
`CORETAX`, `BPJS_KESEHATAN`, `SATUSEHAT`, `OSS`, `SAMSAT`, `PLN`, `PDAM`, `ETLE`, `MPASPOR`

#### 1. List Consents
- **HTTP Method**: `GET`
- **Path**: `/api/v1/consent`
- **Auth**: Bearer Token (`JwtAuthGuard`)

**Example Success Response (200 OK)**:
```json
[
  {
    "id": "a1b2c3d4-5678-90ab-cdef-111111111111",
    "service_name": "CORETAX",
    "status": "GRANTED",
    "granted_at": "2026-08-08T10:00:00.000Z",
    "revoked_at": null
  },
  {
    "id": "a2b3c4d5-6789-0abc-def1-222222222222",
    "service_name": "BPJS_KESEHATAN",
    "status": "REVOKED",
    "granted_at": "2026-08-07T10:00:00.000Z",
    "revoked_at": "2026-08-08T09:00:00.000Z"
  }
]
```

---

#### 2. Grant Consent
- **HTTP Method**: `POST`
- **Path**: `/api/v1/consent`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Request Body** (`GrantConsentDto`):
  - `service_name` (string, required): Must be a valid `ServiceNameEnum`.

**Example Request**:
```json
{
  "service_name": "CORETAX"
}
```

**Example Success Response (201 Created)**:
```json
{
  "id": "a1b2c3d4-5678-90ab-cdef-111111111111",
  "service_name": "CORETAX",
  "status": "GRANTED",
  "granted_at": "2026-08-08T10:00:00.000Z",
  "revoked_at": null
}
```

**Error Cases**:
- `400 Bad Request`: `service_name` is not a valid enum value.

---

#### 3. Revoke Consent
- **HTTP Method**: `PATCH`
- **Path**: `/api/v1/consent/:consentId/revoke`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Path Params**:
  - `consentId` (UUID, required): The target consent record ID.

**Example Success Response (200 OK)**:
```json
{
  "id": "a1b2c3d4-5678-90ab-cdef-111111111111",
  "service_name": "CORETAX",
  "status": "REVOKED",
  "granted_at": "2026-08-08T10:00:00.000Z",
  "revoked_at": "2026-08-08T11:00:00.000Z"
}
```

**Error Cases**:
- `404 Not Found`: Consent record does not exist.
- `403 Forbidden`: Consent record belongs to another user.

---

### Module 4: Dashboard (`/api/v1/dashboard`)

#### 1. Get Dashboard Summary
- **HTTP Method**: `GET`
- **Path**: `/api/v1/dashboard`
- **Auth**: Bearer Token (`JwtAuthGuard`)

**Example Success Response (200 OK)**:
```json
[
  {
    "service_name": "CORETAX",
    "status": "ACTIVE",
    "last_synced_at": "2026-08-08T10:00:00.000Z"
  },
  {
    "service_name": "BPJS_KESEHATAN",
    "status": "WARNING",
    "last_synced_at": "2026-08-08T10:00:00.000Z"
  },
  {
    "service_name": "SATUSEHAT",
    "status": null,
    "last_synced_at": null,
    "consent_required": true
  }
]
```

---

#### 2. Manual Refresh / Synchronize All Services
- **HTTP Method**: `POST`
- **Path**: `/api/v1/dashboard/refresh`
- **Auth**: Bearer Token (`JwtAuthGuard`)

**Behavior**: Triggers fresh sync calls across all 9 mock services. Services lacking `GRANTED` consent are skipped with `consent_required: true`. If a service fails, it is skipped with `sync_error: true` (graceful degradation).

**Example Success Response (200 OK)**:
```json
[
  {
    "service_name": "CORETAX",
    "status": "ACTIVE",
    "last_synced_at": "2026-08-08T11:00:00.000Z"
  },
  {
    "service_name": "BPJS_KESEHATAN",
    "status": "EXPIRED",
    "last_synced_at": "2026-08-08T11:00:00.000Z"
  },
  {
    "service_name": "PLN",
    "status": null,
    "last_synced_at": null,
    "consent_required": true
  }
]
```

---

### Module 5: Deadlines & Timeline (`/api/v1/deadlines`)

#### 1. List Deadlines (Paginated)
- **HTTP Method**: `GET`
- **Path**: `/api/v1/deadlines`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Query Params**:
  - `status` (string, optional): `ACTIVE`, `WARNING`, `EXPIRED`.
  - `service_name` (string, optional): Filter by `ServiceNameEnum`.
  - `due_date_from` (ISO string, optional): e.g. `2026-08-01T00:00:00Z`.
  - `due_date_to` (ISO string, optional): e.g. `2026-08-31T23:59:59Z`.
  - `sort` (string, optional): `due_date`, `-due_date`, `created_at`, `-created_at`, `service_name`, `-service_name`, `status`, `-status`, `title`, `-title`.
  - `page` (integer, optional, default: 1): Page number.
  - `limit` (integer, optional, default: 10, max: 100): Items per page.

**Example Request**:
`GET /api/v1/deadlines?status=ACTIVE&sort=due_date&page=1&limit=2`

**Example Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "d1e2f3a4-5678-90ab-cdef-111111111111",
      "service_name": "CORETAX",
      "title": "SPT Tahunan PPh Orang Pribadi 2025",
      "description": "Batas akhir pelaporan SPT Tahunan",
      "due_date": "2026-08-20T23:59:59.000Z",
      "status": "ACTIVE",
      "created_at": "2026-08-01T00:00:00.000Z",
      "updated_at": "2026-08-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 2
  }
}
```

---

#### 2. Get Deadline Detail
- **HTTP Method**: `GET`
- **Path**: `/api/v1/deadlines/:deadlineId`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Path Params**:
  - `deadlineId` (UUID, required): Target deadline ID.

**Example Success Response (200 OK)**:
```json
{
  "id": "d1e2f3a4-5678-90ab-cdef-111111111111",
  "service_name": "CORETAX",
  "title": "SPT Tahunan PPh Orang Pribadi 2025",
  "description": "Batas akhir pelaporan SPT Tahunan",
  "due_date": "2026-08-20T23:59:59.000Z",
  "status": "ACTIVE",
  "created_at": "2026-08-01T00:00:00.000Z",
  "updated_at": "2026-08-01T00:00:00.000Z"
}
```

---

### Module 6: Notifications (`/api/v1/notifications`)

#### 1. List Notifications
- **HTTP Method**: `GET`
- **Path**: `/api/v1/notifications`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Query Params**:
  - `unread` (boolean, optional): Set `true` to return only unread notifications.

**Example Request**:
`GET /api/v1/notifications?unread=true`

**Example Success Response (200 OK)** (Flat Array):
```json
[
  {
    "id": "n1o2p3q4-5678-90ab-cdef-111111111111",
    "title": "Peringatan Jatuh Tempo Tax",
    "type": "DEADLINE_WARNING",
    "message": "Pembayaran PPh jatuh tempo dalam 3 hari.",
    "sent_at": "2026-08-08T08:00:00.000Z",
    "read_at": null
  }
]
```

---

#### 2. Mark Notification as Read
- **HTTP Method**: `PATCH`
- **Path**: `/api/v1/notifications/:notificationId/read`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Path Params**:
  - `notificationId` (UUID, required): Target notification ID.

**Example Success Response (200 OK)**:
```json
{
  "id": "n1o2p3q4-5678-90ab-cdef-111111111111",
  "title": "Peringatan Jatuh Tempo Tax",
  "type": "DEADLINE_WARNING",
  "message": "Pembayaran PPh jatuh tempo dalam 3 hari.",
  "sent_at": "2026-08-08T08:00:00.000Z",
  "read_at": "2026-08-08T11:00:00.000Z"
}
```

---

### Module 7: Life Event Assistant (`/api/v1/life-events`)

#### 1. List Master Life Events
- **HTTP Method**: `GET`
- **Path**: `/api/v1/life-events`
- **Auth**: Bearer Token (`JwtAuthGuard`)

**Example Success Response (200 OK)**:
```json
[
  {
    "id": "l1i2f3e4-5678-90ab-cdef-111111111111",
    "code": "PERNIKAHAN",
    "name": "Pernikahan / Perkawinan",
    "description": "Panduan administrasi pengurusan dokumen pernikahan"
  }
]
```

---

#### 2. Select Life Event
- **HTTP Method**: `POST`
- **Path**: `/api/v1/life-events/select`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Request Body** (`SelectLifeEventDto`):
  - `life_event_id` (UUID, required): Master life event ID.

**Example Request**:
```json
{
  "life_event_id": "l1i2f3e4-5678-90ab-cdef-111111111111"
}
```

**Example Success Response (201 Created)**:
```json
{
  "id": "s1e2l3e4-5678-90ab-cdef-222222222222",
  "life_event": {
    "id": "l1i2f3e4-5678-90ab-cdef-111111111111",
    "code": "PERNIKAHAN",
    "name": "Pernikahan / Perkawinan",
    "description": "Panduan administrasi pengurusan dokumen pernikahan"
  },
  "selected_at": "2026-08-08T12:00:00.000Z",
  "total_items": 5,
  "completed_items": 0
}
```

---

#### 3. List My Active Selections
- **HTTP Method**: `GET`
- **Path**: `/api/v1/life-events/selections`
- **Auth**: Bearer Token (`JwtAuthGuard`)

**Example Success Response (200 OK)**:
```json
[
  {
    "id": "s1e2l3e4-5678-90ab-cdef-222222222222",
    "life_event": {
      "id": "l1i2f3e4-5678-90ab-cdef-111111111111",
      "code": "PERNIKAHAN",
      "name": "Pernikahan / Perkawinan",
      "description": "Panduan administrasi pengurusan dokumen pernikahan"
    },
    "selected_at": "2026-08-08T12:00:00.000Z",
    "total_items": 5,
    "completed_items": 2
  }
]
```

---

#### 4. Get Checklist by Selection ID
- **HTTP Method**: `GET`
- **Path**: `/api/v1/life-events/selections/:selectionId/checklist`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Path Params**:
  - `selectionId` (UUID, required): Selection ID.

**Example Success Response (200 OK)**:
```json
{
  "id": "s1e2l3e4-5678-90ab-cdef-222222222222",
  "life_event": {
    "id": "l1i2f3e4-5678-90ab-cdef-111111111111",
    "code": "PERNIKAHAN",
    "name": "Pernikahan / Perkawinan",
    "description": "Panduan..."
  },
  "selected_at": "2026-08-08T12:00:00.000Z",
  "total_items": 2,
  "completed_items": 1,
  "checklist": [
    {
      "id": "c1h2e3c4-5678-90ab-cdef-333333333333",
      "document_name": "Surat Pengantar RT/RW",
      "display_order": 1,
      "is_required": true,
      "is_completed": true,
      "completed_at": "2026-08-08T12:30:00.000Z",
      "created_at": "2026-08-08T12:00:00.000Z"
    },
    {
      "id": "c2h3e4c5-6789-0abc-def1-444444444444",
      "document_name": "Fotokopi KTP & KK Calon Pengantin",
      "display_order": 2,
      "is_required": true,
      "is_completed": false,
      "completed_at": null,
      "created_at": "2026-08-08T12:00:00.000Z"
    }
  ]
}
```

---

#### 5. Toggle Checklist Item Completion
- **HTTP Method**: `PATCH`
- **Path**: `/api/v1/checklist-items/:itemId`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Path Params**:
  - `itemId` (UUID, required): Target checklist item ID.
- **Request Body** (`UpdateChecklistItemDto`):
  - `is_completed` (boolean, required).

**Example Request**:
```json
{
  "is_completed": true
}
```

**Example Success Response (200 OK)**:
```json
{
  "id": "c2h3e4c5-6789-0abc-def1-444444444444",
  "document_name": "Fotokopi KTP & KK Calon Pengantin",
  "display_order": 2,
  "is_required": true,
  "is_completed": true,
  "completed_at": "2026-08-08T13:00:00.000Z",
  "created_at": "2026-08-08T12:00:00.000Z"
}
```

---

### Module 8: Document Vault (`/api/v1/documents`)

#### 1. Upload Document
- **HTTP Method**: `POST`
- **Path**: `/api/v1/documents`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file` (binary, required): Max 10MB (`10485760` bytes). Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`.
  - `document_type` (string, required): e.g. `"KTP"`, `"PASPOR"`, `"STNK"`.
  - `expiry_date` (ISO date string, optional): e.g. `"2030-12-31"`.

**Example Success Response (201 Created)**:
```json
{
  "id": "doc12345-6789-90ab-cdef-1234567890ab",
  "document_type": "KTP",
  "original_filename": "ktp_budi.pdf",
  "mime_type": "application/pdf",
  "file_size": 245800,
  "expiry_date": "2030-12-31T00:00:00.000Z",
  "uploaded_at": "2026-08-08T14:00:00.000Z",
  "last_verified_at": null
}
```

---

#### 2. List My Documents
- **HTTP Method**: `GET`
- **Path**: `/api/v1/documents`
- **Auth**: Bearer Token (`JwtAuthGuard`)

**Example Success Response (200 OK)**:
```json
[
  {
    "id": "doc12345-6789-90ab-cdef-1234567890ab",
    "document_type": "KTP",
    "original_filename": "ktp_budi.pdf",
    "mime_type": "application/pdf",
    "file_size": 245800,
    "expiry_date": "2030-12-31T00:00:00.000Z",
    "uploaded_at": "2026-08-08T14:00:00.000Z",
    "last_verified_at": null
  }
]
```

---

#### 3. Verify Identity & Generate Preview URL
- **HTTP Method**: `POST`
- **Path**: `/api/v1/documents/:documentId/verify`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Path Params**:
  - `documentId` (UUID, required).
- **Request Body** (`VerifyDocumentDto`):
  - `password` (string, required): User's current account password to authorize preview.

**Example Request**:
```json
{
  "password": "Password123!"
}
```

**Example Success Response (200 OK)**:
```json
{
  "preview_url": "/api/v1/documents/preview/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 300
}
```

**Error Cases**:
- `401 Unauthorized`: Invalid password.
- `403 Forbidden`: Document belongs to another user.
- `404 Not Found`: Document not found.

---

#### 4. Preview / Stream Document (Signed Token)
- **HTTP Method**: `GET`
- **Path**: `/api/v1/documents/preview/:token`
- **Auth**: Public (No Bearer header required — authenticated via path `token`)
- **Path Params**:
  - `token` (string, required): The signed 5-minute preview JWT token obtained from `/verify`.

**Behavior**: Streams the decrypted file buffer directly with `Content-Disposition: inline` headers for previewing inside browser viewports.

---

#### 5. Delete Document
- **HTTP Method**: `DELETE`
- **Path**: `/api/v1/documents/:documentId`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Path Params**:
  - `documentId` (UUID, required).

**Example Success Response (200 OK)**:
```json
{
  "message": "Document deleted successfully"
}
```

---

### Module 9: Admin (`/api/v1/admin`)

Requires `JwtAuthGuard` + `RolesGuard` (`ADMINISTRATOR` role).

#### 1. List Users (Paginated)
- **HTTP Method**: `GET`
- **Path**: `/api/v1/admin/users`
- **Auth**: Bearer Token (`ADMINISTRATOR`)
- **Query Params**:
  - `search` (string, optional): Case-insensitive search on email or full name.
  - `page` (integer, optional, default: 1).
  - `limit` (integer, optional, default: 10).

**Example Request**:
`GET /api/v1/admin/users?search=budi&page=1&limit=10`

**Example Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "e4a2d810-777b-4d2c-88bf-91923456789a",
      "email": "user@padi.go.id",
      "full_name": "Budi Santoso",
      "phone_number": "081234567890",
      "role": "USER",
      "is_active": true,
      "created_at": "2026-08-08T10:00:00.000Z",
      "updated_at": "2026-08-08T10:00:00.000Z",
      "deleted_at": null
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

#### 2. Get User Detail
- **HTTP Method**: `GET`
- **Path**: `/api/v1/admin/users/:id`
- **Auth**: Bearer Token (`ADMINISTRATOR`)
- **Path Params**:
  - `id` (UUID, required): Target user ID.

**Example Success Response (200 OK)**:
```json
{
  "id": "e4a2d810-777b-4d2c-88bf-91923456789a",
  "email": "user@padi.go.id",
  "full_name": "Budi Santoso",
  "phone_number": "081234567890",
  "role": "USER",
  "is_active": true,
  "created_at": "2026-08-08T10:00:00.000Z",
  "updated_at": "2026-08-08T10:00:00.000Z",
  "deleted_at": null
}
```

---

#### 3. Update User Status (Suspend / Activate)
- **HTTP Method**: `PATCH`
- **Path**: `/api/v1/admin/users/:id/status`
- **Auth**: Bearer Token (`ADMINISTRATOR`)
- **Path Params**:
  - `id` (UUID, required): Target user ID.
- **Request Body** (`UpdateUserStatusDto`):
  - `is_active` (boolean, required): Set `false` to suspend or `true` to reactivate.

**Behavior**: Setting `is_active: false` revokes all active sessions and refresh tokens belonging to the user.

**Example Request**:
```json
{
  "is_active": false
}
```

**Example Success Response (200 OK)**:
```json
{
  "id": "e4a2d810-777b-4d2c-88bf-91923456789a",
  "email": "user@padi.go.id",
  "full_name": "Budi Santoso",
  "phone_number": "081234567890",
  "role": "USER",
  "is_active": false,
  "created_at": "2026-08-08T10:00:00.000Z",
  "updated_at": "2026-08-08T15:00:00.000Z",
  "deleted_at": null
}
```

---

#### 4. List Audit Logs (Paginated)
- **HTTP Method**: `GET`
- **Path**: `/api/v1/admin/audit-logs`
- **Auth**: Bearer Token (`ADMINISTRATOR`)
- **Query Params**:
  - `from` (ISO string, optional): Start date filter.
  - `to` (ISO string, optional): End date filter.
  - `user_id` (UUID, optional): Filter by user ID.
  - `page` (integer, optional, default: 1).
  - `limit` (integer, optional, default: 10).

**Example Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "a9b8c7d6-1234-5678-90ab-cdef12345678",
      "user_id": "e4a2d810-777b-4d2c-88bf-91923456789a",
      "action": "SUSPEND_USER",
      "service_accessed": null,
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2026-08-08T15:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

### Module 10: Chat Assistant (`/api/v1/chat`)

Bridging agentic backend AI capabilities with an external Langflow HTTP service.

#### 1. Create Chat Session
- **HTTP Method**: `POST`
- **Path**: `/api/v1/chat/sessions`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Request Body** (`CreateSessionDto`):
  - `title` (string, optional, 1–255 characters, default: `"Untitled"`).

**Example Request**:
```json
{
  "title": "Tanya Jawab Coretax & BPJS"
}
```

**Example Success Response (201 Created)**:
```json
{
  "id": "chat1234-5678-90ab-cdef-111122223333",
  "title": "Tanya Jawab Coretax & BPJS",
  "created_at": "2026-08-08T16:00:00.000Z",
  "updated_at": "2026-08-08T16:00:00.000Z"
}
```

---

#### 2. List Chat Sessions
- **HTTP Method**: `GET`
- **Path**: `/api/v1/chat/sessions`
- **Auth**: Bearer Token (`JwtAuthGuard`)

**Example Success Response (200 OK)**:
```json
[
  {
    "id": "chat1234-5678-90ab-cdef-111122223333",
    "title": "Tanya Jawab Coretax & BPJS",
    "created_at": "2026-08-08T16:00:00.000Z",
    "updated_at": "2026-08-08T16:05:00.000Z"
  }
]
```

---

#### 3. Get Session Message History
- **HTTP Method**: `GET`
- **Path**: `/api/v1/chat/sessions/:sessionId/messages`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Path Params**:
  - `sessionId` (UUID, required).

**Example Success Response (200 OK)**:
```json
[
  {
    "id": "msg11111-2222-3333-4444-555555555555",
    "role": "user",
    "content": "Kapan deadline pajak saya berikutnya?",
    "created_at": "2026-08-08T16:01:00.000Z"
  },
  {
    "id": "msg66666-7777-8888-9999-000000000000",
    "role": "assistant",
    "content": "Berdasarkan data Anda, deadline pajak terdekat adalah SPT Tahunan pada 20 Agustus 2026.",
    "created_at": "2026-08-08T16:01:02.000Z"
  }
]
```

---

#### 4. Send Message to AI
- **HTTP Method**: `POST`
- **Path**: `/api/v1/chat/sessions/:sessionId/messages`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Path Params**:
  - `sessionId` (UUID, required).
- **Request Body** (`SendMessageDto`):
  - `message` (string, required, 1–5000 characters).

**Behavior**: Saves user message to DB, automatically builds user context (user profile + service statuses + nearest deadline), forwards to Langflow over HTTP (30s timeout), saves AI response, and returns assistant message. Gracefully returns fallback response if Langflow is offline.

**Example Request**:
```json
{
  "message": "Berapa tagihan BPJS saya bulan ini?"
}
```

**Example Success Response (200 OK)**:
```json
{
  "id": "msg88888-9999-0000-1111-222222222222",
  "role": "assistant",
  "content": "Status BPJS Kesehatan Anda saat ini dalam kondisi WARNING. Silakan lakukan pembayaran sebelum akhir bulan.",
  "created_at": "2026-08-08T16:05:00.000Z"
}
```

---

#### 5. Delete Chat Session (Soft Delete)
- **HTTP Method**: `DELETE`
- **Path**: `/api/v1/chat/sessions/:sessionId`
- **Auth**: Bearer Token (`JwtAuthGuard`)
- **Path Params**:
  - `sessionId` (UUID, required).

**Example Success Response (200 OK)**:
```json
{
  "message": "Session deleted successfully"
}
```

---

## 3. Known Behaviors & Edge Cases

1. **Logout & Token Expiry**:
   - Logging out (`POST /api/v1/auth/logout`) instantly revokes the refresh token and deactivates the user session in the database.
   - However, an already-issued JWT access token remains valid until its natural 15-minute expiration because JWT signature validation is stateless. This is intentional by design.

2. **Dashboard Sync & Consent Handling**:
   - Calling `POST /api/v1/dashboard/refresh` automatically skips any government services where user consent is not `GRANTED`.
   - Instead of failing the entire request, skipped services return `status: null` with `"consent_required": true`.
   - If an external mock service experiences an error, it returns `"sync_error": true` without failing other service syncs (NFR-004 graceful degradation).

3. **Password Change vs Account Deletion**:
   - Changing password (`PATCH /api/v1/users/me/password`) revokes all other active sessions and refresh tokens except the current device session (`exceptSessionId`).
   - Account deletion (`DELETE /api/v1/users/me`) soft-deletes the account and revokes **ALL** sessions and refresh tokens including the current one.

4. **Document Vault Verification & Previewing**:
   - Calling `POST /api/v1/documents/:id/verify` returns `preview_url` and `expires_in` (strictly adhering to project-wide `snake_case` naming conventions).
   - The returned `preview_url` points to `GET /api/v1/documents/preview/:token`, which is a public streaming endpoint that does **NOT** require an Authorization Bearer header (authentication is embedded in the signed path token valid for 300 seconds).

