import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Invoice {
  id: string;
  user_id: string;
  appointment_id?: string;
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
  referrer_id?: string;
  referral_commission_percentage: number;
  referral_commission_amount: number;
  referral_commission_paid: boolean;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  payment_method?: string;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceFormData {
  appointment_id?: string;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  doctor_fees: number;
  platform_fees: number;
  gst_percentage: number;
  discount_percentage: number;
  other_charges: number;
  other_charges_description?: string;
  is_referred: boolean;
  referrer_id?: string;
  referral_commission_percentage: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  payment_method?: string;
  notes?: string;
}

export function useInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  };

  const calculateInvoice = (data: InvoiceFormData) => {
    const subtotal = data.doctor_fees + data.platform_fees + data.other_charges;
    const discountAmount = (subtotal * data.discount_percentage) / 100;
    const afterDiscount = subtotal - discountAmount;
    const gstAmount = (afterDiscount * data.gst_percentage) / 100;
    const totalAmount = afterDiscount + gstAmount;
    
    let referralCommissionAmount = 0;
    if (data.is_referred && data.referral_commission_percentage > 0) {
      referralCommissionAmount = (data.doctor_fees * data.referral_commission_percentage) / 100;
    }

    return {
      subtotal,
      discount_amount: discountAmount,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      referral_commission_amount: referralCommissionAmount,
    };
  };

  const fetchInvoices = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices((data as Invoice[]) || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createInvoice = async (formData: InvoiceFormData) => {
    if (!user) {
      toast.error('Please login first');
      return null;
    }

    try {
      const calculated = calculateInvoice(formData);
      
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: generateInvoiceNumber(),
          invoice_date: new Date().toISOString().split('T')[0],
          ...formData,
          ...calculated,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Invoice created successfully!');
      fetchInvoices();
      return data as Invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
      return null;
    }
  };

  const updateInvoice = async (id: string, formData: Partial<InvoiceFormData>) => {
    try {
      let updateData: any = { ...formData };
      
      // Recalculate if fee fields changed
      if (formData.doctor_fees !== undefined || formData.platform_fees !== undefined || 
          formData.gst_percentage !== undefined || formData.discount_percentage !== undefined ||
          formData.other_charges !== undefined) {
        const existing = invoices.find(inv => inv.id === id);
        if (existing) {
          const merged = { ...existing, ...formData } as InvoiceFormData;
          const calculated = calculateInvoice(merged);
          updateData = { ...updateData, ...calculated };
        }
      }

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      toast.success('Invoice updated!');
      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Invoice deleted!');
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  const markAsPaid = async (id: string, paymentMethod?: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_method: paymentMethod,
          payment_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Invoice marked as paid!');
      fetchInvoices();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Failed to update invoice');
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('invoices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchInvoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchInvoices]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    calculateInvoice,
    refetch: fetchInvoices,
  };
}
