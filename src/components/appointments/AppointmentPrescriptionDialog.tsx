import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PatientInfoSection } from '@/components/prescription/PatientInfoSection';
import { VitalsSection } from '@/components/prescription/VitalsSection';
import { SymptomsSection } from '@/components/prescription/SymptomsSection';
import { DiagnosisSection } from '@/components/prescription/DiagnosisSection';
import { MedicinesSection } from '@/components/prescription/MedicinesSection';
import { TestsSection } from '@/components/prescription/TestsSection';
import { useTemplates } from '@/hooks/useTemplates';
import { ChevronLeft, ChevronRight, Download, Save } from 'lucide-react';
import { toast } from 'sonner';
import { generatePrescriptionPdf } from '@/utils/generatePrescriptionPdf';
import { Appointment } from '@/hooks/useAppointments';
import { SuggestionModeSwitch } from '@/components/prescription/SuggestionModeSwitch';
import { SuggestionMode } from '@/types/suggestion';

interface AppointmentPrescriptionDialogProps {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (prescriptionData: any) => Promise<void>;
}

const steps = ['Vitals', 'Symptoms', 'Diagnosis', 'Tests', 'Medicines'];

export function AppointmentPrescriptionDialog({
  appointment,
  open,
  onOpenChange,
  onSave,
}: AppointmentPrescriptionDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>('combined');

  const {
    medicineTemplates,
    saveMedicineTemplate,
    deleteMedicineTemplate,
    diagnosisTemplates,
    saveDiagnosisTemplate,
    deleteDiagnosisTemplate,
    trackDiagnosisUsage,
    getSavedDiagnosisSuggestions,
    doctorProfile,
  } = useTemplates();

  // Pre-fill patient info from appointment
  const [patientInfo] = useState({
    name: appointment.patient_name,
    phone: appointment.patient_phone || '',
    email: appointment.patient_email || '',
    address: '',
    medicalHistory: '',
  });

  const [vitals, setVitals] = useState({
    bp: '',
    pr: '',
    spo2: '',
    temp: '',
    height: '',
    weight: '',
    bmi: '',
    age: appointment.patient_age?.toString() || '',
    gender: appointment.patient_gender || '',
  });

  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [diagnoses, setDiagnoses] = useState<{ name: string; confidence?: string; description?: string }[]>([]);
  const [diagnosisType, setDiagnosisType] = useState('provisional');
  const [tests, setTests] = useState<{ testName: string; testType?: string; reason?: string }[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);

  const handleNext = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const handlePrev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const getPrescriptionData = () => ({
    patientInfo,
    vitals,
    symptoms,
    clinicalFindings,
    diagnoses,
    diagnosisType,
    tests,
    medicines,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(getPrescriptionData());
      toast.success('Prescription saved successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast.error('Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndDownload = async () => {
    setSaving(true);
    try {
      const prescriptionData = getPrescriptionData();
      await onSave(prescriptionData);
      await generatePrescriptionPdf({
        ...prescriptionData,
        doctorProfile,
      });
      toast.success('Prescription saved and downloaded!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save/download prescription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Create Prescription for {appointment.patient_name}</span>
            <SuggestionModeSwitch mode={suggestionMode} onChange={setSuggestionMode} />
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-2">
          {steps.map((step, i) => (
            <React.Fragment key={step}>
              <button
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  i === currentStep
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : i < currentStep
                    ? 'bg-green-500/20 text-green-600'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{step}</span>
              </button>
              {i < steps.length - 1 && <div className="flex-1 h-0.5 bg-border mx-1" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {currentStep === 0 && <VitalsSection vitals={vitals} onChange={setVitals} />}
          {currentStep === 1 && (
            <SymptomsSection
              symptoms={symptoms}
              onSymptomsChange={setSymptoms}
              clinicalFindings={clinicalFindings}
              onClinicalFindingsChange={setClinicalFindings}
              suggestionMode={suggestionMode}
            />
          )}
          {currentStep === 2 && (
            <DiagnosisSection
              symptoms={symptoms}
              diagnoses={diagnoses}
              onDiagnosesChange={setDiagnoses}
              diagnosisType={diagnosisType}
              onDiagnosisTypeChange={setDiagnosisType}
              diagnosisTemplates={diagnosisTemplates}
              onSaveDiagnosisTemplate={saveDiagnosisTemplate}
              onDeleteDiagnosisTemplate={deleteDiagnosisTemplate}
              onTrackDiagnosisUsage={trackDiagnosisUsage}
              getSavedDiagnosisSuggestions={getSavedDiagnosisSuggestions}
              suggestionMode={suggestionMode}
            />
          )}
          {currentStep === 3 && (
            <TestsSection
              symptoms={symptoms}
              diagnoses={diagnoses}
              tests={tests}
              onTestsChange={setTests}
              suggestionMode={suggestionMode}
            />
          )}
          {currentStep === 4 && (
            <MedicinesSection
              symptoms={symptoms}
              diagnoses={diagnoses}
              medicines={medicines}
              onMedicinesChange={setMedicines}
              patientInfo={{ age: vitals.age, gender: vitals.gender, weight: vitals.weight }}
              medicineTemplates={medicineTemplates}
              onSaveMedicineTemplate={saveMedicineTemplate}
              onDeleteMedicineTemplate={deleteMedicineTemplate}
              suggestionMode={suggestionMode}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>

          <div className="flex gap-2">
            {currentStep === steps.length - 1 ? (
              <>
                <Button variant="outline" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" /> Save Only
                </Button>
                <Button onClick={handleSaveAndDownload} disabled={saving} className="bg-gradient-primary">
                  <Download className="h-4 w-4 mr-1" /> Save & Download
                </Button>
              </>
            ) : (
              <Button onClick={handleNext}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
