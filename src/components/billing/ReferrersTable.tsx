import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Referrer } from '@/hooks/useReferrers';
import { MoreHorizontal, Trash2, Wallet, Loader2 } from 'lucide-react';

interface ReferrersTableProps {
  referrers: Referrer[];
  loading: boolean;
  onMarkCommissionPaid: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
}

export function ReferrersTable({ referrers, loading, onMarkCommissionPaid, onDelete }: ReferrersTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payingReferrer, setPayingReferrer] = useState<Referrer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'clinic':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Clinic</Badge>;
      case 'hospital':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Hospital</Badge>;
      case 'individual':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Individual</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (referrers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No referrers found. Add your first referrer to start tracking commissions.
      </div>
    );
  }

  const handlePayCommission = () => {
    if (payingReferrer && paymentAmount) {
      onMarkCommissionPaid(payingReferrer.id, parseFloat(paymentAmount));
      setPayingReferrer(null);
      setPaymentAmount('');
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Commission %</TableHead>
              <TableHead className="text-right">Earned</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Due</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrers.map((referrer) => {
              const due = Number(referrer.total_commission_earned) - Number(referrer.total_commission_paid);
              return (
                <TableRow key={referrer.id}>
                  <TableCell className="font-medium">{referrer.name}</TableCell>
                  <TableCell>{getTypeBadge(referrer.type)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {referrer.phone && <div>{referrer.phone}</div>}
                      {referrer.email && <div className="text-muted-foreground">{referrer.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{referrer.default_commission_percentage}%</TableCell>
                  <TableCell className="text-right text-green-600">
                    ₹{Number(referrer.total_commission_earned).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{Number(referrer.total_commission_paid).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {due > 0 ? (
                      <span className="text-orange-600 font-medium">₹{due.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">₹0.00</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {due > 0 && (
                          <DropdownMenuItem onClick={() => {
                            setPayingReferrer(referrer);
                            setPaymentAmount(due.toFixed(2));
                          }}>
                            <Wallet className="h-4 w-4 mr-2" />
                            Pay Commission
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setDeleteId(referrer.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Referrer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this referrer? They won't appear in future invoices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pay Commission Dialog */}
      <Dialog open={!!payingReferrer} onOpenChange={() => setPayingReferrer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Commission to {payingReferrer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment_amount">Payment Amount (₹)</Label>
              <Input
                id="payment_amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingReferrer(null)}>
              Cancel
            </Button>
            <Button onClick={handlePayCommission} className="bg-gradient-primary">
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
