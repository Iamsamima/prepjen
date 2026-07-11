# Wiring the custom Node backend to the frontend

The React app was originally built against Lovable Cloud (Supabase). The
standalone `backend/` (Node + Express + Mongoose + multi-key Gemini) is now
wired in as an **opt-in** alternative, so you can migrate feature-by-feature
without breaking anything.

## 1. Configure

Add to `.env` (or `.env.local`):

```env
VITE_API_URL=http://localhost:5000
```

When `VITE_API_URL` is set, `isCustomBackendEnabled()` returns `true` and the
typed client in `src/lib/apiClient.ts` is usable everywhere.

Start the backend:

```bash
cd backend
cp .env.example .env      # fill MONGODB_URI, JWT_SECRET, GEMINI_API_KEYS
npm install
npm run dev               # http://localhost:5000  · docs: /api/docs
```

`GEMINI_API_KEYS` is comma-separated. The service round-robins keys, cools
rate-limited ones for `GEMINI_COOLDOWN_MS` (default 60s), retries the next
healthy key automatically, and exposes runtime state at `GET /api/ai/status`.
Rotate keys live with `POST /api/ai/reload`.

## 2. Use `api` in code

```ts
import { api, isCustomBackendEnabled } from '@/lib/apiClient';

if (isCustomBackendEnabled()) {
  const { docs } = await api.appointments.list({ page: 1, limit: 20 });
}
```

Every backend route has a typed method: `api.auth.*`, `api.profile.*`,
`api.appointments.*`, `api.invoices.*`, `api.referrers.*`, `api.templates.*`,
`api.medicines.*`, `api.tests.*`, `api.prescriptions.*`, `api.uploads.*`,
`api.stats.*`, `api.ai.*`, `api.health()`.

## 3. Auth token

`api.auth.login()` returns `{ token, user }`. Persist with:

```ts
import { setAuthToken } from '@/lib/apiClient';
setAuthToken(res.token);
```

All subsequent client calls attach `Authorization: Bearer <token>`. Call
`setAuthToken(null)` on logout.

## 4. What is already wired

- **AI suggestions** (`src/hooks/usePrescriptionSuggestions.ts`) — when
  `VITE_API_URL` is set the hook calls `POST /api/ai/suggest` (multi-key
  Gemini). Otherwise it falls back to the Supabase Edge Function.

## 5. What to migrate next (pattern)

Each Supabase-backed hook can be flipped with the same shape:

```ts
// Before (Supabase)
const { data } = await supabase.from('appointments').select('*');

// After
const data = isCustomBackendEnabled()
  ? (await api.appointments.list()).docs
  : (await supabase.from('appointments').select('*')).data;
```

Hooks that are ready to switch: `useAppointments`, `useInvoices`,
`useReferrers`, `usePatientHistory`, `AuthContext` (login/signup/me), plus
the settings Import/Export helpers (`api.medicines.import`, `api.tests.import`).

## 6. Backend health-check

```bash
curl $VITE_API_URL/api/health
curl -H "Authorization: Bearer $TOKEN" $VITE_API_URL/api/ai/status
```

## 7. Recent fixes shipped alongside the wiring

- `stats.controller` no longer references the missing `req.user.mongoObjectId`;
  aggregations now use a pre-cast `req.user._mongoId` set in `middleware/auth`.
- `appointments.stats` + `invoices.stats` `$match` are cast to ObjectId.
- `crudFactory` list filters now coerce `"true"`/`"false"` strings to booleans.
- Gemini service:
  - De-dups keys, honours `GEMINI_API_KEY` fallback.
  - Cools down on 401/403/429, tracks per-key call/error counts.
  - Aborts requests after `GEMINI_TIMEOUT_MS` (30s default).
  - Adds `reloadKeys()` and exposes it via `POST /api/ai/reload`.
  - `getStatus()` returns per-key `calls`, `errors`, `last_error`, and a
    `healthy_keys` count.
- Added `templates` import/export and `prescriptions/history/:phone`.