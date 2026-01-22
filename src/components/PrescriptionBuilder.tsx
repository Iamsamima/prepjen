import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PatientInfoSection } from '@/components/prescription/PatientInfoSection';
import { VitalsSection } from '@/components/prescription/VitalsSection';
import { SymptomsSection } from '@/components/prescription/SymptomsSection';
import { DiagnosisSection } from '@/components/prescription/DiagnosisSection';
import { MedicinesSection } from '@/components/prescription/MedicinesSection';
import { TestsSection } from '@/components/prescription/TestsSection';
import { DoctorSettingsSection } from '@/components/prescription/DoctorSettingsSection';
import { useTemplates } from '@/hooks/useTemplates';
import { Stethoscope, LogOut, ChevronLeft, ChevronRight, Download, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { generatePrescriptionPdf } from '@/utils/generatePrescriptionPdf';

const steps = ['Patient', 'Vitals', 'Symptoms', 'Diagnosis', 'Tests', 'Medicines', 'Settings'];

export function PrescriptionBuilder() {
  const { user, signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  
  const {
    medicineTemplates,
    saveMedicineTemplate,
    deleteMedicineTemplate,
    diagnosisTemplates,
    saveDiagnosisTemplate,
    deleteDiagnosisTemplate,
    prescriptionTemplates,
    savePrescriptionTemplate,
    deletePrescriptionTemplate,
    trackDiagnosisUsage,
    getSavedDiagnosisSuggestions,
    doctorProfile,
    updateDoctorProfile,
    clearImage,
  } = useTemplates();

  const [patientInfo, setPatientInfo] = useState({
    name: '', phone: '', email: '', address: '', medicalHistory: '',
  });
  const [vitals, setVitals] = useState({
    bp: '', pr: '', spo2: '', temp: '', height: '', weight: '', bmi: '', age: '', gender: '',
  });
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [diagnoses, setDiagnoses] = useState<{ name: string; confidence?: string; description?: string }[]>([]);
  const [diagnosisType, setDiagnosisType] = useState('provisional');
  const [tests, setTests] = useState<{ testName: string; testType?: string; reason?: string }[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);

  const handleNext = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const handlePrev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleGeneratePrescription = () => {
    try {
      generatePrescriptionPdf({
        patientInfo,
        vitals,
        symptoms,
        clinicalFindings,
        diagnoses,
        diagnosisType,
        tests,
        medicines,
        doctorProfile,
      });
      toast.success('Prescription PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-bold font-display text-lg">AI Prescription Builder</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, i) => (
            <React.Fragment key={step}>
              <button
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  i === currentStep ? 'bg-primary text-primary-foreground shadow-glow' :
                  i < currentStep ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-xs">
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{step}</span>
              </button>
              {i < steps.length - 1 && <div className="flex-1 h-0.5 bg-border mx-2" />}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <Card className="border-0 shadow-elevated">
          <CardContent className="p-6 md:p-8">
            {currentStep === 0 && <PatientInfoSection patientInfo={patientInfo} onChange={setPatientInfo} />}
            {currentStep === 1 && <VitalsSection vitals={vitals} onChange={setVitals} />}
            {currentStep === 2 && (
              <SymptomsSection
                symptoms={symptoms}
                onSymptomsChange={setSymptoms}
                clinicalFindings={clinicalFindings}
                onClinicalFindingsChange={setClinicalFindings}
              />
            )}
            {currentStep === 3 && (
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
              />
            )}
            {currentStep === 4 && (
              <TestsSection
                symptoms={symptoms}
                diagnoses={diagnoses}
                tests={tests}
                onTestsChange={setTests}
              />
            )}
            {currentStep === 5 && (
              <MedicinesSection
                symptoms={symptoms}
                diagnoses={diagnoses}
                medicines={medicines}
                onMedicinesChange={setMedicines}
                patientInfo={{ age: vitals.age, gender: vitals.gender, weight: vitals.weight }}
                medicineTemplates={medicineTemplates}
                onSaveMedicineTemplate={saveMedicineTemplate}
                onDeleteMedicineTemplate={deleteMedicineTemplate}
              />
            )}
            {currentStep === 6 && (
              <DoctorSettingsSection
                profile={doctorProfile}
                onUpdateProfile={updateDoctorProfile}
                onClearImage={clearImage}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Previous
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} className="bg-gradient-primary shadow-glow">
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleGeneratePrescription} className="bg-gradient-primary shadow-glow">
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
