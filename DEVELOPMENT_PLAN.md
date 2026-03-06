# MVP Development Plan

## Product
Bank statement converter:
- `MT940` / `CAMT.053` -> `CSV` / `XLSX` / `QBO`

MVP goal: quickly launch a working SaaS for accounting/finance teams with secure storage and basic monetization.

---

## Chosen Tech Stack

### Web
- **Next.js** (App Router, TypeScript)
- **Hero UI** as the base UI library for all interfaces

### Backend
- **NestJS** (REST API, TypeScript)
- **Auth0** for authorization (OAuth2/OIDC)

### Database
- **PostgreSQL**
  - locally: Docker
  - production: AWS RDS (private)

### File Storage
- Locally: **MinIO** (S3-compatible)
- Production: **AWS S3**

### Queues/Background Processing
- **AWS SQS** + worker (NestJS or separate service)

---

## UI Standard (mandatory)

- All UI changes must be made through **Hero UI**.
- New buttons, forms, tables, modals, alerts, dropdowns, tabs, and other elements must be built using Hero UI components.
- Do not add parallel UI libraries (MUI, Ant, Chakra, shadcn, etc.) without a separate team decision.
- Custom styles via `className`/Hero UI themes, but without breaking design system consistency.
- If a required component is not available in Hero UI, first check the composable pattern based on Hero UI primitives.

---

## Architecture (high-level)

1. User logs in via Auth0.
2. Frontend calls NestJS API with `Bearer access_token`.
3. API returns `presigned URL` for upload.
4. File is uploaded directly to S3/MinIO.
5. API creates a `job` in the database and enqueues the task.
6. Worker:
   - parses MT940/CAMT.053,
   - validates data,
   - generates CSV/XLSX/QBO,
   - stores export in storage.
7. User receives status and downloads the result via short-lived signed URL.

---

## Data Security

### Auth / API
- JWT validation in NestJS via JWKS (Auth0 issuer/audience/signature/exp).
- Scope-based access:
  - `jobs:write`
  - `jobs:read`
  - `exports:download`

### Database (RDS)
- `PubliclyAccessible=false`
- access only through private security groups
- TLS (`sslmode=require`)
- encryption at rest (KMS)
- backups + point-in-time restore
- secrets only in AWS Secrets Manager

### Files
- Upload/download only via presigned URL
- lifecycle policy (auto-deletion of raw/exports after 24–72 hours)
- no logging of sensitive file contents

---

## Local Development

### Rationale
- consistent approach to infrastructure: S3-compatible storage and Postgres locally
- fewer differences between dev and prod

### Docker Compose (minimal example)

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: appdb
    ports:
      - "5432:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio123
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - ./data/minio:/data
```

### Example env for dev

```env
# Database
DATABASE_URL=postgresql://app:app@localhost:5432/appdb

# Auth0
AUTH0_ISSUER_BASE_URL=https://<tenant>.auth0.com/
AUTH0_AUDIENCE=https://api.yourapp.com
AUTH0_CLIENT_ID=<client_id>
AUTH0_CLIENT_SECRET=<client_secret>

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minio
S3_SECRET_ACCESS_KEY=minio123
S3_FORCE_PATH_STYLE=true
S3_BUCKET_RAW=raw
S3_BUCKET_EXPORTS=exports
```

---

## MVP Scope

### Must-have
- Upload `.mt940` and `.xml` (CAMT.053)
- Auto-detection of format
- Parsing into normalized transaction model
- Validation report (errors/warnings)
- Export to CSV/XLSX/QBO
- Auth0 login
- Free/Pro limits

### Out of scope (post-MVP)
- Public API for third parties
- Mass batch-processing of large archives
- Deep bank-specific profiles

---

## 14-Day Implementation Plan

### Days 1–2: Foundation
- Next.js + NestJS skeleton
- basic Hero UI setup in Next.js (provider, theme, basic layout components)
- PostgreSQL schema + migrations
- Auth0 setup (app + API + scopes)

### Days 3–4: Auth end-to-end
- login/logout in Next.js
- JWT guard/scopes guard in NestJS
- `/me` endpoint

### Days 5–6: Upload pipeline
- `/uploads/init` (presigned URL)
- upload to MinIO/S3
- `jobs` + SQS integration

### Days 7–8: CAMT.053 parser
- XML parsing
- mapping to normalized transactions
- preview in UI

### Days 9–10: MT940 parser + validation
- tags `:61:`, `:86:`, etc.
- validation rules and errors

### Day 11: Exporters
- CSV, XLSX, QBO
- signed download links

### Day 12: Billing
- Stripe Free/Pro
- plan-based limits

### Day 13: Security hardening
- rate limit, CORS, helmet
- logging without sensitive data
- retention policy

### Day 14: Release
- deploy web/api
- smoke tests
- launch checklist

---

## Definition of Done (MVP)
- User logs in via Auth0.
- MT940/CAMT.053 files are processed reliably.
- Export to CSV/XLSX/QBO works.
- Data is stored securely (DB + storage + secrets).
- Basic paid limits exist and the product is ready for production launch.

---

## Instructions for AI Agents (coding rules)

### General rules
- Write code in TypeScript, following the current module structure.
- Before making changes, check existing patterns in the repository and avoid breaking compatibility.
- Add minimal tests (unit/integration, where appropriate) for each new feature.
- Do not commit secrets, keys, tokens, or private URIs.
- All configuration via env variables with documentation.

### UI rules (mandatory)
- **All UI changes must be made only with the Hero UI library.**
- Do not use raw HTML elements as final components if an equivalent exists in Hero UI.
- Do not add other UI frameworks or component libraries.
- Support accessibility: `label`, `aria-*`, keyboard navigation.
- New pages must use shared UI patterns (cards, forms, tables, alerts) via Hero UI.

### Next.js rules
- Use App Router and server/client components as needed.
- Forms with validation (zod/DTO schemas), proper handling of loading/error states.
- Do not duplicate API logic in the frontend; all conversion business logic stays on the backend.

### NestJS rules
- Every endpoint goes through DTO + validation pipe.
- Route protection via JWT guard + scopes guard.
- Keep validations, parsing, and exporters in separate services (single responsibility).
- Structured logs, no sensitive financial data.
