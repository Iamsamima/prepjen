/**
 * Typed client for the custom Node/Express/Mongoose backend.
 *
 * Enabled by setting `VITE_API_URL` (e.g. http://localhost:5000). When it's
 * unset, `isCustomBackendEnabled()` returns false and callers should fall back
 * to the existing Supabase implementation.
 *
 * Token is persisted in localStorage under `app_auth_token` and attached as a
 * Bearer header on every request.
 */

const RAW_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
export const API_BASE = RAW_BASE ? RAW_BASE.replace(/\/+$/, '') : '';
export const isCustomBackendEnabled = () => Boolean(API_BASE);

const TOKEN_KEY = 'app_auth_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setAuthToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** send as multipart/form-data instead of JSON */
  form?: FormData;
  /** do not attach Authorization header */
  anonymous?: boolean;
}

function buildUrl(path: string, query?: Record<string, unknown>) {
  const url = new URL(
    path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function request<T = unknown>(
  method: Method,
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  if (!API_BASE) {
    throw new ApiError(0, 'Custom backend is not configured (set VITE_API_URL)');
  }
  const headers: Record<string, string> = { Accept: 'application/json', ...(opts.headers || {}) };
  if (!opts.anonymous) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method,
    headers,
    body,
    signal: opts.signal,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in (data as any) && (data as any).error) ||
      `Request failed: ${res.status}`;
    throw new ApiError(res.status, String(message), data);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ---------------- Types ----------------
export interface Paginated<T> {
  docs: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'doctor' | 'staff';
}
export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  from?: string;
  to?: string;
  [k: string]: unknown;
};

// ---------------- API surface ----------------
export const api = {
  // ---- Auth ----
  auth: {
    signup: (body: { email: string; password: string; full_name?: string }) =>
      request<AuthResponse>('POST', '/api/auth/signup', { body, anonymous: true }),
    login: (body: { email: string; password: string }) =>
      request<AuthResponse>('POST', '/api/auth/login', { body, anonymous: true }),
    me: () => request<AuthUser>('GET', '/api/auth/me'),
    changePassword: (body: { current_password: string; new_password: string }) =>
      request<{ ok: boolean }>('POST', '/api/auth/change-password', { body }),
  },

  // ---- Profile ----
  profile: {
    get: () => request<any>('GET', '/api/profile'),
    update: (body: Record<string, unknown>) => request<any>('PUT', '/api/profile', { body }),
    clearAsset: (field: 'header_url' | 'footer_url' | 'signature_url' | 'logo_url') =>
      request<any>('DELETE', `/api/profile/asset/${field}`),
  },

  // ---- Appointments ----
  appointments: {
    list: (q: ListParams = {}) => request<Paginated<any>>('GET', '/api/appointments', { query: q }),
    get: (id: string) => request<any>('GET', `/api/appointments/${id}`),
    create: (body: Record<string, unknown>) =>
      request<any>('POST', '/api/appointments', { body }),
    update: (id: string, body: Record<string, unknown>) =>
      request<any>('PUT', `/api/appointments/${id}`, { body }),
    remove: (id: string) => request<{ ok: boolean }>('DELETE', `/api/appointments/${id}`),
    stats: () => request<any>('GET', '/api/appointments/stats'),
    markSeen: (id: string) => request<any>('POST', `/api/appointments/${id}/mark-seen`),
    attachPrescription: (id: string, body: unknown) =>
      request<any>('POST', `/api/appointments/${id}/prescription`, { body }),
    patientHistory: (phone: string) =>
      request<any>('GET', `/api/appointments/history/${encodeURIComponent(phone)}`),
  },

  // ---- Invoices ----
  invoices: {
    list: (q: ListParams = {}) => request<Paginated<any>>('GET', '/api/invoices', { query: q }),
    get: (id: string) => request<any>('GET', `/api/invoices/${id}`),
    create: (body: Record<string, unknown>) => request<any>('POST', '/api/invoices', { body }),
    update: (id: string, body: Record<string, unknown>) =>
      request<any>('PUT', `/api/invoices/${id}`, { body }),
    remove: (id: string) => request<{ ok: boolean }>('DELETE', `/api/invoices/${id}`),
    stats: () => request<any>('GET', '/api/invoices/stats'),
    nextNumber: () => request<{ invoice_number: string }>('GET', '/api/invoices/next-number'),
    markPaid: (id: string, body: { payment_method?: string } = {}) =>
      request<any>('POST', `/api/invoices/${id}/mark-paid`, { body }),
  },

  // ---- Referrers ----
  referrers: {
    list: (q: ListParams = {}) => request<Paginated<any>>('GET', '/api/referrers', { query: q }),
    get: (id: string) => request<any>('GET', `/api/referrers/${id}`),
    create: (body: Record<string, unknown>) => request<any>('POST', '/api/referrers', { body }),
    update: (id: string, body: Record<string, unknown>) =>
      request<any>('PUT', `/api/referrers/${id}`, { body }),
    remove: (id: string) => request<{ ok: boolean }>('DELETE', `/api/referrers/${id}`),
    payCommission: (id: string, amount: number) =>
      request<any>('POST', `/api/referrers/${id}/pay-commission`, { body: { amount } }),
  },

  // ---- Templates ----
  templates: {
    list: (q: ListParams & { type?: string } = {}) =>
      request<Paginated<any>>('GET', '/api/templates', { query: q }),
    get: (id: string) => request<any>('GET', `/api/templates/${id}`),
    create: (body: Record<string, unknown>) => request<any>('POST', '/api/templates', { body }),
    update: (id: string, body: Record<string, unknown>) =>
      request<any>('PUT', `/api/templates/${id}`, { body }),
    remove: (id: string) => request<{ ok: boolean }>('DELETE', `/api/templates/${id}`),
    bulk: (items: unknown[]) =>
      request<{ inserted: number }>('POST', '/api/templates/bulk', { body: { items } }),
    import: (items: unknown[]) =>
      request<{ inserted: number }>('POST', '/api/templates/import', { body: { items } }),
    export: (type?: string) =>
      request<any[]>('GET', '/api/templates/export', { query: type ? { type } : undefined }),
  },

  // ---- Medicines ----
  medicines: {
    list: (q: ListParams = {}) => request<Paginated<any>>('GET', '/api/medicines', { query: q }),
    get: (id: string) => request<any>('GET', `/api/medicines/${id}`),
    create: (body: Record<string, unknown>) => request<any>('POST', '/api/medicines', { body }),
    update: (id: string, body: Record<string, unknown>) =>
      request<any>('PUT', `/api/medicines/${id}`, { body }),
    remove: (id: string) => request<{ ok: boolean }>('DELETE', `/api/medicines/${id}`),
    bulk: (items: unknown[]) =>
      request<{ inserted: number }>('POST', '/api/medicines/bulk', { body: { items } }),
    import: (items: unknown[]) =>
      request<{ inserted: number }>('POST', '/api/medicines/import', { body: { items } }),
    export: () => request<any[]>('GET', '/api/medicines/export'),
  },

  // ---- Tests ----
  tests: {
    list: (q: ListParams = {}) => request<Paginated<any>>('GET', '/api/tests', { query: q }),
    get: (id: string) => request<any>('GET', `/api/tests/${id}`),
    create: (body: Record<string, unknown>) => request<any>('POST', '/api/tests', { body }),
    update: (id: string, body: Record<string, unknown>) =>
      request<any>('PUT', `/api/tests/${id}`, { body }),
    remove: (id: string) => request<{ ok: boolean }>('DELETE', `/api/tests/${id}`),
    bulk: (items: unknown[]) =>
      request<{ inserted: number }>('POST', '/api/tests/bulk', { body: { items } }),
    import: (items: unknown[]) =>
      request<{ inserted: number }>('POST', '/api/tests/import', { body: { items } }),
    export: () => request<any[]>('GET', '/api/tests/export'),
  },

  // ---- Prescriptions ----
  prescriptions: {
    list: (q: ListParams = {}) =>
      request<Paginated<any>>('GET', '/api/prescriptions', { query: q }),
    get: (id: string) => request<any>('GET', `/api/prescriptions/${id}`),
    create: (body: Record<string, unknown>) =>
      request<any>('POST', '/api/prescriptions', { body }),
    update: (id: string, body: Record<string, unknown>) =>
      request<any>('PUT', `/api/prescriptions/${id}`, { body }),
    remove: (id: string) => request<{ ok: boolean }>('DELETE', `/api/prescriptions/${id}`),
    history: (phone: string) =>
      request<any>('GET', `/api/prescriptions/history/${encodeURIComponent(phone)}`),
  },

  // ---- Uploads ----
  uploads: {
    upload: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return request<{ filename: string; url: string; size: number }>('POST', '/api/uploads', {
        form: fd,
      });
    },
  },

  // ---- Stats ----
  stats: {
    overview: () => request<any>('GET', '/api/stats/overview'),
  },

  // ---- AI (multi-key Gemini) ----
  ai: {
    suggest: (body: {
      type:
        | 'symptoms'
        | 'diagnosis'
        | 'medicines'
        | 'dose'
        | 'dosage'
        | 'frequency'
        | 'duration'
        | 'tests';
      context?: Record<string, any>;
      query?: string;
    }) =>
      request<{ type: string; suggestions: unknown[]; keyIndex: number }>(
        'POST',
        '/api/ai/suggest',
        { body }
      ),
    chat: (body: {
      prompt?: string;
      messages?: { role: 'user' | 'assistant'; content: string }[];
      system?: string;
      json?: boolean;
    }) =>
      request<{ text: string; keyIndex: number }>('POST', '/api/ai/chat', {
        body,
      }),
    status: () => request<any>('GET', '/api/ai/status'),
    reload: () => request<{ ok: boolean; totalKeys: number }>('POST', '/api/ai/reload'),
  },

  // ---- Health ----
  health: () => request<{ status: string; time: string }>('GET', '/api/health', { anonymous: true }),
};

export type Api = typeof api;