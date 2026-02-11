# MediPrescribe Pro — Complete Backend API Reference

> **Full-stack analysis**: Every API below is mapped 1:1 from the existing frontend hooks (`useAppointments`, `useInvoices`, `useReferrers`, `usePatientHistory`, `usePrescriptionSuggestions`, `useTemplates`, `AuthContext`).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Setup](#project-setup)
4. [Environment Variables](#environment-variables)
5. [Database Models (MongoDB Schemas)](#database-models)
6. [Middleware](#middleware)
7. [Error Handling](#error-handling)
8. [API Endpoints — Full Reference](#api-endpoints)
   - [Auth](#1-authentication)
   - [Appointments](#2-appointments)
   - [Patient History / Search](#3-patient-history--search)
   - [Invoices](#4-invoices)
   - [Referrers](#5-referrers)
   - [AI Prescription Suggestions](#6-ai-prescription-suggestions-gemini)
   - [Templates](#7-templates--doctor-profile)
   - [Dashboard Stats](#8-dashboard-stats)
   - [Demo / Health](#9-demo--health-endpoints)
9. [Swagger / OpenAPI Setup](#swagger--openapi-setup)
10. [Debouncing & Regex Search Strategy](#debouncing--regex-search)
11. [Gemini AI Integration Templates](#gemini-ai-integration)
12. [Frontend Replacement Guide](#frontend-replacement-guide)
13. [Deployment](#deployment)
14. [Migration Checklist](#migration-checklist)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  (useAppointments, useInvoices, useReferrers, etc.)     │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────▼──────────────────────────────────┐
│              Node.js + Express Backend                   │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │ Auth MW  │  │ Validator │  │  Error Handler       │  │
│  └────┬─────┘  └─────┬─────┘  └──────────┬───────────┘  │
│       │              │                   │               │
│  ┌────▼──────────────▼───────────────────▼───────────┐  │
│  │                Route Handlers                      │  │
│  │  /auth  /appointments  /invoices  /referrers       │  │
│  │  /suggestions  /templates  /stats  /demo           │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │                                  │
│  ┌────────────────────▼──────────────────────────────┐  │
│  │  MongoDB (Mongoose)  │  Gemini AI Gateway         │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Runtime       | Node.js 20+                         |
| Framework     | Express 5.x                         |
| Database      | MongoDB 7+ / Mongoose 8+            |
| Auth          | JWT (jsonwebtoken) + bcryptjs        |
| Validation    | Zod                                 |
| AI            | Google Gemini via `@google/generative-ai` |
| Docs          | swagger-jsdoc + swagger-ui-express   |
| Rate Limit    | express-rate-limit                   |
| Search        | MongoDB regex with text indexes      |
| Caching       | node-cache (in-memory, 5min TTL)     |

---

## Project Setup

```bash
mkdir mediprescribe-backend && cd mediprescribe-backend
npm init -y

# Core
npm i express mongoose dotenv cors helmet morgan compression

# Auth
npm i jsonwebtoken bcryptjs

# Validation
npm i zod

# AI
npm i @google/generative-ai

# API Docs
npm i swagger-jsdoc swagger-ui-express

# Rate limiting & caching
npm i express-rate-limit node-cache

# Dev
npm i -D typescript @types/node @types/express @types/cors @types/morgan
npm i -D @types/jsonwebtoken @types/bcryptjs @types/swagger-jsdoc @types/swagger-ui-express
npm i -D tsx nodemon
```

### `package.json` scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "seed": "tsx src/scripts/seed.ts"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*"]
}
```

---

## Environment Variables

```env
# .env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/mediprescribe
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Gemini AI
GEMINI_API_KEY=your-google-gemini-api-key

# OR use Lovable AI Gateway (current setup)
LOVABLE_API_KEY=your-lovable-api-key
AI_GATEWAY_URL=https://ai.gateway.lovable.dev/v1/chat/completions

# Rate limits
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AI_RATE_LIMIT_MAX=30

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173
```

---

## Database Models

### `src/models/User.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false, // Never return password by default
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
```

### `src/models/Appointment.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

// Maps to: useAppointments.ts → Appointment interface
export interface IAppointment extends Document {
  user_id: mongoose.Types.ObjectId;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_age?: number;
  patient_gender?: string;
  appointment_date: string;     // 'yyyy-MM-dd'
  appointment_time: string;     // 'HH:mm'
  status: 'scheduled' | 'seen' | 'cancelled' | 'no-show';
  payment_status: 'pending' | 'paid' | 'partial';
  amount_charged: number;
  amount_paid: number;
  notes?: string;
  prescription_data?: Record<string, any>; // JSONB equivalent
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  patient_name: { type: String, required: true, trim: true, maxlength: 200 },
  patient_phone: { type: String, trim: true, maxlength: 20 },
  patient_email: { type: String, trim: true, lowercase: true, maxlength: 255 },
  patient_age: { type: Number, min: 0, max: 150 },
  patient_gender: { type: String, enum: ['Male', 'Female', 'Other', null] },
  appointment_date: { type: String, required: true },
  appointment_time: { type: String, required: true },
  status: {
    type: String,
    enum: ['scheduled', 'seen', 'cancelled', 'no-show'],
    default: 'scheduled',
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'partial'],
    default: 'pending',
  },
  amount_charged: { type: Number, default: 0, min: 0 },
  amount_paid: { type: Number, default: 0, min: 0 },
  notes: { type: String, maxlength: 2000 },
  prescription_data: { type: Schema.Types.Mixed, default: null },
}, { timestamps: true });

// Compound indexes for common queries (from useAppointments.fetchAppointments)
appointmentSchema.index({ user_id: 1, appointment_date: 1, appointment_time: 1 });
// Text index for regex search (from usePatientHistory)
appointmentSchema.index({ patient_name: 'text', patient_phone: 'text' });
// Index for patient phone search
appointmentSchema.index({ user_id: 1, patient_phone: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
```

### `src/models/Invoice.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

// Maps to: useInvoices.ts → Invoice interface
export interface IInvoice extends Document {
  user_id: mongoose.Types.ObjectId;
  appointment_id?: mongoose.Types.ObjectId;
  invoice_number: string;
  invoice_date: string;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
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
  is_referred: boolean;
  referrer_id?: mongoose.Types.ObjectId;
  referral_commission_percentage: number;
  referral_commission_amount: number;
  referral_commission_paid: boolean;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  payment_method?: string;
  payment_date?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  appointment_id: { type: Schema.Types.ObjectId, ref: 'Appointment', default: null },
  invoice_number: { type: String, required: true, unique: true },
  invoice_date: { type: String, required: true },
  patient_name: { type: String, required: true, trim: true },
  patient_phone: { type: String, trim: true },
  patient_email: { type: String, trim: true, lowercase: true },
  doctor_fees: { type: Number, default: 0, min: 0 },
  platform_fees: { type: Number, default: 0, min: 0 },
  gst_percentage: { type: Number, default: 18, min: 0, max: 100 },
  gst_amount: { type: Number, default: 0 },
  discount_percentage: { type: Number, default: 0, min: 0, max: 100 },
  discount_amount: { type: Number, default: 0 },
  other_charges: { type: Number, default: 0, min: 0 },
  other_charges_description: { type: String },
  subtotal: { type: Number, default: 0 },
  total_amount: { type: Number, default: 0 },
  is_referred: { type: Boolean, default: false },
  referrer_id: { type: Schema.Types.ObjectId, ref: 'Referrer', default: null },
  referral_commission_percentage: { type: Number, default: 0 },
  referral_commission_amount: { type: Number, default: 0 },
  referral_commission_paid: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'cancelled'],
    default: 'draft',
  },
  payment_method: { type: String, enum: ['cash', 'upi', 'card', 'netbanking', null] },
  payment_date: { type: String },
  notes: { type: String, maxlength: 2000 },
}, { timestamps: true });

invoiceSchema.index({ user_id: 1, created_at: -1 });
invoiceSchema.index({ invoice_number: 1 }, { unique: true });
invoiceSchema.index({ patient_name: 'text', patient_phone: 'text' });

// Auto-generate invoice number (maps to useInvoices.generateInvoiceNumber)
invoiceSchema.pre('save', function (next) {
  if (!this.invoice_number) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.invoice_number = `INV-${year}${month}-${random}`;
  }
  next();
});

// Auto-calculate totals (maps to useInvoices.calculateInvoice)
invoiceSchema.pre('save', function (next) {
  this.subtotal = this.doctor_fees + this.platform_fees + this.other_charges;
  this.discount_amount = (this.subtotal * this.discount_percentage) / 100;
  const afterDiscount = this.subtotal - this.discount_amount;
  this.gst_amount = (afterDiscount * this.gst_percentage) / 100;
  this.total_amount = afterDiscount + this.gst_amount;

  if (this.is_referred && this.referral_commission_percentage > 0) {
    this.referral_commission_amount = (this.doctor_fees * this.referral_commission_percentage) / 100;
  } else {
    this.referral_commission_amount = 0;
  }
  next();
});

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
```

### `src/models/Referrer.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

// Maps to: useReferrers.ts → Referrer interface
export interface IReferrer extends Document {
  user_id: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  type: 'individual' | 'clinic' | 'hospital' | 'other';
  default_commission_percentage: number;
  total_commission_earned: number;
  total_commission_paid: number;
  is_active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const referrerSchema = new Schema<IReferrer>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  type: {
    type: String,
    enum: ['individual', 'clinic', 'hospital', 'other'],
    default: 'individual',
  },
  default_commission_percentage: { type: Number, default: 10, min: 0, max: 100 },
  total_commission_earned: { type: Number, default: 0 },
  total_commission_paid: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  notes: { type: String, maxlength: 2000 },
}, { timestamps: true });

referrerSchema.index({ user_id: 1, is_active: 1, name: 1 });
referrerSchema.index({ name: 'text' });

export const Referrer = mongoose.model<IReferrer>('Referrer', referrerSchema);
```

### `src/models/Template.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

// Maps to: useTemplates.ts (currently localStorage, migrated to DB)
export interface ITemplate extends Document {
  user_id: mongoose.Types.ObjectId;
  type: 'medicine' | 'diagnosis' | 'prescription';
  name: string;
  data: Record<string, any>;
  createdAt: Date;
}

const templateSchema = new Schema<ITemplate>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['medicine', 'diagnosis', 'prescription'], required: true },
  name: { type: String, required: true, trim: true },
  data: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

templateSchema.index({ user_id: 1, type: 1 });

export const Template = mongoose.model<ITemplate>('Template', templateSchema);
```

### `src/models/DoctorProfile.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

// Maps to: useTemplates.ts → doctorProfile (currently localStorage)
export interface IDoctorProfile extends Document {
  user_id: mongoose.Types.ObjectId;
  name: string;
  qualifications: string;
  specialization: string;
  registrationNo: string;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicState: string;
  clinicPincode: string;
  phone: string;
  email: string;
  website: string;
  chamberName: string;
  chamberAddress: string;
  chamberTimings: string;
  chamberPhone: string;
  signatureImage: string;
  headerImage: string;
  footerImage: string;
  logoImage: string;
}

const doctorProfileSchema = new Schema<IDoctorProfile>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, default: '' },
  qualifications: { type: String, default: '' },
  specialization: { type: String, default: '' },
  registrationNo: { type: String, default: '' },
  clinicName: { type: String, default: '' },
  clinicAddress: { type: String, default: '' },
  clinicCity: { type: String, default: '' },
  clinicState: { type: String, default: '' },
  clinicPincode: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  chamberName: { type: String, default: '' },
  chamberAddress: { type: String, default: '' },
  chamberTimings: { type: String, default: '' },
  chamberPhone: { type: String, default: '' },
  signatureImage: { type: String, default: '' },
  headerImage: { type: String, default: '' },
  footerImage: { type: String, default: '' },
  logoImage: { type: String, default: '' },
}, { timestamps: true });

export const DoctorProfile = mongoose.model<IDoctorProfile>('DoctorProfile', doctorProfileSchema);
```

---

## Middleware

### `src/middleware/auth.ts` — JWT Authentication

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
};
```

### `src/middleware/validate.ts` — Zod Validation

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};
```

### `src/middleware/rateLimiter.ts`

```typescript
import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.AI_RATE_LIMIT_MAX || '30'),
  message: {
    success: false,
    error: 'AI rate limit exceeded. Please wait a moment.',
    code: 'AI_RATE_LIMIT',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many auth attempts',
    code: 'AUTH_RATE_LIMIT',
  },
});
```

---

## Error Handling

### `src/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export const errorHandler = (err: AppError, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    const fields = Object.entries(err.errors).map(([field, e]) => ({
      field,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: fields,
    });
  }

  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: `Duplicate value for field: ${field}`,
      code: 'DUPLICATE_KEY',
      field,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      error: `Invalid ${err.path}: ${err.value}`,
      code: 'INVALID_ID',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Gemini AI errors
  if (err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('429')) {
    return res.status(429).json({
      success: false,
      error: 'AI rate limit exceeded. Please try again later.',
      code: 'AI_RATE_LIMIT',
    });
  }

  if (err.message?.includes('402') || err.message?.includes('credits')) {
    return res.status(402).json({
      success: false,
      error: 'AI credits exhausted',
      code: 'AI_CREDITS_EXHAUSTED',
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

// Async handler wrapper to avoid try-catch in every route
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### Standard Response Format

All responses follow this structure:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 20 }  // optional for lists
}

// Error
{
  "success": false,
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": [...]  // optional validation details
}
```

---

## API Endpoints

### Base URL: `http://localhost:5000/api/v1`

---

### 1. Authentication

> **Maps to**: `src/contexts/AuthContext.tsx`

#### `POST /auth/signup`

```typescript
/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: doctor@clinic.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: securePassword123
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Email already exists
 */
```

**Request:**
```json
{
  "email": "doctor@clinic.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "doctor@clinic.com" },
    "token": "eyJhbGci..."
  }
}
```

#### `POST /auth/login`

```typescript
/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email & password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
```

#### `POST /auth/logout`

Invalidate token (client-side removal, optionally add token blacklist).

#### `GET /auth/me`

Returns current user profile. Requires `Authorization: Bearer <token>`.

### Route Implementation: `src/routes/auth.ts`

```typescript
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

const signupSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(6).max(128),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  }),
});

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /auth/signup
router.post('/signup', authLimiter, validate(signupSchema), asyncHandler(async (req: any, res: any) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'Email already registered',
      code: 'DUPLICATE_EMAIL',
    });
  }

  const user = await User.create({ email, password });
  const token = generateToken(user._id.toString());

  res.status(201).json({
    success: true,
    data: {
      user: { id: user._id, email: user.email },
      token,
    },
  });
}));

// POST /auth/login
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(async (req: any, res: any) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS',
    });
  }

  const token = generateToken(user._id.toString());

  res.json({
    success: true,
    data: {
      user: { id: user._id, email: user.email },
      token,
    },
  });
}));

// GET /auth/me
router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: any) => {
  res.json({
    success: true,
    data: { user: { id: req.user!._id, email: req.user!.email } },
  });
}));

export default router;
```

---

### 2. Appointments

> **Maps to**: `src/hooks/useAppointments.ts` — all CRUD + date filtering

#### Endpoints

| Method   | Path                          | Description                                    | Frontend Source                          |
|----------|-------------------------------|------------------------------------------------|-----------------------------------------|
| `GET`    | `/appointments`               | List with date range filter                    | `fetchAppointments()`                   |
| `GET`    | `/appointments/:id`           | Get single appointment                         | N/A (new)                               |
| `POST`   | `/appointments`               | Create appointment                             | `createAppointment()`                   |
| `PUT`    | `/appointments/:id`           | Update (status, prescription, payment)         | `updateAppointment()`                   |
| `DELETE` | `/appointments/:id`           | Delete appointment                             | `deleteAppointment()`                   |
| `GET`    | `/appointments/search`        | Regex search by name/phone (debounced)         | `usePatientHistory` search methods      |

#### `GET /appointments`

```typescript
/**
 * @swagger
 * /api/v1/appointments:
 *   get:
 *     tags: [Appointments]
 *     summary: List appointments with date range filter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (yyyy-MM-dd)
 *         example: "2026-02-11"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (yyyy-MM-dd)
 *         example: "2026-02-11"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, seen, cancelled, no-show]
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [pending, paid, partial]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of appointments
 */
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "patient_name": "Rajesh Kumar",
      "patient_phone": "+919876543210",
      "appointment_date": "2026-02-11",
      "appointment_time": "10:30",
      "status": "scheduled",
      "payment_status": "pending",
      "amount_charged": 500,
      "amount_paid": 0,
      "prescription_data": null
    }
  ],
  "meta": { "total": 25, "page": 1, "limit": 50 }
}
```

#### `GET /appointments/search` — Regex Search with Debouncing

```typescript
/**
 * @swagger
 * /api/v1/appointments/search:
 *   get:
 *     tags: [Appointments]
 *     summary: Search appointments by patient name or phone (regex)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (name or phone, supports partial match)
 *         example: "Rajesh"
 *       - in: query
 *         name: field
 *         schema:
 *           type: string
 *           enum: [name, phone, all]
 *           default: all
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 */
```

#### `POST /appointments`

```typescript
/**
 * @swagger
 * /api/v1/appointments:
 *   post:
 *     tags: [Appointments]
 *     summary: Create a new appointment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_name, appointment_date, appointment_time]
 *             properties:
 *               patient_name:
 *                 type: string
 *                 example: "Rajesh Kumar"
 *               patient_phone:
 *                 type: string
 *                 example: "+919876543210"
 *               patient_email:
 *                 type: string
 *               patient_age:
 *                 type: integer
 *                 example: 45
 *               patient_gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               appointment_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-02-12"
 *               appointment_time:
 *                 type: string
 *                 example: "10:30"
 *               status:
 *                 type: string
 *                 enum: [scheduled, seen, cancelled, no-show]
 *                 default: scheduled
 *               payment_status:
 *                 type: string
 *                 enum: [pending, paid, partial]
 *                 default: pending
 *               amount_charged:
 *                 type: number
 *                 example: 500
 *               amount_paid:
 *                 type: number
 *                 example: 0
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment created
 */
```

#### `PUT /appointments/:id`

```typescript
/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   put:
 *     tags: [Appointments]
 *     summary: Update an appointment (status, payment, prescription)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               payment_status:
 *                 type: string
 *               amount_paid:
 *                 type: number
 *               prescription_data:
 *                 type: object
 *                 description: Full prescription JSON (symptoms, diagnosis, medicines, tests, vitals)
 *     responses:
 *       200:
 *         description: Appointment updated
 *       404:
 *         description: Appointment not found
 */
```

#### `DELETE /appointments/:id`

```typescript
/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   delete:
 *     tags: [Appointments]
 *     summary: Delete an appointment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointment deleted
 *       404:
 *         description: Not found
 */
```

### Route Implementation: `src/routes/appointments.ts`

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { Appointment } from '../models/Appointment';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation schemas
const createSchema = z.object({
  body: z.object({
    patient_name: z.string().trim().min(1).max(200),
    patient_phone: z.string().trim().max(20).optional(),
    patient_email: z.string().trim().email().max(255).optional(),
    patient_age: z.number().int().min(0).max(150).optional(),
    patient_gender: z.enum(['Male', 'Female', 'Other']).optional(),
    appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
    status: z.enum(['scheduled', 'seen', 'cancelled', 'no-show']).default('scheduled'),
    payment_status: z.enum(['pending', 'paid', 'partial']).default('pending'),
    amount_charged: z.number().min(0).default(0),
    amount_paid: z.number().min(0).default(0),
    notes: z.string().max(2000).optional(),
  }),
});

const updateSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    patient_name: z.string().trim().min(1).max(200).optional(),
    patient_phone: z.string().trim().max(20).optional(),
    patient_email: z.string().trim().email().max(255).optional(),
    patient_age: z.number().int().min(0).max(150).optional(),
    patient_gender: z.enum(['Male', 'Female', 'Other']).optional(),
    appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    appointment_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    status: z.enum(['scheduled', 'seen', 'cancelled', 'no-show']).optional(),
    payment_status: z.enum(['pending', 'paid', 'partial']).optional(),
    amount_charged: z.number().min(0).optional(),
    amount_paid: z.number().min(0).optional(),
    notes: z.string().max(2000).optional(),
    prescription_data: z.any().optional(),
  }),
});

const searchSchema = z.object({
  query: z.object({
    q: z.string().trim().min(1).max(100),
    field: z.enum(['name', 'phone', 'all']).default('all'),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

// GET /appointments — list with date range
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const { from, to, status, payment_status, page = '1', limit = '50' } = req.query as any;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  const filter: any = { user_id: req.user!._id };

  if (from && to) {
    filter.appointment_date = { $gte: from, $lte: to };
  } else if (from) {
    filter.appointment_date = { $gte: from };
  }

  if (status) filter.status = status;
  if (payment_status) filter.payment_status = payment_status;

  const [data, total] = await Promise.all([
    Appointment.find(filter)
      .sort({ appointment_date: 1, appointment_time: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data,
    meta: { total, page: pageNum, limit: limitNum },
  });
}));

// GET /appointments/search — regex search (maps to usePatientHistory)
router.get('/search', validate(searchSchema), asyncHandler(async (req: AuthRequest, res: any) => {
  const { q, field, limit } = req.query as any;
  const limitNum = parseInt(limit) || 20;

  // Escape special regex characters to prevent ReDoS
  const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedQuery, 'i');

  const filter: any = { user_id: req.user!._id };

  if (field === 'name') {
    filter.patient_name = regex;
  } else if (field === 'phone') {
    filter.patient_phone = regex;
  } else {
    // Search both fields
    filter.$or = [
      { patient_name: regex },
      { patient_phone: regex },
    ];
  }

  const results = await Appointment.find(filter)
    .sort({ appointment_date: -1, appointment_time: -1 })
    .limit(limitNum)
    .lean();

  res.json({
    success: true,
    data: results,
    meta: { total: results.length },
  });
}));

// GET /appointments/:id
router.get('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    user_id: req.user!._id,
  }).lean();

  if (!appointment) {
    return res.status(404).json({
      success: false,
      error: 'Appointment not found',
      code: 'NOT_FOUND',
    });
  }

  res.json({ success: true, data: appointment });
}));

// POST /appointments
router.post('/', validate(createSchema), asyncHandler(async (req: AuthRequest, res: any) => {
  const appointment = await Appointment.create({
    ...req.body,
    user_id: req.user!._id,
  });

  res.status(201).json({ success: true, data: appointment });
}));

// PUT /appointments/:id
router.put('/:id', validate(updateSchema), asyncHandler(async (req: AuthRequest, res: any) => {
  const appointment = await Appointment.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user!._id },
    { $set: req.body },
    { new: true, runValidators: true }
  ).lean();

  if (!appointment) {
    return res.status(404).json({
      success: false,
      error: 'Appointment not found',
      code: 'NOT_FOUND',
    });
  }

  res.json({ success: true, data: appointment });
}));

// DELETE /appointments/:id
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const result = await Appointment.findOneAndDelete({
    _id: req.params.id,
    user_id: req.user!._id,
  });

  if (!result) {
    return res.status(404).json({
      success: false,
      error: 'Appointment not found',
      code: 'NOT_FOUND',
    });
  }

  res.json({ success: true, data: { message: 'Appointment deleted' } });
}));

export default router;
```

---

### 3. Patient History / Search

> **Maps to**: `src/hooks/usePatientHistory.ts`

Patient search is handled via the `/appointments/search` endpoint above. The frontend methods map as follows:

| Frontend Method             | Backend Endpoint                                  |
|-----------------------------|---------------------------------------------------|
| `searchByPhone(phone)`      | `GET /appointments/search?q={phone}&field=phone`  |
| `searchByName(name)`        | `GET /appointments/search?q={name}&field=name`    |
| `getPatientAppointments()`  | `GET /appointments/search?q={phone_or_name}&field=all` |

**Debouncing Note**: Debouncing (600ms) is handled client-side in `usePrescriptionSuggestions.ts`. The backend protects itself with rate limiting.

---

### 4. Invoices

> **Maps to**: `src/hooks/useInvoices.ts` — all CRUD + calculation + mark-as-paid

#### Endpoints

| Method   | Path                        | Description                        | Frontend Source          |
|----------|-----------------------------|------------------------------------|--------------------------|
| `GET`    | `/invoices`                 | List all invoices                  | `fetchInvoices()`        |
| `GET`    | `/invoices/:id`             | Get single invoice                 | N/A (new)                |
| `POST`   | `/invoices`                 | Create with auto-calculation       | `createInvoice()`        |
| `PUT`    | `/invoices/:id`             | Update (recalculates totals)       | `updateInvoice()`        |
| `DELETE` | `/invoices/:id`             | Delete invoice                     | `deleteInvoice()`        |
| `PATCH`  | `/invoices/:id/mark-paid`   | Mark invoice as paid               | `markAsPaid()`           |
| `GET`    | `/invoices/search`          | Search by patient name/phone       | N/A (new)                |
| `GET`    | `/invoices/calculate`       | Preview calculation without saving | `calculateInvoice()`     |

#### `POST /invoices`

```typescript
/**
 * @swagger
 * /api/v1/invoices:
 *   post:
 *     tags: [Invoices]
 *     summary: Create invoice with auto-calculated totals
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_name, doctor_fees]
 *             properties:
 *               appointment_id:
 *                 type: string
 *               patient_name:
 *                 type: string
 *                 example: "Rajesh Kumar"
 *               patient_phone:
 *                 type: string
 *               patient_email:
 *                 type: string
 *               doctor_fees:
 *                 type: number
 *                 example: 500
 *               platform_fees:
 *                 type: number
 *                 example: 0
 *               gst_percentage:
 *                 type: number
 *                 example: 18
 *               discount_percentage:
 *                 type: number
 *                 example: 0
 *               other_charges:
 *                 type: number
 *                 example: 0
 *               other_charges_description:
 *                 type: string
 *               is_referred:
 *                 type: boolean
 *                 example: false
 *               referrer_id:
 *                 type: string
 *               referral_commission_percentage:
 *                 type: number
 *                 example: 10
 *               status:
 *                 type: string
 *                 enum: [draft, sent, paid, cancelled]
 *                 default: draft
 *               payment_method:
 *                 type: string
 *                 enum: [cash, upi, card, netbanking]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invoice created with auto-calculated fields
 */
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "invoice_number": "INV-2602-3847",
    "patient_name": "Rajesh Kumar",
    "doctor_fees": 500,
    "platform_fees": 0,
    "other_charges": 0,
    "subtotal": 500,
    "discount_percentage": 0,
    "discount_amount": 0,
    "gst_percentage": 18,
    "gst_amount": 90,
    "total_amount": 590,
    "referral_commission_amount": 0,
    "status": "draft"
  }
}
```

#### `PATCH /invoices/:id/mark-paid`

```typescript
/**
 * @swagger
 * /api/v1/invoices/{id}/mark-paid:
 *   patch:
 *     tags: [Invoices]
 *     summary: Mark invoice as paid
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_method:
 *                 type: string
 *                 enum: [cash, upi, card, netbanking]
 *     responses:
 *       200:
 *         description: Invoice marked as paid
 */
```

#### `GET /invoices/calculate` — Preview Calculation

```typescript
/**
 * @swagger
 * /api/v1/invoices/calculate:
 *   get:
 *     tags: [Invoices]
 *     summary: Preview invoice calculation without saving
 *     parameters:
 *       - in: query
 *         name: doctor_fees
 *         schema: { type: number }
 *       - in: query
 *         name: platform_fees
 *         schema: { type: number }
 *       - in: query
 *         name: other_charges
 *         schema: { type: number }
 *       - in: query
 *         name: gst_percentage
 *         schema: { type: number }
 *       - in: query
 *         name: discount_percentage
 *         schema: { type: number }
 *       - in: query
 *         name: referral_commission_percentage
 *         schema: { type: number }
 *       - in: query
 *         name: is_referred
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Calculated totals
 */
```

### Route Implementation: `src/routes/invoices.ts`

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { Invoice } from '../models/Invoice';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  body: z.object({
    appointment_id: z.string().optional(),
    patient_name: z.string().trim().min(1).max(200),
    patient_phone: z.string().trim().max(20).optional(),
    patient_email: z.string().trim().email().optional(),
    doctor_fees: z.number().min(0),
    platform_fees: z.number().min(0).default(0),
    gst_percentage: z.number().min(0).max(100).default(18),
    discount_percentage: z.number().min(0).max(100).default(0),
    other_charges: z.number().min(0).default(0),
    other_charges_description: z.string().optional(),
    is_referred: z.boolean().default(false),
    referrer_id: z.string().optional(),
    referral_commission_percentage: z.number().min(0).max(100).default(0),
    status: z.enum(['draft', 'sent', 'paid', 'cancelled']).default('draft'),
    payment_method: z.enum(['cash', 'upi', 'card', 'netbanking']).optional(),
    notes: z.string().max(2000).optional(),
  }),
});

// GET /invoices
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const { page = '1', limit = '50', status } = req.query as any;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit) || 50);

  const filter: any = { user_id: req.user!._id };
  if (status) filter.status = status;

  const [data, total] = await Promise.all([
    Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  res.json({ success: true, data, meta: { total, page: pageNum, limit: limitNum } });
}));

// GET /invoices/calculate — preview (no save)
router.get('/calculate', asyncHandler(async (req: AuthRequest, res: any) => {
  const { doctor_fees = 0, platform_fees = 0, other_charges = 0,
          gst_percentage = 18, discount_percentage = 0,
          referral_commission_percentage = 0, is_referred = false } = req.query as any;

  const df = parseFloat(doctor_fees);
  const pf = parseFloat(platform_fees);
  const oc = parseFloat(other_charges);
  const subtotal = df + pf + oc;
  const discountAmount = (subtotal * parseFloat(discount_percentage)) / 100;
  const afterDiscount = subtotal - discountAmount;
  const gstAmount = (afterDiscount * parseFloat(gst_percentage)) / 100;
  const totalAmount = afterDiscount + gstAmount;
  const commissionAmount = is_referred === 'true'
    ? (df * parseFloat(referral_commission_percentage)) / 100
    : 0;

  res.json({
    success: true,
    data: {
      subtotal,
      discount_amount: discountAmount,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      referral_commission_amount: commissionAmount,
    },
  });
}));

// GET /invoices/search — regex search
router.get('/search', asyncHandler(async (req: AuthRequest, res: any) => {
  const { q, limit = '20' } = req.query as any;
  if (!q) return res.status(400).json({ success: false, error: 'Query required', code: 'MISSING_QUERY' });

  const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedQuery, 'i');

  const results = await Invoice.find({
    user_id: req.user!._id,
    $or: [
      { patient_name: regex },
      { patient_phone: regex },
      { invoice_number: regex },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  res.json({ success: true, data: results });
}));

// GET /invoices/:id
router.get('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user_id: req.user!._id }).lean();
  if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found', code: 'NOT_FOUND' });
  res.json({ success: true, data: invoice });
}));

// POST /invoices (auto-calculates via pre-save hook)
router.post('/', validate(createSchema), asyncHandler(async (req: AuthRequest, res: any) => {
  const invoice = await Invoice.create({
    ...req.body,
    user_id: req.user!._id,
    invoice_date: new Date().toISOString().split('T')[0],
  });
  res.status(201).json({ success: true, data: invoice });
}));

// PUT /invoices/:id (recalculates via pre-save hook)
router.put('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user_id: req.user!._id });
  if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found', code: 'NOT_FOUND' });

  Object.assign(invoice, req.body);
  await invoice.save(); // triggers pre-save recalculation

  res.json({ success: true, data: invoice });
}));

// PATCH /invoices/:id/mark-paid
router.patch('/:id/mark-paid', asyncHandler(async (req: AuthRequest, res: any) => {
  const invoice = await Invoice.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user!._id },
    {
      $set: {
        status: 'paid',
        payment_method: req.body.payment_method || null,
        payment_date: new Date().toISOString().split('T')[0],
      },
    },
    { new: true }
  ).lean();

  if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found', code: 'NOT_FOUND' });
  res.json({ success: true, data: invoice });
}));

// DELETE /invoices/:id
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const result = await Invoice.findOneAndDelete({ _id: req.params.id, user_id: req.user!._id });
  if (!result) return res.status(404).json({ success: false, error: 'Invoice not found', code: 'NOT_FOUND' });
  res.json({ success: true, data: { message: 'Invoice deleted' } });
}));

export default router;
```

---

### 5. Referrers

> **Maps to**: `src/hooks/useReferrers.ts` — CRUD + soft delete + commission tracking

#### Endpoints

| Method   | Path                              | Description                   | Frontend Source              |
|----------|-----------------------------------|-------------------------------|------------------------------|
| `GET`    | `/referrers`                      | List active referrers         | `fetchReferrers()`           |
| `GET`    | `/referrers/:id`                  | Get single referrer           | N/A (new)                    |
| `POST`   | `/referrers`                      | Create referrer               | `createReferrer()`           |
| `PUT`    | `/referrers/:id`                  | Update referrer               | `updateReferrer()`           |
| `DELETE` | `/referrers/:id`                  | Soft-delete (is_active=false) | `deleteReferrer()`           |
| `PATCH`  | `/referrers/:id/commission-paid`  | Record commission payment     | `markCommissionPaid()`       |
| `GET`    | `/referrers/search`               | Search by name (regex)        | N/A (new)                    |

### Route Implementation: `src/routes/referrers.ts`

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { Referrer } from '../models/Referrer';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(200),
    phone: z.string().trim().max(20).optional(),
    email: z.string().trim().email().optional(),
    type: z.enum(['individual', 'clinic', 'hospital', 'other']).default('individual'),
    default_commission_percentage: z.number().min(0).max(100).default(10),
    notes: z.string().max(2000).optional(),
  }),
});

// GET /referrers (only active, sorted by name — matches frontend)
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const referrers = await Referrer.find({
    user_id: req.user!._id,
    is_active: true,
  })
    .sort({ name: 1 })
    .lean();

  res.json({ success: true, data: referrers });
}));

// GET /referrers/search
router.get('/search', asyncHandler(async (req: AuthRequest, res: any) => {
  const { q, limit = '20' } = req.query as any;
  if (!q) return res.status(400).json({ success: false, error: 'Query required' });

  const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const results = await Referrer.find({
    user_id: req.user!._id,
    is_active: true,
    name: new RegExp(escapedQuery, 'i'),
  })
    .sort({ name: 1 })
    .limit(parseInt(limit))
    .lean();

  res.json({ success: true, data: results });
}));

// GET /referrers/:id
router.get('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const referrer = await Referrer.findOne({ _id: req.params.id, user_id: req.user!._id }).lean();
  if (!referrer) return res.status(404).json({ success: false, error: 'Referrer not found', code: 'NOT_FOUND' });
  res.json({ success: true, data: referrer });
}));

// POST /referrers
router.post('/', validate(createSchema), asyncHandler(async (req: AuthRequest, res: any) => {
  const referrer = await Referrer.create({ ...req.body, user_id: req.user!._id });
  res.status(201).json({ success: true, data: referrer });
}));

// PUT /referrers/:id
router.put('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const referrer = await Referrer.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user!._id },
    { $set: req.body },
    { new: true, runValidators: true }
  ).lean();

  if (!referrer) return res.status(404).json({ success: false, error: 'Referrer not found', code: 'NOT_FOUND' });
  res.json({ success: true, data: referrer });
}));

// DELETE /referrers/:id (soft delete — matches frontend deleteReferrer)
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const referrer = await Referrer.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user!._id },
    { $set: { is_active: false } },
    { new: true }
  ).lean();

  if (!referrer) return res.status(404).json({ success: false, error: 'Referrer not found', code: 'NOT_FOUND' });
  res.json({ success: true, data: { message: 'Referrer deactivated' } });
}));

// PATCH /referrers/:id/commission-paid (maps to markCommissionPaid)
router.patch('/:id/commission-paid', asyncHandler(async (req: AuthRequest, res: any) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid amount required' });
  }

  const referrer = await Referrer.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user!._id },
    { $inc: { total_commission_paid: amount } },
    { new: true }
  ).lean();

  if (!referrer) return res.status(404).json({ success: false, error: 'Referrer not found', code: 'NOT_FOUND' });
  res.json({ success: true, data: referrer });
}));

export default router;
```

---

### 6. AI Prescription Suggestions (Gemini)

> **Maps to**: `src/hooks/usePrescriptionSuggestions.ts` + `supabase/functions/prescription-suggest/index.ts`

#### Endpoints

| Method | Path                          | Description                           | Frontend Source           |
|--------|-------------------------------|---------------------------------------|---------------------------|
| `POST` | `/suggestions`                | Get AI suggestions (cached, debounced)| `fetchSuggestions()`       |
| `POST` | `/suggestions/stream`         | SSE streaming suggestions             | N/A (new)                  |

#### `POST /suggestions`

```typescript
/**
 * @swagger
 * /api/v1/suggestions:
 *   post:
 *     tags: [AI Suggestions]
 *     summary: Get AI-powered prescription suggestions
 *     description: |
 *       Returns medical suggestions using Gemini AI.
 *       - Server-side caching (5-minute TTL, 100 entries)
 *       - Client-side debouncing (600ms recommended)
 *       - Rate limited to 30 req/min
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [symptoms, diagnosis, medicines, dosage, dose, frequency, duration, tests]
 *                 example: "diagnosis"
 *               context:
 *                 type: object
 *                 properties:
 *                   symptoms:
 *                     type: string
 *                     example: "Fever, Headache, Body Pain"
 *                   diagnosis:
 *                     type: string
 *                   medicineName:
 *                     type: string
 *                   medicineType:
 *                     type: string
 *                   patientInfo:
 *                     type: object
 *                     properties:
 *                       age:
 *                         type: string
 *                       gender:
 *                         type: string
 *                       weight:
 *                         type: string
 *               query:
 *                 type: string
 *                 description: Partial text for autocomplete
 *     responses:
 *       200:
 *         description: AI suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     suggestions:
 *                       type: array
 *                     type:
 *                       type: string
 *                     cached:
 *                       type: boolean
 *       429:
 *         description: Rate limit exceeded
 *       402:
 *         description: AI credits exhausted
 */
```

### Route Implementation: `src/routes/suggestions.ts`

```typescript
import { Router } from 'express';
import { z } from 'zod';
import NodeCache from 'node-cache';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { aiLimiter } from '../middleware/rateLimiter';
import { GeminiService } from '../services/GeminiService';

const router = Router();
router.use(authMiddleware);
router.use(aiLimiter);

// In-memory cache (maps to frontend suggestionCache — 5min TTL, 100 max keys)
const cache = new NodeCache({ stdTTL: 300, maxKeys: 100, checkperiod: 60 });

const suggestionSchema = z.object({
  body: z.object({
    type: z.enum(['symptoms', 'diagnosis', 'medicines', 'dosage', 'dose', 'frequency', 'duration', 'tests']),
    context: z.object({
      symptoms: z.string().optional(),
      diagnosis: z.string().optional(),
      medicineName: z.string().optional(),
      medicineType: z.string().optional(),
      patientInfo: z.object({
        age: z.string().optional(),
        gender: z.string().optional(),
        weight: z.string().optional(),
      }).optional(),
    }).optional().default({}),
    query: z.string().max(200).optional(),
  }),
});

// POST /suggestions
router.post('/', validate(suggestionSchema), asyncHandler(async (req: AuthRequest, res: any) => {
  const { type, context, query } = req.body;

  // Cache key
  const cacheKey = JSON.stringify({ type, context, query: query?.toLowerCase().trim() });
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      data: { suggestions: cached, type, cached: true },
    });
  }

  const gemini = new GeminiService();
  const suggestions = await gemini.getSuggestions(type, context, query);

  cache.set(cacheKey, suggestions);

  res.json({
    success: true,
    data: { suggestions, type, cached: false },
  });
}));

// POST /suggestions/stream — SSE streaming
router.post('/stream', validate(suggestionSchema), asyncHandler(async (req: AuthRequest, res: any) => {
  const { type, context, query } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const gemini = new GeminiService();

  try {
    const stream = await gemini.streamSuggestions(type, context, query);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ chunk: chunk.text() })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}));

export default router;
```

---

### 7. Templates & Doctor Profile

> **Maps to**: `src/hooks/useTemplates.ts` — currently localStorage, migrated to DB

#### Endpoints

| Method   | Path                        | Description                    | Frontend Source                   |
|----------|-----------------------------|--------------------------------|-----------------------------------|
| `GET`    | `/templates`                | List all templates (by type)   | Load from localStorage            |
| `POST`   | `/templates`                | Create template                | `saveMedicineTemplate()`, etc.    |
| `DELETE` | `/templates/:id`            | Delete template                | `deleteMedicineTemplate()`, etc.  |
| `GET`    | `/doctor-profile`           | Get doctor profile             | `doctorProfile` state             |
| `PUT`    | `/doctor-profile`           | Update doctor profile          | `updateDoctorProfile()`           |
| `DELETE` | `/doctor-profile/image/:field` | Clear specific image        | `clearImage()`                    |

### Route Implementation: `src/routes/templates.ts`

```typescript
import { Router } from 'express';
import { Template } from '../models/Template';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
router.use(authMiddleware);

// GET /templates?type=medicine|diagnosis|prescription
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const { type } = req.query as any;
  const filter: any = { user_id: req.user!._id };
  if (type) filter.type = type;

  const templates = await Template.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: templates });
}));

// POST /templates
router.post('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const template = await Template.create({
    ...req.body,
    user_id: req.user!._id,
  });
  res.status(201).json({ success: true, data: template });
}));

// DELETE /templates/:id
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const result = await Template.findOneAndDelete({ _id: req.params.id, user_id: req.user!._id });
  if (!result) return res.status(404).json({ success: false, error: 'Template not found' });
  res.json({ success: true, data: { message: 'Template deleted' } });
}));

export default router;
```

### `src/routes/doctorProfile.ts`

```typescript
import { Router } from 'express';
import { DoctorProfile } from '../models/DoctorProfile';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
router.use(authMiddleware);

// GET /doctor-profile
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  let profile = await DoctorProfile.findOne({ user_id: req.user!._id }).lean();
  if (!profile) {
    profile = await DoctorProfile.create({ user_id: req.user!._id });
  }
  res.json({ success: true, data: profile });
}));

// PUT /doctor-profile
router.put('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const profile = await DoctorProfile.findOneAndUpdate(
    { user_id: req.user!._id },
    { $set: req.body },
    { new: true, upsert: true }
  ).lean();
  res.json({ success: true, data: profile });
}));

// DELETE /doctor-profile/image/:field
router.delete('/image/:field', asyncHandler(async (req: AuthRequest, res: any) => {
  const validFields = ['signatureImage', 'headerImage', 'footerImage', 'logoImage'];
  if (!validFields.includes(req.params.field)) {
    return res.status(400).json({ success: false, error: 'Invalid image field' });
  }

  const profile = await DoctorProfile.findOneAndUpdate(
    { user_id: req.user!._id },
    { $set: { [req.params.field]: '' } },
    { new: true }
  ).lean();

  res.json({ success: true, data: profile });
}));

export default router;
```

---

### 8. Dashboard Stats

> **Maps to**: `src/hooks/useAppointments.ts → getStats()` and `src/components/billing/BillingStats.tsx`

#### Endpoints

| Method | Path                 | Description                         | Frontend Source         |
|--------|----------------------|-------------------------------------|-------------------------|
| `GET`  | `/stats/appointments`| Appointment dashboard stats         | `getStats()`            |
| `GET`  | `/stats/billing`     | Billing & referral stats            | `BillingStats` component |

#### `GET /stats/appointments`

```typescript
/**
 * @swagger
 * /api/v1/stats/appointments:
 *   get:
 *     tags: [Stats]
 *     summary: Get appointment dashboard statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 totalPatients: 150
 *                 patientsSeen: 120
 *                 totalRevenue: 75000
 *                 amountPaid: 60000
 *                 amountDue: 15000
 *                 scheduledToday: 8
 */
```

#### `GET /stats/billing`

```typescript
/**
 * @swagger
 * /api/v1/stats/billing:
 *   get:
 *     tags: [Stats]
 *     summary: Get billing & referral statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing stats
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 totalInvoices: 85
 *                 paidInvoices: 70
 *                 totalRevenue: 125000
 *                 pendingAmount: 15000
 *                 activeReferrers: 5
 *                 commissionDue: 8500
 *                 totalCommissionPaid: 12000
 */
```

### Route Implementation: `src/routes/stats.ts`

```typescript
import { Router } from 'express';
import { Appointment } from '../models/Appointment';
import { Invoice } from '../models/Invoice';
import { Referrer } from '../models/Referrer';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { format } from 'date-fns';

const router = Router();
router.use(authMiddleware);

// GET /stats/appointments (maps to useAppointments.getStats)
router.get('/appointments', asyncHandler(async (req: AuthRequest, res: any) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const userId = req.user!._id;

  const [allApps, todayApps] = await Promise.all([
    Appointment.find({ user_id: userId }).lean(),
    Appointment.find({ user_id: userId, appointment_date: today }).lean(),
  ]);

  res.json({
    success: true,
    data: {
      totalPatients: allApps.length,
      patientsSeen: allApps.filter(a => a.status === 'seen').length,
      totalRevenue: allApps.reduce((sum, a) => sum + (a.amount_charged || 0), 0),
      amountPaid: allApps.reduce((sum, a) => sum + (a.amount_paid || 0), 0),
      amountDue: allApps.reduce((sum, a) => sum + ((a.amount_charged || 0) - (a.amount_paid || 0)), 0),
      scheduledToday: todayApps.filter(a => a.status === 'scheduled').length,
    },
  });
}));

// GET /stats/billing (maps to BillingStats component)
router.get('/billing', asyncHandler(async (req: AuthRequest, res: any) => {
  const userId = req.user!._id;

  const [invoices, referrers] = await Promise.all([
    Invoice.find({ user_id: userId }).lean(),
    Referrer.find({ user_id: userId, is_active: true }).lean(),
  ]);

  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const pendingInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
  const totalCommissionEarned = referrers.reduce((s, r) => s + (r.total_commission_earned || 0), 0);
  const totalCommissionPaid = referrers.reduce((s, r) => s + (r.total_commission_paid || 0), 0);

  res.json({
    success: true,
    data: {
      totalInvoices: invoices.length,
      paidInvoices: paidInvoices.length,
      totalRevenue: paidInvoices.reduce((s, i) => s + (i.total_amount || 0), 0),
      pendingAmount: pendingInvoices.reduce((s, i) => s + (i.total_amount || 0), 0),
      activeReferrers: referrers.length,
      referrersWithDue: referrers.filter(r => (r.total_commission_earned - r.total_commission_paid) > 0).length,
      commissionDue: totalCommissionEarned - totalCommissionPaid,
      totalCommissionPaid,
    },
  });
}));

export default router;
```

---

### 9. Demo / Health Endpoints

```typescript
/**
 * @swagger
 * /api/v1/demo/health:
 *   get:
 *     tags: [Demo]
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Server is running
 *
 * /api/v1/demo/db-status:
 *   get:
 *     tags: [Demo]
 *     summary: Database connection status
 *     responses:
 *       200:
 *         description: Database connected
 *
 * /api/v1/demo/ai-test:
 *   post:
 *     tags: [Demo]
 *     summary: Test AI integration with a sample prompt
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 default: "Suggest 3 common medicines for fever"
 *     responses:
 *       200:
 *         description: AI response
 *
 * /api/v1/demo/sample-data:
 *   post:
 *     tags: [Demo]
 *     summary: Seed sample appointments and invoices (dev only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Sample data created
 */
```

### Route Implementation: `src/routes/demo.ts`

```typescript
import { Router } from 'express';
import mongoose from 'mongoose';
import { GeminiService } from '../services/GeminiService';
import { Appointment } from '../models/Appointment';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /demo/health
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
    },
  });
});

// GET /demo/db-status
router.get('/db-status', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = mongoose.connection.readyState;

  res.json({
    success: true,
    data: {
      status: states[state] || 'unknown',
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A',
    },
  });
});

// POST /demo/ai-test
router.post('/ai-test', asyncHandler(async (req, res) => {
  const { prompt = 'Suggest 3 common medicines for fever' } = req.body;
  const gemini = new GeminiService();
  const result = await gemini.chat(prompt);

  res.json({
    success: true,
    data: {
      prompt,
      response: result,
      model: 'gemini-2.5-flash',
    },
  });
}));

// POST /demo/sample-data
router.post('/sample-data', authMiddleware, asyncHandler(async (req: AuthRequest, res: any) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, error: 'Not allowed in production' });
  }

  const userId = req.user!._id;
  const today = new Date().toISOString().split('T')[0];

  const appointments = await Appointment.insertMany([
    { user_id: userId, patient_name: 'Demo Patient 1', patient_phone: '+919876543210', patient_age: 35, patient_gender: 'Male', appointment_date: today, appointment_time: '09:00', status: 'scheduled', payment_status: 'pending', amount_charged: 500, amount_paid: 0 },
    { user_id: userId, patient_name: 'Demo Patient 2', patient_phone: '+919876543211', patient_age: 28, patient_gender: 'Female', appointment_date: today, appointment_time: '10:00', status: 'seen', payment_status: 'paid', amount_charged: 800, amount_paid: 800 },
    { user_id: userId, patient_name: 'Demo Patient 3', patient_phone: '+919876543212', patient_age: 55, patient_gender: 'Male', appointment_date: today, appointment_time: '11:30', status: 'scheduled', payment_status: 'pending', amount_charged: 600, amount_paid: 200 },
  ]);

  res.status(201).json({
    success: true,
    data: {
      message: 'Sample data created',
      appointmentsCreated: appointments.length,
    },
  });
}));

export default router;
```

---

## Swagger / OpenAPI Setup

### `src/config/swagger.ts`

```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MediPrescribe Pro API',
      version: '1.0.0',
      description: `
## MediPrescribe Pro Backend API

Complete REST API for the MediPrescribe Pro clinical management platform.

### Features
- **Authentication**: JWT-based auth with signup/login
- **Appointments**: Full CRUD with date filtering and regex search
- **Invoices**: Auto-calculated billing with GST, discounts, referral commissions
- **Referrers**: Referral tracking with commission management
- **AI Suggestions**: Gemini-powered prescription auto-suggestions
- **Templates**: Medicine, diagnosis, and prescription templates
- **Stats**: Dashboard analytics

### Authentication
All endpoints (except auth & demo) require a Bearer token:
\`Authorization: Bearer <jwt_token>\`

### Rate Limits
- General: 100 requests per 15 minutes
- AI Suggestions: 30 requests per minute
- Auth: 10 attempts per 15 minutes

### Error Codes
| Code | Description |
|------|-------------|
| AUTH_REQUIRED | No token provided |
| INVALID_TOKEN | Token is invalid |
| TOKEN_EXPIRED | Token has expired |
| VALIDATION_ERROR | Request validation failed |
| NOT_FOUND | Resource not found |
| DUPLICATE_KEY | Unique constraint violation |
| RATE_LIMIT_EXCEEDED | Too many requests |
| AI_RATE_LIMIT | AI rate limit hit |
| AI_CREDITS_EXHAUSTED | No AI credits remaining |
      `,
      contact: {
        name: 'MediPrescribe Support',
      },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
      { url: 'https://api.mediprescribe.com', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Appointments', description: 'Appointment CRUD & search' },
      { name: 'Invoices', description: 'Invoice management with auto-calculation' },
      { name: 'Referrers', description: 'Referral partner management' },
      { name: 'AI Suggestions', description: 'Gemini-powered prescription suggestions' },
      { name: 'Templates', description: 'Medicine/Diagnosis/Prescription templates' },
      { name: 'Stats', description: 'Dashboard analytics' },
      { name: 'Demo', description: 'Health check & testing endpoints' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MediPrescribe Pro API Docs',
  }));

  // Raw JSON spec endpoint
  app.get('/api-docs.json', (_req, res) => {
    res.json(specs);
  });

  console.log('📄 Swagger docs available at: http://localhost:5000/api-docs');
}
```

---

## Debouncing & Regex Search

### Strategy (mirrors frontend implementation)

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT SIDE                          │
│                                                          │
│  User types → 600ms debounce → API call                 │
│  (usePrescriptionSuggestions.ts debounceRef)             │
│                                                          │
│  Cache check → if hit, return cached (5min TTL)         │
│  (suggestionCache Map, MAX 100 entries)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                     SERVER SIDE                          │
│                                                          │
│  Rate limiter → 30 req/min for AI, 100/15min general    │
│                                                          │
│  Server cache → NodeCache (5min TTL, 100 keys)          │
│                                                          │
│  Regex search → escape special chars → $regex query     │
│  (prevents ReDoS attacks)                               │
└─────────────────────────────────────────────────────────┘
```

### Backend Regex Search Implementation

```typescript
// IMPORTANT: Always escape user input to prevent ReDoS attacks
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// MongoDB regex query example
const searchAppointments = async (userId: string, query: string, field: 'name' | 'phone' | 'all') => {
  const escapedQuery = escapeRegex(query.trim());
  const regex = new RegExp(escapedQuery, 'i'); // case-insensitive

  const filter: any = { user_id: userId };

  if (field === 'name') {
    filter.patient_name = { $regex: regex };
  } else if (field === 'phone') {
    filter.patient_phone = { $regex: regex };
  } else {
    filter.$or = [
      { patient_name: { $regex: regex } },
      { patient_phone: { $regex: regex } },
    ];
  }

  return Appointment.find(filter)
    .sort({ appointment_date: -1 })
    .limit(20)
    .lean();
};
```

### Frontend Debounce (reference for replacement):

```typescript
// Current frontend pattern (usePrescriptionSuggestions.ts)
const debounceRef = useRef<NodeJS.Timeout>();

const fetchSuggestions = useCallback(async (type, context, query) => {
  if (debounceRef.current) clearTimeout(debounceRef.current);

  return new Promise((resolve) => {
    debounceRef.current = setTimeout(async () => {
      // Check cache → API call → store in cache
      const cacheKey = JSON.stringify({ type, context, query });
      const cached = suggestionCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 300000) {
        resolve(cached.suggestions);
        return;
      }
      // ... fetch from backend
    }, 600); // 600ms debounce
  });
}, []);
```

---

## Gemini AI Integration

### `src/services/GeminiService.ts`

```typescript
import { GoogleGenerativeAI, GenerateContentStreamResult } from '@google/generative-ai';

type SuggestionType = 'symptoms' | 'diagnosis' | 'medicines' | 'dosage' | 'dose' | 'frequency' | 'duration' | 'tests';

interface SuggestionContext {
  symptoms?: string;
  diagnosis?: string;
  medicineName?: string;
  medicineType?: string;
  patientInfo?: { age?: string; gender?: string; weight?: string };
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = 'gemini-2.5-flash'; // Fast + accurate for medical suggestions
  }

  // Maps exactly to supabase/functions/prescription-suggest/index.ts
  private buildPrompt(type: SuggestionType, context: SuggestionContext, query?: string): string {
    const prompts: Record<SuggestionType, string> = {
      symptoms: `Given the partial symptom text "${query || ''}", suggest 5-8 common medical symptoms that match. Return as JSON array of strings.`,
      diagnosis: `Based on symptoms: "${context.symptoms || ''}", suggest 5-8 possible diagnoses. Return as JSON array of objects: [{"name": "...", "confidence": "high/medium/low", "description": "..."}]`,
      medicines: `For diagnosis "${context.diagnosis || ''}" with symptoms "${context.symptoms || ''}", suggest 5-10 medicines. Return as JSON array: [{"name": "...", "type": "Tablet/Syrup/etc", "genericName": "..."}]`,
      dosage: `For medicine "${context.medicineName || ''}" (${context.medicineType || 'Tablet'}), patient: ${JSON.stringify(context.patientInfo || {})}. Return JSON array of dosage strings.`,
      dose: `For medicine "${context.medicineName || ''}" (${context.medicineType || 'Tablet'}), patient: ${JSON.stringify(context.patientInfo || {})}. Return JSON array of dose strings.`,
      frequency: `For medicine "${context.medicineName || ''}". Return JSON array of frequency strings.`,
      duration: `For medicine "${context.medicineName || ''}" for "${context.diagnosis || ''}". Return JSON array of duration strings.`,
      tests: `For diagnosis "${context.diagnosis || ''}" with symptoms "${context.symptoms || ''}". Return JSON array: [{"testName": "...", "testType": "Blood/Imaging/etc", "reason": "..."}]`,
    };
    return prompts[type];
  }

  async getSuggestions(type: SuggestionType, context: SuggestionContext, query?: string): Promise<any[]> {
    const model = this.genAI.getGenerativeModel({ model: this.model });
    const prompt = this.buildPrompt(type, context, query);
    const systemInstruction = 'You are a medical AI assistant. Provide accurate, evidence-based suggestions. Always respond with valid JSON arrays.';

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction,
    });

    const text = result.response.text();
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error('Failed to parse AI response:', text);
      return [];
    }
  }

  async streamSuggestions(type: SuggestionType, context: SuggestionContext, query?: string): Promise<GenerateContentStreamResult> {
    const model = this.genAI.getGenerativeModel({ model: this.model });
    const prompt = this.buildPrompt(type, context, query);

    return model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: 'You are a medical AI assistant. Respond with valid JSON.',
    });
  }

  async chat(prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.model });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
```

### Alternative: Lovable AI Gateway (current approach)

```typescript
// Current edge function uses Lovable AI Gateway — no external API key needed
// supabase/functions/prescription-suggest/index.ts

const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,  // Auto-provided by Lovable Cloud
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-3-flash-preview",  // Lovable-supported model
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  }),
});

// When migrating to custom backend, replace with direct Gemini SDK
```

---

## Main Server Entry Point

### `src/server.ts`

```typescript
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

import { setupSwagger } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/auth';
import appointmentRoutes from './routes/appointments';
import invoiceRoutes from './routes/invoices';
import referrerRoutes from './routes/referrers';
import suggestionRoutes from './routes/suggestions';
import templateRoutes from './routes/templates';
import doctorProfileRoutes from './routes/doctorProfile';
import statsRoutes from './routes/stats';
import demoRoutes from './routes/demo';

dotenv.config();

const app = express();

// Security & Parsing
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' })); // Large for base64 images
app.use(morgan('combined'));
app.use(generalLimiter);

// Swagger
setupSwagger(app);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/referrers', referrerRoutes);
app.use('/api/v1/suggestions', suggestionRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/doctor-profile', doctorProfileRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/demo', demoRoutes);

// Global error handler (MUST be last)
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
  });
});

// Database & Start
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📄 API Docs: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Demo health: http://localhost:${PORT}/api/v1/demo/health`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
```

---

## Frontend Replacement Guide

### Step-by-step: Replace Supabase calls with API calls

#### 1. Create API Client

```typescript
// src/lib/api.ts — replaces supabase client
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('auth_token');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    const json = await res.json();

    if (!res.ok) {
      if (json.code === 'TOKEN_EXPIRED' || json.code === 'INVALID_TOKEN') {
        this.setToken(null);
        window.location.href = '/login';
      }
      throw new Error(json.error || 'API Error');
    }

    return json;
  }

  get<T>(path: string) { return this.request<T>(path); }
  post<T>(path: string, body: any) { return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) }); }
  put<T>(path: string, body: any) { return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) }); }
  patch<T>(path: string, body: any) { return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }); }
  delete<T>(path: string) { return this.request<T>(path, { method: 'DELETE' }); }
}

export const api = new ApiClient();
```

#### 2. Replace Auth Context

```typescript
// BEFORE (Supabase):
const { error } = await supabase.auth.signInWithPassword({ email, password });

// AFTER (Custom API):
const { data } = await api.post('/auth/login', { email, password });
api.setToken(data.token);
```

#### 3. Replace useAppointments Hook

```typescript
// BEFORE (Supabase):
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('user_id', user.id)
  .gte('appointment_date', fromDate)
  .lte('appointment_date', toDate)
  .order('appointment_date', { ascending: true });

// AFTER (Custom API):
const { data } = await api.get(`/appointments?from=${fromDate}&to=${toDate}`);
```

#### 4. Replace useInvoices Hook

```typescript
// BEFORE:
const { data } = await supabase.from('invoices').insert({ user_id: user.id, ...formData }).select().single();

// AFTER:
const { data } = await api.post('/invoices', formData);
// user_id is set server-side via JWT
```

#### 5. Replace usePatientHistory Hook

```typescript
// BEFORE:
const { data } = await supabase
  .from('appointments')
  .select('*')
  .eq('user_id', user.id)
  .ilike('patient_phone', `%${phone}%`);

// AFTER:
const { data } = await api.get(`/appointments/search?q=${phone}&field=phone`);
```

#### 6. Replace usePrescriptionSuggestions Hook

```typescript
// BEFORE:
const { data } = await supabase.functions.invoke('prescription-suggest', {
  body: { type, context, query },
});

// AFTER:
const { data } = await api.post('/suggestions', { type, context, query });
```

#### 7. Replace useReferrers Hook

```typescript
// BEFORE:
await supabase.from('referrers').update({ is_active: false }).eq('id', id);

// AFTER:
await api.delete(`/referrers/${id}`);  // Server handles soft-delete
```

#### 8. Replace Real-time Subscriptions

```typescript
// BEFORE (Supabase realtime):
const channel = supabase
  .channel('appointments-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
    fetchAppointments();
  })
  .subscribe();

// AFTER — Option A: Polling
useEffect(() => {
  const interval = setInterval(fetchAppointments, 30000); // 30s polling
  return () => clearInterval(interval);
}, []);

// AFTER — Option B: WebSocket (requires socket.io on backend)
// socket.on('appointment:changed', () => fetchAppointments());
```

---

## Deployment

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/mediprescribe
      - JWT_SECRET=${JWT_SECRET}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - mongo
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
volumes:
  mongo-data:
```

---

## Migration Checklist

### Phase 1: Infrastructure
- [ ] Set up Node.js project with TypeScript
- [ ] Configure MongoDB (local or Atlas)
- [ ] Set up Gemini API key
- [ ] Deploy health endpoint and verify

### Phase 2: Backend API
- [ ] Implement auth routes (signup, login, me)
- [ ] Implement appointments CRUD + search
- [ ] Implement invoices CRUD + calculation + mark-paid
- [ ] Implement referrers CRUD + commission
- [ ] Implement AI suggestions with caching
- [ ] Implement templates & doctor profile
- [ ] Implement stats endpoints
- [ ] Set up Swagger docs and demo endpoints
- [ ] Add rate limiting + error handling

### Phase 3: Frontend Migration
- [ ] Create API client (`src/lib/api.ts`)
- [ ] Replace `AuthContext` (Supabase → JWT)
- [ ] Replace `useAppointments` hook
- [ ] Replace `useInvoices` hook
- [ ] Replace `useReferrers` hook
- [ ] Replace `usePatientHistory` hook
- [ ] Replace `usePrescriptionSuggestions` hook
- [ ] Migrate `useTemplates` from localStorage to API
- [ ] Replace real-time subscriptions with polling/WebSocket
- [ ] Update environment variables

### Phase 4: Data Migration
- [ ] Export all appointments from Lovable Cloud
- [ ] Export all invoices
- [ ] Export all referrers
- [ ] Transform and import into MongoDB
- [ ] Verify data integrity

### Phase 5: Testing
- [ ] Test all CRUD operations
- [ ] Test search with regex patterns
- [ ] Test AI suggestions with caching
- [ ] Test invoice auto-calculation
- [ ] Test auth flow (signup → login → protected routes)
- [ ] Test rate limiting
- [ ] Test error handling for all edge cases
- [ ] Load test with sample data
- [ ] Verify Swagger docs are complete and accurate

---

## Complete API Summary Table

| # | Method   | Endpoint                              | Auth | Description                              |
|---|----------|---------------------------------------|------|------------------------------------------|
| 1 | POST     | `/auth/signup`                        | ❌    | Register new user                        |
| 2 | POST     | `/auth/login`                         | ❌    | Login with email/password                |
| 3 | GET      | `/auth/me`                            | ✅    | Get current user                         |
| 4 | GET      | `/appointments`                       | ✅    | List with date range + status filters    |
| 5 | GET      | `/appointments/search`                | ✅    | Regex search by name/phone               |
| 6 | GET      | `/appointments/:id`                   | ✅    | Get single appointment                   |
| 7 | POST     | `/appointments`                       | ✅    | Create appointment                       |
| 8 | PUT      | `/appointments/:id`                   | ✅    | Update (status, prescription, etc.)      |
| 9 | DELETE   | `/appointments/:id`                   | ✅    | Delete appointment                       |
|10 | GET      | `/invoices`                           | ✅    | List all invoices                        |
|11 | GET      | `/invoices/calculate`                 | ✅    | Preview calculation                      |
|12 | GET      | `/invoices/search`                    | ✅    | Regex search by name/phone/invoice#      |
|13 | GET      | `/invoices/:id`                       | ✅    | Get single invoice                       |
|14 | POST     | `/invoices`                           | ✅    | Create with auto-calculation             |
|15 | PUT      | `/invoices/:id`                       | ✅    | Update with recalculation                |
|16 | PATCH    | `/invoices/:id/mark-paid`             | ✅    | Mark as paid                             |
|17 | DELETE   | `/invoices/:id`                       | ✅    | Delete invoice                           |
|18 | GET      | `/referrers`                          | ✅    | List active referrers                    |
|19 | GET      | `/referrers/search`                   | ✅    | Regex search by name                     |
|20 | GET      | `/referrers/:id`                      | ✅    | Get single referrer                      |
|21 | POST     | `/referrers`                          | ✅    | Create referrer                          |
|22 | PUT      | `/referrers/:id`                      | ✅    | Update referrer                          |
|23 | DELETE   | `/referrers/:id`                      | ✅    | Soft-delete (deactivate)                 |
|24 | PATCH    | `/referrers/:id/commission-paid`      | ✅    | Record commission payment                |
|25 | POST     | `/suggestions`                        | ✅    | AI suggestions (cached)                  |
|26 | POST     | `/suggestions/stream`                 | ✅    | AI suggestions (SSE streaming)           |
|27 | GET      | `/templates`                          | ✅    | List templates by type                   |
|28 | POST     | `/templates`                          | ✅    | Create template                          |
|29 | DELETE   | `/templates/:id`                      | ✅    | Delete template                          |
|30 | GET      | `/doctor-profile`                     | ✅    | Get doctor profile                       |
|31 | PUT      | `/doctor-profile`                     | ✅    | Update doctor profile                    |
|32 | DELETE   | `/doctor-profile/image/:field`        | ✅    | Clear specific image                     |
|33 | GET      | `/stats/appointments`                 | ✅    | Appointment dashboard stats              |
|34 | GET      | `/stats/billing`                      | ✅    | Billing & referral stats                 |
|35 | GET      | `/demo/health`                        | ❌    | Health check                             |
|36 | GET      | `/demo/db-status`                     | ❌    | Database status                          |
|37 | POST     | `/demo/ai-test`                       | ❌    | Test AI integration                      |
|38 | POST     | `/demo/sample-data`                   | ✅    | Seed demo data (dev only)                |

---

*Generated from full frontend analysis of MediPrescribe Pro — all 38 endpoints mapped from existing hooks, components, and edge functions.*
