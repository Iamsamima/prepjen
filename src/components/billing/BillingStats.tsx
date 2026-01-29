import { Card, CardContent } from '@/components/ui/card';
import { Invoice } from '@/hooks/useInvoices';
import { Referrer } from '@/hooks/useReferrers';
import { Receipt, IndianRupee, Users, TrendingUp } from 'lucide-react';

interface BillingStatsProps {
  invoices: Invoice[];
  referrers: Referrer[];
}

export function BillingStats({ invoices, referrers }: BillingStatsProps) {
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  
  const pendingAmount = invoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const totalCommissionEarned = referrers.reduce(
    (sum, ref) => sum + Number(ref.total_commission_earned), 0
  );
  const totalCommissionPaid = referrers.reduce(
    (sum, ref) => sum + Number(ref.total_commission_paid), 0
  );
  const commissionDue = totalCommissionEarned - totalCommissionPaid;

  const stats = [
    {
      title: 'Total Invoices',
      value: totalInvoices.toString(),
      subtext: `${paidInvoices} paid`,
      icon: Receipt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Revenue Collected',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      subtext: `₹${pendingAmount.toLocaleString('en-IN')} pending`,
      icon: IndianRupee,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Active Referrers',
      value: referrers.length.toString(),
      subtext: `${referrers.filter(r => (Number(r.total_commission_earned) - Number(r.total_commission_paid)) > 0).length} with due`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Commission Due',
      value: `₹${commissionDue.toLocaleString('en-IN')}`,
      subtext: `₹${totalCommissionPaid.toLocaleString('en-IN')} paid`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
