import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay, addDays } from 'date-fns';

export interface Appointment {
  id: string;
  user_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_age?: number;
  patient_gender?: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'seen' | 'cancelled' | 'no-show';
  payment_status: 'pending' | 'paid' | 'partial';
  amount_charged: number;
  amount_paid: number;
  notes?: string;
  prescription_data?: any;
  created_at: string;
  updated_at: string;
}

export interface AppointmentStats {
  totalPatients: number;
  patientsSeen: number;
  totalRevenue: number;
  amountPaid: number;
  amountDue: number;
  scheduledToday: number;
}

export type DateFilter = 'today' | 'tomorrow' | 'custom';

export function useAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date(),
  });

  const fetchAppointments = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      let fromDate: string;
      let toDate: string;

      if (dateFilter === 'today') {
        fromDate = format(startOfDay(new Date()), 'yyyy-MM-dd');
        toDate = format(endOfDay(new Date()), 'yyyy-MM-dd');
      } else if (dateFilter === 'tomorrow') {
        const tomorrow = addDays(new Date(), 1);
        fromDate = format(startOfDay(tomorrow), 'yyyy-MM-dd');
        toDate = format(endOfDay(tomorrow), 'yyyy-MM-dd');
      } else {
        fromDate = format(customDateRange.from, 'yyyy-MM-dd');
        toDate = format(customDateRange.to, 'yyyy-MM-dd');
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .gte('appointment_date', fromDate)
        .lte('appointment_date', toDate)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setAppointments((data as Appointment[]) || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [user, dateFilter, customDateRange]);

  const getStats = useCallback(async (): Promise<AppointmentStats> => {
    if (!user) {
      return { totalPatients: 0, patientsSeen: 0, totalRevenue: 0, amountPaid: 0, amountDue: 0, scheduledToday: 0 };
    }

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Get all appointments for stats
      const { data: allAppointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const apps = (allAppointments as Appointment[]) || [];
      const todayApps = apps.filter(a => a.appointment_date === today);

      return {
        totalPatients: apps.length,
        patientsSeen: apps.filter(a => a.status === 'seen').length,
        totalRevenue: apps.reduce((sum, a) => sum + Number(a.amount_charged || 0), 0),
        amountPaid: apps.reduce((sum, a) => sum + Number(a.amount_paid || 0), 0),
        amountDue: apps.reduce((sum, a) => sum + (Number(a.amount_charged || 0) - Number(a.amount_paid || 0)), 0),
        scheduledToday: todayApps.filter(a => a.status === 'scheduled').length,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { totalPatients: 0, patientsSeen: 0, totalRevenue: 0, amountPaid: 0, amountDue: 0, scheduledToday: 0 };
    }
  }, [user]);

  const createAppointment = async (appointment: Omit<Appointment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast.error('Please login first');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointment,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Appointment booked successfully!');
      fetchAppointments();
      return data as Appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to book appointment');
      return null;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Appointment updated!');
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Appointment deleted!');
      fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAppointments]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
    getStats,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    refetch: fetchAppointments,
  };
}
