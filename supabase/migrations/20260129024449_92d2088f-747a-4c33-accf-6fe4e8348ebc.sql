-- Create referrers table for tracking referral sources
CREATE TABLE public.referrers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    type TEXT DEFAULT 'individual' CHECK (type IN ('individual', 'clinic', 'hospital', 'other')),
    default_commission_percentage DECIMAL(5,2) DEFAULT 10.00,
    total_commission_earned DECIMAL(10,2) DEFAULT 0,
    total_commission_paid DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table with fee breakdown
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Patient info (denormalized for invoice records)
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    patient_email TEXT,
    
    -- Fee breakdown
    doctor_fees DECIMAL(10,2) DEFAULT 0,
    platform_fees DECIMAL(10,2) DEFAULT 0,
    gst_percentage DECIMAL(5,2) DEFAULT 18.00,
    gst_amount DECIMAL(10,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    other_charges_description TEXT,
    
    -- Totals
    subtotal DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Referral tracking
    is_referred BOOLEAN DEFAULT false,
    referrer_id UUID REFERENCES public.referrers(id) ON DELETE SET NULL,
    referral_commission_percentage DECIMAL(5,2) DEFAULT 0,
    referral_commission_amount DECIMAL(10,2) DEFAULT 0,
    referral_commission_paid BOOLEAN DEFAULT false,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
    payment_method TEXT,
    payment_date DATE,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.referrers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrers
CREATE POLICY "Users can view their own referrers" ON public.referrers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referrers" ON public.referrers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referrers" ON public.referrers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own referrers" ON public.referrers
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON public.invoices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" ON public.invoices
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_referrers_user_id ON public.referrers(user_id);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_appointment_id ON public.invoices(appointment_id);
CREATE INDEX idx_invoices_referrer_id ON public.invoices(referrer_id);
CREATE INDEX idx_invoices_invoice_date ON public.invoices(invoice_date);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- Triggers for updated_at
CREATE TRIGGER update_referrers_updated_at
    BEFORE UPDATE ON public.referrers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_appointments_updated_at();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_appointments_updated_at();

-- Enable realtime for invoices
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;