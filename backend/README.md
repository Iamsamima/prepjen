# Prescription App — Node.js/Express/Mongoose Backend

A production-ready backend template that mirrors every feature of the frontend,
with **Google Gemini** AI powered by **multi-key rotation** (round-robin +
automatic failover on 429/quota errors).

## Features

- **Auth**: JWT signup/login/me/change-password, bcrypt password hashing
- **Doctor Profile**: header/footer/signature/logo, clinic & hospital info, fee defaults
- **Appointments**: full CRUD, date-range + regex search, stats aggregation,
  mark-seen, attach prescription, patient history by phone
- **Invoices**: auto-numbering, auto totals (subtotal/discount/GST/commission),
  referrer commission tracking, mark-paid, stats
- **Referrers**: CRUD (soft delete), commission payment tracking
- **Prescriptions**: standalone save + link to appointments
- **Templates**: unified store for prescription / medicine / diagnosis / symptom / test
- **Medicine & Test databases**: CRUD, bulk insert, JSON import/export
- **Uploads**: image uploads (multer) served under `/uploads`
- **AI (Gemini)**: `/api/ai/suggest`, `/api/ai/chat`, `/api/ai/status`
  - **Multi-key rotation**: comma-separated `GEMINI_API_KEYS`
  - **Cooldown on 429/403** for the offending key, retries on the next key
- **Cross-cutting**: pagination, regex search (debounce on client),
  sortable list endpoints, date filters, allowed-field filters, request
  validation, helmet + CORS + rate limiting + Mongo-sanitize, morgan logs
- **Swagger** UI at `/api/docs`, JSON at `/api/docs.json`

## Getting Started

```bash
cd backend
cp .env.example .env         # fill in MONGODB_URI, JWT_SECRET, GEMINI_API_KEYS
npm install
npm run seed                 # optional: creates demo@doctor.com / demo1234
npm run dev                  # http://localhost:5000
```

Open **http://localhost:5000/api/docs** for the interactive API reference.

## Multi-Key Gemini Rotation

Set `GEMINI_API_KEYS` to a comma-separated list:

```
GEMINI_API_KEYS=AIzaSy...KEY1,AIzaSy...KEY2,AIzaSy...KEY3
```

`src/services/geminiService.js` will:
1. Round-robin pick the next non-cooling key for every request.
2. On `429`/`403`, cool the key down for 60s and immediately retry with the next key.
3. If **all** keys are cooling, reset the earliest one and use it.
4. Return the used `keyIndex` in the response for debugging.

Inspect the pool at `GET /api/ai/status`.

## Endpoints (all under `/api`)

| Group          | Base path              | Notes                                  |
|----------------|------------------------|----------------------------------------|
| Auth           | `/auth`                | signup, login, me, change-password     |
| Profile        | `/profile`             | GET/PUT + `DELETE /asset/:field`       |
| Appointments   | `/appointments`        | CRUD + `/stats`, `/search`, `/history/:phone`, `/:id/mark-seen`, `/:id/prescription` |
| Invoices       | `/invoices`            | CRUD + `/stats`, `/next-number`, `/:id/mark-paid` |
| Referrers      | `/referrers`           | CRUD (soft-delete) + `/:id/pay-commission` |
| Templates      | `/templates`           | CRUD + `/bulk`                         |
| Medicines      | `/medicines`           | CRUD + `/bulk`, `/import`, `/export`   |
| Tests          | `/tests`               | CRUD + `/bulk`, `/import`, `/export`   |
| Prescriptions  | `/prescriptions`       | CRUD                                   |
| AI             | `/ai`                  | `/suggest`, `/chat`, `/status`         |
| Uploads        | `/uploads`             | multipart image upload                 |
| Stats          | `/stats/overview`      | dashboard overview                     |
| Docs           | `/docs`                | Swagger UI                             |
| Health         | `/health`              | uptime probe                           |

Every list endpoint supports:
`?page=&limit=&sort=field,-other&search=regex&from=YYYY-MM-DD&to=YYYY-MM-DD` plus
endpoint-specific `allowedFilters` (e.g. `?status=paid`).

## Frontend Migration Guide

Replace the Supabase client with `fetch`/`axios` calls to this API. The response
shapes match the existing hooks:

| Frontend hook                    | Endpoint                                |
|----------------------------------|-----------------------------------------|
| `useAppointments`                | `/api/appointments` + `/stats`          |
| `useInvoices`                    | `/api/invoices`                         |
| `useReferrers`                   | `/api/referrers`                        |
| `useTemplates`                   | `/api/templates`                        |
| `useSavedMedicines`              | `/api/medicines`                        |
| `usePatientHistory`              | `/api/appointments/history/:phone`      |
| `usePrescriptionSuggestions`     | `/api/ai/suggest`                       |

Auth: on login, store the returned `token` and send it as
`Authorization: Bearer <token>` on every request.

## Deployment

- Any Node host: Railway, Render, Fly.io, DigitalOcean App Platform, EC2.
- MongoDB Atlas recommended for `MONGODB_URI`.
- Set env vars in the host dashboard.
- Run `npm start` (or `node src/server.js`).
