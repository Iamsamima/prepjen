import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoiceForm } from './InvoiceForm';
import { ReferrerForm } from './ReferrerForm';
import { InvoicesTable } from './InvoicesTable';
import { ReferrersTable } from './ReferrersTable';
import { BillingStats } from './BillingStats';
import { useInvoices } from '@/hooks/useInvoices';
import { useReferrers } from '@/hooks/useReferrers';
import { Receipt, Users } from 'lucide-react';

export function BillingDashboard() {
  const {
    invoices,
    loading: invoicesLoading,
    createInvoice,
    deleteInvoice,
    markAsPaid,
  } = useInvoices();

  const {
    referrers,
    loading: referrersLoading,
    createReferrer,
    deleteReferrer,
    markCommissionPaid,
  } = useReferrers();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <BillingStats invoices={invoices} referrers={referrers} />

      {/* Tabs for Invoices and Referrers */}
      <Card className="border-0 shadow-elevated">
        <CardHeader>
          <Tabs defaultValue="invoices" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="invoices" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  Invoices
                </TabsTrigger>
                <TabsTrigger value="referrers" className="gap-2">
                  <Users className="h-4 w-4" />
                  Referrers
                </TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <ReferrerForm onSubmit={createReferrer} />
                <InvoiceForm onSubmit={createInvoice} />
              </div>
            </div>

            <CardContent className="px-0 pt-6">
              <TabsContent value="invoices" className="mt-0">
                <InvoicesTable
                  invoices={invoices}
                  loading={invoicesLoading}
                  onMarkPaid={markAsPaid}
                  onDelete={deleteInvoice}
                />
              </TabsContent>
              <TabsContent value="referrers" className="mt-0">
                <ReferrersTable
                  referrers={referrers}
                  loading={referrersLoading}
                  onMarkCommissionPaid={markCommissionPaid}
                  onDelete={deleteReferrer}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
}
