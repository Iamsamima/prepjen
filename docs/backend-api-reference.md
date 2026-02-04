# Backend API Reference & Migration Guide

Complete API documentation, Gemini integration templates, and step-by-step replacement guide for migrating from Lovable Cloud.

---

## Table of Contents

1. [API Endpoints Reference](#api-endpoints-reference)
2. [Gemini Integration Templates](#gemini-integration-templates)
3. [Replacement Guide](#replacement-guide)

---

## API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| POST | `/api/auth/refresh` | Refresh access token | Yes |
| GET | `/api/auth/me` | Get current user | Yes |

### Appointments Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/appointments` | List all appointments | Yes |
| GET | `/api/appointments/:id` | Get single appointment | Yes |
| POST | `/api/appointments` | Create appointment | Yes |
| PUT | `/api/appointments/:id` | Update appointment | Yes |
| PATCH | `/api/appointments/:id/status` | Update status only | Yes |
| DELETE | `/api/appointments/:id` | Delete appointment | Yes |

### Invoices Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/invoices` | List all invoices | Yes |
| GET | `/api/invoices/:id` | Get single invoice | Yes |
| POST | `/api/invoices` | Create invoice | Yes |
| PUT | `/api/invoices/:id` | Update invoice | Yes |
| PATCH | `/api/invoices/:id/payment` | Update payment status | Yes |
| DELETE | `/api/invoices/:id` | Delete invoice | Yes |

### Referrers Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/referrers` | List all referrers | Yes |
| GET | `/api/referrers/:id` | Get single referrer | Yes |
| POST | `/api/referrers` | Create referrer | Yes |
| PUT | `/api/referrers/:id` | Update referrer | Yes |
| PATCH | `/api/referrers/:id/commission` | Mark commission paid | Yes |
| DELETE | `/api/referrers/:id` | Delete referrer | Yes |

### AI Suggestion Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/ai/suggestions` | Get AI suggestions | No |
| POST | `/api/ai/chat` | Chat with AI | No |
| POST | `/api/ai/chat/stream` | Stream chat response | No |

---

## API Request/Response Schemas

### Appointment Schema

```typescript
// Request body for creating/updating appointment
interface AppointmentRequest {
  patient_name: string;           // Required
  patient_phone?: string;
  patient_email?: string;
  patient_age?: number;
  patient_gender?: 'male' | 'female' | 'other';
  appointment_date: string;       // Required, format: YYYY-MM-DD
  appointment_time: string;       // Required, format: HH:MM
  status?: 'scheduled' | 'seen' | 'cancelled' | 'no-show';
  payment_status?: 'pending' | 'paid' | 'partial';
  amount_charged?: number;
  amount_paid?: number;
  notes?: string;
  prescription_data?: PrescriptionData;
}

// Response
interface AppointmentResponse {
  id: string;
  user_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_age?: number;
  patient_gender?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  payment_status: string;
  amount_charged: number;
  amount_paid: number;
  notes?: string;
  prescription_data?: PrescriptionData;
  created_at: string;
  updated_at: string;
}
```

### Invoice Schema

```typescript
// Request body for creating/updating invoice
interface InvoiceRequest {
  appointment_id?: string;
  patient_name: string;           // Required
  patient_phone?: string;
  patient_email?: string;
  doctor_fees?: number;
  platform_fees?: number;
  gst_percentage?: number;        // Default: 18
  discount_percentage?: number;
  other_charges?: number;
  other_charges_description?: string;
  is_referred?: boolean;
  referrer_id?: string;
  referral_commission_percentage?: number;
  notes?: string;
}

// Response (includes calculated fields)
interface InvoiceResponse {
  id: string;
  user_id: string;
  invoice_number: string;         // Auto-generated
  appointment_id?: string;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  invoice_date: string;
  doctor_fees: number;
  platform_fees: number;
  gst_percentage: number;
  gst_amount: number;             // Calculated
  discount_percentage: number;
  discount_amount: number;        // Calculated
  other_charges: number;
  other_charges_description?: string;
  subtotal: number;               // Calculated
  total_amount: number;           // Calculated
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  payment_method?: string;
  payment_date?: string;
  is_referred: boolean;
  referrer_id?: string;
  referral_commission_percentage: number;
  referral_commission_amount: number;  // Calculated
  referral_commission_paid: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

### AI Suggestions Schema

```typescript
// Request
interface SuggestionRequest {
  type: 'symptoms' | 'diagnosis' | 'medicines' | 'dosage' | 'dose' | 'frequency' | 'duration' | 'tests';
  context: {
    symptoms?: string;
    diagnosis?: string;
    medicineName?: string;
    medicineType?: string;
    patientInfo?: {
      age?: string;
      gender?: string;
      weight?: string;
    };
  };
  query?: string;  // For search/filter
}

// Response varies by type
interface SymptomSuggestion {
  suggestions: string[];  // ["Fever", "Headache", "Fatigue"]
}

interface DiagnosisSuggestion {
  suggestions: Array<{
    name: string;
    confidence: 'high' | 'medium' | 'low';
    description: string;
  }>;
}

interface MedicineSuggestion {
  suggestions: Array<{
    name: string;
    type: 'Tablet' | 'Syrup' | 'Injection' | 'Capsule' | 'Ointment';
    genericName?: string;
  }>;
}

interface TestSuggestion {
  suggestions: Array<{
    testName: string;
    testType: 'Blood' | 'Urine' | 'Imaging' | 'Other';
    reason: string;
  }>;
}
```

---

## Gemini Integration Templates

### Template 1: Basic Non-Streaming Suggestions

```typescript
// File: supabase/functions/prescription-suggest/index.ts
// OR: src/controllers/aiController.ts (Node.js)

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

interface SuggestionRequest {
  type: 'symptoms' | 'diagnosis' | 'medicines' | 'dosage' | 'frequency' | 'duration' | 'tests';
  context: Record<string, any>;
  query?: string;
}

const PROMPTS: Record<string, (ctx: any, query?: string) => string> = {
  symptoms: (ctx, query) => 
    `Given the partial symptom text "${query || ''}", suggest 5-8 common medical symptoms that match. Return as JSON array of strings only.`,
  
  diagnosis: (ctx) => 
    `Based on symptoms: "${ctx.symptoms || ''}", suggest 5-8 possible diagnoses. Return as JSON array: [{"name": "...", "confidence": "high/medium/low", "description": "..."}]`,
  
  medicines: (ctx) => 
    `For diagnosis "${ctx.diagnosis || ''}" with symptoms "${ctx.symptoms || ''}", suggest 5-10 medicines. Return as JSON array: [{"name": "...", "type": "Tablet/Syrup/etc", "genericName": "..."}]`,
  
  dosage: (ctx) => 
    `For medicine "${ctx.medicineName || ''}" (${ctx.medicineType || 'Tablet'}), patient: ${JSON.stringify(ctx.patientInfo || {})}. Suggest dosages as JSON array of strings.`,
  
  frequency: (ctx) => 
    `For medicine "${ctx.medicineName || ''}", suggest frequencies. Return as JSON array: ["Once daily", "Twice daily", "Three times daily", etc.]`,
  
  duration: (ctx) => 
    `For medicine "${ctx.medicineName || ''}" treating "${ctx.diagnosis || ''}", suggest durations. Return as JSON array: ["5 days", "7 days", "2 weeks", etc.]`,
  
  tests: (ctx) => 
    `For diagnosis "${ctx.diagnosis || ''}" with symptoms "${ctx.symptoms || ''}", suggest diagnostic tests. Return as JSON array: [{"testName": "...", "testType": "Blood/Urine/Imaging", "reason": "..."}]`,
};

export async function getSuggestions(request: SuggestionRequest): Promise<any[]> {
  const { type, context, query } = request;
  
  const systemPrompt = `You are a medical AI assistant. Provide accurate, evidence-based suggestions. Always respond with valid JSON arrays only. No markdown, no explanations.`;
  
  const userPrompt = PROMPTS[type](context, query);

  try {
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 1024,
      },
    });

    const responseText = result.response.text();
    
    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Gemini API error:', error);
    return [];
  }
}
```

### Template 2: Streaming Chat

```typescript
// File: src/services/geminiStreamService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function* streamChat(messages: Message[]): AsyncGenerator<string> {
  // Convert messages to Gemini format
  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });
  
  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessageStream(lastMessage.content);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}

// Express SSE endpoint
export async function handleStreamChat(req: Request, res: Response) {
  const { messages } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    for await (const chunk of streamChat(messages)) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
  }
  
  res.end();
}
```

### Template 3: Lovable AI Gateway (Current Setup)

```typescript
// File: supabase/functions/prescription-suggest/index.ts
// This is the CURRENT implementation using Lovable AI

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context, query } = await req.json();
    
    // LOVABLE_API_KEY is auto-provisioned
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build prompt based on type
    const systemPrompt = `You are a medical AI assistant. Respond with valid JSON arrays only.`;
    let userPrompt = buildPromptForType(type, context, query);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",  // Default Lovable AI model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      // Handle rate limits and payment errors
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "[]";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(JSON.stringify({ suggestions, type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### Template 4: Tool Calling / Structured Output

```typescript
// For extracting structured data with guaranteed schema

const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: "Extract prescription details from the text." },
      { role: "user", content: prescriptionText },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "extract_prescription",
          description: "Extract structured prescription data",
          parameters: {
            type: "object",
            properties: {
              medicines: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    dosage: { type: "string" },
                    frequency: { type: "string" },
                    duration: { type: "string" },
                  },
                  required: ["name", "dosage", "frequency", "duration"],
                },
              },
              diagnosis: { type: "string" },
              notes: { type: "string" },
            },
            required: ["medicines", "diagnosis"],
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "extract_prescription" } },
  }),
});
```

---

## Replacement Guide

### Step-by-Step Migration from Lovable Cloud to Custom Backend

#### Phase 1: Setup Infrastructure

```bash
# 1. Create new Node.js project
mkdir prescription-backend && cd prescription-backend
npm init -y

# 2. Install dependencies
npm install express mongoose dotenv cors helmet jsonwebtoken bcryptjs
npm install @google/generative-ai
npm install -D typescript @types/node @types/express nodemon ts-node

# 3. Initialize TypeScript
npx tsc --init
```

#### Phase 2: Environment Configuration

Create `.env` file:

```env
# Server
NODE_ENV=development
PORT=3000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/prescription-app

# Authentication
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Frontend URL (for CORS)
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Phase 3: Replace Supabase Client Calls

**Before (Lovable Cloud/Supabase):**

```typescript
// src/hooks/useAppointments.ts
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('user_id', userId)
  .order('appointment_date', { ascending: false });
```

**After (Custom Backend):**

```typescript
// src/hooks/useAppointments.ts
import { api } from '@/lib/api';

const { data, error } = await api.get('/appointments');
```

**API Client Setup:**

```typescript
// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const token = this.token || localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async get<T>(endpoint: string): Promise<{ data: T | null; error: string | null }> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: error.message || 'Request failed' };
      }
      
      const data = await response.json();
      return { data, error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }

  async post<T>(endpoint: string, body: any): Promise<{ data: T | null; error: string | null }> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: error.message || 'Request failed' };
      }
      
      const data = await response.json();
      return { data, error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }

  async put<T>(endpoint: string, body: any): Promise<{ data: T | null; error: string | null }> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: error.message || 'Request failed' };
      }
      
      const data = await response.json();
      return { data, error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }

  async delete<T>(endpoint: string): Promise<{ data: T | null; error: string | null }> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: error.message || 'Request failed' };
      }
      
      const data = await response.json();
      return { data, error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }
}

export const api = new ApiClient();
```

#### Phase 4: Replace Authentication

**Before (Supabase Auth):**

```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Logout
await supabase.auth.signOut();
```

**After (JWT Auth):**

```typescript
// src/contexts/AuthContext.tsx
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.setToken(token);
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    const { data, error } = await api.get<User>('/auth/me');
    if (data) {
      setUser(data);
    } else {
      api.clearToken();
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await api.post<{ token: string; user: User }>(
      '/auth/login',
      { email, password }
    );
    
    if (error) throw new Error(error);
    
    api.setToken(data!.token);
    setUser(data!.user);
  };

  const signup = async (email: string, password: string, name: string) => {
    const { data, error } = await api.post<{ token: string; user: User }>(
      '/auth/signup',
      { email, password, name }
    );
    
    if (error) throw new Error(error);
    
    api.setToken(data!.token);
    setUser(data!.user);
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### Phase 5: Replace Edge Functions

**Before (Supabase Edge Function):**

```typescript
const { data, error } = await supabase.functions.invoke('prescription-suggest', {
  body: { type, context, query },
});
```

**After (Custom API):**

```typescript
const { data, error } = await api.post('/ai/suggestions', {
  type,
  context,
  query,
});
```

#### Phase 6: Replace Realtime Subscriptions

**Before (Supabase Realtime):**

```typescript
const channel = supabase
  .channel('appointments')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, 
    (payload) => handleChange(payload)
  )
  .subscribe();
```

**After (Socket.io or Polling):**

```typescript
// Option 1: Socket.io
import { io } from 'socket.io-client';

const socket = io(API_URL);

socket.on('appointment:created', (data) => handleChange(data));
socket.on('appointment:updated', (data) => handleChange(data));
socket.on('appointment:deleted', (data) => handleChange(data));

// Option 2: Polling (simpler)
useEffect(() => {
  const interval = setInterval(() => {
    refetchAppointments();
  }, 30000); // Poll every 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

---

## Migration Checklist

### Pre-Migration

- [ ] Export all data from Lovable Cloud database
- [ ] Set up MongoDB Atlas cluster
- [ ] Get Google Gemini API key
- [ ] Prepare hosting (Railway, Render, Vercel, etc.)

### Backend Setup

- [ ] Initialize Node.js project with TypeScript
- [ ] Set up Express with middleware (CORS, Helmet, Morgan)
- [ ] Configure MongoDB connection
- [ ] Create Mongoose models (User, Appointment, Invoice, Referrer)
- [ ] Implement JWT authentication
- [ ] Create CRUD controllers for all entities
- [ ] Integrate Gemini API for suggestions
- [ ] Add error handling middleware
- [ ] Write API tests

### Frontend Updates

- [ ] Create API client utility
- [ ] Replace Supabase client imports
- [ ] Update AuthContext for JWT auth
- [ ] Replace `supabase.from()` calls with API calls
- [ ] Replace `supabase.functions.invoke()` calls
- [ ] Update realtime subscriptions (or implement polling)
- [ ] Update environment variables

### Data Migration

- [ ] Export appointments from Supabase
- [ ] Export invoices from Supabase
- [ ] Export referrers from Supabase
- [ ] Transform data for MongoDB format
- [ ] Import data to MongoDB Atlas
- [ ] Verify data integrity

### Testing

- [ ] Test all API endpoints
- [ ] Test authentication flow
- [ ] Test AI suggestions
- [ ] Test invoice calculations
- [ ] End-to-end testing
- [ ] Performance testing

### Deployment

- [ ] Deploy backend to hosting platform
- [ ] Configure environment variables
- [ ] Set up SSL/TLS
- [ ] Configure domain/subdomain
- [ ] Update frontend API URL
- [ ] Deploy frontend
- [ ] Monitor for errors

---

## Quick Reference: Supabase → Custom API Mapping

| Supabase Call | Custom API Equivalent |
|--------------|----------------------|
| `supabase.from('table').select()` | `api.get('/table')` |
| `supabase.from('table').insert(data)` | `api.post('/table', data)` |
| `supabase.from('table').update(data).eq('id', id)` | `api.put('/table/:id', data)` |
| `supabase.from('table').delete().eq('id', id)` | `api.delete('/table/:id')` |
| `supabase.auth.signInWithPassword()` | `api.post('/auth/login')` |
| `supabase.auth.signUp()` | `api.post('/auth/signup')` |
| `supabase.auth.signOut()` | `api.post('/auth/logout')` |
| `supabase.auth.getUser()` | `api.get('/auth/me')` |
| `supabase.functions.invoke('fn', { body })` | `api.post('/fn', body)` |

---

## Summary

This guide provides:

- ✅ Complete API endpoint documentation
- ✅ Request/response schemas for all entities
- ✅ Four Gemini integration templates (basic, streaming, Lovable AI, tool calling)
- ✅ Step-by-step migration guide
- ✅ Code replacement examples
- ✅ Migration checklist

For questions or issues during migration, refer to:
- [Node.js Express Docs](https://expressjs.com/)
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [Google Gemini API Docs](https://ai.google.dev/docs)
