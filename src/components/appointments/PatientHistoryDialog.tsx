import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePatientHistory } from '@/hooks/usePatientHistory';
import { Appointment } from '@/hooks/useAppointments';
import { Search, Loader2, User, Calendar, Stethoscope, Pill, TestTube, Download } from 'lucide-react';
import { format } from 'date-fns';
import { generatePrescriptionPdf } from '@/utils/generatePrescriptionPdf';
import { useTemplates } from '@/hooks/useTemplates';
import { toast } from 'sonner';

interface PatientHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPhone?: string;
  initialName?: string;
}

export function PatientHistoryDialog({
  open,
  onOpenChange,
  initialPhone,
  initialName,
}: PatientHistoryDialogProps) {
  const [searchQuery, setSearchQuery] = useState(initialPhone || initialName || '');
  const [searchType, setSearchType] = useState<'phone' | 'name'>(initialPhone ? 'phone' : 'name');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { searchByPhone, searchByName, loading } = usePatientHistory();
  const { doctorProfile } = useTemplates();

  useEffect(() => {
    if (open && (initialPhone || initialName)) {
      handleSearch();
    }
  }, [open, initialPhone, initialName]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    const results = searchType === 'phone'
      ? await searchByPhone(searchQuery)
      : await searchByName(searchQuery);
    
    setAppointments(results);
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

  const appointmentsWithPrescriptions = appointments.filter(a => a.prescription_data);
  const uniqueDiagnoses = new Set<string>();
  appointmentsWithPrescriptions.forEach(a => {
    if (a.prescription_data?.diagnoses) {
      a.prescription_data.diagnoses.forEach((d: any) => {
        uniqueDiagnoses.add(d.name);
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient History
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'phone' | 'name')}
              className="px-3 py-2 border rounded-md bg-background text-sm"
            >
              <option value="phone">Phone</option>
              <option value="name">Name</option>
            </select>
            <Input
              placeholder={searchType === 'phone' ? 'Enter phone number...' : 'Enter patient name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Results */}
        <ScrollArea className="h-[500px] pr-4">
          {appointments.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? 'No patient records found.' : 'Search by phone or name to view history.'}
            </div>
          )}

          {appointments.length > 0 && (
            <div className="space-y-6">
              {/* Patient Summary */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{appointments[0].patient_name}</h3>
                  <Badge variant="outline">{appointments.length} visits</Badge>
                </div>
                {appointments[0].patient_phone && (
                  <p className="text-sm text-muted-foreground">Phone: {appointments[0].patient_phone}</p>
                )}
                {appointments[0].patient_age && (
                  <p className="text-sm text-muted-foreground">
                    Age: {appointments[0].patient_age} • Gender: {appointments[0].patient_gender || 'N/A'}
                  </p>
                )}
                
                {uniqueDiagnoses.size > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Past Diagnoses:</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(uniqueDiagnoses).map((diagnosis, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {diagnosis}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Visit History */}
              <div>
                <h4 className="font-medium mb-3">Visit History</h4>
                <Accordion type="single" collapsible className="space-y-2">
                  {appointments.map((appointment, index) => (
                    <AccordionItem
                      key={appointment.id}
                      value={appointment.id}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-4 text-left">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {appointment.appointment_time} • {appointment.status}
                            </p>
                          </div>
                          {appointment.prescription_data && (
                            <Badge variant="default" className="ml-auto mr-4">
                              Has Rx
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {appointment.prescription_data ? (
                          <div className="space-y-4 pt-2 pb-4">
                            {/* Vitals */}
                            {appointment.prescription_data.vitals && (
                              <div>
                                <p className="text-sm font-medium flex items-center gap-2 mb-2">
                                  <Stethoscope className="h-4 w-4" /> Vitals
                                </p>
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                  {appointment.prescription_data.vitals.bp && (
                                    <div className="p-2 bg-muted rounded">
                                      <span className="text-muted-foreground">BP:</span>{' '}
                                      {appointment.prescription_data.vitals.bp}
                                    </div>
                                  )}
                                  {appointment.prescription_data.vitals.pr && (
                                    <div className="p-2 bg-muted rounded">
                                      <span className="text-muted-foreground">PR:</span>{' '}
                                      {appointment.prescription_data.vitals.pr}
                                    </div>
                                  )}
                                  {appointment.prescription_data.vitals.temp && (
                                    <div className="p-2 bg-muted rounded">
                                      <span className="text-muted-foreground">Temp:</span>{' '}
                                      {appointment.prescription_data.vitals.temp}
                                    </div>
                                  )}
                                  {appointment.prescription_data.vitals.weight && (
                                    <div className="p-2 bg-muted rounded">
                                      <span className="text-muted-foreground">Weight:</span>{' '}
                                      {appointment.prescription_data.vitals.weight}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Symptoms */}
                            {appointment.prescription_data.symptoms?.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Symptoms</p>
                                <div className="flex flex-wrap gap-1">
                                  {appointment.prescription_data.symptoms.map((s: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {s}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Diagnoses */}
                            {appointment.prescription_data.diagnoses?.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Diagnosis</p>
                                <div className="flex flex-wrap gap-1">
                                  {appointment.prescription_data.diagnoses.map((d: any, i: number) => (
                                    <Badge key={i} className="text-xs">
                                      {d.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tests */}
                            {appointment.prescription_data.tests?.length > 0 && (
                              <div>
                                <p className="text-sm font-medium flex items-center gap-2 mb-2">
                                  <TestTube className="h-4 w-4" /> Tests Ordered
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {appointment.prescription_data.tests.map((t: any, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {t.testName}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Medicines */}
                            {appointment.prescription_data.medicines?.length > 0 && (
                              <div>
                                <p className="text-sm font-medium flex items-center gap-2 mb-2">
                                  <Pill className="h-4 w-4" /> Medicines
                                </p>
                                <div className="space-y-1">
                                  {appointment.prescription_data.medicines.map((m: any, i: number) => (
                                    <div key={i} className="text-xs p-2 bg-muted rounded flex justify-between">
                                      <span className="font-medium">{m.name || m.medicineName}</span>
                                      <span className="text-muted-foreground">
                                        {m.dosage} • {m.frequency} • {m.duration}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Download Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadPrescription(appointment)}
                              className="mt-2"
                            >
                              <Download className="h-4 w-4 mr-2" /> Download Prescription
                            </Button>
                          </div>
                        ) : (
                          <div className="py-4 text-sm text-muted-foreground">
                            No prescription data for this visit.
                            {appointment.notes && (
                              <p className="mt-2">
                                <span className="font-medium">Notes:</span> {appointment.notes}
                              </p>
                            )}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
