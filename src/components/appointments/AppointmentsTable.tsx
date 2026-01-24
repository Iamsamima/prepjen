import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Appointment } from '@/hooks/useAppointments';
import { AppointmentBookingForm } from './AppointmentBookingForm';
import { AppointmentPrescriptionDialog } from './AppointmentPrescriptionDialog';
import { PatientHistoryDialog } from './PatientHistoryDialog';
import { MoreHorizontal, Eye, Pencil, Trash2, Download, Loader2, FileText, CheckCircle, History } from 'lucide-react';
import { format } from 'date-fns';
import { generatePrescriptionPdf } from '@/utils/generatePrescriptionPdf';
import { useTemplates } from '@/hooks/useTemplates';
import { toast } from 'sonner';

interface AppointmentsTableProps {
  appointments: Appointment[];
  loading: boolean;
  onUpdate: (id: string, updates: Partial<Appointment>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function AppointmentsTable({ appointments, loading, onUpdate, onDelete }: AppointmentsTableProps) {
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [prescribingAppointment, setPrescribingAppointment] = useState<Appointment | null>(null);
  const [historyPatient, setHistoryPatient] = useState<{ phone?: string; name?: string } | null>(null);
  const { doctorProfile } = useTemplates();

  const handleMarkAsSeen = async (appointment: Appointment) => {
    await onUpdate(appointment.id, { status: 'seen' });
    setPrescribingAppointment(appointment);
  };

  const handleSavePrescription = async (prescriptionData: any) => {
    if (prescribingAppointment) {
      await onUpdate(prescribingAppointment.id, {
        prescription_data: prescriptionData,
        status: 'seen',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'secondary',
      seen: 'default',
      cancelled: 'destructive',
      'no-show': 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-500/10 text-green-600',
      pending: 'bg-yellow-500/10 text-yellow-600',
      partial: 'bg-orange-500/10 text-orange-600',
    };
    return <Badge className={colors[status] || 'bg-gray-500/10 text-gray-600'}>{status}</Badge>;
  };

  const handleDownloadPrescription = async (appointment: Appointment) => {
    if (!appointment.prescription_data) {
      toast.error('No prescription data available');
      return;
    }

    try {
      await generatePrescriptionPdf({
        ...appointment.prescription_data,
        doctorProfile,
      });
      toast.success('Prescription downloaded!');
    } catch (error) {
      console.error('Error downloading prescription:', error);
      toast.error('Failed to download prescription');
    }
  };

  const handleEditSubmit = async (data: any) => {
    if (editingAppointment) {
      await onUpdate(editingAppointment.id, data);
      setEditingAppointment(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No appointments found for the selected date range.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{appointment.patient_name}</p>
                    {appointment.patient_phone && (
                      <p className="text-sm text-muted-foreground">{appointment.patient_phone}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}</p>
                    <p className="text-sm text-muted-foreground">{appointment.appointment_time}</p>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                <TableCell>{getPaymentBadge(appointment.payment_status)}</TableCell>
                <TableCell className="text-right">
                  <div>
                    <p className="font-medium">₹{Number(appointment.amount_charged).toLocaleString()}</p>
                    {Number(appointment.amount_paid) < Number(appointment.amount_charged) && (
                      <p className="text-sm text-destructive">
                        Due: ₹{(Number(appointment.amount_charged) - Number(appointment.amount_paid)).toLocaleString()}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingAppointment(appointment)}>
                        <Eye className="h-4 w-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingAppointment(appointment)}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {appointment.status === 'scheduled' && (
                        <DropdownMenuItem onClick={() => handleMarkAsSeen(appointment)}>
                          <CheckCircle className="h-4 w-4 mr-2" /> Mark as Seen & Create Rx
                        </DropdownMenuItem>
                      )}
                      {appointment.status !== 'scheduled' && !appointment.prescription_data && (
                        <DropdownMenuItem onClick={() => setPrescribingAppointment(appointment)}>
                          <FileText className="h-4 w-4 mr-2" /> Create Prescription
                        </DropdownMenuItem>
                      )}
                      {appointment.prescription_data && (
                        <>
                          <DropdownMenuItem onClick={() => setPrescribingAppointment(appointment)}>
                            <FileText className="h-4 w-4 mr-2" /> Edit Prescription
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPrescription(appointment)}>
                            <Download className="h-4 w-4 mr-2" /> Download Rx
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setHistoryPatient({
                          phone: appointment.patient_phone,
                          name: appointment.patient_name,
                        })}
                      >
                        <History className="h-4 w-4 mr-2" /> View History
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeletingId(appointment.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <AlertDialog open={!!viewingAppointment} onOpenChange={() => setViewingAppointment(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Appointment Details</AlertDialogTitle>
          </AlertDialogHeader>
          {viewingAppointment && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground">Patient</p>
                  <p className="font-medium">{viewingAppointment.patient_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{viewingAppointment.patient_phone || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{viewingAppointment.patient_email || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Age / Gender</p>
                  <p className="font-medium">
                    {viewingAppointment.patient_age || '-'} / {viewingAppointment.patient_gender || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(viewingAppointment.appointment_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">{viewingAppointment.appointment_time}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(viewingAppointment.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Payment</p>
                  {getPaymentBadge(viewingAppointment.payment_status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Charged</p>
                  <p className="font-medium">₹{Number(viewingAppointment.amount_charged).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid</p>
                  <p className="font-medium">₹{Number(viewingAppointment.amount_paid).toLocaleString()}</p>
                </div>
              </div>
              {viewingAppointment.notes && (
                <div>
                  <p className="text-muted-foreground">Notes</p>
                  <p className="font-medium">{viewingAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {editingAppointment && (
        <AppointmentBookingForm
          editingAppointment={editingAppointment}
          onSubmit={handleEditSubmit}
          onClose={() => setEditingAppointment(null)}
          open={!!editingAppointment}
          onOpenChange={(open) => !open && setEditingAppointment(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the appointment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  onDelete(deletingId);
                  setDeletingId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Prescription Dialog */}
      {prescribingAppointment && (
        <AppointmentPrescriptionDialog
          appointment={prescribingAppointment}
          open={!!prescribingAppointment}
          onOpenChange={(open) => !open && setPrescribingAppointment(null)}
          onSave={handleSavePrescription}
        />
      )}

      {/* Patient History Dialog */}
      {historyPatient && (
        <PatientHistoryDialog
          open={!!historyPatient}
          onOpenChange={(open) => !open && setHistoryPatient(null)}
          initialPhone={historyPatient.phone}
          initialName={historyPatient.name}
        />
      )}
    </>
  );
}
