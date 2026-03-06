# План розробки MVP

## Продукт
Конвертер банківських виписок:
- `MT940` / `CAMT.053` -> `CSV` / `XLSX` / `QBO`

Ціль MVP: швидко запустити робочий SaaS для бухгалтерії/фінкоманд з безпечним зберіганням та базовою монетизацією.

---

## Обраний стек

### Web
- **Next.js** (App Router, TypeScript)
- **Hero UI** як базова UI library для всіх інтерфейсів

### Backend
- **NestJS** (REST API, TypeScript)
- **Auth0** для авторизації (OAuth2/OIDC)

### База даних
- **PostgreSQL**
  - локально: Docker
  - продакшн: AWS RDS (private)

### Storage для файлів
- Локально: **MinIO** (S3-compatible)
- Продакшн: **AWS S3**

### Черги/фонова обробка
- **AWS SQS** + worker (NestJS або окремий сервіс)

---

## UI стандарт (обов'язковий)

- Усі зміни інтерфейсу виконувати через **Hero UI**.
- Нові кнопки, форми, таблиці, модалки, алерти, дропдауни, таби та інші елементи робити на базі компонентів Hero UI.
- Не додавати паралельні UI libraries (MUI, Ant, Chakra, shadcn тощо) без окремого рішення команди.
- Кастомні стилі через `className`/теми Hero UI, але без порушення консистентності дизайн-системи.
- Якщо потрібного компонента немає в Hero UI, спочатку перевірити composable-патерн на базі Hero UI primitives.

---

## Архітектура (high-level)

1. Користувач логіниться через Auth0.
2. Frontend викликає API NestJS з `Bearer access_token`.
3. API повертає `presigned URL` для upload.
4. Файл завантажується напряму у S3/MinIO.
5. API створює `job` у БД та ставить задачу в чергу.
6. Worker:
   - парсить MT940/CAMT.053,
   - валідовує дані,
   - генерує CSV/XLSX/QBO,
   - зберігає експорт у storage.
7. Користувач отримує статус і завантажує результат через short-lived signed URL.

---

## Безпека даних

### Auth / API
- Перевірка JWT у NestJS через JWKS (Auth0 issuer/audience/signature/exp).
- Scope-based доступ:
  - `jobs:write`
  - `jobs:read`
  - `exports:download`

### База (RDS)
- `PubliclyAccessible=false`
- доступ тільки через приватні security groups
- TLS (`sslmode=require`)
- encryption at rest (KMS)
- backups + point-in-time restore
- секрети тільки в AWS Secrets Manager

### Файли
- Upload/download тільки через presigned URL
- lifecycle policy (автовидалення raw/exports через 24-72 год)
- без логування чутливого вмісту файлів

---

## Локальна розробка

### Чому так
- однаковий підхід до інфраструктури: локально S3-compatible storage і Postgres
- менше відмінностей між dev і prod

### Docker compose (мінімальний приклад)

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

### Приклад env для dev

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

## Scope MVP

### Must-have
- Upload `.mt940` та `.xml` (CAMT.053)
- Автовизначення формату
- Парсинг у нормалізовану модель транзакцій
- Validation report (errors/warnings)
- Export у CSV/XLSX/QBO
- Auth0 login
- Free/Pro обмеження

### Out of scope (після MVP)
- Публічний API для третіх сторін
- Масовий batch-processing великих архівів
- Глибокі bank-specific профілі

---

## План реалізації на 14 днів

### День 1-2: Основа
- skeleton Next.js + NestJS
- базове налаштування Hero UI у Next.js (provider, theme, базові компоненти layout)
- PostgreSQL schema + міграції
- Auth0 setup (app + API + scopes)

### День 3-4: Auth end-to-end
- login/logout на Next.js
- JWT guard/scopes guard у NestJS
- `/me` endpoint

### День 5-6: Upload pipeline
- `/uploads/init` (presigned URL)
- upload у MinIO/S3
- `jobs` + SQS інтеграція

### День 7-8: CAMT.053 parser
- XML parsing
- мапінг у normalized transactions
- preview у UI

### День 9-10: MT940 parser + validation
- теги `:61:`, `:86:` тощо
- правила валідації та помилки

### День 11: Експортери
- CSV, XLSX, QBO
- signed download links

### День 12: Білінг
- Stripe Free/Pro
- ліміти по плану

### День 13: Security hardening
- rate limit, CORS, helmet
- логування без чутливих даних
- retention policy

### День 14: Реліз
- деплой web/api
- smoke tests
- launch checklist

---

## Definition of Done (MVP)
- Користувач логіниться через Auth0.
- MT940/CAMT.053 файли стабільно обробляються.
- Експорт у CSV/XLSX/QBO працює.
- Дані безпечно зберігаються (DB + storage + secrets).
- Є базові платні обмеження та готовність до продакшн-запуску.

---

## Інструкції для AI агентів (coding rules)

### Загальні правила
- Писати код на TypeScript, дотримуючись поточної структури модулів.
- Перед змінами перевіряти існуючі патерни в репозиторії і не ламати сумісність.
- Для кожної нової фічі додавати мінімальні тести (unit/integration, якщо доречно).
- Не комітити секрети, ключі, токени, приватні URI.
- Усі конфіги через env-змінні з описом у документації.

### Правила для UI (обов'язково)
- **Усі UI зміни виконувати тільки з Hero UI library.**
- Не використовувати raw HTML-елементи як фінальні компоненти, якщо є еквівалент у Hero UI.
- Не додавати інші UI frameworks або компонентні бібліотеки.
- Підтримувати доступність: `label`, `aria-*`, keyboard navigation.
- Нові сторінки повинні використовувати спільні UI-патерни (cards, forms, tables, alerts) через Hero UI.

### Правила для Next.js
- Використовувати App Router та server/client components за потребою.
- Форми з валідацією (zod/DTO схеми), коректна обробка loading/error states.
- Не дублювати API-логіку у фронтенді; вся бізнес-логіка конвертації на бекенді.

### Правила для NestJS
- Кожен endpoint проходить через DTO + validation pipe.
- Захист роутів через JWT guard + scopes guard.
- Валідації, парсинг і експортери тримати в окремих сервісах (single responsibility).
- Логи структуровані, без чутливих фінансових даних.
