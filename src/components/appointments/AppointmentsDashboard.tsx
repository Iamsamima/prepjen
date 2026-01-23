import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from './DashboardStats';
import { AppointmentFilters } from './AppointmentFilters';
import { AppointmentBookingForm } from './AppointmentBookingForm';
import { AppointmentsTable } from './AppointmentsTable';
import { useAppointments } from '@/hooks/useAppointments';
import { Calendar } from 'lucide-react';

export function AppointmentsDashboard() {
  const {
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
  } = useAppointments();

  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateAppointment = async (data: any) => {
    const result = await createAppointment(data);
    if (result) {
      setRefreshKey((k) => k + 1);
    }
    return result;
  };

  const handleUpdateAppointment = async (id: string, data: any) => {
    await updateAppointment(id, data);
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteAppointment = async (id: string) => {
    await deleteAppointment(id);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <DashboardStats getStats={getStats} refreshKey={refreshKey} />

      {/* Appointments Section */}
      <Card className="border-0 shadow-elevated">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Appointments</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <AppointmentFilters
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              customDateRange={customDateRange}
              setCustomDateRange={setCustomDateRange}
            />
            <AppointmentBookingForm onSubmit={handleCreateAppointment} />
          </div>
        </CardHeader>
        <CardContent>
          <AppointmentsTable
            appointments={appointments}
            loading={loading}
            onUpdate={handleUpdateAppointment}
            onDelete={handleDeleteAppointment}
          />
        </CardContent>
      </Card>
    </div>
  );
}
