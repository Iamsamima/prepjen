import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from './useAppointments';

export interface PatientHistoryResult {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
}

export function usePatientHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchByPhone = useCallback(async (phone: string): Promise<Appointment[]> => {
    if (!user || !phone.trim()) return [];

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .ilike('patient_phone', `%${phone.trim()}%`)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (queryError) throw queryError;
      return (data as Appointment[]) || [];
    } catch (err) {
      console.error('Error searching patient history:', err);
      setError('Failed to search patient history');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const searchByName = useCallback(async (name: string): Promise<Appointment[]> => {
    if (!user || !name.trim()) return [];

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .ilike('patient_name', `%${name.trim()}%`)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (queryError) throw queryError;
      return (data as Appointment[]) || [];
    } catch (err) {
      console.error('Error searching patient history:', err);
      setError('Failed to search patient history');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getPatientAppointments = useCallback(async (
    patientPhone?: string,
    patientName?: string
  ): Promise<Appointment[]> => {
    if (!user) return [];

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id);

      if (patientPhone) {
        query = query.eq('patient_phone', patientPhone);
      } else if (patientName) {
        query = query.ilike('patient_name', patientName);
      } else {
        return [];
      }

      const { data, error: queryError } = await query
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (queryError) throw queryError;
      return (data as Appointment[]) || [];
    } catch (err) {
      console.error('Error fetching patient appointments:', err);
      setError('Failed to fetch patient history');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    searchByPhone,
    searchByName,
    getPatientAppointments,
    loading,
    error,
  };
}
