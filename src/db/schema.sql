-- ============================================
-- DATABASE SCHEMA FOR PRESCRIPTION APP
-- Migration-Ready Setup File
-- ============================================
-- This file contains the complete database schema
-- for potential migration to MongoDB, PostgreSQL, 
-- or any other database system.
-- ============================================

-- APPOINTMENTS TABLE
-- Stores all patient appointments with payment tracking
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,                                    -- Doctor's user ID
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    patient_email TEXT,
    patient_age INTEGER,
    patient_gender TEXT CHECK (patient_gender IN ('male', 'female', 'other')),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'seen', 'cancelled', 'no-show')),
    payment_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'paid', 'partial')),
    amount_charged DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    prescription_data JSONB,                                  -- Full prescription as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES for performance
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_payment_status ON appointments(payment_status);

-- ============================================
-- MONGODB EQUIVALENT SCHEMA (for migration)
-- ============================================
/*
db.createCollection("appointments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "patient_name", "appointment_date", "appointment_time", "status", "payment_status"],
      properties: {
        _id: { bsonType: "objectId" },
        user_id: { bsonType: "string" },
        patient_name: { bsonType: "string" },
        patient_phone: { bsonType: "string" },
        patient_email: { bsonType: "string" },
        patient_age: { bsonType: "int" },
        patient_gender: { enum: ["male", "female", "other"] },
        appointment_date: { bsonType: "date" },
        appointment_time: { bsonType: "string" },
        status: { enum: ["scheduled", "seen", "cancelled", "no-show"] },
        payment_status: { enum: ["pending", "paid", "partial"] },
        amount_charged: { bsonType: "decimal" },
        amount_paid: { bsonType: "decimal" },
        notes: { bsonType: "string" },
        prescription_data: { bsonType: "object" },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.appointments.createIndex({ user_id: 1 });
db.appointments.createIndex({ appointment_date: 1 });
db.appointments.createIndex({ status: 1 });
db.appointments.createIndex({ payment_status: 1 });
*/

-- ============================================
-- TYPESCRIPT INTERFACE (for reference)
-- ============================================
/*
interface Appointment {
  id: string;
  user_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_age?: number;
  patient_gender?: 'male' | 'female' | 'other';
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM
  status: 'scheduled' | 'seen' | 'cancelled' | 'no-show';
  payment_status: 'pending' | 'paid' | 'partial';
  amount_charged: number;
  amount_paid: number;
  notes?: string;
  prescription_data?: PrescriptionData;
  created_at: string;
  updated_at: string;
}
*/
