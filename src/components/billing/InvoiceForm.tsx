import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { InvoiceFormData, useInvoices } from '@/hooks/useInvoices';
import { useReferrers, Referrer } from '@/hooks/useReferrers';
import { Plus, Calculator } from 'lucide-react';

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => Promise<any>;
  appointmentData?: {
    id: string;
    patient_name: string;
    patient_phone?: string;
    patient_email?: string;
    amount_charged?: number;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function InvoiceForm({ onSubmit, appointmentData, open, onOpenChange }: InvoiceFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { referrers } = useReferrers();
  const { calculateInvoice } = useInvoices();

  const dialogOpen = open ?? isOpen;
  const setDialogOpen = onOpenChange ?? setIsOpen;

  const [formData, setFormData] = useState<InvoiceFormData>({
    appointment_id: appointmentData?.id,
    patient_name: appointmentData?.patient_name || '',
    patient_phone: appointmentData?.patient_phone || '',
    patient_email: appointmentData?.patient_email || '',
    doctor_fees: appointmentData?.amount_charged || 0,
    platform_fees: 0,
    gst_percentage: 18,
    discount_percentage: 0,
    other_charges: 0,
    other_charges_description: '',
    is_referred: false,
    referrer_id: undefined,
    referral_commission_percentage: 10,
    status: 'draft',
    payment_method: '',
    notes: '',
  });

  const [calculated, setCalculated] = useState({
    subtotal: 0,
    discount_amount: 0,
    gst_amount: 0,
    total_amount: 0,
    referral_commission_amount: 0,
  });

  useEffect(() => {
    const result = calculateInvoice(formData);
    setCalculated(result);
  }, [formData, calculateInvoice]);

  useEffect(() => {
    if (formData.referrer_id) {
      const referrer = referrers.find(r => r.id === formData.referrer_id);
      if (referrer) {
        setFormData(prev => ({
          ...prev,
          referral_commission_percentage: referrer.default_commission_percentage,
        }));
      }
    }
  }, [formData.referrer_id, referrers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
    setDialogOpen(false);
    // Reset form
    setFormData({
      patient_name: '',
      patient_phone: '',
      patient_email: '',
      doctor_fees: 0,
      platform_fees: 0,
      gst_percentage: 18,
      discount_percentage: 0,
      other_charges: 0,
      is_referred: false,
      referral_commission_percentage: 10,
      status: 'draft',
    });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!appointmentData && (
        <DialogTrigger asChild>
          <Button className="bg-gradient-primary shadow-glow gap-2">
            <Plus className="h-4 w-4" /> Create Invoice
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Create Invoice
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient_name">Patient Name *</Label>
                <Input
                  id="patient_name"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient_phone">Phone</Label>
                <Input
                  id="patient_phone"
                  value={formData.patient_phone}
                  onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient_email">Email</Label>
                <Input
                  id="patient_email"
                  type="email"
                  value={formData.patient_email}
                  onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Fee Breakdown */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Fee Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctor_fees">Doctor Fees (₹) *</Label>
                <Input
                  id="doctor_fees"
                  type="number"
                  step="0.01"
                  value={formData.doctor_fees}
                  onChange={(e) => setFormData({ ...formData, doctor_fees: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform_fees">Platform Fees (₹)</Label>
                <Input
                  id="platform_fees"
                  type="number"
                  step="0.01"
                  value={formData.platform_fees}
                  onChange={(e) => setFormData({ ...formData, platform_fees: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_charges">Other Charges (₹)</Label>
                <Input
                  id="other_charges"
                  type="number"
                  step="0.01"
                  value={formData.other_charges}
                  onChange={(e) => setFormData({ ...formData, other_charges: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_charges_description">Other Charges Description</Label>
                <Input
                  id="other_charges_description"
                  value={formData.other_charges_description}
                  onChange={(e) => setFormData({ ...formData, other_charges_description: e.target.value })}
                  placeholder="e.g., Lab tests, Equipment"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_percentage">Discount (%)</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gst_percentage">GST (%)</Label>
                <Input
                  id="gst_percentage"
                  type="number"
                  step="0.01"
                  value={formData.gst_percentage}
                  onChange={(e) => setFormData({ ...formData, gst_percentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Referral Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Referral</h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="is_referred" className="text-sm">Patient was referred</Label>
                <Switch
                  id="is_referred"
                  checked={formData.is_referred}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_referred: checked })}
                />
              </div>
            </div>
            {formData.is_referred && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referrer_id">Referred By</Label>
                  <Select
                    value={formData.referrer_id}
                    onValueChange={(value) => setFormData({ ...formData, referrer_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select referrer" />
                    </SelectTrigger>
                    <SelectContent>
                      {referrers.map((referrer) => (
                        <SelectItem key={referrer.id} value={referrer.id}>
                          {referrer.name} ({referrer.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referral_commission_percentage">Commission (%)</Label>
                  <Input
                    id="referral_commission_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.referral_commission_percentage}
                    onChange={(e) => setFormData({ ...formData, referral_commission_percentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Status & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'draft' | 'sent' | 'paid' | 'cancelled') => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="netbanking">Net Banking</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* Summary Card */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{calculated.subtotal.toFixed(2)}</span>
                </div>
                {calculated.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({formData.discount_percentage}%):</span>
                    <span>-₹{calculated.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST ({formData.gst_percentage}%):</span>
                  <span>+₹{calculated.gst_amount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{calculated.total_amount.toFixed(2)}</span>
                </div>
                {formData.is_referred && calculated.referral_commission_amount > 0 && (
                  <div className="flex justify-between text-orange-600 mt-2">
                    <span>Referral Commission ({formData.referral_commission_percentage}% of doctor fees):</span>
                    <span>₹{calculated.referral_commission_amount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary">
              {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
