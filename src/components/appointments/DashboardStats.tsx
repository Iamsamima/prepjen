import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AppointmentStats } from '@/hooks/useAppointments';
import { Users, UserCheck, IndianRupee, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface DashboardStatsProps {
  getStats: () => Promise<AppointmentStats>;
  refreshKey?: number;
}

export function DashboardStats({ getStats, refreshKey }: DashboardStatsProps) {
  const [stats, setStats] = useState<AppointmentStats>({
    totalPatients: 0,
    patientsSeen: 0,
    totalRevenue: 0,
    amountPaid: 0,
    amountDue: 0,
    scheduledToday: 0,
  });

  useEffect(() => {
    getStats().then(setStats);
  }, [getStats, refreshKey]);

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Patients Seen',
      value: stats.patientsSeen,
      icon: UserCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Scheduled Today',
      value: stats.scheduledToday,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Amount Paid',
      value: `₹${stats.amountPaid.toLocaleString()}`,
      icon: IndianRupee,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Amount Due',
      value: `₹${stats.amountDue.toLocaleString()}`,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
