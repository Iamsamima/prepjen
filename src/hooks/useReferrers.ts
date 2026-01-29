import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Referrer {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  type: 'individual' | 'clinic' | 'hospital' | 'other';
  default_commission_percentage: number;
  total_commission_earned: number;
  total_commission_paid: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferrerFormData {
  name: string;
  phone?: string;
  email?: string;
  type: 'individual' | 'clinic' | 'hospital' | 'other';
  default_commission_percentage: number;
  notes?: string;
}

export function useReferrers() {
  const { user } = useAuth();
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrers = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('referrers')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setReferrers((data as Referrer[]) || []);
    } catch (error) {
      console.error('Error fetching referrers:', error);
      toast.error('Failed to load referrers');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createReferrer = async (formData: ReferrerFormData) => {
    if (!user) {
      toast.error('Please login first');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('referrers')
        .insert({
          user_id: user.id,
          ...formData,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Referrer added successfully!');
      fetchReferrers();
      return data as Referrer;
    } catch (error) {
      console.error('Error creating referrer:', error);
      toast.error('Failed to add referrer');
      return null;
    }
  };

  const updateReferrer = async (id: string, formData: Partial<ReferrerFormData>) => {
    try {
      const { error } = await supabase
        .from('referrers')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
      toast.success('Referrer updated!');
      fetchReferrers();
    } catch (error) {
      console.error('Error updating referrer:', error);
      toast.error('Failed to update referrer');
    }
  };

  const deleteReferrer = async (id: string) => {
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('referrers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Referrer removed!');
      fetchReferrers();
    } catch (error) {
      console.error('Error deleting referrer:', error);
      toast.error('Failed to remove referrer');
    }
  };

  const markCommissionPaid = async (id: string, amount: number) => {
    try {
      const referrer = referrers.find(r => r.id === id);
      if (!referrer) throw new Error('Referrer not found');

      const { error } = await supabase
        .from('referrers')
        .update({
          total_commission_paid: referrer.total_commission_paid + amount,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Commission payment recorded!');
      fetchReferrers();
    } catch (error) {
      console.error('Error marking commission paid:', error);
      toast.error('Failed to update commission');
    }
  };

  useEffect(() => {
    fetchReferrers();
  }, [fetchReferrers]);

  return {
    referrers,
    loading,
    createReferrer,
    updateReferrer,
    deleteReferrer,
    markCommissionPaid,
    refetch: fetchReferrers,
  };
}
