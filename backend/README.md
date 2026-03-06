# Bank Statement Converter API

NestJS backend for MT940/CAMT.053 → CSV/XLSX/QBO conversion.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start infrastructure (Docker)

```bash
docker compose up -d
```

This starts PostgreSQL 16 and MinIO (S3-compatible storage).

### 3. Configure environment

Copy `.env.example` to `.env` and adjust:

```bash
cp .env.example .env
```

For **local dev without Auth0**, set `AUTH_DISABLED=true` in `.env`.

### 4. Run migrations

```bash
npm run migration:run
```

### 5. Start the API

```bash
npm run start:dev
```

API: http://localhost:3001  
Swagger docs: http://localhost:3001/api

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/me` | Current user (JWT) |
| POST | `/uploads/init` | Get presigned upload URL |
| POST | `/jobs` | Create conversion job |
| GET | `/jobs` | List user jobs |
| GET | `/jobs/:id` | Get job status |
| GET | `/exports/:jobId/:format` | Get presigned download URL (csv/xlsx/qbo) |

## Flow

1. `POST /uploads/init` → get presigned URL
2. Upload file directly to S3/MinIO using the URL
3. `POST /jobs` with `{ key }` → job is created and processed
4. `GET /jobs/:id` → poll until status is `completed`
5. `GET /exports/:jobId/csv` (or xlsx, qbo) → get download URL

## Auth

- **Production**: Auth0 JWT with scopes `jobs:read`, `jobs:write`, `exports:download`
- **Local dev**: Set `AUTH_DISABLED=true` to bypass Auth0
