const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { generate, extractJson, getStatus, reloadKeys } = require('../services/geminiService');

const SYSTEM = `You are a medical AI assistant helping doctors write prescriptions.
You provide accurate, evidence-based suggestions. ALWAYS respond with a valid JSON array only, no prose.`;

function buildPrompt(type, context = {}, query = '') {
  switch (type) {
    case 'symptoms':
      return `Given partial symptom text "${query}", suggest 5-8 common medical symptoms. Return JSON array of strings.`;
    case 'diagnosis':
      return `Based on symptoms: "${context.symptoms || ''}", suggest 5-8 possible diagnoses. Return JSON array of {"name","confidence":"high|medium|low","description"}.`;
    case 'medicines':
      return `For diagnosis "${context.diagnosis || ''}" with symptoms "${context.symptoms || ''}", suggest 5-10 medicines. Return JSON array of {"name","type","genericName"}.`;
    case 'dose':
    case 'dosage':
      return `For medicine "${context.medicineName || ''}" (${context.medicineType || 'Tablet'}), patient ${JSON.stringify(context.patientInfo || {})}, suggest common dosages as JSON array of strings.`;
    case 'frequency':
      return `For medicine "${context.medicineName || ''}", suggest common frequencies as JSON array of strings.`;
    case 'duration':
      return `For medicine "${context.medicineName || ''}" used for "${context.diagnosis || ''}", suggest treatment durations as JSON array of strings.`;
    case 'tests':
      return `For diagnosis "${context.diagnosis || ''}" with symptoms "${context.symptoms || ''}", suggest diagnostic tests as JSON array of {"testName","testType","reason"}.`;
    default:
      throw new ApiError(400, 'Invalid suggestion type');
  }
}

exports.suggest = asyncHandler(async (req, res) => {
  const { type, context = {}, query = '' } = req.body || {};
  if (!type) throw new ApiError(400, 'type is required');
  const prompt = buildPrompt(type, context, query);
  const { text, keyIndex } = await generate(prompt, { system: SYSTEM, json: true });
  const suggestions = extractJson(text) || [];
  res.json({ type, suggestions, keyIndex });
});

exports.chat = asyncHandler(async (req, res) => {
  const { messages, prompt, system, json } = req.body || {};
  if (!prompt && !messages) throw new ApiError(400, 'prompt or messages required');
  const contents = messages
    ? messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
    : [{ role: 'user', parts: [{ text: prompt }] }];
  const { text, keyIndex } = await generate(contents, { system, json: !!json });
  res.json({ text, keyIndex });
});

exports.status = asyncHandler(async (_req, res) => res.json(getStatus()));

exports.reload = asyncHandler(async (_req, res) => {
  const total = reloadKeys();
  res.json({ ok: true, totalKeys: total });
});