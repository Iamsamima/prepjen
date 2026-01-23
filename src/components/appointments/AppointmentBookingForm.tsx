import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Appointment } from '@/hooks/useAppointments';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

interface AppointmentBookingFormProps {
  onSubmit: (appointment: Omit<Appointment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<any>;
  editingAppointment?: Appointment | null;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AppointmentBookingForm({ 
  onSubmit, 
  editingAppointment, 
  onClose,
  open,
  onOpenChange 
}: AppointmentBookingFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const dialogOpen = open ?? isOpen;
  const setDialogOpen = onOpenChange ?? setIsOpen;

  const [formData, setFormData] = useState<{
    patient_name: string;
    patient_phone: string;
    patient_email: string;
    patient_age: string;
    patient_gender: string;
    appointment_date: string;
    appointment_time: string;
    status: 'scheduled' | 'seen' | 'cancelled' | 'no-show';
    payment_status: 'pending' | 'paid' | 'partial';
    amount_charged: string;
    amount_paid: string;
    notes: string;
  }>({
    patient_name: editingAppointment?.patient_name || '',
    patient_phone: editingAppointment?.patient_phone || '',
    patient_email: editingAppointment?.patient_email || '',
    patient_age: editingAppointment?.patient_age?.toString() || '',
    patient_gender: editingAppointment?.patient_gender || '',
    appointment_date: editingAppointment?.appointment_date || format(new Date(), 'yyyy-MM-dd'),
    appointment_time: editingAppointment?.appointment_time || '10:00',
    status: editingAppointment?.status || 'scheduled',
    payment_status: editingAppointment?.payment_status || 'pending',
    amount_charged: editingAppointment?.amount_charged?.toString() || '0',
    amount_paid: editingAppointment?.amount_paid?.toString() || '0',
    notes: editingAppointment?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const statusValue = formData.status as 'scheduled' | 'seen' | 'cancelled' | 'no-show';
    const paymentStatusValue = formData.payment_status as 'pending' | 'paid' | 'partial';

    await onSubmit({
      patient_name: formData.patient_name,
      patient_phone: formData.patient_phone || undefined,
      patient_email: formData.patient_email || undefined,
      patient_age: formData.patient_age ? parseInt(formData.patient_age) : undefined,
      patient_gender: formData.patient_gender || undefined,
      appointment_date: formData.appointment_date,
      appointment_time: formData.appointment_time,
      status: statusValue,
      payment_status: paymentStatusValue,
      amount_charged: parseFloat(formData.amount_charged) || 0,
      amount_paid: parseFloat(formData.amount_paid) || 0,
      notes: formData.notes || undefined,
    });

    setLoading(false);
    setDialogOpen(false);
    onClose?.();
    
    // Reset form
    setFormData({
      patient_name: '',
      patient_phone: '',
      patient_email: '',
      patient_age: '',
      patient_gender: '',
      appointment_date: format(new Date(), 'yyyy-MM-dd'),
      appointment_time: '10:00',
      status: 'scheduled',
      payment_status: 'pending',
      amount_charged: '0',
      amount_paid: '0',
      notes: '',
    });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!editingAppointment && (
        <DialogTrigger asChild>
          <Button className="bg-gradient-primary shadow-glow gap-2">
            <Plus className="h-4 w-4" /> Book Appointment
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAppointment ? 'Edit Appointment' : 'Book New Appointment'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="patient_age">Age</Label>
              <Input
                id="patient_age"
                type="number"
                value={formData.patient_age}
                onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient_gender">Gender</Label>
              <Select
                value={formData.patient_gender}
                onValueChange={(value) => setFormData({ ...formData, patient_gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Date *</Label>
              <Input
                id="appointment_date"
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment_time">Time *</Label>
              <Input
                id="appointment_time"
                type="time"
                value={formData.appointment_time}
                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'scheduled' | 'seen' | 'cancelled' | 'no-show') => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="seen">Seen</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value: 'pending' | 'paid' | 'partial') => setFormData({ ...formData, payment_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount_charged">Amount Charged (₹)</Label>
              <Input
                id="amount_charged"
                type="number"
                step="0.01"
                value={formData.amount_charged}
                onChange={(e) => setFormData({ ...formData, amount_charged: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount_paid">Amount Paid (₹)</Label>
              <Input
                id="amount_paid"
                type="number"
                step="0.01"
                value={formData.amount_paid}
                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => {
              setDialogOpen(false);
              onClose?.();
            }}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary">
              {loading ? 'Saving...' : editingAppointment ? 'Update' : 'Book Appointment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
