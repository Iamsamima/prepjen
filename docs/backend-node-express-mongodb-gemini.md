# Backend Setup Guide: Node.js + Express + MongoDB + Gemini API

This guide explains how to create a backend server using Node.js, Express, MongoDB, and Google's Gemini API for AI-powered features.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [MongoDB Setup](#mongodb-setup)
4. [Express Server Configuration](#express-server-configuration)
5. [Database Models](#database-models)
6. [API Routes](#api-routes)
7. [Gemini AI Integration](#gemini-ai-integration)
8. [Authentication Middleware](#authentication-middleware)
9. [Environment Variables](#environment-variables)
10. [Deployment](#deployment)

---

## Prerequisites

- Node.js v18+ installed
- MongoDB Atlas account or local MongoDB installation
- Google Cloud account with Gemini API access
- npm or yarn package manager

---

## Project Setup

### 1. Initialize the Project

```bash
mkdir prescription-backend
cd prescription-backend
npm init -y
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install express mongoose dotenv cors helmet morgan

# AI & Authentication
npm install @google/generative-ai jsonwebtoken bcryptjs

# Validation & Utilities
npm install express-validator uuid

# Development dependencies
npm install -D nodemon typescript @types/node @types/express ts-node
```

### 3. Project Structure

```
prescription-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── gemini.ts
│   ├── controllers/
│   │   ├── appointmentController.ts
│   │   ├── invoiceController.ts
│   │   ├── prescriptionController.ts
│   │   └── aiController.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── models/
│   │   ├── Appointment.ts
│   │   ├── Invoice.ts
│   │   ├── Referrer.ts
│   │   └── User.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── appointments.ts
│   │   ├── invoices.ts
│   │   └── ai.ts
│   ├── services/
│   │   └── geminiService.ts
│   ├── utils/
│   │   └── helpers.ts
│   └── app.ts
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## MongoDB Setup

### 1. Database Configuration

**`src/config/database.ts`**

```typescript
import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prescription-app';
    
    await mongoose.connect(mongoURI, {
      // MongoDB driver options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;
```

### 2. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use `0.0.0.0/0` for all IPs)
5. Get the connection string and add it to `.env`

---

## Express Server Configuration

**`src/app.ts`**

```typescript
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import connectDB from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
```

---

## Database Models

### Appointment Model

**`src/models/Appointment.ts`**

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  user_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_age?: number;
  patient_gender?: 'male' | 'female' | 'other';
  appointment_date: Date;
  appointment_time: string;
  status: 'scheduled' | 'seen' | 'cancelled' | 'no-show';
  payment_status: 'pending' | 'paid' | 'partial';
  amount_charged: number;
  amount_paid: number;
  notes?: string;
  prescription_data?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    user_id: { type: String, required: true, index: true },
    patient_name: { type: String, required: true },
    patient_phone: { type: String },
    patient_email: { type: String },
    patient_age: { type: Number },
    patient_gender: { type: String, enum: ['male', 'female', 'other'] },
    appointment_date: { type: Date, required: true, index: true },
    appointment_time: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'seen', 'cancelled', 'no-show'],
      default: 'scheduled',
      index: true,
    },
    payment_status: {
      type: String,
      enum: ['pending', 'paid', 'partial'],
      default: 'pending',
      index: true,
    },
    amount_charged: { type: Number, default: 0 },
    amount_paid: { type: Number, default: 0 },
    notes: { type: String },
    prescription_data: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound indexes for common queries
appointmentSchema.index({ user_id: 1, appointment_date: -1 });
appointmentSchema.index({ user_id: 1, status: 1 });

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);
```

### Invoice Model

**`src/models/Invoice.ts`**

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoice extends Document {
  user_id: string;
  invoice_number: string;
  appointment_id?: mongoose.Types.ObjectId;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  invoice_date: Date;
  doctor_fees: number;
  platform_fees: number;
  gst_percentage: number;
  gst_amount: number;
  discount_percentage: number;
  discount_amount: number;
  other_charges: number;
  other_charges_description?: string;
  subtotal: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  payment_method?: string;
  payment_date?: Date;
  is_referred: boolean;
  referrer_id?: mongoose.Types.ObjectId;
  referral_commission_percentage: number;
  referral_commission_amount: number;
  referral_commission_paid: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    user_id: { type: String, required: true, index: true },
    invoice_number: { type: String, required: true, unique: true },
    appointment_id: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    patient_name: { type: String, required: true },
    patient_phone: { type: String },
    patient_email: { type: String },
    invoice_date: { type: Date, default: Date.now, index: true },
    doctor_fees: { type: Number, default: 0 },
    platform_fees: { type: Number, default: 0 },
    gst_percentage: { type: Number, default: 18 },
    gst_amount: { type: Number, default: 0 },
    discount_percentage: { type: Number, default: 0 },
    discount_amount: { type: Number, default: 0 },
    other_charges: { type: Number, default: 0 },
    other_charges_description: { type: String },
    subtotal: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'cancelled'],
      default: 'draft',
      index: true,
    },
    payment_method: { type: String },
    payment_date: { type: Date },
    is_referred: { type: Boolean, default: false },
    referrer_id: { type: Schema.Types.ObjectId, ref: 'Referrer' },
    referral_commission_percentage: { type: Number, default: 0 },
    referral_commission_amount: { type: Number, default: 0 },
    referral_commission_paid: { type: Boolean, default: false },
    notes: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Auto-generate invoice number before saving
invoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoice_number) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoice_number = `INV-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model<IInvoice>('Invoice', invoiceSchema);
```

### Referrer Model

**`src/models/Referrer.ts`**

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IReferrer extends Document {
  user_id: string;
  name: string;
  type: 'individual' | 'clinic' | 'hospital' | 'other';
  phone?: string;
  email?: string;
  default_commission_percentage: number;
  total_commission_earned: number;
  total_commission_paid: number;
  is_active: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const referrerSchema = new Schema<IReferrer>(
  {
    user_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['individual', 'clinic', 'hospital', 'other'],
      default: 'individual',
    },
    phone: { type: String },
    email: { type: String },
    default_commission_percentage: { type: Number, default: 10 },
    total_commission_earned: { type: Number, default: 0 },
    total_commission_paid: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    notes: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default mongoose.model<IReferrer>('Referrer', referrerSchema);
```

---

## Gemini AI Integration

### 1. Gemini Configuration

**`src/config/gemini.ts`**

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash', // Fast and efficient
});

export const geminiProModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro', // For complex tasks
});

export default genAI;
```

### 2. AI Service

**`src/services/geminiService.ts`**

```typescript
import { geminiModel } from '../config/gemini';

interface SuggestionContext {
  symptoms?: string;
  diagnosis?: string;
  medicineName?: string;
  medicineType?: string;
  patientInfo?: {
    age?: string;
    gender?: string;
    weight?: string;
  };
}

type SuggestionType = 
  | 'symptoms' 
  | 'diagnosis' 
  | 'medicines' 
  | 'dosage' 
  | 'frequency' 
  | 'duration' 
  | 'tests';

export class GeminiService {
  private static buildPrompt(type: SuggestionType, context: SuggestionContext, query?: string): string {
    const prompts: Record<SuggestionType, string> = {
      symptoms: `Given the partial symptom text "${query || ''}", suggest 5-8 common medical symptoms that match or start with this text. Return as JSON array of strings. Example: ["Fever", "Fatigue", "Headache"]`,
      
      diagnosis: `Based on these symptoms: "${context.symptoms || ''}", suggest 5-8 possible diagnoses. Return as JSON array of objects with format: [{"name": "Diagnosis Name", "confidence": "high/medium/low", "description": "Brief description"}]`,
      
      medicines: `For the diagnosis "${context.diagnosis || ''}" with symptoms "${context.symptoms || ''}", suggest 5-10 commonly prescribed medicines. Return as JSON array of objects: [{"name": "Medicine Name", "type": "Tablet/Syrup/Injection/Capsule/Ointment", "genericName": "Generic name if applicable"}]`,
      
      dosage: `For the medicine "${context.medicineName || ''}" (${context.medicineType || 'Tablet'}), suggest common dosages. Patient info: ${JSON.stringify(context.patientInfo || {})}. Return as JSON array of strings like: ["500mg", "250mg", "1g"]`,
      
      frequency: `For the medicine "${context.medicineName || ''}" with dosage, suggest common frequencies. Return as JSON array of strings like: ["Once daily", "Twice daily", "Three times daily", "Every 8 hours"]`,
      
      duration: `For the medicine "${context.medicineName || ''}" used for "${context.diagnosis || ''}", suggest common treatment durations. Return as JSON array of strings like: ["5 days", "7 days", "10 days", "2 weeks"]`,
      
      tests: `For the diagnosis "${context.diagnosis || ''}" with symptoms "${context.symptoms || ''}", suggest relevant diagnostic tests. Return as JSON array of objects: [{"testName": "Test Name", "testType": "Blood/Urine/Imaging/Other", "reason": "Why recommended"}]`,
    };

    return prompts[type];
  }

  static async getSuggestions(
    type: SuggestionType,
    context: SuggestionContext,
    query?: string
  ): Promise<any[]> {
    try {
      const prompt = this.buildPrompt(type, context, query);
      
      const result = await geminiModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a medical AI assistant helping doctors write prescriptions. Provide accurate, evidence-based suggestions. Always respond with valid JSON arrays only.\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 1024,
        },
      });

      const responseText = result.response.text();
      
      // Extract JSON from response
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

  static async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      const chat = geminiModel.startChat({
        history: messages.slice(0, -1).map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      });

      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      
      return result.response.text();
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw error;
    }
  }

  static async streamChat(
    messages: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const chat = geminiModel.startChat({
        history: messages.slice(0, -1).map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      });

      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessageStream(lastMessage.content);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        onChunk(chunkText);
      }
    } catch (error) {
      console.error('Gemini stream error:', error);
      throw error;
    }
  }
}
```

### 3. AI Controller

**`src/controllers/aiController.ts`**

```typescript
import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const { type, context, query } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Suggestion type is required' });
    }

    const suggestions = await GeminiService.getSuggestions(type, context || {}, query);
    
    res.json({ suggestions, type });
  } catch (error) {
    console.error('Suggestion error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
};

export const chat = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await GeminiService.chat(messages);
    
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
};

export const streamChat = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await GeminiService.streamChat(messages, (chunk) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream chat error:', error);
    res.status(500).json({ error: 'Failed to process stream' });
  }
};
```

---

## API Routes

**`src/routes/index.ts`**

```typescript
import { Router } from 'express';
import appointmentRoutes from './appointments';
import invoiceRoutes from './invoices';
import aiRoutes from './ai';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.use('/ai', aiRoutes);

// Protected routes
router.use('/appointments', authMiddleware, appointmentRoutes);
router.use('/invoices', authMiddleware, invoiceRoutes);

export default router;
```

**`src/routes/ai.ts`**

```typescript
import { Router } from 'express';
import { getSuggestions, chat, streamChat } from '../controllers/aiController';

const router = Router();

router.post('/suggestions', getSuggestions);
router.post('/chat', chat);
router.post('/chat/stream', streamChat);

export default router;
```

---

## Authentication Middleware

**`src/middleware/auth.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: string;
    };

    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
```

**`src/middleware/errorHandler.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message,
    });
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      details: err.message,
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
```

---

## Environment Variables

**`.env.example`**

```env
# Server
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/prescription-app?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## Deployment

### Docker Deployment

**`Dockerfile`**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/app.js"]
```

**`docker-compose.yml`**

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: unless-stopped
```

### Deploy to Railway/Render

1. Push code to GitHub
2. Connect repository to Railway or Render
3. Add environment variables
4. Deploy automatically on push

---

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add to your `.env` file

---

## Frontend Integration

Update your frontend to call the new backend:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Fetch AI suggestions
const getSuggestions = async (type: string, context: object, query?: string) => {
  const response = await fetch(`${API_URL}/ai/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, context, query }),
  });
  return response.json();
};
```

---

## Summary

This guide covers:
- ✅ Express server setup with security middleware
- ✅ MongoDB models matching current schema
- ✅ Gemini AI integration for suggestions
- ✅ JWT authentication
- ✅ Error handling
- ✅ Docker deployment

For the current Lovable Cloud setup, use the Supabase Edge Functions which provide the same functionality without managing a separate server.
