# Product Requirements Document — PADI (Portal Administrasi Indonesia)

## 1. Product Summary

PADI (Portal Administrasi Indonesia) is a national-level unified administration dashboard platform that integrates various government public services (Coretax DJP, BPJS Kesehatan, SATUSEHAT, SAMSAT, PLN, PDAM, ETLE, M-Paspor) into a single cohesive interface.

This system serves as an **integration layer**, not a replacement for existing government systems. Key features include: Unified Dashboard, Administration Timeline, Smart Reminder, Life Event Assistant, Digital Document Vault, and Notification Center.

In this prototype release, all external data is sourced from a **Mock API** that simulates responses from real government services, before being replaced by actual integrations in the future.

---

## 2. Background & Problem Statement

Indonesian citizens must manage numerous administrative obligations (taxes, BPJS, driver's licenses, civil registry documents, etc.) scattered across various different agency systems, each with its own login, interface, and workflow. Consequently, people often pay or renew documents late because there is no single place that summarizes everything. PADI unifies the status of all these administrative obligations in one dashboard and alerts users before deadlines pass.

---

## 3. Actors / User Roles

| Role | Description |
| --- | --- |
| User (Citizen) | Medium-to-high digital literacy, requires quick access to their administrative info. Can only view and manage their own data. |
| Administrator | Technical personnel managing the platform. Monitors service availability, manages user accounts, and reviews security audit logs. |

---

## 4. Features & Functional Requirements

### 4.1 Unified Dashboard & Status (FR-001–FR-003)

Summarizes all user administrative obligations in a single screen, with status categories: Active, Needs Attention, and Document Expiring Soon. Data is fetched and normalized from various agencies. Users can refresh data manually.

### 4.2 Administration Timeline & Smart Reminder (FR-004–FR-005)

A chronological list of administrative deadlines (Property Tax, Vehicle Tax, etc.), with automated warning notifications at D-30, D-7, and D-1 prior to the deadline.

### 4.3 Life Event Assistant (FR-006–FR-008)

An assistant for specific life events (Marriage, Having a Child, Moving House, Starting a Business) that generates automated document and administration checklists. Users can mark completed checklist items.

### 4.4 Digital Document Vault (FR-009–FR-011)

Encrypted storage for user identity documents (ID Card/KTP, Family Card/KK, Tax ID/NPWP, Driver's License/SIM, etc.). Document previews can only be accessed after the user reverifies their identity.

### 4.5 Authentication & Consent Management (FR-012–FR-014)

Single Sign-On using NIK (National Identification Number) and Email. A Consent Management screen must be displayed before the system accesses any external API on behalf of the user. Every data access is recorded in an immutable Audit Log.

### 4.6 AI Assistant (Low Priority — out of scope for this prototype)

An NLP-based chatbot to answer administrative questions.

---

## 5. Key Architectural Decisions (Prototype)

The following decisions affect how the product works as a whole, making them relevant to the entire team (not just backend developers):

- **Internal Mock API:** Because government agencies have not opened public APIs, all "external services" for this prototype are simulated internally and do not require connections to real government systems. The data displayed in the application is simulated, not actual government data—this is important for demo/presentation contexts.
- **Synchronous Data Synchronization:** Data is synced directly (synchronously) rather than through background queues (message queues). For a prototype/demo scale, this approach is responsive enough without adding infrastructure complexity. This can be expanded later if the system connects to actual government APIs with slower response times.
- **Dynamic Status Calculation:** Administrative obligation statuses (Timeline/Deadline) are calculated automatically from the due date, rather than stored as fixed values—ensuring statuses are always accurate without additional processing.

---

## 6. Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-001 | The main dashboard must be accessible in < 3 clicks after login. Important notifications are placed above the fold. |
| NFR-002 | Aggregation system calls must respond in < 2 seconds from the user's side. |
| NFR-003 | Token-based authentication with short expiration times. All communication is encrypted. Critical actions are recorded in an immutable Audit Log. |
| NFR-004 | Graceful degradation—if one external service fails, only the related component displays an unavailable status, rather than crashing the entire application. |

---

## 7. Interface & Design

- Web-based, responsive for desktop and mobile screens.
- Modern SaaS visual style with a Dark Mode option.
- Clear visual indicators for administrative statuses (warning icons, checkmarks).
- Language: Indonesian. Currency: Rupiah. Time follows the user's local time zone (WIB/WITA/WIT).

---

## 8. Constraints

- Frontend: React. Backend: NestJS + PostgreSQL (see `backend-rules.md` for technical backend details).
- All communication must be routed via HTTPS.
- The project is built for a competition with a strict time limit—prioritize features that can be fully demoed end-to-end over numerous half-finished features.

---

## 9. Out of Scope (This Prototype)

- Actual API integrations with government agencies (still simulated/Mock API).
- Data synchronization via message queues / asynchronous background processes.
- Certified Electronic Signatures.
- NLP-based AI Assistant / chatbot.
- Native mobile applications (Android/iOS).
- NFC reading for e-KTP (electronic ID card).

---

## 10. Future Development

- Official government API integration via PKS (Cooperation Agreement).
- Message queues for large-scale data synchronization, once real external APIs are connected and user volume increases.
- Certified Electronic Signatures.
- NLP-based AI Assistant.
- Native mobile applications (Android & iOS).