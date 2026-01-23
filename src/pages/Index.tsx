import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/components/LoginPage';
import { PrescriptionBuilder } from '@/components/PrescriptionBuilder';
import { AppointmentsDashboard } from '@/components/appointments/AppointmentsDashboard';
import { Button } from '@/components/ui/button';
import { Loader2, Stethoscope, Calendar, LogOut, FileText } from 'lucide-react';

type ActiveTab = 'appointments' | 'prescription';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('appointments');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (activeTab === 'prescription') {
    return <PrescriptionBuilder onBack={() => setActiveTab('appointments')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-bold font-display text-lg">MediPrescribe Pro</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              size="sm"
              onClick={() => setActiveTab('appointments')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Appointments</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('prescription')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">New Prescription</span>
            </Button>
            <span className="text-sm text-muted-foreground hidden md:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <AppointmentsDashboard />
      </main>
    </div>
  );
};

export default Index;
