/**
 * Gemini AI service with MULTI-KEY ROTATION + FAILOVER.
 *
 * - Reads keys from GEMINI_API_KEYS (comma-separated).
 * - Round-robin picks the next healthy key for every call.
 * - On 429/quota/403 the key is temporarily cooled-down and the next key is tried.
 * - Automatically retries up to (#keys) times before surfacing the error.
 *
 * Uses the official Google Generative Language REST API — no SDK dependency:
 *   POST {BASE}/models/{model}:generateContent?key={API_KEY}
 */
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const BASE = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const COOLDOWN_MS = Number(process.env.GEMINI_COOLDOWN_MS || 60_000);

function loadKeys() {
  const raw = process.env.GEMINI_API_KEYS || '';
  // De-dup while preserving order — accidental duplicates would waste rotations.
  const seen = new Set();
  const keys = [];
  for (const raw2 of raw.split(',')) {
    const s = raw2.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    keys.push(s);
  }
  // Back-compat: also honour a single GEMINI_API_KEY.
  if (keys.length === 0 && process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }
  return keys;
}

const state = {
  keys: loadKeys(),
  cursor: 0,
  cooldownUntil: new Map(), // key -> epoch ms
  stats: new Map(), // key -> { calls, errors, lastError }
};

function refreshKeysIfEmpty() {
  if (state.keys.length === 0) {
    state.keys = loadKeys();
    state.cursor = 0;
  }
}

function pickKey() {
  refreshKeysIfEmpty();
  if (state.keys.length === 0) {
    throw new ApiError(500, 'No Gemini API keys configured (set GEMINI_API_KEYS)');
  }
  const now = Date.now();
  for (let i = 0; i < state.keys.length; i++) {
    const idx = (state.cursor + i) % state.keys.length;
    const k = state.keys[idx];
    const cd = state.cooldownUntil.get(k) || 0;
    if (cd <= now) {
      state.cursor = (idx + 1) % state.keys.length;
      return { key: k, index: idx };
    }
  }
  // all cooling down — reset the earliest cooldown and use it
  let earliestKey = state.keys[0];
  let earliestTime = Infinity;
  for (const [k, t] of state.cooldownUntil.entries()) {
    if (t < earliestTime) {
      earliestTime = t;
      earliestKey = k;
    }
  }
  state.cooldownUntil.delete(earliestKey);
  return { key: earliestKey, index: state.keys.indexOf(earliestKey) };
}

function coolDown(key, ms = COOLDOWN_MS) {
  state.cooldownUntil.set(key, Date.now() + ms);
  logger.warn(`Gemini key #${state.keys.indexOf(key)} cooled down for ${ms}ms`);
}

function bumpStats(key, { error, message } = {}) {
  const s = state.stats.get(key) || { calls: 0, errors: 0, lastError: null };
  s.calls += 1;
  if (error) {
    s.errors += 1;
    s.lastError = message || String(error);
  }
  state.stats.set(key, s);
}

/**
 * Call Gemini generateContent with automatic key failover.
 * @param {Array|string} prompt - either a string or an array of {role, parts:[{text}]}.
 * @param {object} opts
 * @param {string} [opts.model]
 * @param {object} [opts.generationConfig]
 * @param {string} [opts.system]           - optional system instruction
 * @param {boolean} [opts.json]            - request JSON output (application/json)
 */
async function generate(prompt, opts = {}) {
  const model = opts.model || MODEL;
  const contents = typeof prompt === 'string'
    ? [{ role: 'user', parts: [{ text: prompt }] }]
    : prompt;

  const body = {
    contents,
    ...(opts.system ? { systemInstruction: { role: 'user', parts: [{ text: opts.system }] } } : {}),
    generationConfig: {
      temperature: 0.7,
      ...(opts.json ? { responseMimeType: 'application/json' } : {}),
      ...(opts.generationConfig || {}),
    },
  };

  const totalKeys = Math.max(1, state.keys.length || loadKeys().length);
  let lastErr;

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const { key, index } = pickKey();
    const url = `${BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Number(process.env.GEMINI_TIMEOUT_MS || 30_000));
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (res.status === 429 || res.status === 403 || res.status === 401) {
        coolDown(key);
        bumpStats(key, { error: true, message: `HTTP ${res.status}` });
        lastErr = new ApiError(res.status, `Gemini key #${index} rate-limited`);
        continue;
      }
      if (!res.ok) {
        const text = await res.text();
        bumpStats(key, { error: true, message: `HTTP ${res.status}` });
        throw new ApiError(res.status, 'Gemini API error', text.slice(0, 500));
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('') || '';
      bumpStats(key, {});
      return { text, raw: data, keyIndex: index };
    } catch (e) {
      lastErr = e;
      if (e instanceof ApiError && (e.status === 429 || e.status === 403)) continue;
      // For network / abort errors, cool this key briefly and retry.
      bumpStats(key, { error: true, message: e.message });
      coolDown(key, 10_000);
    }
  }

  throw lastErr || new ApiError(500, 'Gemini request failed on all keys');
}

/** Convenience: parse a JSON array/object from the model response, tolerating markdown fences. */
function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : text;
  const arr = candidate.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  try {
    return JSON.parse(arr ? arr[0] : candidate);
  } catch {
    return null;
  }
}

function getStatus() {
  const now = Date.now();
  return {
    totalKeys: state.keys.length,
    model: MODEL,
    keys: state.keys.map((k, i) => ({
      index: i,
      preview: k.slice(0, 6) + '…' + k.slice(-4),
      cooling: (state.cooldownUntil.get(k) || 0) > now,
      cooldown_remaining_ms: Math.max(0, (state.cooldownUntil.get(k) || 0) - now),
      calls: state.stats.get(k)?.calls || 0,
      errors: state.stats.get(k)?.errors || 0,
      last_error: state.stats.get(k)?.lastError || null,
    })),
    healthy_keys: state.keys.filter((k) => (state.cooldownUntil.get(k) || 0) <= now).length,
  };
}

function reloadKeys() {
  state.keys = loadKeys();
  state.cursor = 0;
  state.cooldownUntil.clear();
  return state.keys.length;
}

module.exports = { generate, extractJson, getStatus, reloadKeys };